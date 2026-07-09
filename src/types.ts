// ============================================================================
// LifeArc data model
// ----------------------------------------------------------------------------
// These types are the single source of truth for the app's schema. They map
// 1:1 to the tables you would create in Postgres/Supabase for a backend (see
// README "Data model"). The client persists them via the Zustand store.
// ============================================================================

export type LifeAreaId =
  | 'career'
  | 'money'
  | 'health'
  | 'home'
  | 'relationships'
  | 'confidence'

export type IdentityId =
  | 'builder'
  | 'creator'
  | 'explorer'
  | 'organizer'
  | 'rebuilder'
  | 'leader'

export type Priority = 'low' | 'medium' | 'high'
export type Difficulty = 'quick' | 'standard' | 'deep'
export type Tier = 'free' | 'premium'

// -- users --------------------------------------------------------------------
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  tier: Tier
}

// -- identities / classes (static config) ------------------------------------
export interface Identity {
  id: IdentityId
  name: string // e.g. "The Builder"
  tagline: string
  description: string
  emoji: string
  // theme drives CSS variables app-wide
  theme: { accent: string; accentSoft: string; accentGlow: string }
  vocabulary: {
    xp: string // identity-flavored name for XP
    quest: string
    boss: string
    levelTitle: (level: number) => string
  }
  focusAreas: LifeAreaId[]
  milestones: { level: number; title: string; reward: string }[]
  shareStyle: { pattern: 'grid' | 'rings' | 'waves' | 'sparks' }
}

// -- profiles -----------------------------------------------------------------
export interface Profile {
  identityId: IdentityId
  level: number
  xp: number // total lifetime xp
  coins: number
  missionArc: string // the user's current narrative arc
  createdAt: string
  areaXp: Record<LifeAreaId, number>
}

// -- quests -------------------------------------------------------------------
export interface Quest {
  id: string
  title: string
  description: string
  area: LifeAreaId
  xp: number
  coins: number
  difficulty: Difficulty
  status: 'active' | 'done'
  dateKey: string // YYYY-MM-DD this quest belongs to
  aiGenerated: boolean
}

// -- tasks (user-created) -----------------------------------------------------
export interface Task {
  id: string
  title: string
  notes?: string
  area: LifeAreaId
  priority: Priority
  dueDate?: string
  status: 'active' | 'done'
  subtasks: { id: string; title: string; done: boolean }[]
  createdAt: string
}

// -- streaks ------------------------------------------------------------------
export interface Streak {
  current: number
  longest: number
  lastCheckIn: string | null // YYYY-MM-DD
  freezeTokens: number
}

// -- achievements / badges ----------------------------------------------------
export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  tier: 'bronze' | 'silver' | 'gold' | 'legendary'
  unlockedAt: string | null
}

// -- boss battles (weekly) ----------------------------------------------------
export interface BossBattle {
  id: string
  name: string
  narrative: string
  emoji: string
  area: LifeAreaId
  weekKey: string // ISO week identifier
  totalHp: number
  damageDealt: number
  objectives: { id: string; label: string; hp: number; done: boolean }[]
  reward: { xp: number; coins: number; badgeId?: string }
  status: 'active' | 'won'
}

// -- share cards --------------------------------------------------------------
export type ShareCardType =
  | 'level-up'
  | 'weekly-recap'
  | 'mission-complete'
  | 'boss-win'
  | 'streak-milestone'
  | 'identity-reveal'
  | 'current-arc'

export interface ShareCard {
  id: string
  type: ShareCardType
  title: string
  subtitle: string
  stat: string
  caption: string
  createdAt: string
}

// -- notifications / reminders ------------------------------------------------
export interface AppNotification {
  id: string
  title: string
  body: string
  kind: 'reminder' | 'reward' | 'streak' | 'system'
  createdAt: string
  read: boolean
}

// -- progress logs ------------------------------------------------------------
export interface ProgressLog {
  id: string
  dateKey: string
  area: LifeAreaId
  xp: number
  label: string
}
