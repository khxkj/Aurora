import { useMemo } from 'react'
import type { WeatherMood } from '../types/weather'
import { atmosphereGradients } from '../lib/weatherCodes'

interface Props {
  mood: WeatherMood
}

export function Atmosphere({ mood }: Props) {
  const gradient = atmosphereGradients[mood] ?? atmosphereGradients.cloudy

  const particles = useMemo(() => {
    if (mood === 'rain' || mood === 'drizzle' || mood === 'thunder') {
      return Array.from({ length: mood === 'thunder' ? 40 : 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 12) * 0.25}s`,
        duration: `${0.7 + (i % 5) * 0.15}s`,
        opacity: 0.25 + (i % 4) * 0.12,
      }))
    }
    if (mood === 'snow') {
      return Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: `${(i * 29) % 100}%`,
        delay: `${(i % 10) * 0.4}s`,
        duration: `${3 + (i % 6) * 0.5}s`,
        opacity: 0.35 + (i % 5) * 0.1,
      }))
    }
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${(i * 41) % 100}%`,
      delay: `${(i % 9) * 0.6}s`,
      duration: `${8 + (i % 7)}s`,
      opacity: 0.15 + (i % 4) * 0.08,
    }))
  }, [mood])

  const isPrecip = mood === 'rain' || mood === 'drizzle' || mood === 'thunder' || mood === 'snow'

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-[background] duration-1000 ease-out"
        style={{ background: gradient }}
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,7,15,0.35)_70%,rgba(5,7,15,0.75)_100%)]" />

      {/* Aurora ribbons for night / clear */}
      {(mood === 'clear-night' || mood === 'thunder') && (
        <>
          <div
            className="animate-aurora absolute -left-1/4 top-0 h-[55vh] w-[70vw] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse, rgba(52,211,153,0.25) 0%, transparent 70%)',
            }}
          />
          <div
            className="animate-aurora absolute -right-1/4 top-1/4 h-[50vh] w-[60vw] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse, rgba(167,139,250,0.3) 0%, transparent 70%)',
              animationDelay: '-4s',
            }}
          />
          <div
            className="animate-aurora absolute left-1/3 top-0 h-[40vh] w-[50vw] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse, rgba(56,189,248,0.2) 0%, transparent 70%)',
              animationDelay: '-8s',
            }}
          />
        </>
      )}

      {/* Warm glow for clear day / hot */}
      {(mood === 'clear-day' || mood === 'hot') && (
        <div
          className="absolute left-1/2 top-[-10%] h-[50vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              mood === 'hot'
                ? 'radial-gradient(ellipse, rgba(251,146,60,0.45) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(253,224,71,0.4) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Stars for night */}
      {mood === 'clear-night' && (
        <div className="absolute inset-0 opacity-70">
          {Array.from({ length: 40 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: i % 5 === 0 ? 2.5 : 1.5,
                height: i % 5 === 0 ? 2.5 : 1.5,
                left: `${(i * 17 + 7) % 100}%`,
                top: `${(i * 23 + 3) % 55}%`,
                opacity: 0.3 + (i % 5) * 0.12,
                animation: `pulse-soft ${3 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${(i % 7) * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Particles / rain / snow */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: isPrecip ? '-5%' : `${20 + (p.id % 60)}%`,
            width: mood === 'snow' ? 5 : isPrecip ? 1.5 : 4,
            height: mood === 'snow' ? 5 : isPrecip ? 14 + (p.id % 10) : 4,
            borderRadius: mood === 'snow' || !isPrecip ? '50%' : 2,
            background:
              mood === 'snow'
                ? 'rgba(255,255,255,0.85)'
                : isPrecip
                  ? 'rgba(186,230,253,0.55)'
                  : 'rgba(255,255,255,0.35)',
            opacity: p.opacity,
            animation: isPrecip
              ? mood === 'snow'
                ? `drift ${p.duration} linear infinite`
                : `rain-fall ${p.duration} linear infinite`
              : `drift ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Lightning flash for thunder */}
      {mood === 'thunder' && (
        <div
          className="absolute inset-0 bg-white/10"
          style={{ animation: 'pulse-soft 4s ease-in-out infinite' }}
        />
      )}
    </div>
  )
}
