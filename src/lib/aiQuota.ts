/** Free AI messages per local calendar day (resets at midnight) */
export const FREE_AI_PER_DAY = 5

const KEYS = {
  day: 'aurora.ai.day',
  count: 'aurora.ai.count',
} as const

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function readCount(): { day: string; count: number } {
  try {
    const day = localStorage.getItem(KEYS.day) || ''
    const count = Number(localStorage.getItem(KEYS.count) || '0')
    if (day !== todayKey()) {
      return { day: todayKey(), count: 0 }
    }
    return { day, count: Number.isFinite(count) ? count : 0 }
  } catch {
    return { day: todayKey(), count: 0 }
  }
}

function writeCount(day: string, count: number) {
  try {
    localStorage.setItem(KEYS.day, day)
    localStorage.setItem(KEYS.count, String(count))
  } catch {
    /* ignore */
  }
}

export function getAiUsage(): { used: number; limit: number; remaining: number } {
  const { day, count } = readCount()
  if (day !== todayKey()) {
    writeCount(todayKey(), 0)
    return { used: 0, limit: FREE_AI_PER_DAY, remaining: FREE_AI_PER_DAY }
  }
  const used = Math.max(0, count)
  return {
    used,
    limit: FREE_AI_PER_DAY,
    remaining: Math.max(0, FREE_AI_PER_DAY - used),
  }
}

/** Call after a successful AI reply on the free plan */
export function consumeAiCredit(): void {
  const { day, count } = readCount()
  const d = day === todayKey() ? day : todayKey()
  const next = day === todayKey() ? count + 1 : 1
  writeCount(d, next)
}

export function canUseFreeAi(): boolean {
  return getAiUsage().remaining > 0
}
