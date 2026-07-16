import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchCurrentSnapshot,
  fetchWeather,
  fetchWorldSnapshot,
  reverseGeocode,
  WORLD_CITIES,
} from './api/weather'
import { Atmosphere } from './components/Atmosphere'
import { DailyForecast } from './components/DailyForecast'
import { DetailGrid } from './components/DetailGrid'
import { ErrorState, LoadingState } from './components/LoadingState'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HourlyStrip } from './components/HourlyStrip'
import { SavedCities } from './components/SavedCities'
import { SearchBar } from './components/SearchBar'
import { PwaPrompts } from './components/PwaPrompts'
import {
  loadLastLocation,
  loadSavedCities,
  loadTempUnit,
  loadWeatherCache,
  loadWindUnit,
  saveLastLocation,
  saveSavedCities,
  saveTempUnit,
  saveWeatherCache,
  saveWindUnit,
} from './lib/storage'
import { getWeatherMeta } from './lib/weatherCodes'
import type { GeoLocation, SavedCity, TempUnit, WeatherBundle, WindUnit } from './types/weather'
import type { WorldCitySnap } from './components/WorldStrip'

// Heavy chunks — load after first paint
const TempChart = lazy(() =>
  import('./components/TempChart').then((m) => ({ default: m.TempChart })),
)
const WeatherAI = lazy(() =>
  import('./components/WeatherAI').then((m) => ({ default: m.WeatherAI })),
)
const WorldStrip = lazy(() =>
  import('./components/WorldStrip').then((m) => ({ default: m.WorldStrip })),
)

const DEFAULT_CITY: GeoLocation = WORLD_CITIES[1]

function toSaved(loc: GeoLocation): SavedCity {
  return {
    id: loc.id,
    name: loc.name,
    country: loc.country,
    latitude: loc.latitude,
    longitude: loc.longitude,
    admin1: loc.admin1,
  }
}

function scheduleIdle(fn: () => void, timeout = 1200): () => void {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => fn(), { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const t = globalThis.setTimeout(fn, 400)
  return () => globalThis.clearTimeout(t)
}

export default function App() {
  // Instant UI from cache when available
  const [data, setData] = useState<WeatherBundle | null>(() => loadWeatherCache())
  const [loading, setLoading] = useState(() => !loadWeatherCache())
  const [refreshing, setRefreshing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => loadTempUnit())
  const [windUnit, setWindUnit] = useState<WindUnit>(() => loadWindUnit())
  const [saved, setSaved] = useState<SavedCity[]>(() => loadSavedCities())
  const [savedTemps, setSavedTemps] = useState<Record<number, number>>({})
  const [world, setWorld] = useState<WorldCitySnap[]>([])
  const [extrasReady, setExtrasReady] = useState(false)
  const hasDataRef = useRef(!!data)
  hasDataRef.current = !!data

  const loadLocation = useCallback(async (loc: GeoLocation, opts?: { silent?: boolean }) => {
    // Keep showing previous/cache data while refreshing to avoid blank freeze
    if (opts?.silent || hasDataRef.current) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const bundle = await fetchWeather(loc)
      setData(bundle)
      hasDataRef.current = true
      saveLastLocation(toSaved(bundle.location))
      saveWeatherCache(bundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Boot: paint cache → refresh last city ASAP (no geo wait unless no last city)
  useEffect(() => {
    let cancelled = false

    async function boot() {
      const params = new URLSearchParams(window.location.search)
      const wantNear = params.get('near') === '1'
      const last = loadLastLocation()
      const cached = loadWeatherCache()

      // Fast path: we know the city — refresh in background without blocking UI
      if (last && !wantNear) {
        if (cached) {
          setData(cached)
          setLoading(false)
        }
        if (!cancelled) await loadLocation(last, { silent: !!cached })
        return
      }

      if (wantNear && 'geolocation' in navigator) {
        setLocating(true)
        // Show cache or default city immediately while GPS runs
        if (cached && !cancelled) {
          setData(cached)
          setLoading(false)
        } else if (!cancelled) {
          void loadLocation(DEFAULT_CITY, { silent: false })
        }
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 120_000,
            })
          })
          if (cancelled) return
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (geo && !cancelled) {
            await loadLocation(geo, { silent: true })
            window.history.replaceState({}, '', window.location.pathname)
          }
        } catch {
          if (!cached && !cancelled) await loadLocation(last || DEFAULT_CITY)
        } finally {
          if (!cancelled) setLocating(false)
        }
        return
      }

      // First launch: try quick geo, else default — never hang long
      if ('geolocation' in navigator) {
        setLocating(true)
        const geoPromise = new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
            maximumAge: 300_000,
          })
        })

        // Race: if GPS is slow, show London (or cache) immediately
        const timeoutFallback = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 900))

        if (cached) {
          setData(cached)
          setLoading(false)
        }

        const raced = await Promise.race([
          geoPromise.then((p) => ({ type: 'geo' as const, p })),
          timeoutFallback.then(() => ({ type: 'timeout' as const })),
        ])

        if (cancelled) return

        if (raced.type === 'timeout') {
          // Don't block — load last/default, GPS can finish later
          if (!cached) await loadLocation(DEFAULT_CITY)
          setLocating(false)
          try {
            const pos = await geoPromise
            if (cancelled) return
            const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
            if (geo && !cancelled) await loadLocation(geo, { silent: true })
          } catch {
            /* ignore late GPS failure */
          }
          return
        }

        try {
          const geo = await reverseGeocode(raced.p.coords.latitude, raced.p.coords.longitude)
          if (geo && !cancelled) await loadLocation(geo, { silent: !!cached })
          else if (!cancelled) await loadLocation(DEFAULT_CITY, { silent: !!cached })
        } catch {
          if (!cancelled) await loadLocation(DEFAULT_CITY, { silent: !!cached })
        } finally {
          if (!cancelled) setLocating(false)
        }
        return
      }

      if (!cancelled) await loadLocation(last || DEFAULT_CITY, { silent: !!cached })
    }

    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, [])

  // Defer heavy extras until main weather is up
  useEffect(() => {
    if (!data) return
    return scheduleIdle(() => setExtrasReady(true), 800)
  }, [data])

  // World strip — idle, single batched request
  useEffect(() => {
    if (!extrasReady) return
    let cancelled = false
    const cancelIdle = scheduleIdle(() => {
      fetchWorldSnapshot()
        .then((list) => {
          if (!cancelled) setWorld(list)
        })
        .catch(() => {})
    }, 1500)
    return () => {
      cancelled = true
      cancelIdle()
    }
  }, [extrasReady])

  // Saved city temps — lightweight current-only, deferred
  useEffect(() => {
    if (!extrasReady || saved.length === 0) {
      if (saved.length === 0) setSavedTemps({})
      return
    }
    let cancelled = false
    const cancelIdle = scheduleIdle(() => {
      void (async () => {
        const map: Record<number, number> = {}
        // Sequential small batches to avoid network stampede
        for (let i = 0; i < saved.length; i += 3) {
          if (cancelled) return
          const chunk = saved.slice(i, i + 3)
          const part = await Promise.all(
            chunk.map(async (c) => {
              try {
                const s = await fetchCurrentSnapshot(c)
                return [c.id, s.temp] as const
              } catch {
                return [c.id, NaN] as const
              }
            }),
          )
          for (const [id, t] of part) {
            if (Number.isFinite(t)) map[id] = t
          }
        }
        if (!cancelled) setSavedTemps({ ...map })
      })()
    }, 1000)
    return () => {
      cancelled = true
      cancelIdle()
    }
  }, [saved, extrasReady])

  const mood = useMemo(() => {
    if (!data) return 'clear-night' as const
    return getWeatherMeta(
      data.current.weather_code,
      !!data.current.is_day,
      data.current.temperature_2m,
    ).mood
  }, [data])

  const isSaved = data ? saved.some((c) => c.id === data.location.id) : false

  const handleTempUnit = (u: TempUnit) => {
    setTempUnit(u)
    saveTempUnit(u)
  }

  const handleWindUnit = (u: WindUnit) => {
    setWindUnit(u)
    saveWindUnit(u)
  }

  const toggleSave = () => {
    if (!data) return
    const loc = toSaved(data.location)
    setSaved((prev) => {
      const exists = prev.some((c) => c.id === loc.id)
      const next = exists ? prev.filter((c) => c.id !== loc.id) : [loc, ...prev].slice(0, 12)
      saveSavedCities(next)
      return next
    })
  }

  const removeSaved = (id: number) => {
    setSaved((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveSavedCities(next)
      return next
    })
  }

  const useMyLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser')
      return
    }
    setLocating(true)
    setError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60_000,
        })
      })
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      if (geo) await loadLocation(geo, { silent: true })
    } catch {
      setError('Could not access your location. Check browser permissions.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <Atmosphere mood={mood} />
      <PwaPrompts />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 safe-pad">
        <Header
          tempUnit={tempUnit}
          windUnit={windUnit}
          onTempUnit={handleTempUnit}
          onWindUnit={handleWindUnit}
          onRefresh={() => data && loadLocation(data.location, { silent: true })}
          refreshing={refreshing}
          lastUpdated={data?.fetchedAt}
        />

        <div className="mt-6 flex flex-col gap-4">
          <SearchBar
            onSelect={(loc) => loadLocation(loc)}
            onUseLocation={useMyLocation}
            locating={locating}
          />

          <SavedCities
            cities={saved}
            tempUnit={tempUnit}
            temps={savedTemps}
            activeId={data?.location.id}
            onSelect={(c) => loadLocation(c)}
            onRemove={removeSaved}
            onToggleSave={toggleSave}
            isSaved={isSaved}
            canSave={!!data}
          />
        </div>

        {loading && !data && <LoadingState />}

        {error && !data && (
          <ErrorState message={error} onRetry={() => loadLocation(DEFAULT_CITY)} />
        )}

        {data && (
          <div className="mt-8 space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {refreshing && (
              <p className="text-center text-[11px] text-white/35">Updating forecast…</p>
            )}

            <Hero data={data} tempUnit={tempUnit} windUnit={windUnit} />
            <HourlyStrip data={data} tempUnit={tempUnit} />
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3 min-h-[14rem]">
                {extrasReady ? (
                  <Suspense
                    fallback={
                      <div className="glass h-56 animate-pulse rounded-3xl sm:h-60" />
                    }
                  >
                    <TempChart data={data} tempUnit={tempUnit} />
                  </Suspense>
                ) : (
                  <div className="glass h-56 animate-pulse rounded-3xl sm:h-60" />
                )}
              </div>
              <div className="lg:col-span-2">
                <DailyForecast data={data} tempUnit={tempUnit} />
              </div>
            </div>
            <DetailGrid data={data} tempUnit={tempUnit} windUnit={windUnit} />

            {extrasReady && (
              <Suspense fallback={null}>
                <WeatherAI data={data} tempUnit={tempUnit} windUnit={windUnit} />
                <WorldStrip
                  cities={world}
                  tempUnit={tempUnit}
                  activeId={data.location.id}
                  onSelect={(loc) => loadLocation(loc)}
                />
              </Suspense>
            )}

            <footer className="pt-6 text-center text-[11px] text-white/30">
              <p className="text-sm font-medium tracking-wide text-white/55">
                By Khaled Alfaifi
              </p>
              <p className="mt-2">
                Powered by{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
                >
                  Open-Meteo
                </a>
                {' · '}
                <a
                  href={`${import.meta.env.BASE_URL}privacy.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
                >
                  Privacy Policy
                </a>
                {' · '}
                Forecasts update automatically · Built with care for planet Earth
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
