import type { BossBattle, Identity, LifeAreaId } from '@/types'
import { weekKey, uid } from '@/lib/utils'

interface BossTemplate {
  name: string
  emoji: string
  area: LifeAreaId
  narrative: string
  objectives: string[]
}

// A small library of weekly bosses keyed loosely by life area. The weekly
// generator picks one aligned to the identity's focus areas.
const BOSS_LIBRARY: BossTemplate[] = [
  {
    name: 'The Inbox Hydra', emoji: '🐉', area: 'career',
    narrative: 'Every message you ignore grows two more heads. Cut it down to zero this week.',
    objectives: ['Reply to 5 lingering messages', 'Unsubscribe from 3 noise sources', 'Reach inbox under 10', 'Send one bold email you’ve avoided'],
  },
  {
    name: 'Lord Doomscroll', emoji: '📱',   area: 'confidence',
    narrative: 'He feeds on your evenings. Reclaim your attention and starve the beast.',
    objectives: ['3 phone-free mornings', 'One 24h app timer set', 'Read 20 pages instead', 'One full screen-free evening'],
  },
  {
    name: 'The Clutter Golem', emoji: '🗿', area: 'home',
    narrative: 'Built from everything you meant to deal with later. Time to dismantle it.',
    objectives: ['Clear one surface fully', 'Fill one donate bag', '15-min reset x3', 'One drawer or shelf sorted'],
  },
  {
    name: 'The Leak', emoji: '💧', area: 'money',
    narrative: 'A slow drain on your future. Find it, seal it, redirect the flow.',
    objectives: ['List every subscription', 'Cancel 2 you forgot', 'Set one savings transfer', 'Track spending for 5 days'],
  },
  {
    name: 'The Fog', emoji: '🌫️', area: 'health',
    narrative: 'It dulls your energy and clouds your days. Burn it off with movement and light.',
    objectives: ['Move your body 4 days', 'Sleep before midnight x3', 'Drink water first thing x5', 'One meal you actually cooked'],
  },
  {
    name: 'The Distance', emoji: '🌉', area: 'relationships',
    narrative: 'The quiet gap that grows when life gets busy. Close it, one message at a time.',
    objectives: ['Reach out to 2 people', 'Make one real plan', 'Send one thank-you', 'One undistracted hangout'],
  },
]

export function generateWeeklyBoss(identity: Identity, date = new Date()): BossBattle {
  const wk = weekKey(date)
  // Deterministic pick per week so it feels "assigned", biased to focus areas.
  const pool = BOSS_LIBRARY.filter((b) => identity.focusAreas.includes(b.area))
  const source = pool.length ? pool : BOSS_LIBRARY
  const seed = Array.from(wk).reduce((a, c) => a + c.charCodeAt(0), 0)
  const tpl = source[seed % source.length]

  const objectives = tpl.objectives.map((label) => ({
    id: uid(),
    label,
    hp: 25,
    done: false,
  }))
  const totalHp = objectives.reduce((s, o) => s + o.hp, 0)

  return {
    id: `boss-${wk}`,
    name: tpl.name,
    emoji: tpl.emoji,
    area: tpl.area,
    narrative: tpl.narrative,
    weekKey: wk,
    totalHp,
    damageDealt: 0,
    objectives,
    reward: { xp: 300, coins: 120, badgeId: 'boss-first' },
    status: 'active',
  }
}
