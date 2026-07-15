import type { TempUnit, WindUnit } from '../types/weather'

export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'fahrenheit') return (celsius * 9) / 5 + 32
  return celsius
}

export function formatTemp(celsius: number, unit: TempUnit, decimals = 0): string {
  const v = convertTemp(celsius, unit)
  return `${v.toFixed(decimals)}°`
}

export function tempSymbol(unit: TempUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C'
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === 'mph') return kmh * 0.621371
  return kmh
}

export function formatWind(kmh: number, unit: WindUnit): string {
  const v = convertWind(kmh, unit)
  return `${Math.round(v)} ${unit === 'mph' ? 'mph' : 'km/h'}`
}

export function formatVisibility(meters: number | undefined): string {
  if (meters == null) return '—'
  if (meters >= 10000) return `${(meters / 1000).toFixed(0)} km`
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`
}
