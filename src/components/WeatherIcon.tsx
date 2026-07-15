import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'

interface Props {
  code: number
  isDay?: boolean
  size?: number
  className?: string
}

export function WeatherIcon({ code, isDay = true, size = 28, className = '' }: Props) {
  const common = { size, className: `shrink-0 ${className}`, strokeWidth: 1.5 }

  if (code === 0 || code === 1) {
    return isDay ? (
      <Sun {...common} className={`${common.className} text-amber-300`} />
    ) : (
      <Moon {...common} className={`${common.className} text-indigo-200`} />
    )
  }
  if (code === 2) return <CloudSun {...common} className={`${common.className} text-sky-200`} />
  if (code === 3) return <Cloud {...common} className={`${common.className} text-slate-200`} />
  if (code === 45 || code === 48)
    return <CloudFog {...common} className={`${common.className} text-slate-300`} />
  if ([51, 53, 55, 56, 57].includes(code))
    return <CloudDrizzle {...common} className={`${common.className} text-sky-300`} />
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain {...common} className={`${common.className} text-blue-300`} />
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow {...common} className={`${common.className} text-sky-100`} />
  if ([95, 96, 99].includes(code))
    return <CloudLightning {...common} className={`${common.className} text-violet-300`} />

  return <Cloud {...common} />
}
