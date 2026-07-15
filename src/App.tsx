import { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
import { TempChart } from './components/TempChart'
import { WorldStrip, type WorldCitySnap } from './components/WorldStrip'
import { WeatherAI } from './components/WeatherAI'
import { PwaPrompts } from './components/PwaPrompts'
import {
  loadLastLocation,
  loadSavedCities,
  loadTempUnit,
  loadWindUnit,
  saveLastLocation,
  saveSavedCities,
  saveTempUnit,
  saveWindUnit,
} from './lib/storage'
import { getWeatherMeta } from './lib/weatherCodes'
import type { GeoLocation, SavedCity, TempUnit, WeatherBundle, WindUnit } from './types/weather'

const DEFAULT_CITY: GeoLocation = WORLD_CITIES[1] // London as friendly default

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

export default function App() {
  const [data, setData] = useState<WeatherBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => loadTempUnit())
  const [windUnit, setWindUnit] = useState<WindUnit>(() => loadWindUnit())
  const [saved, setSaved] = useState<SavedCity[]>(() => loadSavedCities())
  const [savedTemps, setSavedTemps] = useState<Record<number, number>>({})
  const [world, setWorld] = useState<WorldCitySnap[]>([])

  const loadLocation = useCallback(async (loc: GeoLocation, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const bundle = await fetchWeather(loc)
      setData(bundle)
      saveLastLocation(toSaved(bundle.location))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load: last location → geolocation → default
  // Also honors PWA shortcut ?near=1
  useEffect(() => {
    let cancelled = false

    async function boot() {
      const params = new URLSearchParams(window.location.search)
      const wantNear = params.get('near') === '1'

      if (wantNear && 'geolocation' in navigator) {
        setLocating(true)
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 12000,
            })
          })
          if (cancelled) return
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (geo && !cancelled) {
            await loadLocation(geo)
            setLocating(false)
            window.history.replaceState({}, '', '/')
            return
          }
        } catch {
          /* fall through to normal boot */
        }
        if (!cancelled) setLocating(false)
      }

      const last = loadLastLocation()
      if (last) {
        if (!cancelled) await loadLocation(last)
        return
      }

      if ('geolocation' in navigator) {
        setLocating(true)
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 300_000,
            })
          })
          if (cancelled) return
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (geo && !cancelled) {
            await loadLocation(geo)
            setLocating(false)
            return
          }
        } catch {
          /* fall through */
        }
        if (!cancelled) setLocating(false)
      }

      if (!cancelled) await loadLocation(DEFAULT_CITY)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [loadLocation])

  // World strip
  useEffect(() => {
    let cancelled = false
    fetchWorldSnapshot()
      .then((list) => {
        if (!cancelled) setWorld(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Temps for saved cities
  useEffect(() => {
    if (saved.length === 0) {
      setSavedTemps({})
      return
    }
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        saved.map(async (c) => {
          try {
            const bundle = await fetchWeather(c)
            return [c.id, bundle.current.temperature_2m] as const
          } catch {
            return [c.id, NaN] as const
          }
        }),
      )
      if (!cancelled) {
        const map: Record<number, number> = {}
        for (const [id, t] of entries) {
          if (Number.isFinite(t)) map[id] = t
        }
        setSavedTemps(map)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [saved])

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
          enableHighAccuracy: true,
          timeout: 12000,
        })
      })
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      if (geo) await loadLocation(geo)
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

            <Hero data={data} tempUnit={tempUnit} windUnit={windUnit} />
            <HourlyStrip data={data} tempUnit={tempUnit} />
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <TempChart data={data} tempUnit={tempUnit} />
              </div>
              <div className="lg:col-span-2">
                <DailyForecast data={data} tempUnit={tempUnit} />
              </div>
            </div>
            <DetailGrid data={data} tempUnit={tempUnit} windUnit={windUnit} />
            <WeatherAI data={data} tempUnit={tempUnit} windUnit={windUnit} />
            <WorldStrip
              cities={world}
              tempUnit={tempUnit}
              activeId={data.location.id}
              onSelect={(loc) => loadLocation(loc)}
            />

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
                Forecasts update automatically · Built with care for planet Earth
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
