import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { LIFE_AREAS, areaMeta } from '@/data/lifeAreas'
import { levelFromXp } from '@/lib/game'
import { motivate, nextStepSuggestion, progressSummary } from '@/lib/ai'
import { Card, Ring, SectionTitle, Pill, Stat } from '@/components/ui'
import { dateKey } from '@/lib/utils'
import { QuestRow } from '@/components/QuestRow'

export default function Dashboard() {
  const profile = useStore((s) => s.profile)!
  const user = useStore((s) => s.user)!
  const quests = useStore((s) => s.quests)
  const streak = useStore((s) => s.streak)
  const boss = useStore((s) => s.boss)
  const navigate = useNavigate()

  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)
  const today = dateKey()
  const todays = quests.filter((q) => q.dateKey === today)
  const doneToday = todays.filter((q) => q.status === 'done').length
  const nextQuest = todays.find((q) => q.status === 'active')

  const weakest = LIFE_AREAS
    .map((a) => ({ id: a.id, xp: profile.areaXp[a.id] ?? 0 }))
    .sort((a, b) => a.xp - b.xp)[0].id
  const maxArea = Math.max(1, ...LIFE_AREAS.map((a) => profile.areaXp[a.id] ?? 0))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 pb-4">
      {/* Greeting + hero */}
      <div>
        <div className="text-sm text-slate-400">{greeting}, {user.name} 👋</div>
        <h1 className="font-display text-2xl font-bold">{profile.missionArc}</h1>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative flex items-center gap-5">
          <Ring value={lvl.pct} size={104} stroke={9}>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Level</div>
              <div className="font-display text-3xl font-bold leading-none">{lvl.level}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <Pill>{identity.emoji} {identity.vocabulary.levelTitle(lvl.level)}</Pill>
            <p className="mt-2 text-sm text-slate-300">{motivate(identity, streak.current)}</p>
            <div className="mt-2 text-xs text-slate-500">{lvl.intoLevel} / {lvl.span} {identity.vocabulary.xp} · {lvl.toNext} to next</div>
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Day streak" value={streak.current} emoji="🔥" />
        <Stat label="Coins" value={profile.coins} emoji="🪙" />
        <Stat label="Done today" value={`${doneToday}/${todays.length}`} emoji="✅" />
      </div>

      {/* AI coach */}
      <Card className="border-accent/25 bg-accent/[0.06]">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-lg">🤖</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Your coach</div>
            <p className="mt-1 text-sm text-slate-200">{nextStepSuggestion(identity, weakest, doneToday)}</p>
          </div>
        </div>
      </Card>

      {/* Today's quests */}
      <div>
        <SectionTitle
          eyebrow="Today"
          title={`${identity.vocabulary.quest}s`}
          action={<Link to="/app/quests" className="pill bg-white/6 text-slate-200">All →</Link>}
        />
        <div className="space-y-2.5">
          {nextQuest ? (
            todays.slice(0, 3).map((q) => <QuestRow key={q.id} quest={q} />)
          ) : (
            <Card className="text-center">
              <div className="text-3xl">🎉</div>
              <div className="mt-2 font-display font-bold">All quests cleared!</div>
              <p className="mt-1 text-sm text-slate-400">You showed up today. Come back tomorrow for a fresh set — or take on the boss.</p>
              <button className="btn-ghost mt-4 w-full" onClick={() => navigate('/app/boss')}>Fight the boss ⚔️</button>
            </Card>
          )}
        </div>
      </div>

      {/* Boss preview */}
      {boss && (
        <Card hover onClick={() => navigate('/app/boss')} className="relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/5 text-3xl">{boss.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Weekly {identity.vocabulary.boss}</span>
                {boss.status === 'won' && <Pill tone="success">Defeated</Pill>}
              </div>
              <div className="truncate font-display font-bold">{boss.name}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-accent-gradient" initial={{ width: 0 }} animate={{ width: `${(boss.damageDealt / boss.totalHp) * 100}%` }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Life areas */}
      <div>
        <SectionTitle eyebrow="Balance" title="Life areas" />
        <Card>
          <div className="space-y-3">
            {LIFE_AREAS.map((a) => {
              const xp = profile.areaXp[a.id] ?? 0
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-6 text-center text-lg">{a.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-300">{a.label}</span>
                      <span className="text-slate-500">{xp} {identity.vocabulary.xp}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <motion.div className="h-full rounded-full" style={{ background: areaMeta(a.id).color }} initial={{ width: 0 }} animate={{ width: `${(xp / maxArea) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Summary + share nudge */}
      <Card className="text-center">
        <p className="text-sm text-slate-300">{progressSummary(identity, lvl.level, streak.current, profile.xp > 0 ? Math.round(profile.xp / 50) : 0)}</p>
        <Link to="/app/share?type=current-arc" className="btn-primary mt-4 w-full">📸 Make a share card</Link>
      </Card>
    </div>
  )
}
