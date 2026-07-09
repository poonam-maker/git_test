import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IDENTITY_LIST } from '@/data/identities'
import { LIFE_AREAS } from '@/data/lifeAreas'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
}

export default function Landing() {
  return (
    <div className="mx-auto max-w-md overflow-x-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 py-4 pt-safe">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient text-lg shadow-glow">◆</div>
          <span className="font-display text-lg font-bold">LifeArc</span>
        </div>
        <Link to="/auth" className="pill bg-white/6 text-slate-200">Log in</Link>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-6 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh blur-2xl" />
        <motion.div {...fadeUp} className="pill mx-auto bg-accent/12 text-accent-soft">
          🎮 Your life, but make it a game worth playing
        </motion.div>
        <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="mt-5 font-display text-4xl font-bold leading-[1.05]">
          Level up your <span className="gradient-text">real life</span>.
        </motion.h1>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
          LifeArc turns getting your life together into an identity-driven RPG. Take on daily quests, beat weekly bosses, and watch real progress you can actually see — and share.
        </motion.p>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-7 flex flex-col gap-3">
          <Link to="/auth" className="btn-primary text-base">Start your arc — it’s free</Link>
          <Link to="/auth" className="btn-ghost">I already have an account</Link>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <div className="flex -space-x-2">
            {['🛠️', '🎨', '🧭', '🌱'].map((e) => <span key={e} className="grid h-7 w-7 place-items-center rounded-full border border-ink-950 bg-ink-800 text-sm">{e}</span>)}
          </div>
          Built for people in their 20s figuring it out.
        </motion.div>
      </section>

      {/* Phone-style preview */}
      <motion.section {...fadeUp} className="mt-12 px-5">
        <div className="card overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">The Builder Arc</div>
              <div className="font-display text-lg font-bold">Lv 7 · Architect</div>
            </div>
            <div className="pill bg-accent/15 text-accent-soft">🔥 12 day streak</div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { t: 'Send one bold message', xp: 60, done: true },
              { t: 'Move money to savings', xp: 30, done: true },
              { t: 'Ship a tiny piece of work', xp: 110, done: false },
            ].map((q) => (
              <div key={q.t} className="flex items-center gap-3 rounded-2xl bg-white/4 px-4 py-3">
                <span className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${q.done ? 'bg-accent text-ink-950' : 'border border-white/15'}`}>{q.done ? '✓' : ''}</span>
                <span className={`flex-1 text-sm ${q.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{q.t}</span>
                <span className="text-xs font-semibold text-accent-soft">+{q.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Identities */}
      <section className="mt-14 px-5">
        <motion.h2 {...fadeUp} className="font-display text-2xl font-bold">Pick who you’re becoming.</motion.h2>
        <motion.p {...fadeUp} className="mt-2 text-sm text-slate-400">A quick quiz assigns your class. Each one reshapes your quests, language, and rewards.</motion.p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {IDENTITY_LIST.map((id, i) => (
            <motion.div key={id.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="card p-4"
              style={{ background: `linear-gradient(160deg, rgb(${id.theme.accentSoft} / 0.12), rgb(${id.theme.accent} / 0.05))` }}
            >
              <div className="text-2xl">{id.emoji}</div>
              <div className="mt-2 font-display text-sm font-bold">{id.name}</div>
              <div className="mt-0.5 text-xs text-slate-400">{id.tagline}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Life areas */}
      <section className="mt-14 px-5">
        <motion.h2 {...fadeUp} className="font-display text-2xl font-bold">Every part of life, one arc.</motion.h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {LIFE_AREAS.map((a) => (
            <span key={a.id} className="pill bg-white/5 text-slate-200">{a.emoji} {a.label}</span>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {[
            { emoji: '🎯', t: 'AI-personalized daily quests', d: 'Small, doable steps matched to your identity and focus areas.' },
            { emoji: '⚔️', t: 'Weekly boss battles', d: 'Beat the Inbox Hydra or Lord Doomscroll for big XP and badges.' },
            { emoji: '📸', t: 'Shareable progress cards', d: 'Turn level-ups, streaks and wins into posts worth sharing.' },
          ].map((f, i) => (
            <motion.div key={f.t} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="card flex gap-4 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-xl">{f.emoji}</div>
              <div>
                <div className="font-display font-bold">{f.t}</div>
                <div className="mt-1 text-sm text-slate-400">{f.d}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-14 px-5 pb-16">
        <motion.div {...fadeUp} className="card relative overflow-hidden p-8 text-center">
          <div className="absolute inset-0 bg-mesh opacity-70" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold">Your arc starts today.</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">Two minutes to your class. One quest to your first level. Let’s go.</p>
            <Link to="/auth" className="btn-primary mt-6 w-full text-base">Begin — free forever to start</Link>
          </div>
        </motion.div>
        <p className="mt-8 text-center text-xs text-slate-600">LifeArc · Level up your real life</p>
      </section>
    </div>
  )
}
