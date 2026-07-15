import { motion } from 'framer-motion'
import type { GeoLocation, TempUnit } from '../types/weather'
import { formatTemp } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'

export interface WorldCitySnap {
  location: GeoLocation
  temp: number
  code: number
  isDay: number
}

interface Props {
  cities: WorldCitySnap[]
  tempUnit: TempUnit
  onSelect: (location: GeoLocation) => void
  activeId?: number
}

export function WorldStrip({ cities, tempUnit, onSelect, activeId }: Props) {
  if (cities.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass rounded-3xl p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">Around the world</h2>
        <span className="text-xs text-white/40">Tap a city</span>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {cities.map((c) => {
          const active = c.location.id === activeId
          const local = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: c.location.timezone,
          })
          return (
            <button
              key={c.location.id}
              type="button"
              onClick={() => onSelect(c.location)}
              className={`min-w-[128px] rounded-2xl px-3.5 py-3 text-left transition ${
                active
                  ? 'bg-white/15 ring-1 ring-cyan-300/40'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="truncate text-sm font-semibold text-white">{c.location.name}</p>
              <p className="text-[10px] text-white/40">{local}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <WeatherIcon code={c.code} isDay={!!c.isDay} size={20} />
                <span className="text-lg font-semibold tabular-nums text-white">
                  {Number.isFinite(c.temp) ? formatTemp(c.temp, tempUnit) : '—'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </motion.section>
  )
}
