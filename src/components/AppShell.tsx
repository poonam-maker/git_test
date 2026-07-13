import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { levelFromXp } from '@/lib/game'
import { cx } from '@/lib/utils'
import { Toasts } from './Toasts'
import { LevelUpOverlay } from './LevelUpOverlay'
import { useEffect } from 'react'

const NAV = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/quests', label: 'Quests', icon: '🎯' },
  { to: '/app/boss', label: 'Boss', icon: '⚔️' },
  { to: '/app/achievements', label: 'Badges', icon: '🏆' },
  { to: '/app/profile', label: 'You', icon: '🧬' },
]

export function AppShell() {
  const profile = useStore((s) => s.profile)
  const user = useStore((s) => s.user)
  const streak = useStore((s) => s.streak)
  const notifications = useStore((s) => s.notifications)
  const ensureDaily = useStore((s) => s.ensureDaily)
  const navigate = useNavigate()

  useEffect(() => { ensureDaily() }, [ensureDaily])

  if (!user) return <Navigate to="/auth" replace />
  if (!profile) return <Navigate to="/onboarding" replace />

  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/70 px-4 py-3 backdrop-blur-xl pt-safe">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => navigate('/app/identity')}>
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-lg shadow-glow">
              {identity.emoji}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[11px] font-medium text-slate-400">{identity.vocabulary.levelTitle(lvl.level)}</div>
              <div className="font-display text-sm font-bold">Lv {lvl.level} · {user.name}</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div className="pill bg-white/6 text-slate-200">🪙 {profile.coins}</div>
            <button
              onClick={() => navigate('/app/profile')}
              className={cx('pill', streak.current > 0 ? 'bg-accent/15 text-accent-soft' : 'bg-white/6 text-slate-300')}
            >
              🔥 {streak.current}
            </button>
            <button onClick={() => navigate('/app/profile')} className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/6">
              🔔
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink-950">{unread}</span>}
            </button>
          </div>
        </div>
        {/* level progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <motion.div className="h-full rounded-full bg-accent-gradient" initial={{ width: 0 }} animate={{ width: `${lvl.pct}%` }} transition={{ duration: 0.7 }} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">{lvl.toNext} {identity.vocabulary.xp} to Lv {lvl.level + 1}</span>
        </div>
      </header>

      {/* Page content */}
      <main className="px-4 pb-safe pt-4">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
        <div className="mx-3 mb-3 flex items-center justify-between rounded-3xl border border-white/10 bg-ink-850/90 px-2 py-2 shadow-card backdrop-blur-2xl">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex-1">
              {({ isActive }) => (
                <div className={cx('relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors', isActive ? 'text-accent-soft' : 'text-slate-400')}>
                  {isActive && <motion.div layoutId="navpill" className="absolute inset-0 rounded-2xl bg-accent/12" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative text-lg">{item.icon}</span>
                  <span className="relative">{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Toasts />
      <LevelUpOverlay />
    </div>
  )
}
