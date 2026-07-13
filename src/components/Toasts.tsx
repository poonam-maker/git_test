import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 pt-safe">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/12 bg-ink-800/95 px-4 py-3 text-left shadow-glow backdrop-blur-xl"
          >
            {t.emoji && <span className="text-xl">{t.emoji}</span>}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{t.title}</div>
              {t.body && <div className="truncate text-xs text-slate-400">{t.body}</div>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
