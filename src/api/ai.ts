import type { TempUnit, WeatherBundle, WindUnit } from '../types/weather'
import { getWeatherMeta } from '../lib/weatherCodes'
import { formatTemp, formatWind } from '../lib/units'

/** Cheap, fast chat model — keep max_tokens low to minimize cost */
export const AI_MODEL = 'grok-4-1-fast-non-reasoning'
const FALLBACK_MODEL = 'grok-4.5'
const MAX_OUTPUT_TOKENS = 140
const API_URL = 'https://api.x.ai/v1/chat/completions'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
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

const SYSTEM = `You are AURORA, a brief weather helper.
Rules: use ONLY the weather data block; answer the user's question; max ~55 words; plain language; no markdown tables; if data is missing say so.`

export async function askWeatherAI(opts: {
  apiKey: string
  weatherContext: string
  question: string
  history?: ChatMessage[]
}): Promise<string> {
  const { apiKey, weatherContext, question, history = [] } = opts

  // Keep history tiny (last 2 turns) to stay low-token
  const prior = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-4)

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `WEATHER DATA:\n${weatherContext}\n\nQuestion: ${question.slice(0, 280)}`,
    },
  ]

  // If there's prior context, put short history before the data question
  if (prior.length > 0) {
    messages.splice(1, 0, ...prior)
  }

  async function call(model: string): Promise<string> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      let msg = `AI request failed (${res.status})`
      try {
        const j = JSON.parse(errText) as { error?: { message?: string } }
        if (j.error?.message) msg = j.error.message
      } catch {
        if (errText) msg = errText.slice(0, 160)
      }
      throw new Error(msg)
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('Empty AI response')
    return text
  }

  try {
    return await call(AI_MODEL)
  } catch (e) {
    // Fall back if fast model id isn't available on this account
    const msg = e instanceof Error ? e.message : ''
    if (/model|not found|invalid/i.test(msg) || /404|400/.test(msg)) {
      return await call(FALLBACK_MODEL)
    }
    throw e
  }
}
