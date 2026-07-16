import { motion } from 'framer-motion'
import { Droplets, Eye, Thermometer, Wind } from 'lucide-react'
import type { TempUnit, WeatherBundle, WindUnit } from '../types/weather'
import { getWeatherMeta } from '../lib/weatherCodes'
import { formatTemp, formatVisibility, formatWind } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
  windUnit: WindUnit
}

export function Hero({ data, tempUnit, windUnit }: Props) {
  const { current, location, timezone } = data
  const meta = getWeatherMeta(current.weather_code, !!current.is_day, current.temperature_2m)
  const localTime = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/50">
            {localTime}
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-white sm:text-5xl md:text-6xl">
            {location.name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {[location.admin1, location.country].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
        <div className="animate-float flex items-center gap-4">
          <WeatherIcon
            code={current.weather_code}
            isDay={!!current.is_day}
            size={72}
            className="drop-shadow-lg"
          />
          <div>
            <div className="font-display text-7xl leading-none tracking-tight text-white sm:text-8xl">
              {formatTemp(current.temperature_2m, tempUnit)}
            </div>
            <p className="mt-2 text-lg font-medium text-white/90">{meta.label}</p>
            <p className="text-sm text-white/55">{meta.description}</p>
          </div>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:ml-auto">
          <Stat
            icon={<Thermometer size={16} />}
            label="Feels like"
            value={formatTemp(current.apparent_temperature, tempUnit)}
          />
          <Stat
            icon={<Droplets size={16} />}
            label="Humidity"
            value={`${Math.round(current.relative_humidity_2m)}%`}
          />
          <Stat
            icon={<Wind size={16} />}
            label="Wind"
            value={formatWind(current.wind_speed_10m, windUnit)}
          />
          <Stat
            icon={<Eye size={16} />}
            label="Visibility"
            value={formatVisibility(current.visibility)}
          />
        </div>
      </div>
    </motion.section>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="glass glass-hover rounded-2xl px-3.5 py-3 transition">
      <div className="flex items-center gap-1.5 text-white/50">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  )
}
