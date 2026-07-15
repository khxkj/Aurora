import type { TempUnit, WeatherBundle, WindUnit } from '../types/weather'
import { getWeatherMeta } from '../lib/weatherCodes'
import { formatTemp, formatWind } from '../lib/units'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Shared AI endpoint:
 * - Production / iOS: VITE_AI_PROXY_URL (Cloudflare Worker holding your key)
 * - Local dev: /api/ask (Vite middleware + .env XAI_API_KEY)
 */
export function getAiEndpoint(): string {
  const fromEnv = (import.meta.env.VITE_AI_PROXY_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  // Vite dev middleware (see vite.config.ts)
  const base = import.meta.env.BASE_URL || '/'
  return `${base}api/ask`.replace(/\/{2,}/g, '/').replace(':/', '://')
}

export function isSharedAiConfigured(): boolean {
  return Boolean((import.meta.env.VITE_AI_PROXY_URL as string | undefined)?.trim()) ||
    import.meta.env.DEV === true
}

/** Tiny weather snapshot so the model has facts without burning tokens */
export function buildWeatherContext(
  data: WeatherBundle,
  tempUnit: TempUnit,
  windUnit: WindUnit,
): string {
  const { location, current, daily, hourly, airQuality, timezone } = data
  const meta = getWeatherMeta(current.weather_code, !!current.is_day, current.temperature_2m)

  const now = Date.now()
  let start = 0
  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]).getTime() >= now - 30 * 60 * 1000) {
      start = i
      break
    }
  }
  const nextTemps = Array.from({ length: 6 }, (_, i) => start + i)
    .filter((i) => i < hourly.temperature_2m.length)
    .map((i) => Math.round(hourly.temperature_2m[i]))
    .join(',')

  const days = daily.time.slice(0, 4).map((d, i) => {
    const label = i === 0 ? 'Today' : d.slice(5)
    return `${label}:${Math.round(daily.temperature_2m_min[i])}/${Math.round(daily.temperature_2m_max[i])}C rain${daily.precipitation_probability_max[i] ?? 0}%`
  })

  const aqi = airQuality?.european_aqi ?? airQuality?.us_aqi

  return [
    `Place:${location.name},${location.country || ''} tz:${timezone}`,
    `Now:${formatTemp(current.temperature_2m, tempUnit)} feels${formatTemp(current.apparent_temperature, tempUnit)} ${meta.label}`,
    `Hum${Math.round(current.relative_humidity_2m)}% wind${formatWind(current.wind_speed_10m, windUnit)} UV${current.uv_index?.toFixed?.(0) ?? daily.uv_index_max?.[0] ?? '?'} AQI${aqi ?? '?'} cloud${Math.round(current.cloud_cover)}%`,
    `Next6hC:${nextTemps}`,
    `Days:${days.join('|')}`,
    `Sun:${daily.sunrise?.[0]?.slice(11, 16) ?? '?'}-${daily.sunset?.[0]?.slice(11, 16) ?? '?'}`,
  ].join('\n')
}

export async function askWeatherAI(opts: {
  weatherContext: string
  question: string
  history?: ChatMessage[]
}): Promise<string> {
  const { weatherContext, question, history = [] } = opts
  const endpoint = getAiEndpoint()

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question.slice(0, 280),
      weatherContext: weatherContext.slice(0, 1200),
      history: history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 400) })),
    }),
  })

  const raw = await res.text()
  let data: { answer?: string; error?: string } = {}
  try {
    data = JSON.parse(raw) as { answer?: string; error?: string }
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    throw new Error(data.error || raw.slice(0, 160) || `AI request failed (${res.status})`)
  }
  if (!data.answer?.trim()) {
    throw new Error(data.error || 'Empty AI response')
  }
  return data.answer.trim()
}
