import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Achievement, AppNotification, BossBattle, IdentityId, LifeAreaId,
  Priority, Profile, ProgressLog, Quest, ShareCard, ShareCardType,
  Streak, Task, User,
} from '@/types'
import { LIFE_AREAS } from '@/data/lifeAreas'
import { BADGE_CATALOG } from '@/data/badges'
import { getIdentity } from '@/data/identities'
import { generateWeeklyBoss } from '@/data/bosses'
import { generateDailyQuests, breakdownTask, shareCaption } from './ai'
import { levelFromXp } from './game'
import { dateKey, weekKey, daysBetween, uid } from './utils'

const emptyAreaXp = (): Record<LifeAreaId, number> =>
  LIFE_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: 0 }), {} as Record<LifeAreaId, number>)

interface Toast {
  id: string
  title: string
  body?: string
  emoji?: string
}

interface State {
  // core data
  user: User | null
  profile: Profile | null
  quests: Quest[]
  tasks: Task[]
  streak: Streak
  achievements: Achievement[]
  boss: BossBattle | null
  shareCards: ShareCard[]
  notifications: AppNotification[]
  logs: ProgressLog[]
  lastQuestDate: string | null

  // ephemeral UI
  toasts: Toast[]
  levelUpTo: number | null // triggers celebration overlay

  // derived
  level: () => number

  // auth / onboarding
  signup: (name: string, email: string) => void
  logout: () => void
  completeOnboarding: (identityId: IdentityId, focusAreas: LifeAreaId[]) => void

  // daily lifecycle
  ensureDaily: () => void

  // quests
  completeQuest: (id: string) => void
  rerollQuests: () => void

  // tasks
  addTask: (t: { title: string; area: LifeAreaId; priority: Priority; dueDate?: string; notes?: string }) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  autoBreakdown: (id: string) => void
  toggleSubtask: (taskId: string, subId: string) => void

  // boss
  hitBossObjective: (objId: string) => void

  // share cards
  createShareCard: (type: ShareCardType, opts?: { title?: string; subtitle?: string; stat?: string }) => ShareCard

  // notifications / settings
  markAllRead: () => void
  addReminder: (title: string, body: string) => void
  setTier: (tier: 'free' | 'premium') => void
  resetAll: () => void

  // toasts
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  clearLevelUp: () => void
}

function grantXp(state: State, area: LifeAreaId, xp: number, coins: number, label: string) {
  const profile = state.profile!
  const beforeLevel = levelFromXp(profile.xp).level
  const newXp = profile.xp + xp
  const afterLevel = levelFromXp(newXp).level
  const updatedProfile: Profile = {
    ...profile,
    xp: newXp,
    coins: profile.coins + coins,
    areaXp: { ...profile.areaXp, [area]: (profile.areaXp[area] ?? 0) + xp },
  }
  const log: ProgressLog = { id: uid(), dateKey: dateKey(), area, xp, label }
  return { updatedProfile, leveledUp: afterLevel > beforeLevel, afterLevel, log }
}

function checkBadges(state: State, partial: Partial<State>): Partial<State> {
  const profile = (partial.profile ?? state.profile)!
  const streak = partial.streak ?? state.streak
  const quests = partial.quests ?? state.quests
  const shareCards = partial.shareCards ?? state.shareCards
  const tasks = partial.tasks ?? state.tasks
  const achievements = [...(partial.achievements ?? state.achievements)]
  const level = levelFromXp(profile.xp).level
  const bossWins = (partial.boss ?? state.boss)?.status === 'won' ? 1 : 0
  const doneToday = quests.filter((q) => q.status === 'done' && q.dateKey === dateKey()).length
  const areasWithXp = Object.values(profile.areaXp).filter((v) => v > 0).length
  const datedTasks = tasks.filter((t) => t.dueDate).length

  const conditions: Record<string, boolean> = {
    'first-step': quests.some((q) => q.status === 'done'),
    'day-one': true,
    triple: doneToday >= 3,
    'streak-3': streak.current >= 3,
    'streak-7': streak.current >= 7,
    'streak-30': streak.current >= 30,
    'level-5': level >= 5,
    'level-10': level >= 10,
    'level-20': level >= 20,
    'boss-first': bossWins >= 1,
    rich: profile.coins >= 500,
    'well-rounded': areasWithXp >= 6,
    sharer: shareCards.length >= 1,
    planner: datedTasks >= 5,
  }

  const newlyUnlocked: Achievement[] = []
  const next = achievements.map((a) => {
    if (!a.unlockedAt && conditions[a.id]) {
      const unlocked = { ...a, unlockedAt: new Date().toISOString() }
      newlyUnlocked.push(unlocked)
      return unlocked
    }
    return a
  })

  if (newlyUnlocked.length) {
    // fire toasts + notifications for each
    setTimeout(() => {
      const s = useStore.getState()
      newlyUnlocked.forEach((b) =>
        s.pushToast({ title: 'Badge unlocked!', body: b.title, emoji: b.emoji }),
      )
    }, 350)
    const notes: AppNotification[] = newlyUnlocked.map((b) => ({
      id: uid(),
      title: `Badge unlocked: ${b.title}`,
      body: b.description,
      kind: 'reward',
      createdAt: new Date().toISOString(),
      read: false,
    }))
    partial.notifications = [...notes, ...(partial.notifications ?? state.notifications)]
  }
  partial.achievements = next
  return partial
}

const initialStreak: Streak = { current: 0, longest: 0, lastCheckIn: null, freezeTokens: 1 }

// Resilient storage: use localStorage when available, otherwise fall back to an
// in-memory map. Keeps the app from crashing in private mode, SSR, or sandboxed
// iframes where accessing localStorage throws.
const memoryStore = new Map<string, string>()
const safeStorage = {
  getItem: (name: string): string | null => {
    try { return globalThis.localStorage.getItem(name) } catch { return memoryStore.get(name) ?? null }
  },
  setItem: (name: string, value: string): void => {
    try { globalThis.localStorage.setItem(name, value) } catch { memoryStore.set(name, value) }
  },
  removeItem: (name: string): void => {
    try { globalThis.localStorage.removeItem(name) } catch { memoryStore.delete(name) }
  },
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      quests: [],
      tasks: [],
      streak: initialStreak,
      achievements: [],
      boss: null,
      shareCards: [],
      notifications: [],
      logs: [],
      lastQuestDate: null,
      toasts: [],
      levelUpTo: null,

      level: () => (get().profile ? levelFromXp(get().profile!.xp).level : 1),

      signup: (name, email) =>
        set({
          user: {
            id: uid(),
            name: name.trim() || 'Adventurer',
            email: email.trim(),
            createdAt: new Date().toISOString(),
            tier: 'free',
          },
        }),

      logout: () => set({ user: null }),

      completeOnboarding: (identityId, focusAreas) => {
        const identity = getIdentity(identityId)
        const areas = focusAreas.length ? focusAreas : identity.focusAreas
        const profile: Profile = {
          identityId,
          level: 1,
          xp: 0,
          coins: 50,
          missionArc: `The ${identity.name.replace('The ', '')} Arc: Chapter One`,
          createdAt: new Date().toISOString(),
          areaXp: emptyAreaXp(),
        }
        const achievements: Achievement[] = BADGE_CATALOG.map((b) => ({ ...b, unlockedAt: null }))
        const quests = generateDailyQuests({ ...identity, focusAreas: areas }, new Date(), 3)
        const boss = generateWeeklyBoss(identity)
        let partial: Partial<State> = {
          profile: { ...profile, identityId },
          achievements,
          quests,
          boss,
          lastQuestDate: dateKey(),
          notifications: [
            {
              id: uid(),
              title: `Welcome, ${identity.name}`,
              body: 'Your arc begins now. Clear your first quest to earn XP.',
              kind: 'system',
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        }
        // store focus areas on identity-driven profile via areaXp seed order only;
        // persist focusAreas by writing them into the quests generation above.
        partial = checkBadges(get(), partial)
        set(partial)
        get().pushToast({ title: `You are ${identity.name}`, body: identity.tagline, emoji: identity.emoji })
      },

      ensureDaily: () => {
        const { profile, lastQuestDate, boss } = get()
        if (!profile) return
        const today = dateKey()
        const patch: Partial<State> = {}

        if (lastQuestDate !== today) {
          const identity = getIdentity(profile.identityId)
          patch.quests = generateDailyQuests(identity, new Date(), 3)
          patch.lastQuestDate = today
          patch.notifications = [
            {
              id: uid(),
              title: 'New quests are live 🎯',
              body: 'Fresh daily quests are ready. Keep your streak alive.',
              kind: 'reminder',
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...get().notifications,
          ]
        }
        // refresh boss if the week rolled over
        if (!boss || boss.weekKey !== weekKey()) {
          patch.boss = generateWeeklyBoss(getIdentity(profile.identityId))
        }
        if (Object.keys(patch).length) set(patch)
      },

      completeQuest: (id) => {
        const state = get()
        const quest = state.quests.find((q) => q.id === id)
        if (!quest || quest.status === 'done') return

        const { updatedProfile, leveledUp, afterLevel, log } = grantXp(
          state, quest.area, quest.xp, quest.coins, quest.title,
        )
        const quests = state.quests.map((q) => (q.id === id ? { ...q, status: 'done' as const } : q))

        // streak logic
        const today = dateKey()
        let streak = state.streak
        if (streak.lastCheckIn !== today) {
          const gap = streak.lastCheckIn ? daysBetween(streak.lastCheckIn, today) : 1
          const current = gap === 1 ? streak.current + 1 : streak.current === 0 ? 1 : gap > 1 ? 1 : streak.current
          streak = {
            ...streak,
            current: streak.lastCheckIn === null ? 1 : current,
            longest: Math.max(streak.longest, streak.lastCheckIn === null ? 1 : current),
            lastCheckIn: today,
          }
        }

        let partial: Partial<State> = {
          profile: updatedProfile,
          quests,
          streak,
          logs: [log, ...state.logs].slice(0, 200),
        }
        if (leveledUp) partial.levelUpTo = afterLevel
        partial = checkBadges(state, partial)
        set(partial)

        get().pushToast({
          title: `+${quest.xp} XP · +${quest.coins} 🪙`,
          body: leveledUp ? `Level ${afterLevel}!` : quest.title,
          emoji: leveledUp ? '⚡' : '✅',
        })
      },

      rerollQuests: () => {
        const { profile } = get()
        if (!profile) return
        const identity = getIdentity(profile.identityId)
        // reroll only the still-active quests, keep completed ones for the day
        const done = get().quests.filter((q) => q.status === 'done')
        const fresh = generateDailyQuests(identity, new Date(), 3 + done.length)
          .filter((q) => !done.some((d) => d.title === q.title))
          .slice(0, 3)
        set({ quests: [...done, ...fresh] })
        get().pushToast({ title: 'Quests refreshed', emoji: '🔄' })
      },

      addTask: ({ title, area, priority, dueDate, notes }) => {
        const task: Task = {
          id: uid(),
          title: title.trim(),
          area,
          priority,
          dueDate,
          notes,
          status: 'active',
          subtasks: [],
          createdAt: new Date().toISOString(),
        }
        set({ tasks: [task, ...get().tasks] })
        set(checkBadges(get(), {}))
      },

      toggleTask: (id) => {
        const state = get()
        const task = state.tasks.find((t) => t.id === id)
        if (!task) return
        const nowDone = task.status === 'active'
        const tasks = state.tasks.map((t) =>
          t.id === id ? { ...t, status: nowDone ? ('done' as const) : ('active' as const) } : t,
        )
        if (nowDone) {
          const { updatedProfile, leveledUp, afterLevel, log } = grantXp(state, task.area, 40, 10, task.title)
          let partial: Partial<State> = { tasks, profile: updatedProfile, logs: [log, ...state.logs].slice(0, 200) }
          if (leveledUp) partial.levelUpTo = afterLevel
          partial = checkBadges(state, partial)
          set(partial)
          get().pushToast({ title: '+40 XP · Task done', emoji: '✅' })
        } else {
          set({ tasks })
        }
      },

      deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),

      autoBreakdown: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return
        const steps = breakdownTask(task.title, task.area)
        const subtasks = steps.map((title) => ({ id: uid(), title, done: false }))
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, subtasks } : t)) })
        get().pushToast({ title: 'AI broke it down', body: `${steps.length} steps added`, emoji: '🤖' })
      },

      toggleSubtask: (taskId, subId) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
              : t,
          ),
        }),

      hitBossObjective: (objId) => {
        const state = get()
        const boss = state.boss
        if (!boss || boss.status === 'won') return
        const obj = boss.objectives.find((o) => o.id === objId)
        if (!obj || obj.done) return

        const objectives = boss.objectives.map((o) => (o.id === objId ? { ...o, done: true } : o))
        const damageDealt = Math.min(boss.totalHp, boss.damageDealt + obj.hp)
        const won = objectives.every((o) => o.done)
        const updatedBoss: BossBattle = { ...boss, objectives, damageDealt, status: won ? 'won' : 'active' }

        let partial: Partial<State> = { boss: updatedBoss }

        if (won) {
          const { updatedProfile, leveledUp, afterLevel, log } = grantXp(
            state, boss.area, boss.reward.xp, boss.reward.coins, `Defeated ${boss.name}`,
          )
          partial.profile = updatedProfile
          partial.logs = [log, ...state.logs].slice(0, 200)
          if (leveledUp) partial.levelUpTo = afterLevel
          get().pushToast({ title: 'BOSS DEFEATED', body: `${boss.name} · +${boss.reward.xp} XP`, emoji: '⚔️' })
        } else {
          get().pushToast({ title: `Hit! -${obj.hp} HP`, body: boss.name, emoji: '💥' })
        }
        partial = checkBadges(state, partial)
        set(partial)
      },

      createShareCard: (type, opts) => {
        const state = get()
        const identity = getIdentity(state.profile!.identityId)
        const lvl = levelFromXp(state.profile!.xp).level
        const stat = opts?.stat ?? `Level ${lvl}`
        const card: ShareCard = {
          id: uid(),
          type,
          title: opts?.title ?? defaultCardTitle(type, identity.name),
          subtitle: opts?.subtitle ?? state.profile!.missionArc,
          stat,
          caption: shareCaption(identity, type, stat),
          createdAt: new Date().toISOString(),
        }
        set(checkBadges(state, { shareCards: [card, ...state.shareCards] }))
        return card
      },

      markAllRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

      addReminder: (title, body) =>
        set({
          notifications: [
            { id: uid(), title, body, kind: 'reminder', createdAt: new Date().toISOString(), read: false },
            ...get().notifications,
          ],
        }),

      setTier: (tier) => {
        const user = get().user
        if (user) set({ user: { ...user, tier } })
        get().pushToast({ title: tier === 'premium' ? 'Premium unlocked ✨' : 'Back to Free', emoji: '💫' })
      },

      resetAll: () =>
        set({
          user: null, profile: null, quests: [], tasks: [], streak: initialStreak,
          achievements: [], boss: null, shareCards: [], notifications: [], logs: [],
          lastQuestDate: null, toasts: [], levelUpTo: null,
        }),

      pushToast: (t) => {
        const toast = { ...t, id: uid() }
        set({ toasts: [...get().toasts, toast] })
        setTimeout(() => get().dismissToast(toast.id), 3800)
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      clearLevelUp: () => set({ levelUpTo: null }),
    }),
    {
      name: 'lifearc-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        const { toasts: _t, levelUpTo: _l, ...rest } = s
        return rest as State
      },
    },
  ),
)

function defaultCardTitle(type: ShareCardType, identityName: string): string {
  const map: Record<ShareCardType, string> = {
    'level-up': 'LEVEL UP',
    'weekly-recap': 'WEEKLY RECAP',
    'mission-complete': 'MISSION COMPLETE',
    'boss-win': 'BOSS DEFEATED',
    'streak-milestone': 'STREAK MILESTONE',
    'identity-reveal': identityName.toUpperCase(),
    'current-arc': 'MY CURRENT ARC',
  }
  return map[type]
}
