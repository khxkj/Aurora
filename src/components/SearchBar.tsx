import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { searchLocations } from '../api/weather'
import type { GeoLocation } from '../types/weather'

interface Props {
  onSelect: (location: GeoLocation) => void
  onUseLocation: () => void
  locating?: boolean
}

export function SearchBar({ onSelect, onUseLocation, locating }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoLocation[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = window.setTimeout(async () => {
      try {
        const list = await searchLocations(query)
        setResults(list)
        setActive(0)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [query])

  const pick = (loc: GeoLocation) => {
    onSelect(loc)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl">
      <div className="glass-strong flex items-center gap-2 rounded-2xl px-3 py-2.5 shadow-xl shadow-black/20 transition focus-within:border-white/25 focus-within:ring-2 focus-within:ring-cyan-400/30">
        <Search size={18} className="shrink-0 text-white/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any city on Earth…"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader2 size={16} className="animate-spin text-white/50" />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onUseLocation}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15 disabled:opacity-50"
          title="Use my location"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          <span className="hidden sm:inline">Near me</span>
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="glass-strong absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl py-1.5 shadow-2xl shadow-black/40">
          {results.map((r, i) => (
            <li key={`${r.id}-${r.latitude}-${r.longitude}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${
                  i === active ? 'bg-white/12' : 'hover:bg-white/8'
                }`}
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-cyan-300/80" />
                <span>
                  <span className="block text-sm font-medium text-white">{r.name}</span>
                  <span className="block text-xs text-white/50">
                    {[r.admin1, r.country].filter(Boolean).join(', ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
