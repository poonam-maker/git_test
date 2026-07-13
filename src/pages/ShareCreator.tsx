import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { useStore } from '@/lib/store'
import { getIdentity } from '@/data/identities'
import { levelFromXp } from '@/lib/game'
import { ShareCardView } from '@/components/ShareCard'
import { Card } from '@/components/ui'
import { cx } from '@/lib/utils'
import type { ShareCard, ShareCardType } from '@/types'

const TYPES: { id: ShareCardType; label: string; emoji: string }[] = [
  { id: 'current-arc', label: 'My arc', emoji: '🧭' },
  { id: 'level-up', label: 'Level up', emoji: '⚡' },
  { id: 'streak-milestone', label: 'Streak', emoji: '🔥' },
  { id: 'boss-win', label: 'Boss win', emoji: '⚔️' },
  { id: 'weekly-recap', label: 'Weekly recap', emoji: '📈' },
  { id: 'mission-complete', label: 'Mission', emoji: '✅' },
  { id: 'identity-reveal', label: 'Identity', emoji: '🎭' },
]

export default function ShareCreator() {
  const [params] = useSearchParams()
  const profile = useStore((s) => s.profile)!
  const user = useStore((s) => s.user)!
  const streak = useStore((s) => s.streak)
  const create = useStore((s) => s.createShareCard)
  const identity = getIdentity(profile.identityId)
  const lvl = levelFromXp(profile.xp)

  const initialType = (params.get('type') as ShareCardType) || 'current-arc'
  const [type, setType] = useState<ShareCardType>(initialType)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const statFor = useMemo(() => {
    const override = params.get('stat')
    if (override) return override
    switch (type) {
      case 'level-up': return `Level ${lvl.level}`
      case 'streak-milestone': return `${streak.current}-day streak`
      case 'boss-win': return 'Boss defeated'
      case 'weekly-recap': return `${Math.round(profile.xp / 50)} quests done`
      case 'identity-reveal': return identity.name
      case 'mission-complete': return profile.missionArc
      default: return `${identity.name.replace('The ', '')} · Lv ${lvl.level}`
    }
  }, [type, params, lvl.level, streak.current, profile.xp, profile.missionArc, identity])

  // Build a live preview card (not persisted until the user saves/downloads).
  const card: ShareCard = useMemo(
    () => ({
      id: 'preview',
      type,
      title: type === 'identity-reveal' ? identity.name.toUpperCase() : type.replace('-', ' ').toUpperCase(),
      subtitle: profile.missionArc,
      stat: statFor,
      caption: '',
      createdAt: '',
    }),
    [type, statFor, identity, profile.missionArc],
  )

  const captionText = useMemo(
    () => buildCaption(type, identity.name, statFor),
    [type, identity.name, statFor],
  )

  useEffect(() => { setCopied(false) }, [type])

  const download = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `lifearc-${type}.png`
      link.href = dataUrl
      link.click()
      create(type, { stat: statFor }) // persist + count toward "sharer" badge
    } catch {
      /* export can fail if fonts block; user can retry */
    } finally {
      setBusy(false)
    }
  }

  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(captionText); setCopied(true) } catch { /* clipboard blocked */ }
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Share your progress</h1>
        <p className="text-sm text-slate-400">Turn your wins into cards worth posting.</p>
      </div>

      {/* Type picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={cx('flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-2.5 transition', t.id === type ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/4')}>
            <span className="text-lg">{t.emoji}</span>
            <span className="text-[11px] font-semibold">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className="mx-auto w-full max-w-[320px]">
        <ShareCardView ref={cardRef} card={card} identity={identity} name={user.name} />
      </div>

      {/* Caption */}
      <Card>
        <div className="label">AI caption</div>
        <p className="text-sm text-slate-300">{captionText}</p>
        <button onClick={copyCaption} className="btn-ghost mt-3 w-full text-xs">{copied ? '✓ Copied' : '📋 Copy caption'}</button>
      </Card>

      <button onClick={download} disabled={busy} className="btn-primary w-full text-base">
        {busy ? 'Rendering…' : '⬇️ Download card'}
      </button>
      <p className="text-center text-xs text-slate-600">Saves a high-res PNG, perfect for stories & feeds.</p>
    </div>
  )
}

// Inline caption generator mirroring ai.shareCaption to avoid a persist round-trip.
function buildCaption(type: ShareCardType, identityName: string, stat: string): string {
  const clean = identityName.replace('The ', '')
  const map: Record<ShareCardType, string> = {
    'level-up': `Leveled up to ${stat} on my ${clean} arc. Building a life I actually want, one quest at a time. 🎮`,
    'weekly-recap': `This week on LifeArc: ${stat}. Small reps, real change. 📈`,
    'mission-complete': `Mission complete: ${stat}. Turning “someday” into “done”. ✅`,
    'boss-win': `Boss defeated: ${stat}. The version of me that avoids things is losing. ⚔️`,
    'streak-milestone': `${stat} on LifeArc 🔥 Showing up for myself is finally the habit.`,
    'identity-reveal': `Turns out I’m ${identityName}. Starting my arc today. 🧭`,
    'current-arc': `My current arc: ${stat}. Follow along as I level up my real life. ✨`,
  }
  return map[type]
}
