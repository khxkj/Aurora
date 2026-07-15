import { motion } from 'framer-motion'
import {
  Cloud,
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind,
} from 'lucide-react'
import type { TempUnit, WeatherBundle, WindUnit } from '../types/weather'
import { aqiLabel, uvLabel, windDirection } from '../lib/weatherCodes'
import { formatPressure, formatTemp, formatWind } from '../lib/units'

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
  windUnit: WindUnit
}

export function DetailGrid({ data, tempUnit, windUnit }: Props) {
  const { current, daily, airQuality, timezone } = data
  const aqi = aqiLabel(airQuality?.european_aqi ?? airQuality?.us_aqi)
  const uv = uvLabel(current.uv_index ?? daily.uv_index_max?.[0])
  const sunrise = daily.sunrise?.[0]
    ? new Date(daily.sunrise[0]).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      })
    : '—'
  const sunset = daily.sunset?.[0]
    ? new Date(daily.sunset[0]).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      })
    : '—'

  const cards = [
    {
      icon: <ThermometerSun size={18} />,
      title: 'UV Index',
      value: current.uv_index != null ? current.uv_index.toFixed(1) : '—',
      sub: uv.label,
      accent: uv.color,
      bar: Math.min(((current.uv_index ?? 0) / 11) * 100, 100),
    },
    {
      icon: <Wind size={18} />,
      title: 'Wind',
      value: formatWind(current.wind_speed_10m, windUnit),
      sub: `${windDirection(current.wind_direction_10m)} · Gusts ${formatWind(current.wind_gusts_10m, windUnit)}`,
      accent: '#67e8f9',
      bar: Math.min((current.wind_speed_10m / 60) * 100, 100),
    },
    {
      icon: <Droplets size={18} />,
      title: 'Humidity',
      value: `${Math.round(current.relative_humidity_2m)}%`,
      sub: `Dew-point feel ${formatTemp(current.apparent_temperature, tempUnit)}`,
      accent: '#38bdf8',
      bar: current.relative_humidity_2m,
    },
    {
      icon: <Gauge size={18} />,
      title: 'Pressure',
      value: formatPressure(current.pressure_msl),
      sub: current.pressure_msl >= 1013 ? 'High pressure' : 'Low pressure',
      accent: '#a78bfa',
      bar: Math.min(Math.max(((current.pressure_msl - 980) / 50) * 100, 0), 100),
    },
    {
      icon: <Cloud size={18} />,
      title: 'Cloud cover',
      value: `${Math.round(current.cloud_cover)}%`,
      sub:
        current.precipitation > 0
          ? `Precip ${current.precipitation.toFixed(1)} mm`
          : 'No active precip',
      accent: '#94a3b8',
      bar: current.cloud_cover,
    },
    {
      icon: <span className="text-sm font-bold">AQ</span>,
      title: 'Air quality',
      value: String(airQuality?.european_aqi ?? airQuality?.us_aqi ?? '—'),
      sub: aqi.advice,
      accent: aqi.color,
      bar: Math.min(((airQuality?.european_aqi ?? airQuality?.us_aqi ?? 0) / 100) * 100, 100),
      badge: aqi.label,
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="glass glass-hover rounded-3xl p-4 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/55">
                <span style={{ color: c.accent }}>{c.icon}</span>
                <span className="text-xs font-medium uppercase tracking-wider">{c.title}</span>
              </div>
              {c.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${c.accent}22`, color: c.accent }}
                >
                  {c.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{c.value}</p>
            <p className="mt-0.5 text-xs text-white/45">{c.sub}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.bar}%`, background: c.accent }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="glass grid grid-cols-2 gap-3 rounded-3xl p-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <Sunrise size={20} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
              Sunrise
            </p>
            <p className="text-lg font-semibold text-white">{sunrise}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
            <Sunset size={20} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
              Sunset
            </p>
            <p className="text-lg font-semibold text-white">{sunset}</p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
