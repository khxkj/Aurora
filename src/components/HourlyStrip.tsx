import { motion } from 'framer-motion'
import type { TempUnit, WeatherBundle } from '../types/weather'
import { formatTemp } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
}

export function HourlyStrip({ data, tempUnit }: Props) {
  const { hourly, timezone } = data
  const now = Date.now()

  // Start from current hour, show next 24 hours
  let start = 0
  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]).getTime() >= now - 30 * 60 * 1000) {
      start = i
      break
    }
  }
  const items = Array.from({ length: 24 }, (_, i) => start + i).filter(
    (i) => i < hourly.time.length,
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="glass rounded-3xl p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">Next 24 hours</h2>
        <span className="text-xs text-white/40">Scroll →</span>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((i, idx) => {
          const t = new Date(hourly.time[i])
          const label =
            idx === 0
              ? 'Now'
              : t.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  hour12: true,
                  timeZone: timezone,
                })
          const precip = hourly.precipitation_probability[i] ?? 0

          return (
            <div
              key={hourly.time[i]}
              className={`flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl px-2.5 py-3 transition ${
                idx === 0 ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/8'
              }`}
            >
              <span className="text-[11px] font-medium text-white/55">{label}</span>
              <WeatherIcon
                code={hourly.weather_code[i]}
                isDay={!!hourly.is_day[i]}
                size={22}
              />
              <span className="text-sm font-semibold tabular-nums text-white">
                {formatTemp(hourly.temperature_2m[i], tempUnit)}
              </span>
              <span
                className={`text-[10px] tabular-nums ${
                  precip > 40 ? 'text-sky-300' : 'text-white/35'
                }`}
              >
                {precip}%
              </span>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
