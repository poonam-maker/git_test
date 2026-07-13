import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { areaMeta } from '@/data/lifeAreas'
import { Card, Pill } from '@/components/ui'
import { cx } from '@/lib/utils'

export default function BossBattle() {
  const boss = useStore((s) => s.boss)
  const hit = useStore((s) => s.hitBossObjective)
  const profile = useStore((s) => s.profile)!
  const identity = getIdentity(profile.identityId)

  if (!boss) return null
  const won = boss.status === 'won'
  const hpPct = 100 - (boss.damageDealt / boss.totalHp) * 100
  const area = areaMeta(boss.area)

  return (
    <div className="space-y-5 pb-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Weekly {identity.vocabulary.boss}</div>
        <h1 className="font-display text-2xl font-bold">Boss Battle</h1>
      </div>

      {/* Boss stage */}
      <Card className="relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="relative">
          <motion.div
            className="mx-auto grid h-28 w-28 place-items-center rounded-full text-6xl"
            style={{ background: won ? 'rgba(255,255,255,0.05)' : `radial-gradient(circle, rgb(${identity.theme.accent} / 0.25), transparent 70%)` }}
            animate={won ? { scale: 0.85, opacity: 0.5, filter: 'grayscale(1)' } : { y: [0, -8, 0] }}
            transition={won ? { duration: 0.5 } : { duration: 3, repeat: Infinity }}
          >
            {boss.emoji}
          </motion.div>
          <h2 className="mt-4 font-display text-2xl font-bold">{boss.name}</h2>
          <div className="mt-1 flex justify-center"><Pill tone="muted" className="text-[10px]" >{area.emoji} {area.label} boss</Pill></div>
          <p className="mx-auto mt-3 max-w-sm text-sm text-slate-400">{boss.narrative}</p>

          {/* HP bar */}
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold text-rose-300">HP</span>
              <span className="text-slate-400">{Math.max(0, boss.totalHp - boss.damageDealt)} / {boss.totalHp}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400" animate={{ width: `${hpPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
        </div>
      </Card>

      {won ? (
        <Card className="text-center">
          <div className="text-4xl">🏆</div>
          <div className="mt-2 font-display text-xl font-bold gradient-text">Victory!</div>
          <p className="mt-1 text-sm text-slate-400">You defeated {boss.name} and earned {boss.reward.xp} XP + {boss.reward.coins} coins. A new boss arrives next week.</p>
          <Link to={`/app/share?type=boss-win&stat=${encodeURIComponent(boss.name)}`} className="btn-primary mt-4 w-full">📸 Share the win</Link>
        </Card>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-bold">Objectives</h3>
            <span className="text-xs text-slate-500">{boss.objectives.filter((o) => o.done).length}/{boss.objectives.length} landed</span>
          </div>
          <div className="space-y-2.5">
            {boss.objectives.map((o) => (
              <motion.button
                key={o.id}
                layout
                onClick={() => !o.done && hit(o.id)}
                disabled={o.done}
                className={cx('card flex w-full items-center gap-3 p-4 text-left transition', o.done ? 'opacity-60' : 'card-hover')}
              >
                <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 text-sm transition', o.done ? 'border-transparent bg-accent text-ink-950' : 'border-white/20')}>{o.done ? '✓' : '⚔️'}</span>
                <span className={cx('flex-1 font-medium', o.done && 'text-slate-500 line-through')}>{o.label}</span>
                <span className="text-xs font-bold text-rose-300">-{o.hp} HP</span>
              </motion.button>
            ))}
          </div>
          <Card className="mt-4 flex items-center gap-3 border-accent/25 bg-accent/[0.06]">
            <span className="text-xl">🎁</span>
            <div className="text-sm">
              <span className="font-semibold">Reward:</span> <span className="text-accent-soft">{boss.reward.xp} XP · {boss.reward.coins} 🪙 · Giant Slayer badge</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
