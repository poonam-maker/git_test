import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { areaMeta } from '@/data/lifeAreas'
import { levelFromXp } from '@/lib/game'
import { Card, Pill } from '@/components/ui'

export default function Identity() {
  const profile = useStore((s) => s.profile)!
  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)
  const v = identity.vocabulary

  return (
    <div className="space-y-5 pb-4">
      {/* Hero */}
      <Card className="relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="relative">
          <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-accent-gradient text-5xl shadow-glow animate-float">
            {identity.emoji}
          </motion.div>
          <h1 className="mt-4 font-display text-3xl font-bold">{identity.name}</h1>
          <p className="mt-1 text-accent-soft">{identity.tagline}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Pill>Lv {lvl.level}</Pill>
            <Pill tone="muted">{v.levelTitle(lvl.level)}</Pill>
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{identity.description}</p>
        </div>
      </Card>

      {/* Current arc */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Current arc</div>
        <div className="mt-1 font-display text-lg font-bold">{profile.missionArc}</div>
        <p className="mt-1 text-sm text-slate-400">Every quest, boss and badge is written in your class’s language. Here’s your world:</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { k: 'XP is', val: v.xp },
            { k: 'Quests are', val: `${v.quest}s` },
            { k: 'Bosses are', val: v.boss },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-white/4 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{x.k}</div>
              <div className="mt-1 text-sm font-bold">{x.val}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus areas */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Signature focus</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {identity.focusAreas.map((a) => {
            const m = areaMeta(a)
            return <span key={a} className="pill bg-white/6" style={{ color: m.color }}>{m.emoji} {m.label}</span>
          })}
        </div>
        <p className="mt-3 text-sm text-slate-400">These shape the quests you’re most likely to get — but you can grow every area.</p>
      </Card>

      {/* Progression path */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Level titles</div>
        <div className="mt-3 space-y-2">
          {[1, 6, 11, 16, 21].map((l) => {
            const reached = lvl.level >= l
            return (
              <div key={l} className={`flex items-center justify-between rounded-xl px-3 py-2 ${reached ? 'bg-accent/10' : 'bg-white/4'}`}>
                <span className={`text-sm font-semibold ${reached ? 'text-accent-soft' : 'text-slate-400'}`}>{v.levelTitle(l)}</span>
                <span className="text-xs text-slate-500">Lv {l}+</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Link to="/app/share?type=identity-reveal" className="btn-primary w-full">📸 Share your identity card</Link>
    </div>
  )
}
