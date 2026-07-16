import type {
  AirQuality,
  CurrentWeather,
  DailyWeather,
  GeoLocation,
  HourlyWeather,
  WeatherBundle,
} from '../types/weather'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'
const AQI_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const REVERSE_URL = 'https://geocoding-api.open-meteo.com/v1/reverse'

export async function searchLocations(query: string, count = 8): Promise<GeoLocation[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    name: q,
    count: String(count),
    language: 'en',
    format: 'json',
  })

  const res = await fetch(`${GEO_URL}?${params}`)
  if (!res.ok) throw new Error('Location search failed')
  const data = (await res.json()) as { results?: GeoLocation[] }
  return data.results ?? []
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    language: 'en',
    format: 'json',
  })

  try {
    const res = await fetch(`${REVERSE_URL}?${params}`)
    if (!res.ok) return null
    const data = (await res.json()) as { results?: GeoLocation[] }
    if (data.results?.[0]) return data.results[0]
  } catch {
    /* fallback below */
  }

  return {
    id: Math.round(lat * 1000 + lon * 1000),
    name: 'My Location',
    latitude: lat,
    longitude: lon,
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export async function fetchWeather(location: GeoLocation): Promise<WeatherBundle> {
  const weatherParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: 'auto',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'is_day',
      'visibility',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
    ].join(','),
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  })

  const aqiParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'european_aqi',
      'us_aqi',
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
    ].join(','),
  })

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`${WEATHER_URL}?${weatherParams}`),
    fetch(`${AQI_URL}?${aqiParams}`).catch(() => null),
  ])

  if (!weatherRes.ok) throw new Error('Weather fetch failed')
  const weather = await weatherRes.json()

  let airQuality: AirQuality | undefined
  if (aqiRes?.ok) {
    try {
      const aqiData = await aqiRes.json()
      airQuality = aqiData.current as AirQuality
    } catch {
      airQuality = undefined
    }
  }

  const hourly = weather.hourly as HourlyWeather
  const current = weather.current as CurrentWeather

  // Attach UV / visibility from nearest hourly slot
  if (hourly?.time?.length) {
    const now = new Date(current.time).getTime()
    let best = 0
    let bestDiff = Infinity
    for (let i = 0; i < hourly.time.length; i++) {
      const d = Math.abs(new Date(hourly.time[i]).getTime() - now)
      if (d < bestDiff) {
        bestDiff = d
        best = i
      }
    }
    current.uv_index = hourly.uv_index?.[best]
    current.visibility = hourly.visibility?.[best]
  }

  return {
    location: {
      ...location,
      timezone: weather.timezone ?? location.timezone,
    },
    timezone: weather.timezone,
    current,
    hourly,
    daily: weather.daily as DailyWeather,
    airQuality,
    fetchedAt: Date.now(),
  }
}

export const WORLD_CITIES: GeoLocation[] = [
  { id: 5128581, name: 'New York', latitude: 40.71, longitude: -74.01, country: 'United States', country_code: 'US', timezone: 'America/New_York' },
  { id: 2643743, name: 'London', latitude: 51.51, longitude: -0.13, country: 'United Kingdom', country_code: 'GB', timezone: 'Europe/London' },
  { id: 1850147, name: 'Tokyo', latitude: 35.69, longitude: 139.69, country: 'Japan', country_code: 'JP', timezone: 'Asia/Tokyo' },
  { id: 2988507, name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France', country_code: 'FR', timezone: 'Europe/Paris' },
  { id: 2147714, name: 'Sydney', latitude: -33.87, longitude: 151.21, country: 'Australia', country_code: 'AU', timezone: 'Australia/Sydney' },
  { id: 360630, name: 'Cairo', latitude: 30.04, longitude: 31.24, country: 'Egypt', country_code: 'EG', timezone: 'Africa/Cairo' },
  { id: 1273294, name: 'Delhi', latitude: 28.65, longitude: 77.23, country: 'India', country_code: 'IN', timezone: 'Asia/Kolkata' },
  { id: 3448439, name: 'São Paulo', latitude: -23.55, longitude: -46.63, country: 'Brazil', country_code: 'BR', timezone: 'America/Sao_Paulo' },
  { id: 1816670, name: 'Beijing', latitude: 39.91, longitude: 116.4, country: 'China', country_code: 'CN', timezone: 'Asia/Shanghai' },
  { id: 108410, name: 'Riyadh', latitude: 24.69, longitude: 46.72, country: 'Saudi Arabia', country_code: 'SA', timezone: 'Asia/Riyadh' },
  { id: 6167865, name: 'Toronto', latitude: 43.7, longitude: -79.42, country: 'Canada', country_code: 'CA', timezone: 'America/Toronto' },
  { id: 993800, name: 'Cape Town', latitude: -33.93, longitude: 18.42, country: 'South Africa', country_code: 'ZA', timezone: 'Africa/Johannesburg' },
]

/** Lightweight current-only fetch (saved city chips) */
export async function fetchCurrentSnapshot(
  location: Pick<GeoLocation, 'latitude' | 'longitude'>,
): Promise<{ temp: number; code: number; isDay: number }> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code,is_day',
  })
  const res = await fetch(`${WEATHER_URL}?${params}`)
  if (!res.ok) throw new Error('snapshot failed')
  const data = await res.json()
  return {
    temp: data.current.temperature_2m as number,
    code: data.current.weather_code as number,
    isDay: data.current.is_day as number,
  }
}

/**
 * One batched Open-Meteo request for all world cities (was 12 parallel requests).
 * Open-Meteo accepts comma-separated lat/lon lists.
 */
export async function fetchWorldSnapshot(): Promise<
  Array<{ location: GeoLocation; temp: number; code: number; isDay: number }>
> {
  try {
    const params = new URLSearchParams({
      latitude: WORLD_CITIES.map((c) => c.latitude).join(','),
      longitude: WORLD_CITIES.map((c) => c.longitude).join(','),
      current: 'temperature_2m,weather_code,is_day',
    })
    const res = await fetch(`${WEATHER_URL}?${params}`)
    if (!res.ok) throw new Error('world fail')
    const data = await res.json()

    // Multi-location: arrays of current objects, or single if one city
    const currents = Array.isArray(data)
      ? data.map((d: { current: { temperature_2m: number; weather_code: number; is_day: number } }) => d.current)
      : Array.isArray(data.current?.time)
        ? // alternate multi format
          (data.current.temperature_2m as number[]).map((temp: number, i: number) => ({
            temperature_2m: temp,
            weather_code: data.current.weather_code[i],
            is_day: data.current.is_day[i],
          }))
        : null

    if (Array.isArray(data) && data.length === WORLD_CITIES.length) {
      return WORLD_CITIES.map((location, i) => ({
        location,
        temp: data[i]?.current?.temperature_2m ?? NaN,
        code: data[i]?.current?.weather_code ?? 0,
        isDay: data[i]?.current?.is_day ?? 1,
      }))
    }

    // Fallback: documented multi-location returns parallel arrays under current
    if (
      data.current &&
      Array.isArray(data.current.temperature_2m) &&
      data.current.temperature_2m.length === WORLD_CITIES.length
    ) {
      return WORLD_CITIES.map((location, i) => ({
        location,
        temp: data.current.temperature_2m[i] as number,
        code: data.current.weather_code[i] as number,
        isDay: data.current.is_day[i] as number,
      }))
    }

    // Last resort: small concurrent batch (max 4 at a time) if batch shape unexpected
    void currents
    const out: Array<{ location: GeoLocation; temp: number; code: number; isDay: number }> = []
    for (let i = 0; i < WORLD_CITIES.length; i += 4) {
      const chunk = WORLD_CITIES.slice(i, i + 4)
      const part = await Promise.all(
        chunk.map(async (loc) => {
          try {
            const s = await fetchCurrentSnapshot(loc)
            return { location: loc, ...s }
          } catch {
            return { location: loc, temp: NaN, code: 0, isDay: 1 }
          }
        }),
      )
      out.push(...part)
    }
    return out
  } catch {
    return WORLD_CITIES.map((location) => ({
      location,
      temp: NaN,
      code: 0,
      isDay: 1,
    }))
  }
}
