import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { levelFromXp } from '@/lib/game'
import { Card, Pill, Stat } from '@/components/ui'
import { cx, formatDate } from '@/lib/utils'

export default function Profile() {
  const user = useStore((s) => s.user)!
  const profile = useStore((s) => s.profile)!
  const streak = useStore((s) => s.streak)
  const notifications = useStore((s) => s.notifications)
  const logs = useStore((s) => s.logs)
  const markAllRead = useStore((s) => s.markAllRead)
  const addReminder = useStore((s) => s.addReminder)
  const setTier = useStore((s) => s.setTier)
  const resetAll = useStore((s) => s.resetAll)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()

  const [remindersOn, setRemindersOn] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)
  const premium = user.tier === 'premium'

  const testReminder = () => addReminder('Daily nudge ⏰', 'Your quests are waiting. 5 minutes keeps the streak alive.')

  return (
    <div className="space-y-5 pb-4">
      <h1 className="font-display text-2xl font-bold">You</h1>

      {/* Profile card */}
      <Card className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-gradient text-3xl shadow-glow">{identity.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold">{user.name}</div>
          <div className="truncate text-sm text-slate-400">{user.email}</div>
          <div className="mt-1 flex gap-2">
            <Pill>Lv {lvl.level}</Pill>
            <Pill tone={premium ? 'accent' : 'muted'}>{premium ? '✨ Premium' : 'Free'}</Pill>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Level" value={lvl.level} emoji="⭐" />
        <Stat label="Longest streak" value={streak.longest} emoji="🔥" />
        <Stat label="Coins" value={profile.coins} emoji="🪙" />
      </div>

      {/* Premium upsell */}
      {!premium ? (
        <Card className="relative overflow-hidden border-accent/25">
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="relative">
            <div className="flex items-center gap-2"><span className="text-xl">✨</span><span className="font-display font-bold">LifeArc Premium</span></div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              {['Extra identity paths & class swaps', 'Custom themes & share-card packs', 'Advanced stats & unlimited AI breakdowns', 'Boss reroll + streak freezes'].map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="text-accent-soft">✓</span>{f}</li>
              ))}
            </ul>
            <button onClick={() => setTier('premium')} className="btn-primary mt-4 w-full">Upgrade — try it free</button>
            <p className="mt-2 text-center text-[11px] text-slate-500">Demo toggle · no payment taken</p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-xl">✨</span><span className="font-semibold">Premium active</span></div>
          <button onClick={() => setTier('free')} className="text-xs text-slate-400">Downgrade</button>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settings</div>
        <div className="mt-3 divide-y divide-white/8">
          <Row label="Daily reminders" desc="A nudge to keep your streak alive">
            <button onClick={() => setRemindersOn((v) => !v)} className={cx('relative h-7 w-12 rounded-full transition', remindersOn ? 'bg-accent' : 'bg-white/15')}>
              <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white transition-all', remindersOn ? 'left-6' : 'left-1')} />
            </button>
          </Row>
          <Row label="Test a notification" desc="See how reminders feel">
            <button onClick={testReminder} className="btn-ghost text-xs">Send</button>
          </Row>
          <Row label="Theme" desc="Driven by your identity class">
            <div className="h-6 w-6 rounded-full bg-accent-gradient shadow-glow" />
          </Row>
        </div>
      </Card>

      {/* Notifications */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-bold">Notifications</h3>
          {notifications.some((n) => !n.read) && <button onClick={markAllRead} className="text-xs text-accent-soft">Mark all read</button>}
        </div>
        {notifications.length === 0 ? (
          <Card className="text-center text-sm text-slate-500">No notifications yet.</Card>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 8).map((n) => (
              <Card key={n.id} className={cx('flex gap-3 p-4', !n.read && 'border-accent/25')}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/6 text-lg">
                  {n.kind === 'reward' ? '🎁' : n.kind === 'streak' ? '🔥' : n.kind === 'reminder' ? '⏰' : '💬'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </div>
                  <div className="text-xs text-slate-400">{n.body}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      {logs.length > 0 && (
        <div>
          <h3 className="mb-3 font-display font-bold">Recent activity</h3>
          <Card>
            <div className="space-y-2.5">
              {logs.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-300">{l.label}</span>
                  <span className="shrink-0 text-xs text-accent-soft">+{l.xp} · {formatDate(l.dateKey)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Danger zone */}
      <div className="space-y-2 pt-2">
        <button onClick={() => { logout(); navigate('/') }} className="btn-ghost w-full">Log out</button>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="w-full py-3 text-sm font-semibold text-rose-400/80">Reset all progress</button>
        ) : (
          <Card className="border-rose-500/30 text-center">
            <p className="text-sm text-slate-300">This wipes your arc, level, and badges. Are you sure?</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">Keep it</button>
              <button onClick={() => { resetAll(); navigate('/') }} className="btn flex-1 bg-rose-500 text-white">Reset</button>
            </div>
          </Card>
        )}
      </div>

      <p className="pt-2 text-center text-xs text-slate-600">LifeArc v1.0 · Member since {formatDate(profile.createdAt)}</p>
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      {children}
    </div>
  )
}
