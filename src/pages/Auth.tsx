import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'

export default function Auth() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const signup = useStore((s) => s.signup)
  const profile = useStore((s) => s.profile)
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && !name.trim()) return setError('What should we call you?')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 4) return setError('Password needs at least 4 characters.')

    setLoading(true)
    // Simulated auth — swap for Supabase/Auth.js on the backend.
    setTimeout(() => {
      signup(name || email.split('@')[0], email)
      navigate(profile ? '/app' : '/onboarding')
    }, 600)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-safe">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient text-lg shadow-glow">◆</div>
          <span className="font-display text-lg font-bold">LifeArc</span>
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl font-bold">
            {mode === 'signup' ? 'Create your arc' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'signup' ? 'Start leveling up your real life in two minutes.' : 'Pick up right where you left off.'}
          </p>

          {/* Segmented toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
            {(['signup', 'login'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`relative rounded-xl py-2.5 text-sm font-semibold transition-colors ${mode === m ? 'text-ink-950' : 'text-slate-300'}`}
              >
                {mode === m && <motion.div layoutId="authtab" className="absolute inset-0 rounded-xl bg-accent-gradient" />}
                <span className="relative">{m === 'signup' ? 'Sign up' : 'Log in'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="name">Your name</label>
                <input id="name" className="input" placeholder="Alex" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to the vibe: consistency over intensity. No spam, ever.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
