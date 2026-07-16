import type { SavedCity, TempUnit, WeatherBundle, WindUnit } from '../types/weather'

const KEYS = {
  cities: 'aurora.savedCities',
  temp: 'aurora.tempUnit',
  wind: 'aurora.windUnit',
  last: 'aurora.lastLocation',
  weatherCache: 'aurora.weatherCache',
} as const

const WEATHER_CACHE_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes

export function loadSavedCities(): SavedCity[] {
  try {
    const raw = localStorage.getItem(KEYS.cities)
    return raw ? (JSON.parse(raw) as SavedCity[]) : []
  } catch {
    return []
  }
}

export function saveSavedCities(cities: SavedCity[]) {
  localStorage.setItem(KEYS.cities, JSON.stringify(cities.slice(0, 12)))
}

export function loadTempUnit(): TempUnit {
  const v = localStorage.getItem(KEYS.temp)
  return v === 'fahrenheit' ? 'fahrenheit' : 'celsius'
}

export function saveTempUnit(unit: TempUnit) {
  localStorage.setItem(KEYS.temp, unit)
}

export function loadWindUnit(): WindUnit {
  const v = localStorage.getItem(KEYS.wind)
  return v === 'mph' ? 'mph' : 'kmh'
}

export function saveWindUnit(unit: WindUnit) {
  localStorage.setItem(KEYS.wind, unit)
}

export function loadLastLocation(): SavedCity | null {
  try {
    const raw = localStorage.getItem(KEYS.last)
    return raw ? (JSON.parse(raw) as SavedCity) : null
  } catch {
    return null
  }
}

export function saveLastLocation(city: SavedCity) {
  localStorage.setItem(KEYS.last, JSON.stringify(city))
}

/** Instant paint on next open — stale data is fine while a refresh runs */
export function loadWeatherCache(): WeatherBundle | null {
  try {
    const raw = localStorage.getItem(KEYS.weatherCache)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WeatherBundle
    if (!parsed?.current || !parsed?.location || !parsed?.hourly || !parsed?.daily) return null
    if (Date.now() - (parsed.fetchedAt || 0) > WEATHER_CACHE_MAX_AGE_MS) {
      // Still return stale for instant UI; caller can refresh
      return parsed
    }
    return parsed
  } catch {
    return null
  }
}

export function saveWeatherCache(bundle: WeatherBundle) {
  try {
    // Cap size: keep only next ~48h hourly to avoid huge localStorage writes
    const slim: WeatherBundle = {
      ...bundle,
      hourly: {
        ...bundle.hourly,
        time: bundle.hourly.time.slice(0, 48),
        temperature_2m: bundle.hourly.temperature_2m.slice(0, 48),
        relative_humidity_2m: bundle.hourly.relative_humidity_2m.slice(0, 48),
        apparent_temperature: bundle.hourly.apparent_temperature.slice(0, 48),
        precipitation_probability: bundle.hourly.precipitation_probability.slice(0, 48),
        precipitation: bundle.hourly.precipitation.slice(0, 48),
        weather_code: bundle.hourly.weather_code.slice(0, 48),
        cloud_cover: bundle.hourly.cloud_cover.slice(0, 48),
        wind_speed_10m: bundle.hourly.wind_speed_10m.slice(0, 48),
        wind_direction_10m: bundle.hourly.wind_direction_10m.slice(0, 48),
        uv_index: bundle.hourly.uv_index.slice(0, 48),
        is_day: bundle.hourly.is_day.slice(0, 48),
        visibility: bundle.hourly.visibility.slice(0, 48),
      },
    }
    localStorage.setItem(KEYS.weatherCache, JSON.stringify(slim))
  } catch {
    /* quota — ignore */
  }
}
