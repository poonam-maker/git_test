import type { Identity, IdentityId } from '@/types'

// The 6 core identities. Each is a full theme + vocabulary + progression path.
// Adding a new paid identity path later = one more entry here (monetization).
export const IDENTITIES: Record<IdentityId, Identity> = {
  builder: {
    id: 'builder',
    name: 'The Builder',
    tagline: 'You make things real.',
    description:
      'You turn ideas into structures. Your power is momentum — small bricks, stacked daily, become something undeniable.',
    emoji: '🛠️',
    theme: { accent: '245 158 11', accentSoft: '251 191 36', accentGlow: '245 158 11' },
    vocabulary: {
      xp: 'Craft',
      quest: 'Build',
      boss: 'Milestone Raid',
      levelTitle: (l) => ['Apprentice', 'Craftsman', 'Architect', 'Master Builder', 'Visionary'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['career', 'money', 'home'],
    milestones: [
      { level: 3, title: 'First Foundation', reward: 'Blueprint badge' },
      { level: 7, title: 'Framework Up', reward: 'Steel theme' },
      { level: 12, title: 'Skyline', reward: 'Architect title' },
      { level: 20, title: 'Landmark', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'grid' },
  },
  creator: {
    id: 'creator',
    name: 'The Creator',
    tagline: 'You turn feeling into form.',
    description:
      'You are wired to express. Your arc is about shipping the work, building an audience of one first, and trusting your taste.',
    emoji: '🎨',
    theme: { accent: '217 70 239', accentSoft: '244 114 182', accentGlow: '217 70 239' },
    vocabulary: {
      xp: 'Spark',
      quest: 'Drop',
      boss: 'Showcase',
      levelTitle: (l) => ['Sketcher', 'Maker', 'Artist', 'Auteur', 'Icon'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['career', 'confidence', 'relationships'],
    milestones: [
      { level: 3, title: 'First Ship', reward: 'Muse badge' },
      { level: 7, title: 'Signature Style', reward: 'Neon theme' },
      { level: 12, title: 'Small Audience', reward: 'Auteur title' },
      { level: 20, title: 'Cultural Dent', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'sparks' },
  },
  explorer: {
    id: 'explorer',
    name: 'The Explorer',
    tagline: 'You grow by going.',
    description:
      "You don't have it all figured out — and that's the point. Your arc is about collecting experiences until the map of your life gets clear.",
    emoji: '🧭',
    theme: { accent: '20 184 166', accentSoft: '45 212 191', accentGlow: '20 184 166' },
    vocabulary: {
      xp: 'Miles',
      quest: 'Expedition',
      boss: 'Frontier',
      levelTitle: (l) => ['Wanderer', 'Scout', 'Pathfinder', 'Voyager', 'Trailblazer'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['confidence', 'health', 'relationships'],
    milestones: [
      { level: 3, title: 'First Frontier', reward: 'Compass badge' },
      { level: 7, title: 'New Terrain', reward: 'Aurora theme' },
      { level: 12, title: 'Open Road', reward: 'Voyager title' },
      { level: 20, title: 'Uncharted', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'waves' },
  },
  organizer: {
    id: 'organizer',
    name: 'The Organizer',
    tagline: 'You bring order to chaos.',
    description:
      'You feel best when life has a system. Your arc is about building calm, repeatable structure so your future self is always covered.',
    emoji: '🗂️',
    theme: { accent: '59 130 246', accentSoft: '56 189 248', accentGlow: '59 130 246' },
    vocabulary: {
      xp: 'Order',
      quest: 'Op',
      boss: 'Overhaul',
      levelTitle: (l) => ['Sorter', 'Planner', 'Systemizer', 'Operator', 'Mastermind'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['home', 'money', 'health'],
    milestones: [
      { level: 3, title: 'Clean Slate', reward: 'Grid badge' },
      { level: 7, title: 'Running Systems', reward: 'Cobalt theme' },
      { level: 12, title: 'Autopilot', reward: 'Operator title' },
      { level: 20, title: 'Life OS', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'grid' },
  },
  rebuilder: {
    id: 'rebuilder',
    name: 'The Rebuilder',
    tagline: 'You rise from the reset.',
    description:
      "Something knocked you down — a breakup, a burnout, a plan that fell apart. Your arc is the comeback. Quietly, then all at once.",
    emoji: '🌱',
    theme: { accent: '34 197 94', accentSoft: '132 204 22', accentGlow: '34 197 94' },
    vocabulary: {
      xp: 'Growth',
      quest: 'Step',
      boss: 'Turning Point',
      levelTitle: (l) => ['Survivor', 'Rebuilder', 'Riser', 'Reborn', 'Phoenix'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['health', 'confidence', 'money'],
    milestones: [
      { level: 3, title: 'First Root', reward: 'Sprout badge' },
      { level: 7, title: 'New Ground', reward: 'Forest theme' },
      { level: 12, title: 'Full Bloom', reward: 'Reborn title' },
      { level: 20, title: 'Phoenix', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'rings' },
  },
  leader: {
    id: 'leader',
    name: 'The Leader',
    tagline: 'You move people and momentum.',
    description:
      'You carry responsibility well. Your arc is about growing into the person others rely on — starting with fully leading your own life.',
    emoji: '👑',
    theme: { accent: '244 63 94', accentSoft: '251 113 133', accentGlow: '244 63 94' },
    vocabulary: {
      xp: 'Influence',
      quest: 'Directive',
      boss: 'Command Trial',
      levelTitle: (l) => ['Recruit', 'Captain', 'Commander', 'General', 'Legend'][Math.min(4, Math.floor((l - 1) / 5))],
    },
    focusAreas: ['career', 'relationships', 'confidence'],
    milestones: [
      { level: 3, title: 'First Command', reward: 'Crest badge' },
      { level: 7, title: 'Trusted Voice', reward: 'Crimson theme' },
      { level: 12, title: 'Real Authority', reward: 'General title' },
      { level: 20, title: 'Legend', reward: 'Legendary aura' },
    ],
    shareStyle: { pattern: 'rings' },
  },
}

export const IDENTITY_LIST = Object.values(IDENTITIES)

export const getIdentity = (id: IdentityId): Identity => IDENTITIES[id]
