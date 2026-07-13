import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { levelFromXp } from '@/lib/game'
import { Card, Pill } from '@/components/ui'
import { cx } from '@/lib/utils'
import type { Achievement } from '@/types'

const TIER_STYLE: Record<Achievement['tier'], { ring: string; label: string }> = {
  bronze: { ring: 'from-amber-700/40 to-amber-500/20', label: 'text-amber-300' },
  silver: { ring: 'from-slate-400/40 to-slate-200/20', label: 'text-slate-200' },
  gold: { ring: 'from-yellow-500/40 to-amber-300/20', label: 'text-yellow-300' },
  legendary: { ring: 'from-fuchsia-500/40 to-cyan-400/20', label: 'text-fuchsia-300' },
}

export default function Achievements() {
  const achievements = useStore((s) => s.achievements)
  const profile = useStore((s) => s.profile)!
  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)
  const unlocked = achievements.filter((a) => a.unlockedAt)
  const pct = Math.round((unlocked.length / achievements.length) * 100)

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-slate-400">Proof of the person you’re becoming.</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-gradient text-2xl shadow-glow">🏆</div>
        <div className="flex-1">
          <div className="font-display text-lg font-bold">{unlocked.length} / {achievements.length} unlocked</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <motion.div className="h-full rounded-full bg-accent-gradient" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      {/* Milestone path for this identity */}
      <div>
        <h3 className="mb-3 font-display font-bold">{identity.name.replace('The ', '')} milestones</h3>
        <Card>
          <div className="space-y-4">
            {identity.milestones.map((m, i) => {
              const reached = lvl.level >= m.level
              return (
                <div key={m.level} className="flex items-center gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={cx('grid h-9 w-9 place-items-center rounded-full text-xs font-bold', reached ? 'bg-accent text-ink-950' : 'bg-white/8 text-slate-400')}>{reached ? '✓' : m.level}</div>
                    {i < identity.milestones.length - 1 && <div className={cx('mt-1 h-6 w-0.5', reached ? 'bg-accent/50' : 'bg-white/10')} />}
                  </div>
                  <div className="flex-1">
                    <div className={cx('font-semibold', !reached && 'text-slate-400')}>{m.title}</div>
                    <div className="text-xs text-slate-500">Lv {m.level} · {m.reward}</div>
                  </div>
                  {reached && <Pill tone="success">Unlocked</Pill>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Badge grid */}
      <div>
        <h3 className="mb-3 font-display font-bold">Badges</h3>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a, i) => {
            const on = !!a.unlockedAt
            const style = TIER_STYLE[a.tier]
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cx('card flex flex-col items-center gap-1.5 p-3 text-center', !on && 'opacity-50')}
              >
                <div className={cx('grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-2xl', on ? style.ring : 'from-white/5 to-white/5 grayscale')}>
                  {on ? a.emoji : '🔒'}
                </div>
                <div className="text-[11px] font-semibold leading-tight">{a.title}</div>
                <div className={cx('text-[9px] font-bold uppercase tracking-wider', on ? style.label : 'text-slate-600')}>{a.tier}</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <p className="pt-2 text-center text-xs text-slate-600">Tap the badges you’ve earned to relive the moment — or turn them into share cards.</p>
    </div>
  )
}
