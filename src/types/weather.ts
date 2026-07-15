export interface GeoLocation {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code?: string
  admin1?: string
  timezone?: string
  population?: number
}

export interface CurrentWeather {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  precipitation: number
  weather_code: number
  cloud_cover: number
  pressure_msl: number
  surface_pressure: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
  visibility?: number
  uv_index?: number
}

export interface HourlyWeather {
  time: string[]
  temperature_2m: number[]
  relative_humidity_2m: number[]
  apparent_temperature: number[]
  precipitation_probability: number[]
  precipitation: number[]
  weather_code: number[]
  cloud_cover: number[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
  uv_index: number[]
  is_day: number[]
  visibility: number[]
}

export interface DailyWeather {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  apparent_temperature_max: number[]
  apparent_temperature_min: number[]
  sunrise: string[]
  sunset: string[]
  uv_index_max: number[]
  precipitation_sum: number[]
  precipitation_probability_max: number[]
  wind_speed_10m_max: number[]
  wind_gusts_10m_max: number[]
}

export interface AirQuality {
  european_aqi?: number
  us_aqi?: number
  pm2_5?: number
  pm10?: number
  carbon_monoxide?: number
  nitrogen_dioxide?: number
  sulphur_dioxide?: number
  ozone?: number
}

export interface WeatherBundle {
  location: GeoLocation
  timezone: string
  current: CurrentWeather
  hourly: HourlyWeather
  daily: DailyWeather
  airQuality?: AirQuality
  fetchedAt: number
}

export type TempUnit = 'celsius' | 'fahrenheit'
export type WindUnit = 'kmh' | 'mph'
export type ThemeMode = 'auto' | 'day' | 'night'

export interface SavedCity {
  id: number
  name: string
  country: string
  latitude: number
  longitude: number
  admin1?: string
}

export type WeatherMood =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'hot'
