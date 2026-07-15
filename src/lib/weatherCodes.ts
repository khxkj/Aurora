import type { WeatherMood } from '../types/weather'

export interface WeatherMeta {
  label: string
  description: string
  mood: WeatherMood
  icon: string
}

const map: Record<number, WeatherMeta> = {
  0: { label: 'Clear', description: 'Crystal clear skies', mood: 'clear-day', icon: 'sun' },
  1: { label: 'Mostly Clear', description: 'Nearly perfect conditions', mood: 'clear-day', icon: 'sun' },
  2: { label: 'Partly Cloudy', description: 'Sun peeking through', mood: 'partly-cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', description: 'A soft gray ceiling', mood: 'cloudy', icon: 'cloud' },
  45: { label: 'Fog', description: 'Low visibility mist', mood: 'fog', icon: 'cloud-fog' },
  48: { label: 'Rime Fog', description: 'Icy fog settling in', mood: 'fog', icon: 'cloud-fog' },
  51: { label: 'Light Drizzle', description: 'A gentle mist of rain', mood: 'drizzle', icon: 'cloud-drizzle' },
  53: { label: 'Drizzle', description: 'Steady light rain', mood: 'drizzle', icon: 'cloud-drizzle' },
  55: { label: 'Heavy Drizzle', description: 'Dense drizzle', mood: 'drizzle', icon: 'cloud-drizzle' },
  56: { label: 'Freezing Drizzle', description: 'Icy drizzle forming', mood: 'drizzle', icon: 'cloud-drizzle' },
  57: { label: 'Heavy Freezing Drizzle', description: 'Thick icy drizzle', mood: 'snow', icon: 'cloud-snow' },
  61: { label: 'Light Rain', description: 'Soft rainfall', mood: 'rain', icon: 'cloud-rain' },
  63: { label: 'Rain', description: 'Steady rainfall', mood: 'rain', icon: 'cloud-rain' },
  65: { label: 'Heavy Rain', description: 'Pouring rain', mood: 'rain', icon: 'cloud-rain' },
  66: { label: 'Freezing Rain', description: 'Rain turning to ice', mood: 'rain', icon: 'cloud-rain' },
  67: { label: 'Heavy Freezing Rain', description: 'Icy downpour', mood: 'rain', icon: 'cloud-rain' },
  71: { label: 'Light Snow', description: 'Gentle snowfall', mood: 'snow', icon: 'cloud-snow' },
  73: { label: 'Snow', description: 'Steady snowfall', mood: 'snow', icon: 'cloud-snow' },
  75: { label: 'Heavy Snow', description: 'Heavy snowfall', mood: 'snow', icon: 'cloud-snow' },
  77: { label: 'Snow Grains', description: 'Fine snow grains', mood: 'snow', icon: 'cloud-snow' },
  80: { label: 'Light Showers', description: 'Brief light showers', mood: 'rain', icon: 'cloud-rain' },
  81: { label: 'Showers', description: 'Rain showers', mood: 'rain', icon: 'cloud-rain' },
  82: { label: 'Heavy Showers', description: 'Intense showers', mood: 'rain', icon: 'cloud-rain' },
  85: { label: 'Snow Showers', description: 'Snow flurries', mood: 'snow', icon: 'cloud-snow' },
  86: { label: 'Heavy Snow Showers', description: 'Heavy snow flurries', mood: 'snow', icon: 'cloud-snow' },
  95: { label: 'Thunderstorm', description: 'Storms in the area', mood: 'thunder', icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm + Hail', description: 'Storms with hail', mood: 'thunder', icon: 'cloud-lightning' },
  99: { label: 'Severe Thunderstorm', description: 'Severe storms with hail', mood: 'thunder', icon: 'cloud-lightning' },
}

export function getWeatherMeta(code: number, isDay = true, tempC?: number): WeatherMeta {
  const base = map[code] ?? {
    label: 'Unknown',
    description: 'Conditions unavailable',
    mood: 'cloudy' as WeatherMood,
    icon: 'cloud',
  }

  let mood = base.mood
  if ((code === 0 || code === 1) && !isDay) {
    mood = 'clear-night'
  }
  if (tempC !== undefined && tempC >= 34 && (code === 0 || code === 1 || code === 2)) {
    mood = 'hot'
  }

  return { ...base, mood }
}

export function aqiLabel(aqi: number | undefined): { label: string; color: string; advice: string } {
  if (aqi == null) return { label: '—', color: 'rgba(255,255,255,0.5)', advice: 'No data' }
  if (aqi <= 20) return { label: 'Excellent', color: '#34d399', advice: 'Perfect for outdoor time' }
  if (aqi <= 40) return { label: 'Good', color: '#6ee7b7', advice: 'Air quality is fine' }
  if (aqi <= 60) return { label: 'Fair', color: '#fbbf24', advice: 'Sensitive groups take care' }
  if (aqi <= 80) return { label: 'Poor', color: '#fb923c', advice: 'Limit long outdoor exertion' }
  if (aqi <= 100) return { label: 'Very Poor', color: '#f87171', advice: 'Avoid heavy outdoor activity' }
  return { label: 'Hazardous', color: '#ef4444', advice: 'Stay indoors if possible' }
}

export function uvLabel(uv: number | undefined): { label: string; color: string } {
  if (uv == null) return { label: '—', color: 'rgba(255,255,255,0.5)' }
  if (uv < 3) return { label: 'Low', color: '#34d399' }
  if (uv < 6) return { label: 'Moderate', color: '#fbbf24' }
  if (uv < 8) return { label: 'High', color: '#fb923c' }
  if (uv < 11) return { label: 'Very High', color: '#f87171' }
  return { label: 'Extreme', color: '#ef4444' }
}

export function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

export const atmosphereGradients: Record<WeatherMood, string> = {
  'clear-day': 'linear-gradient(160deg, #1a4a8a 0%, #3b82f6 35%, #67e8f9 70%, #fde68a 100%)',
  'clear-night': 'linear-gradient(160deg, #020617 0%, #0f172a 40%, #1e1b4b 75%, #312e81 100%)',
  'partly-cloudy': 'linear-gradient(160deg, #1e3a5f 0%, #475569 45%, #94a3b8 80%, #cbd5e1 100%)',
  cloudy: 'linear-gradient(160deg, #1e293b 0%, #334155 50%, #64748b 100%)',
  fog: 'linear-gradient(160deg, #334155 0%, #64748b 40%, #94a3b8 100%)',
  drizzle: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #475569 100%)',
  rain: 'linear-gradient(160deg, #0c1222 0%, #1e293b 40%, #334155 100%)',
  snow: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 35%, #64748b 70%, #e2e8f0 100%)',
  thunder: 'linear-gradient(160deg, #0a0a12 0%, #1a1030 40%, #312e81 70%, #4c1d95 100%)',
  hot: 'linear-gradient(160deg, #7c2d12 0%, #c2410c 35%, #f59e0b 70%, #fde68a 100%)',
}
