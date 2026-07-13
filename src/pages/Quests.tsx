import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { LIFE_AREAS, areaMeta } from '@/data/lifeAreas'
import { QuestRow } from '@/components/QuestRow'
import { Card, EmptyState } from '@/components/ui'
import { cx, dateKey, formatDate } from '@/lib/utils'
import type { LifeAreaId, Priority } from '@/types'

export default function Quests() {
  const [tab, setTab] = useState<'quests' | 'tasks'>('quests')
  const profile = useStore((s) => s.profile)!
  const identity = getIdentity(profile.identityId)

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Your board</h1>
        <p className="text-sm text-slate-400">Daily {identity.vocabulary.quest.toLowerCase()}s + your own tasks.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
        {(['quests', 'tasks'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx('relative rounded-xl py-2.5 text-sm font-semibold transition-colors', tab === t ? 'text-ink-950' : 'text-slate-300')}>
            {tab === t && <motion.div layoutId="questtab" className="absolute inset-0 rounded-xl bg-accent-gradient" />}
            <span className="relative capitalize">{t === 'quests' ? `${identity.vocabulary.quest}s` : 'My tasks'}</span>
          </button>
        ))}
      </div>

      {tab === 'quests' ? <QuestsTab /> : <TasksTab />}
    </div>
  )
}

function QuestsTab() {
  const quests = useStore((s) => s.quests)
  const reroll = useStore((s) => s.rerollQuests)
  const today = dateKey()
  const todays = quests.filter((q) => q.dateKey === today)
  const active = todays.filter((q) => q.status === 'active')
  const done = todays.filter((q) => q.status === 'done')
  const totalXp = todays.reduce((s, q) => s + q.xp, 0)
  const earnedXp = done.reduce((s, q) => s + q.xp, 0)

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Today’s haul</div>
          <div className="font-display text-lg font-bold">{earnedXp} / {totalXp} XP</div>
        </div>
        <button onClick={reroll} className="btn-ghost text-xs">🔄 Reroll</button>
      </Card>

      {active.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence>{active.map((q) => <QuestRow key={q.id} quest={q} />)}</AnimatePresence>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Completed · {done.length}</div>
          <div className="space-y-2.5">{done.map((q) => <QuestRow key={q.id} quest={q} />)}</div>
        </div>
      )}

      {active.length === 0 && (
        <EmptyState emoji="🎉" title="You cleared today!" body="Fresh quests drop tomorrow. Reroll for more, add your own task, or take on the weekly boss." />
      )}
    </div>
  )
}

function TasksTab() {
  const tasks = useStore((s) => s.tasks)
  const [open, setOpen] = useState(false)

  const active = tasks.filter((t) => t.status === 'active')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen(true)} className="btn-primary w-full">＋ New task</button>

      {open && <TaskComposer onClose={() => setOpen(false)} />}

      {active.length === 0 && !open && (
        <EmptyState emoji="🗒️" title="No tasks yet" body="Add real-life to-dos with priorities and due dates. Let AI break the big ones into steps." action={<button className="btn-ghost mt-2" onClick={() => setOpen(true)}>Add your first task</button>} />
      )}

      <div className="space-y-2.5">
        {active.map((t) => <TaskCard key={t.id} id={t.id} />)}
      </div>

      {done.length > 0 && (
        <div>
          <div className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Done · {done.length}</div>
          <div className="space-y-2.5">{done.map((t) => <TaskCard key={t.id} id={t.id} />)}</div>
        </div>
      )}
    </div>
  )
}

const PRIORITIES: { id: Priority; label: string; tone: string }[] = [
  { id: 'low', label: 'Low', tone: 'bg-white/8 text-slate-300' },
  { id: 'medium', label: 'Medium', tone: 'bg-amber-500/15 text-amber-300' },
  { id: 'high', label: 'High', tone: 'bg-rose-500/15 text-rose-300' },
]

function TaskComposer({ onClose }: { onClose: () => void }) {
  const addTask = useStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<LifeAreaId>('career')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')

  const save = () => {
    if (!title.trim()) return
    addTask({ title, area, priority, dueDate: dueDate || undefined })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
      <Card className="space-y-4">
        <div>
          <label className="label" htmlFor="task-title">What needs doing?</label>
          <input id="task-title" autoFocus className="input" placeholder="e.g. Update my CV" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        </div>
        <div>
          <div className="label">Life area</div>
          <div className="flex flex-wrap gap-2">
            {LIFE_AREAS.map((a) => (
              <button key={a.id} onClick={() => setArea(a.id)} className={cx('pill', area === a.id ? 'bg-accent/20 text-accent-soft' : 'bg-white/6 text-slate-300')}>{a.emoji} {a.label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="label">Priority</div>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p.id} onClick={() => setPriority(p.id)} className={cx('pill flex-1 justify-center', priority === p.id ? p.tone : 'bg-white/6 text-slate-400')}>{p.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="due">Due date (optional)</label>
          <input id="due" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={save}>Add task</button>
        </div>
      </Card>
    </motion.div>
  )
}

function TaskCard({ id }: { id: string }) {
  const task = useStore((s) => s.tasks.find((t) => t.id === id))
  const toggle = useStore((s) => s.toggleTask)
  const del = useStore((s) => s.deleteTask)
  const breakdown = useStore((s) => s.autoBreakdown)
  const toggleSub = useStore((s) => s.toggleSubtask)
  if (!task) return null
  const done = task.status === 'done'
  const area = areaMeta(task.area)
  const prio = PRIORITIES.find((p) => p.id === task.priority)!
  const overdue = task.dueDate && !done && new Date(task.dueDate) < new Date(dateKey() + 'T00:00:00')

  return (
    <Card className={cx(done && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <button onClick={() => toggle(task.id)} className={cx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 text-xs transition', done ? 'border-transparent bg-accent text-ink-950' : 'border-white/20 hover:border-accent')}>{done ? '✓' : ''}</button>
        <div className="min-w-0 flex-1">
          <div className={cx('font-semibold', done && 'text-slate-500 line-through')}>{task.title}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="pill bg-white/6 text-[10px]" style={{ color: area.color }}>{area.emoji} {area.label}</span>
            <span className={cx('pill text-[10px]', prio.tone)}>{prio.label}</span>
            {task.dueDate && <span className={cx('pill text-[10px]', overdue ? 'bg-rose-500/15 text-rose-300' : 'bg-white/6 text-slate-400')}>📅 {formatDate(task.dueDate)}{overdue ? ' · overdue' : ''}</span>}
          </div>
          {task.subtasks.length > 0 && (
            <div className="mt-3 space-y-1.5 border-l-2 border-white/8 pl-3">
              {task.subtasks.map((s) => (
                <button key={s.id} onClick={() => toggleSub(task.id, s.id)} className="flex w-full items-center gap-2 text-left text-sm">
                  <span className={cx('grid h-4 w-4 shrink-0 place-items-center rounded border text-[9px]', s.done ? 'border-transparent bg-accent text-ink-950' : 'border-white/25')}>{s.done ? '✓' : ''}</span>
                  <span className={cx(s.done ? 'text-slate-500 line-through' : 'text-slate-300')}>{s.title}</span>
                </button>
              ))}
            </div>
          )}
          {!done && task.subtasks.length === 0 && (
            <button onClick={() => breakdown(task.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/12 px-3 py-1.5 text-xs font-semibold text-accent-soft">🤖 Break it down with AI</button>
          )}
        </div>
        <button onClick={() => del(task.id)} aria-label="Delete task" className="shrink-0 text-slate-600 hover:text-rose-400">✕</button>
      </div>
    </Card>
  )
}
