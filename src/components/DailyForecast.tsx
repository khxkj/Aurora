import { motion } from 'framer-motion'
import type { TempUnit, WeatherBundle } from '../types/weather'
import { formatTemp } from '../lib/units'
import { getWeatherMeta } from '../lib/weatherCodes'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
}

export function DailyForecast({ data, tempUnit }: Props) {
  const { daily } = data
  const maxRange = Math.max(...daily.temperature_2m_max)
  const minRange = Math.min(...daily.temperature_2m_min)
  const span = Math.max(maxRange - minRange, 1)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="glass rounded-3xl p-4 sm:p-5"
    >
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-white/90">10-day outlook</h2>
      <div className="flex flex-col gap-1">
        {daily.time.map((day, i) => {
          const d = new Date(day + 'T12:00:00')
          const label =
            i === 0
              ? 'Today'
              : i === 1
                ? 'Tomorrow'
                : d.toLocaleDateString('en-US', { weekday: 'short' })
          const meta = getWeatherMeta(daily.weather_code[i])
          const lo = daily.temperature_2m_min[i]
          const hi = daily.temperature_2m_max[i]
          const left = ((lo - minRange) / span) * 100
          const width = ((hi - lo) / span) * 100
          const precip = daily.precipitation_probability_max[i] ?? 0

          return (
            <div
              key={day}
              className="grid grid-cols-[52px_28px_1fr_auto] items-center gap-3 rounded-xl px-1 py-2.5 transition hover:bg-white/5 sm:grid-cols-[72px_32px_56px_1fr_auto]"
            >
              <span className="text-sm font-medium text-white/85">{label}</span>
              <WeatherIcon code={daily.weather_code[i]} size={22} />
              <span className="hidden text-xs text-white/45 sm:block">{meta.label}</span>
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-8 text-right text-xs tabular-nums text-white/45 sm:w-9">
                  {formatTemp(lo, tempUnit)}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute top-0 h-full rounded-full bg-gradient-to-r from-sky-400/80 via-cyan-300 to-amber-300"
                    style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                  />
                </div>
                <span className="w-8 text-xs font-semibold tabular-nums text-white sm:w-9">
                  {formatTemp(hi, tempUnit)}
                </span>
              </div>
              <span
                className={`w-10 text-right text-[11px] tabular-nums ${
                  precip > 40 ? 'text-sky-300' : 'text-white/30'
                }`}
              >
                {precip > 0 ? `${precip}%` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
