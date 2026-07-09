import { forwardRef } from 'react'
import type { Identity, ShareCard as ShareCardData } from '@/types'

// Visual patterns per identity share style.
function Pattern({ kind }: { kind: Identity['shareStyle']['pattern'] }) {
  if (kind === 'grid')
    return (
      <svg className="absolute inset-0 h-full w-full opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="g" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
    )
  if (kind === 'rings')
    return (
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
        {[60, 130, 200, 270].map((r) => <circle key={r} cx="82%" cy="12%" r={r} fill="none" stroke="white" strokeWidth="1.5" />)}
      </svg>
    )
  if (kind === 'waves')
    return (
      <svg className="absolute inset-0 h-full w-full opacity-[0.14]" viewBox="0 0 400 400" preserveAspectRatio="none">
        {[0, 40, 80, 120, 160].map((y) => <path key={y} d={`M0 ${120 + y} Q100 ${80 + y} 200 ${120 + y} T400 ${120 + y}`} fill="none" stroke="white" strokeWidth="2" />)}
      </svg>
    )
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={`${(i * 37) % 100}%`} cy={`${(i * 53) % 100}%`} r={((i % 3) + 1)} fill="white" />)}
    </svg>
  )
}

export const ShareCardView = forwardRef<HTMLDivElement, { card: ShareCardData; identity: Identity; name: string }>(
  ({ card, identity, name }, ref) => {
    const { accent, accentSoft } = identity.theme
    return (
      <div
        ref={ref}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] p-7 text-white"
        style={{
          background: `radial-gradient(120% 90% at 80% 0%, rgb(${accentSoft} / 0.55) 0%, transparent 55%), linear-gradient(160deg, #0b0b14 0%, #141426 60%, rgb(${accent} / 0.25) 100%)`,
        }}
      >
        <Pattern kind={identity.shareStyle.pattern} />
        <div className="relative flex h-full flex-col">
          {/* header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={{ background: `rgb(${accent})` }}>◆</div>
              <span className="text-sm font-bold tracking-wide">LifeArc</span>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: `rgb(${accent} / 0.25)`, color: `rgb(${accentSoft})` }}>
              {card.type.replace('-', ' ')}
            </span>
          </div>

          {/* body */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="text-6xl" style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.4))' }}>{identity.emoji}</div>
            <div className="mt-4 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: `rgb(${accentSoft})` }}>{card.title}</div>
            <div
              className="mt-1 font-bold leading-[0.95]"
              style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: card.stat.length > 12 ? '2.4rem' : '3.4rem' }}
            >
              {card.stat}
            </div>
            <div className="mt-3 max-w-[85%] text-sm text-white/75">{card.subtitle}</div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between border-t border-white/15 pt-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">{name}</div>
              <div className="text-sm font-semibold">{identity.name}</div>
            </div>
            <div className="text-[11px] font-medium text-white/50">lifearc.app</div>
          </div>
        </div>
      </div>
    )
  },
)
ShareCardView.displayName = 'ShareCardView'
