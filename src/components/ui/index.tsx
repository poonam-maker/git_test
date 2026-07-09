import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cx } from '@/lib/utils'

// ---- Card -------------------------------------------------------------------
export function Card({
  children, className, hover, onClick, delay = 0,
}: {
  children: ReactNode; className?: string; hover?: boolean; onClick?: () => void; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cx('card p-5', hover && 'card-hover cursor-pointer', className)}
    >
      {children}
    </motion.div>
  )
}

// ---- Progress bar -----------------------------------------------------------
export function Progress({ value, className, showShimmer = true }: { value: number; className?: string; showShimmer?: boolean }) {
  return (
    <div className={cx('relative h-2.5 w-full overflow-hidden rounded-full bg-white/8', className)}>
      <motion.div
        className="relative h-full rounded-full bg-accent-gradient"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {showShimmer && value > 4 && value < 100 && <span className="shimmer absolute inset-0 overflow-hidden rounded-full" />}
      </motion.div>
    </div>
  )
}

// ---- Ring (radial progress) -------------------------------------------------
export function Ring({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, value) / 100) * c
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--accent))" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

// ---- Pill / badge -----------------------------------------------------------
export function Pill({ children, className, tone = 'accent' }: { children: ReactNode; className?: string; tone?: 'accent' | 'muted' | 'success' | 'danger' }) {
  const tones = {
    accent: 'bg-accent/15 text-accent-soft',
    muted: 'bg-white/8 text-slate-300',
    success: 'bg-emerald-500/15 text-emerald-300',
    danger: 'bg-rose-500/15 text-rose-300',
  }
  return <span className={cx('pill', tones[tone], className)}>{children}</span>
}

// ---- Section header ---------------------------------------------------------
export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-wider text-accent-soft/80">{eyebrow}</div>}
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      {action}
    </div>
  )
}

// ---- Empty state ------------------------------------------------------------
export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">{emoji}</div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="max-w-xs text-sm text-slate-400">{body}</p>
      {action}
    </div>
  )
}

// ---- Loading skeleton -------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('relative overflow-hidden rounded-2xl bg-white/5', className)}><span className="shimmer absolute inset-0" /></div>
}

// ---- Stat tile --------------------------------------------------------------
// Vertical layout so short numeric values never get clipped in tight grids.
export function Stat({ label, value, emoji }: { label: string; value: string | number; emoji?: string }) {
  return (
    <div className="card flex flex-col gap-1.5 p-3.5">
      {emoji && <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-lg">{emoji}</div>}
      <div className="font-display text-xl font-bold leading-none tabular-nums">{value}</div>
      <div className="text-[11px] leading-tight text-slate-400">{label}</div>
    </div>
  )
}
