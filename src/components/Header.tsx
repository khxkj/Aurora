import { RefreshCw } from 'lucide-react'
import type { TempUnit, WindUnit } from '../types/weather'

interface Props {
  tempUnit: TempUnit
  windUnit: WindUnit
  onTempUnit: (u: TempUnit) => void
  onWindUnit: (u: WindUnit) => void
  onRefresh: () => void
  refreshing?: boolean
  lastUpdated?: number
}

export function Header({
  tempUnit,
  windUnit,
  onTempUnit,
  onWindUnit,
  onRefresh,
  refreshing,
  lastUpdated,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 via-violet-400/30 to-pink-400/30 ring-1 ring-white/15">
          <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden>
            <path
              d="M18 40c4-12 10-18 14-18s10 6 14 18"
              stroke="url(#h)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="32" cy="22" r="5" fill="url(#h)" />
            <defs>
              <linearGradient id="h" x1="18" y1="18" x2="46" y2="42">
                <stop stopColor="#67e8f9" />
                <stop offset="0.5" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Aurora</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Global weather
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lastUpdated != null && (
          <span className="hidden text-[11px] text-white/35 sm:inline">
            Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="glass glass-hover rounded-xl p-2 text-white/70 transition disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        <div className="glass flex rounded-xl p-0.5 text-xs font-semibold">
          {(['celsius', 'fahrenheit'] as TempUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onTempUnit(u)}
              className={`rounded-[10px] px-2.5 py-1.5 transition ${
                tempUnit === u ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              {u === 'celsius' ? '°C' : '°F'}
            </button>
          ))}
        </div>

        <div className="glass flex rounded-xl p-0.5 text-xs font-semibold">
          {(['kmh', 'mph'] as WindUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onWindUnit(u)}
              className={`rounded-[10px] px-2.5 py-1.5 transition ${
                windUnit === u ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              {u === 'kmh' ? 'km/h' : 'mph'}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
