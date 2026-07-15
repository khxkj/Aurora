import type { SavedCity, TempUnit, WindUnit } from '../types/weather'

const KEYS = {
  cities: 'aurora.savedCities',
  temp: 'aurora.tempUnit',
  wind: 'aurora.windUnit',
  last: 'aurora.lastLocation',
} as const

export function loadSavedCities(): SavedCity[] {
  try {
    const raw = localStorage.getItem(KEYS.cities)
    return raw ? (JSON.parse(raw) as SavedCity[]) : []
  } catch {
    return []
  }
}

export function saveSavedCities(cities: SavedCity[]) {
  localStorage.setItem(KEYS.cities, JSON.stringify(cities.slice(0, 12)))
}

export function loadTempUnit(): TempUnit {
  const v = localStorage.getItem(KEYS.temp)
  return v === 'fahrenheit' ? 'fahrenheit' : 'celsius'
}

export function saveTempUnit(unit: TempUnit) {
  localStorage.setItem(KEYS.temp, unit)
}

export function loadWindUnit(): WindUnit {
  const v = localStorage.getItem(KEYS.wind)
  return v === 'mph' ? 'mph' : 'kmh'
}

export function saveWindUnit(unit: WindUnit) {
  localStorage.setItem(KEYS.wind, unit)
}

export function loadLastLocation(): SavedCity | null {
  try {
    const raw = localStorage.getItem(KEYS.last)
    return raw ? (JSON.parse(raw) as SavedCity) : null
  } catch {
    return null
  }
}

export function saveLastLocation(city: SavedCity) {
  localStorage.setItem(KEYS.last, JSON.stringify(city))
}
