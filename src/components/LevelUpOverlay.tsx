import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { useNavigate } from 'react-router-dom'

export function LevelUpOverlay() {
  const level = useStore((s) => s.levelUpTo)
  const clear = useStore((s) => s.clearLevelUp)
  const identityId = useStore((s) => s.profile?.identityId)
  const navigate = useNavigate()
  if (level == null || !identityId) return null
  const identity = getIdentity(identityId)
  const title = identity.vocabulary.levelTitle(level)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/80 p-6 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={clear}
      >
        {/* confetti-ish sparks */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-accent"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: (Math.random() - 0.5) * 360,
              y: (Math.random() - 0.5) * 480,
              scale: 0,
            }}
            transition={{ duration: 1.1 + Math.random(), ease: 'easeOut' }}
            style={{ background: i % 2 ? 'rgb(var(--accent))' : 'rgb(var(--accent-soft))' }}
          />
        ))}
        <motion.div
          initial={{ scale: 0.7, y: 20 }} animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="card relative w-full max-w-sm overflow-hidden p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="relative">
            <motion.div
              className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-accent-gradient text-5xl shadow-glow"
              animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 0.8 }}
            >
              {identity.emoji}
            </motion.div>
            <div className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-accent-soft">Level Up</div>
            <div className="mt-1 font-display text-5xl font-bold">Lv {level}</div>
            <div className="mt-1 text-lg font-semibold gradient-text">{title}</div>
            <p className="mt-3 text-sm text-slate-400">
              You’re growing into your {identity.name.replace('The ', '')} arc. Keep the momentum.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn-ghost" onClick={clear}>Keep going</button>
              <button
                className="btn-primary"
                onClick={() => { clear(); navigate('/app/share?type=level-up&stat=Level%20' + level) }}
              >
                Share it
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
