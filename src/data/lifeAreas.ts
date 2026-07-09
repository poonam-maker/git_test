import type { LifeAreaId } from '@/types'

export interface LifeAreaMeta {
  id: LifeAreaId
  label: string
  emoji: string
  color: string // tailwind text color for accents in charts
  blurb: string
}

export const LIFE_AREAS: LifeAreaMeta[] = [
  { id: 'career', label: 'Career', emoji: '🚀', color: '#8b5cf6', blurb: 'Work, skills & direction' },
  { id: 'money', label: 'Money', emoji: '💸', color: '#22c55e', blurb: 'Saving, earning & control' },
  { id: 'health', label: 'Health', emoji: '⚡', color: '#f59e0b', blurb: 'Body, energy & sleep' },
  { id: 'home', label: 'Home', emoji: '🏡', color: '#38bdf8', blurb: 'Space & daily systems' },
  { id: 'relationships', label: 'Relationships', emoji: '💞', color: '#f472b6', blurb: 'People & connection' },
  { id: 'confidence', label: 'Confidence', emoji: '🔥', color: '#ef4444', blurb: 'Mindset & self-belief' },
]

export const areaMeta = (id: LifeAreaId): LifeAreaMeta =>
  LIFE_AREAS.find((a) => a.id === id) ?? LIFE_AREAS[0]
