import type { Achievement } from '@/types'

// Master catalog of achievements. `unlockedAt` is null until earned.
// The store seeds a copy of this for each user and flips timestamps on unlock.
export const BADGE_CATALOG: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first-step', title: 'First Step', description: 'Complete your very first quest.', emoji: '👣', tier: 'bronze' },
  { id: 'day-one', title: 'Day One', description: 'Finish your onboarding and pick your identity.', emoji: '🎬', tier: 'bronze' },
  { id: 'triple', title: 'Triple Threat', description: 'Complete 3 quests in a single day.', emoji: '🎯', tier: 'bronze' },
  { id: 'streak-3', title: 'Warming Up', description: 'Hit a 3-day streak.', emoji: '🔥', tier: 'bronze' },
  { id: 'streak-7', title: 'Unstoppable Week', description: 'Hit a 7-day streak.', emoji: '⚡', tier: 'silver' },
  { id: 'streak-30', title: 'Iron Month', description: 'Hit a 30-day streak.', emoji: '🛡️', tier: 'gold' },
  { id: 'level-5', title: 'Rising', description: 'Reach level 5.', emoji: '📈', tier: 'silver' },
  { id: 'level-10', title: 'Double Digits', description: 'Reach level 10.', emoji: '🌟', tier: 'gold' },
  { id: 'level-20', title: 'Ascended', description: 'Reach level 20.', emoji: '💎', tier: 'legendary' },
  { id: 'boss-first', title: 'Giant Slayer', description: 'Win your first boss battle.', emoji: '⚔️', tier: 'silver' },
  { id: 'boss-three', title: 'Boss Rush', description: 'Win 3 boss battles.', emoji: '🏆', tier: 'gold' },
  { id: 'rich', title: 'Coin Stacker', description: 'Bank 500 coins.', emoji: '🪙', tier: 'silver' },
  { id: 'well-rounded', title: 'Well-Rounded', description: 'Earn XP in all 6 life areas.', emoji: '🌐', tier: 'gold' },
  { id: 'sharer', title: 'Main Character', description: 'Create your first share card.', emoji: '📸', tier: 'bronze' },
  { id: 'planner', title: 'The Planner', description: 'Create 5 tasks with due dates.', emoji: '🗓️', tier: 'bronze' },
]
