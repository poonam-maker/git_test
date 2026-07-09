import { useEffect } from 'react'
import { getIdentity } from '@/data/identities'
import { useStore } from './store'
import type { IdentityId } from '@/types'

/** Push an identity's palette into the CSS variables the whole UI reads. */
export function applyIdentityTheme(identityId: IdentityId | undefined) {
  const root = document.documentElement
  const theme = identityId
    ? getIdentity(identityId).theme
    : { accent: '245 158 11', accentSoft: '251 191 36', accentGlow: '245 158 11' }
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-soft', theme.accentSoft)
  root.style.setProperty('--accent-glow', theme.accentGlow)
}

/** Keeps the app theme in sync with the active profile identity. */
export function useIdentityTheme() {
  const identityId = useStore((s) => s.profile?.identityId)
  useEffect(() => {
    applyIdentityTheme(identityId)
  }, [identityId])
}
