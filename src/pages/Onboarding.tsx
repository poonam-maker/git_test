import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QUIZ, scoreQuiz } from '@/data/quiz'
import { IDENTITY_LIST, getIdentity } from '@/data/identities'
import { LIFE_AREAS } from '@/data/lifeAreas'
import { applyIdentityTheme } from '@/lib/theme'
import { useStore } from '@/lib/store'
import type { IdentityId, LifeAreaId } from '@/types'
import { Progress } from '@/components/ui'
import { cx } from '@/lib/utils'

type Phase = 'intro' | 'quiz' | 'reveal' | 'focus'

export default function Onboarding() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [chosen, setChosen] = useState<IdentityId | null>(null)
  const [focus, setFocus] = useState<LifeAreaId[]>([])
  const complete = useStore((s) => s.completeOnboarding)
  const navigate = useNavigate()

  const result = useMemo(() => (answers.length === QUIZ.length ? scoreQuiz(answers) : null), [answers])
  const identityId = chosen ?? result?.identityId ?? 'builder'
  const identity = getIdentity(identityId)

  const answer = (optIndex: number) => {
    const next = [...answers]
    next[step] = optIndex
    setAnswers(next)
    setTimeout(() => {
      if (step < QUIZ.length - 1) setStep(step + 1)
      else {
        const r = scoreQuiz(next)
        applyIdentityTheme(r.identityId)
        setChosen(r.identityId)
        setFocus(r.focusAreas.length ? r.focusAreas : getIdentity(r.identityId).focusAreas)
        setPhase('reveal')
      }
    }, 220)
  }

  const toggleFocus = (id: LifeAreaId) =>
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : f.length < 3 ? [...f, id] : f))

  const finish = () => {
    complete(identityId, focus.length ? focus : identity.focusAreas)
    navigate('/app')
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-safe">
      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col justify-center text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent-gradient text-4xl shadow-glow animate-float">🧭</div>
            <h1 className="mt-6 font-display text-3xl font-bold">Let’s find your arc.</h1>
            <p className="mx-auto mt-3 max-w-xs text-sm text-slate-400">Six quick questions. No right answers — just you. We’ll assign your identity, class, and first mission.</p>
            <button className="btn-primary mt-8" onClick={() => setPhase('quiz')}>Start the quiz</button>
            <button className="mt-3 text-sm text-slate-500" onClick={() => setPhase('reveal')}>Skip & choose manually</button>
          </motion.div>
        )}

        {/* QUIZ */}
        {phase === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col py-6">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <button onClick={() => (step > 0 ? setStep(step - 1) : setPhase('intro'))} className="font-semibold">← Back</button>
                <span>{step + 1} / {QUIZ.length}</span>
              </div>
              <Progress value={((step) / QUIZ.length) * 100} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="flex flex-1 flex-col">
                <h2 className="font-display text-2xl font-bold">{QUIZ[step].prompt}</h2>
                {QUIZ[step].sub && <p className="mt-2 text-sm text-slate-400">{QUIZ[step].sub}</p>}
                <div className="mt-6 space-y-3">
                  {QUIZ[step].options.map((opt, i) => (
                    <button key={opt.label} onClick={() => answer(i)}
                      className={cx('card card-hover flex w-full items-center gap-4 p-4 text-left', answers[step] === i && 'border-accent/60 bg-accent/10')}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col py-8">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-accent-soft">Your identity</div>
              <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-3xl bg-accent-gradient text-5xl shadow-glow">
                {identity.emoji}
              </motion.div>
              <h1 className="mt-5 font-display text-3xl font-bold">{identity.name}</h1>
              <p className="mt-1 text-accent-soft">{identity.tagline}</p>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{identity.description}</p>
            </div>

            <div className="mt-6">
              <div className="label">Not quite you? Switch class</div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
                {IDENTITY_LIST.map((id) => (
                  <button key={id.id} onClick={() => { setChosen(id.id); applyIdentityTheme(id.id); setFocus(id.focusAreas) }}
                    className={cx('flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition', id.id === identityId ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/4')}>
                    <span className="text-2xl">{id.emoji}</span>
                    <span className="text-[11px] font-semibold">{id.name.replace('The ', '')}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary mt-6" onClick={() => setPhase('focus')}>This is me →</button>
          </motion.div>
        )}

        {/* FOCUS */}
        {phase === 'focus' && (
          <motion.div key="focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col py-8">
            <h1 className="font-display text-3xl font-bold">Where do we start?</h1>
            <p className="mt-2 text-sm text-slate-400">Pick up to 3 life areas for your first quests. You can grow the rest anytime.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {LIFE_AREAS.map((a) => {
                const active = focus.includes(a.id)
                return (
                  <button key={a.id} onClick={() => toggleFocus(a.id)}
                    className={cx('card flex flex-col items-start gap-1 p-4 text-left transition', active ? 'border-accent/60 bg-accent/10' : 'card-hover')}>
                    <span className="text-2xl">{a.emoji}</span>
                    <span className="mt-1 font-display text-sm font-bold">{a.label}</span>
                    <span className="text-[11px] text-slate-400">{a.blurb}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 text-center text-xs text-slate-500">{focus.length}/3 selected</div>
            <div className="mt-auto pt-6">
              <button className="btn-primary w-full text-base" onClick={finish}>Begin my arc 🚀</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
