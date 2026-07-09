// Small shared helpers. No external date lib — keeps the bundle lean.

export const uid = (): string =>
  (crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)

/** Local date key, YYYY-MM-DD. */
export const dateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO-ish week key, e.g. "2026-W28". Used to scope weekly bosses. */
export const weekKey = (d: Date = new Date()): string => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export const daysBetween = (a: string, b: string): number => {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ')

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Deterministic pseudo-random 0..1 from a string seed (for stable "AI" picks). */
export const seededRandom = (seed: string): number => {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

export const pick = <T,>(arr: T[], seed: string): T => arr[Math.floor(seededRandom(seed) * arr.length)]

export const formatDate = (iso?: string): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
