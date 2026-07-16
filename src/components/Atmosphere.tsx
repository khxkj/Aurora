import { useMemo } from 'react'
import type { WeatherMood } from '../types/weather'
import { atmosphereGradients } from '../lib/weatherCodes'

interface Props {
  mood: WeatherMood
}

/** Fewer particles on phones to avoid jank on open */
function particleBudget() {
  if (typeof window === 'undefined') return 12
  const mobile = window.matchMedia('(max-width: 640px)').matches
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return 0
  return mobile ? 10 : 16
}

export function Atmosphere({ mood }: Props) {
  const gradient = atmosphereGradients[mood] ?? atmosphereGradients.cloudy
  const budget = useMemo(() => particleBudget(), [])

  const particles = useMemo(() => {
    if (budget === 0) return []
    const n =
      mood === 'thunder'
        ? Math.min(budget, 14)
        : mood === 'rain' || mood === 'drizzle'
          ? Math.min(budget, 12)
          : mood === 'snow'
            ? Math.min(budget, 12)
            : Math.min(budget, 8)

    return Array.from({ length: n }, (_, i) => ({
      id: i,
      left: `${(i * 37) % 100}%`,
      delay: `${(i % 8) * 0.35}s`,
      duration: `${0.9 + (i % 4) * 0.2}s`,
      opacity: 0.25 + (i % 4) * 0.1,
    }))
  }, [mood, budget])

  const isPrecip = mood === 'rain' || mood === 'drizzle' || mood === 'thunder' || mood === 'snow'
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-[background] duration-700 ease-out"
        style={{ background: gradient }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,7,15,0.35)_70%,rgba(5,7,15,0.75)_100%)]" />

      {(mood === 'clear-night' || mood === 'thunder') && !reduceMotion && (
        <>
          <div
            className="animate-aurora absolute -left-1/4 top-0 h-[45vh] w-[60vw] rounded-full blur-3xl will-change-transform"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.22) 0%, transparent 70%)',
            }}
          />
          <div
            className="animate-aurora absolute -right-1/4 top-1/4 h-[40vh] w-[50vw] rounded-full blur-3xl will-change-transform"
            style={{
              background: 'radial-gradient(ellipse, rgba(167,139,250,0.25) 0%, transparent 70%)',
              animationDelay: '-4s',
            }}
          />
        </>
      )}

      {(mood === 'clear-day' || mood === 'hot') && (
        <div
          className="absolute left-1/2 top-[-10%] h-[45vh] w-[60vw] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              mood === 'hot'
                ? 'radial-gradient(ellipse, rgba(251,146,60,0.4) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(253,224,71,0.35) 0%, transparent 70%)',
          }}
        />
      )}

      {mood === 'clear-night' && !reduceMotion && (
        <div className="absolute inset-0 opacity-60">
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: i % 5 === 0 ? 2 : 1.5,
                height: i % 5 === 0 ? 2 : 1.5,
                left: `${(i * 17 + 7) % 100}%`,
                top: `${(i * 23 + 3) % 55}%`,
                opacity: 0.35 + (i % 4) * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {!reduceMotion &&
        particles.map((p) => (
          <span
            key={p.id}
            className="absolute will-change-transform"
            style={{
              left: p.left,
              top: isPrecip ? '-5%' : `${25 + (p.id % 50)}%`,
              width: mood === 'snow' ? 4 : isPrecip ? 1.5 : 3,
              height: mood === 'snow' ? 4 : isPrecip ? 12 : 3,
              borderRadius: mood === 'snow' || !isPrecip ? '50%' : 2,
              background:
                mood === 'snow'
                  ? 'rgba(255,255,255,0.8)'
                  : isPrecip
                    ? 'rgba(186,230,253,0.5)'
                    : 'rgba(255,255,255,0.3)',
              opacity: p.opacity,
              animation: isPrecip
                ? mood === 'snow'
                  ? `drift ${p.duration} linear infinite`
                  : `rain-fall ${p.duration} linear infinite`
                : `drift ${8 + (p.id % 5)}s ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
    </div>
  )
}
