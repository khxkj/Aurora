import { Star, X } from 'lucide-react'
import type { SavedCity, TempUnit } from '../types/weather'
import type { GeoLocation } from '../types/weather'

interface Props {
  cities: SavedCity[]
  tempUnit: TempUnit
  temps: Record<number, number>
  activeId?: number
  onSelect: (city: GeoLocation) => void
  onRemove: (id: number) => void
  onToggleSave: () => void
  isSaved: boolean
  canSave: boolean
}

export function SavedCities({
  cities,
  temps,
  activeId,
  onSelect,
  onRemove,
  onToggleSave,
  isSaved,
  canSave,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleSave}
        disabled={!canSave}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          isSaved
            ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30'
            : 'bg-white/10 text-white/80 hover:bg-white/15'
        } disabled:opacity-40`}
      >
        <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
        {isSaved ? 'Saved' : 'Save city'}
      </button>

      {cities.map((c) => (
        <div
          key={c.id}
          className={`group inline-flex items-center gap-1 rounded-full pl-3 pr-1 py-1 text-xs transition ${
            c.id === activeId
              ? 'bg-white/15 text-white ring-1 ring-white/20'
              : 'bg-white/8 text-white/75 hover:bg-white/12'
          }`}
        >
          <button type="button" onClick={() => onSelect(c)} className="flex items-center gap-1.5">
            <span className="font-medium">{c.name}</span>
            {temps[c.id] != null && (
              <span className="tabular-nums text-white/50">{Math.round(temps[c.id])}°</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onRemove(c.id)}
            className="rounded-full p-1 text-white/30 opacity-60 transition hover:bg-white/10 hover:text-white hover:opacity-100"
            aria-label={`Remove ${c.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
