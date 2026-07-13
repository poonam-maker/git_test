import type { Difficulty, Identity, LifeAreaId, Quest, ShareCardType } from '@/types'
import { XP_BY_DIFFICULTY, COINS_BY_DIFFICULTY } from './game'
import { dateKey, pick, uid } from './utils'

// ============================================================================
// LifeArc AI service
// ----------------------------------------------------------------------------
// Every "AI" feature routes through here. By default it runs a deterministic,
// identity-aware local generator (VITE_AI_MODE=local) so the whole app works
// with zero keys and zero latency — perfect for demos and offline use.
//
// Set VITE_AI_MODE=live + VITE_AI_ENDPOINT to call a real model. The live path
// posts a structured prompt to your server proxy and falls back to the local
// generator on any error, so the UX never breaks. Swap `callModel` for your
// provider (e.g. an Anthropic Messages API proxy) to go live.
// ============================================================================

const MODE = import.meta.env.VITE_AI_MODE ?? 'local'
const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT ?? ''

// ---- content library --------------------------------------------------------
type QuestSeed = { title: string; description: string; difficulty: Difficulty }

const QUEST_BANK: Record<LifeAreaId, QuestSeed[]> = {
  career: [
    { title: 'Send one bold message', description: 'DM or email one person who could open a door. Keep it short and human.', difficulty: 'standard' },
    { title: 'Update your one-liner', description: 'Rewrite how you describe what you do in a single sentence.', difficulty: 'quick' },
    { title: 'Ship a tiny piece of work', description: 'Publish, post, or send something imperfect. Done beats perfect.', difficulty: 'deep' },
    { title: 'Learn one thing for 25 min', description: 'A tutorial, a chapter, a walkthrough. Progress compounds.', difficulty: 'standard' },
    { title: 'List 3 dream roles', description: 'No filtering. What would make you a little jealous to see someone else do?', difficulty: 'quick' },
  ],
  money: [
    { title: 'Check every account balance', description: 'Face the numbers for 5 honest minutes. Awareness is step one.', difficulty: 'quick' },
    { title: 'Cancel one subscription', description: 'Find one you forgot and kill it. Instant raise.', difficulty: 'standard' },
    { title: 'Move money to savings', description: 'Any amount. £5 counts. Build the muscle, not the amount.', difficulty: 'quick' },
    { title: 'Plan one no-spend day', description: 'Pick a day this week. Make it a game, not a punishment.', difficulty: 'standard' },
    { title: 'Map your monthly outflow', description: 'List what actually leaves your account each month.', difficulty: 'deep' },
  ],
  health: [
    { title: 'Move for 15 minutes', description: 'Walk, stretch, dance. Motion changes your mood chemistry.', difficulty: 'standard' },
    { title: 'Drink water first', description: 'Before coffee or your phone, one full glass of water.', difficulty: 'quick' },
    { title: 'Lights out 30 min early', description: 'Phone across the room. Give tomorrow-you a head start.', difficulty: 'standard' },
    { title: 'Cook one real meal', description: 'Something with actual vegetables. Bonus XP for leftovers.', difficulty: 'deep' },
    { title: 'Step outside for daylight', description: '10 minutes of real light resets your body clock.', difficulty: 'quick' },
  ],
  home: [
    { title: 'Reset one surface', description: 'Clear and wipe a single counter or desk. A calm anchor point.', difficulty: 'quick' },
    { title: '15-minute tidy sprint', description: 'Set a timer, one room, go. Stop when it rings.', difficulty: 'standard' },
    { title: 'Fill one donate bag', description: 'Things you don’t use, love, or need. Lighter space, lighter mind.', difficulty: 'standard' },
    { title: 'Fix one annoying thing', description: 'The drawer, the bulb, the pile. The thing you keep stepping around.', difficulty: 'deep' },
    { title: 'Make your bed', description: 'The tiny win that sets the tone for the whole day.', difficulty: 'quick' },
  ],
  relationships: [
    { title: 'Reach out to one person', description: 'Text someone you’ve been meaning to. No agenda needed.', difficulty: 'quick' },
    { title: 'Make one real plan', description: 'Put something on the calendar with someone you like.', difficulty: 'standard' },
    { title: 'Send a genuine thank-you', description: 'Tell one person exactly why you appreciate them.', difficulty: 'quick' },
    { title: 'Have one phone-free hangout', description: 'Full presence for one conversation today.', difficulty: 'standard' },
    { title: 'Reconnect with someone lost', description: 'The friend you drifted from. Break the ice first.', difficulty: 'deep' },
  ],
  confidence: [
    { title: 'Do one scary-small thing', description: 'Speak up, ask, apply. Shrink the fear by acting on it.', difficulty: 'standard' },
    { title: 'Write 3 wins from this week', description: 'Proof you’re moving, even when it doesn’t feel like it.', difficulty: 'quick' },
    { title: 'Stand tall for 2 minutes', description: 'Posture, breath, eyes up. Your body leads your mind.', difficulty: 'quick' },
    { title: 'Say no to one thing', description: 'Protect your time. A clean no is a form of self-respect.', difficulty: 'standard' },
    { title: 'Post something as yourself', description: 'Share an opinion or a piece of you. Visibility is a muscle.', difficulty: 'deep' },
  ],
}

const PEP_TALKS: Record<string, string[]> = {
  builder: [
    'Lay one brick today. That’s the whole job.',
    'Momentum is your superpower — keep the streak alive.',
    'You don’t need motivation. You need the next small piece.',
  ],
  creator: [
    'Make it badly first. You can’t edit a blank page.',
    'Ship it before you’re ready. Ready is a myth.',
    'Your taste is the compass. Follow it today.',
  ],
  explorer: [
    'You don’t need the whole map — just the next step.',
    'Curiosity beats certainty. Go find out.',
    'Every experiment is data on who you’re becoming.',
  ],
  organizer: [
    'One system today saves ten decisions tomorrow.',
    'Calm is a skill you’re building, quest by quest.',
    'Order isn’t boring — it’s freedom in disguise.',
  ],
  rebuilder: [
    'Quiet progress is still progress. Keep going.',
    'You’re not starting over — you’re starting stronger.',
    'Roots grow in the dark. Trust the process today.',
  ],
  leader: [
    'Lead yourself first. The rest follows.',
    'Standards, not moods, run your day.',
    'People remember who showed up. Be that today.',
  ],
}

// ---- public API -------------------------------------------------------------

/** Deterministic daily quest set, themed to the user's identity focus areas. */
export function generateDailyQuests(identity: Identity, date = new Date(), count = 3): Quest[] {
  const key = dateKey(date)
  const areas = identity.focusAreas
  const quests: Quest[] = []
  const usedTitles = new Set<string>()

  for (let i = 0; i < count; i++) {
    const area = areas[i % areas.length]
    const bank = QUEST_BANK[area]
    // rotate through the bank deterministically by day + slot
    let seed = `${identity.id}-${key}-${area}-${i}`
    let seedItem = pick(bank, seed)
    let guard = 0
    while (usedTitles.has(seedItem.title) && guard < bank.length) {
      seed += 'x'
      seedItem = pick(bank, seed)
      guard++
    }
    usedTitles.add(seedItem.title)
    quests.push({
      id: uid(),
      title: seedItem.title,
      description: seedItem.description,
      area,
      difficulty: seedItem.difficulty,
      xp: XP_BY_DIFFICULTY[seedItem.difficulty],
      coins: COINS_BY_DIFFICULTY[seedItem.difficulty],
      status: 'active',
      dateKey: key,
      aiGenerated: true,
    })
  }
  return quests
}

/** Break a freeform task into concrete, doable subtasks. */
export function breakdownTask(title: string, area: LifeAreaId): string[] {
  const t = title.trim()
  const verbs = ['Clarify the goal in one line', 'Gather what you need', 'Do the smallest first step', 'Finish and check it off']
  const areaFlavor: Record<LifeAreaId, string[]> = {
    career: [`Define what “done” looks like for “${t}”`, 'Find the one person or resource that unlocks it', 'Block 25 focused minutes', 'Ship a first rough version'],
    money: [`Pull the exact numbers behind “${t}”`, 'Decide the target amount or cutoff', 'Take the single money action', 'Set a reminder to review in a week'],
    health: [`Pick when and where “${t}” happens`, 'Remove one obstacle in advance', 'Do a 10-minute starter version', 'Note how you felt after'],
    home: [`Choose the exact zone for “${t}”`, 'Set a 15-minute timer', 'Sort into keep / toss / relocate', 'Do a final wipe-down'],
    relationships: [`Decide who “${t}” involves`, 'Draft the first message', 'Send it today', 'Suggest a concrete time to connect'],
    confidence: [`Name the fear inside “${t}”`, 'Shrink it to a 2-minute version', 'Do that version now', 'Write down what actually happened'],
  }
  return (areaFlavor[area] ?? verbs).slice(0, 4)
}

/** A short motivational line for the given identity + context. */
export function motivate(identity: Identity, streak = 0): string {
  const base = pick(PEP_TALKS[identity.id] ?? PEP_TALKS.builder, `${identity.id}-${dateKey()}-${streak}`)
  if (streak >= 7) return `${streak} days strong. ${base}`
  return base
}

/** Suggested next step given recent behavior — light "coach" heuristic. */
export function nextStepSuggestion(identity: Identity, weakestArea: LifeAreaId, doneToday: number): string {
  if (doneToday === 0) return `Start tiny: one ${identity.vocabulary.quest.toLowerCase()} unlocks the rest of your day.`
  const bank = QUEST_BANK[weakestArea]
  const seed = `${identity.id}-next-${weakestArea}-${dateKey()}`
  const q = pick(bank, seed)
  return `Your ${weakestArea} area is quiet. Try: “${q.title}.”`
}

/** Caption for a shareable card, tuned by identity + card type. */
export function shareCaption(identity: Identity, type: ShareCardType, stat: string): string {
  const map: Record<ShareCardType, string> = {
    'level-up': `Leveled up to ${stat} on my ${identity.name.replace('The ', '')} arc. Building a life I actually want, one quest at a time. 🎮`,
    'weekly-recap': `This week on LifeArc: ${stat}. Small reps, real change. 📈`,
    'mission-complete': `Mission complete: ${stat}. Turning “someday” into “done”. ✅`,
    'boss-win': `Boss defeated: ${stat}. The version of me that avoids things is losing. ⚔️`,
    'streak-milestone': `${stat} streak on LifeArc 🔥 Showing up for myself is finally the habit.`,
    'identity-reveal': `Turns out I’m ${identity.name}. ${identity.tagline} Starting my arc today. 🧭`,
    'current-arc': `My current arc: ${stat}. Follow along as I level up my real life. ✨`,
  }
  return map[type]
}

/** One-paragraph progress summary for the dashboard / recap. */
export function progressSummary(identity: Identity, level: number, streak: number, questsDone: number): string {
  const title = identity.vocabulary.levelTitle(level)
  return `You’re a Level ${level} ${title} on your ${identity.name.replace('The ', '')} arc — ${questsDone} quests cleared and a ${streak}-day streak. ${motivate(identity, streak)}`
}

// ---- live-model plumbing (optional) ----------------------------------------
// Structured so you can drop in a real LLM without touching the UI. When
// VITE_AI_MODE=live, callers can await these async variants; on failure they
// resolve to the deterministic local result.

async function callModel(prompt: string): Promise<string> {
  if (MODE !== 'live' || !ENDPOINT) throw new Error('local-mode')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: import.meta.env.VITE_AI_MODEL, prompt }),
  })
  if (!res.ok) throw new Error(`ai_${res.status}`)
  const data = await res.json()
  return (data.text ?? '').trim()
}

export async function motivateAsync(identity: Identity, streak = 0): Promise<string> {
  try {
    return await callModel(`Give one punchy motivational line (max 14 words) for a ${identity.name} with a ${streak}-day streak.`)
  } catch {
    return motivate(identity, streak)
  }
}
