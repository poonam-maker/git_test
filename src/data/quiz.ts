import type { IdentityId, LifeAreaId } from '@/types'

export interface QuizOption {
  label: string
  emoji: string
  weights: Partial<Record<IdentityId, number>>
  areas?: LifeAreaId[] // areas this answer signals the user cares about
}
export interface QuizQuestion {
  id: string
  prompt: string
  sub?: string
  options: QuizOption[]
}

// A short, emotionally-tuned life-path quiz. Answers weight the 6 identities;
// the top score becomes the assigned class, ties broken by order below.
export const QUIZ: QuizQuestion[] = [
  {
    id: 'feeling',
    prompt: 'Right now, your life feels most like…',
    sub: 'Be honest — there are no wrong answers.',
    options: [
      { label: 'A blank plot of land', emoji: '🧱', weights: { builder: 3, organizer: 1 } },
      { label: 'A song stuck in my head', emoji: '🎧', weights: { creator: 3, explorer: 1 } },
      { label: 'A map with no route yet', emoji: '🗺️', weights: { explorer: 3, creator: 1 } },
      { label: 'A messy desk I need to clear', emoji: '🗃️', weights: { organizer: 3, builder: 1 } },
      { label: 'A phone at 3% battery', emoji: '🪫', weights: { rebuilder: 3, leader: 1 } },
    ],
  },
  {
    id: 'motivation',
    prompt: 'What would make this year feel like a win?',
    options: [
      { label: 'I built something real', emoji: '🏗️', weights: { builder: 3 }, areas: ['career', 'money'] },
      { label: 'I shipped work I’m proud of', emoji: '🚀', weights: { creator: 3 }, areas: ['career', 'confidence'] },
      { label: 'I tried things that scared me', emoji: '✨', weights: { explorer: 3 }, areas: ['confidence', 'health'] },
      { label: 'My life finally feels under control', emoji: '🧘', weights: { organizer: 3 }, areas: ['home', 'money'] },
      { label: 'I feel like myself again', emoji: '🌤️', weights: { rebuilder: 3 }, areas: ['health', 'confidence'] },
      { label: 'People started looking to me', emoji: '🫡', weights: { leader: 3 }, areas: ['relationships', 'career'] },
    ],
  },
  {
    id: 'block',
    prompt: 'What gets in your way the most?',
    options: [
      { label: 'I start things and stall', emoji: '🌀', weights: { builder: 2, organizer: 2 } },
      { label: 'I overthink instead of making', emoji: '🧠', weights: { creator: 2, explorer: 1 } },
      { label: 'I don’t know what I actually want', emoji: '❓', weights: { explorer: 3 } },
      { label: 'My life is a bit chaotic', emoji: '🌪️', weights: { organizer: 3 } },
      { label: 'I’m recovering from a rough patch', emoji: '🩹', weights: { rebuilder: 3 } },
      { label: 'I carry too much for others', emoji: '🎒', weights: { leader: 2, rebuilder: 1 } },
    ],
  },
  {
    id: 'energy',
    prompt: 'Pick the vibe you want more of:',
    options: [
      { label: 'Steady & grounded', emoji: '🪵', weights: { builder: 2, organizer: 1 } },
      { label: 'Expressive & alive', emoji: '🎨', weights: { creator: 3 } },
      { label: 'Curious & free', emoji: '🧭', weights: { explorer: 3 } },
      { label: 'Calm & in control', emoji: '🧊', weights: { organizer: 3 } },
      { label: 'Hopeful & healing', emoji: '🌱', weights: { rebuilder: 3 } },
      { label: 'Bold & respected', emoji: '👑', weights: { leader: 3 } },
    ],
  },
  {
    id: 'focus',
    prompt: 'Which part of life needs the most love?',
    sub: 'You can grow the rest later.',
    options: [
      { label: 'Career', emoji: '🚀', weights: { builder: 1, creator: 1, leader: 1 }, areas: ['career'] },
      { label: 'Money', emoji: '💸', weights: { organizer: 1, builder: 1 }, areas: ['money'] },
      { label: 'Health', emoji: '⚡', weights: { rebuilder: 1, explorer: 1 }, areas: ['health'] },
      { label: 'Home & routine', emoji: '🏡', weights: { organizer: 2 }, areas: ['home'] },
      { label: 'Relationships', emoji: '💞', weights: { leader: 1, creator: 1 }, areas: ['relationships'] },
      { label: 'Confidence', emoji: '🔥', weights: { rebuilder: 1, explorer: 1 }, areas: ['confidence'] },
    ],
  },
  {
    id: 'horizon',
    prompt: 'When you picture 6 months from now, you want to say…',
    options: [
      { label: '“I actually did the thing.”', emoji: '✅', weights: { builder: 2, leader: 1 } },
      { label: '“I made something that’s mine.”', emoji: '🖼️', weights: { creator: 2 } },
      { label: '“I know myself better now.”', emoji: '🔮', weights: { explorer: 2 } },
      { label: '“My days finally flow.”', emoji: '🌊', weights: { organizer: 2 } },
      { label: '“I came back stronger.”', emoji: '🔥', weights: { rebuilder: 2 } },
      { label: '“People count on me.”', emoji: '🤝', weights: { leader: 2 } },
    ],
  },
]

export interface QuizResult {
  identityId: IdentityId
  scores: Record<IdentityId, number>
  focusAreas: LifeAreaId[]
}

export function scoreQuiz(answers: number[]): QuizResult {
  const scores: Record<IdentityId, number> = {
    builder: 0, creator: 0, explorer: 0, organizer: 0, rebuilder: 0, leader: 0,
  }
  const areaHits: Record<string, number> = {}

  answers.forEach((optIndex, qIndex) => {
    const opt = QUIZ[qIndex]?.options[optIndex]
    if (!opt) return
    for (const [id, w] of Object.entries(opt.weights)) {
      scores[id as IdentityId] += w ?? 0
    }
    opt.areas?.forEach((a) => (areaHits[a] = (areaHits[a] ?? 0) + 1))
  })

  const order: IdentityId[] = ['rebuilder', 'creator', 'explorer', 'leader', 'builder', 'organizer']
  const identityId = order.reduce((best, id) => (scores[id] > scores[best] ? id : best), order[0])

  const focusAreas = (Object.entries(areaHits) as [LifeAreaId, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([a]) => a)

  return { identityId, scores, focusAreas }
}
