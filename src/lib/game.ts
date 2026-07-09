import type { Difficulty } from '@/types'

// ============================================================================
// Progression math — the heart of the RPG loop.
// A smooth curve: each level costs a bit more than the last, so early wins come
// fast (retention) and later levels feel earned (long-term stickiness).
// ============================================================================

const BASE = 120
const GROWTH = 1.28

/** Total cumulative XP required to *reach* a given level (level 1 = 0). */
export function xpForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += Math.round(BASE * Math.pow(GROWTH, l - 1))
  return total
}

export interface LevelState {
  level: number
  intoLevel: number // xp earned into the current level
  span: number // xp needed to clear the current level
  pct: number // 0..100 progress through current level
  toNext: number // xp remaining to next level
}

export function levelFromXp(totalXp: number): LevelState {
  let level = 1
  while (totalXp >= xpForLevel(level + 1)) level++
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const span = ceil - floor
  const intoLevel = totalXp - floor
  return {
    level,
    intoLevel,
    span,
    pct: Math.min(100, Math.round((intoLevel / span) * 100)),
    toNext: Math.max(0, ceil - totalXp),
  }
}

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  quick: 30,
  standard: 60,
  deep: 110,
}
export const COINS_BY_DIFFICULTY: Record<Difficulty, number> = {
  quick: 8,
  standard: 18,
  deep: 40,
}

export const difficultyMeta: Record<Difficulty, { label: string; minutes: string }> = {
  quick: { label: 'Quick', minutes: '~5 min' },
  standard: { label: 'Standard', minutes: '~20 min' },
  deep: { label: 'Deep', minutes: '~45 min+' },
}
