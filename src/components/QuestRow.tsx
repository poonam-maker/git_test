import { motion } from 'framer-motion'
import type { Quest } from '@/types'
import { areaMeta } from '@/data/lifeAreas'
import { difficultyMeta } from '@/lib/game'
import { useStore } from '@/lib/store'
import { cx } from '@/lib/utils'

export function QuestRow({ quest }: { quest: Quest }) {
  const complete = useStore((s) => s.completeQuest)
  const done = quest.status === 'done'
  const area = areaMeta(quest.area)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx('card flex items-center gap-3 p-4 transition', done && 'opacity-60')}
    >
      <button
        aria-label={done ? 'Completed' : `Complete quest: ${quest.title}`}
        onClick={() => !done && complete(quest.id)}
        disabled={done}
        className={cx(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 text-sm transition-all',
          done ? 'border-transparent bg-accent text-ink-950' : 'border-white/20 hover:border-accent active:scale-90',
        )}
      >
        {done ? '✓' : ''}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cx('font-semibold leading-snug', done && 'text-slate-500 line-through')}>{quest.title}</div>
        <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">{quest.description}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="pill bg-white/6 text-[10px] text-slate-300" style={{ color: area.color }}>{area.emoji} {area.label}</span>
          <span className="pill bg-white/6 text-[10px] text-slate-400">{difficultyMeta[quest.difficulty].minutes}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-sm font-bold text-accent-soft">+{quest.xp}</div>
        <div className="text-[10px] text-slate-500">+{quest.coins} 🪙</div>
      </div>
    </motion.div>
  )
}
