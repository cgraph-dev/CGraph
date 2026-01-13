/**
 * Gamification Store Slice
 * 
 * Manages XP, achievements, quests, and progression.
 */

import type { GamificationState, SliceCreator } from '../types';

export interface GamificationActions {
  setGamification: (data: Partial<GamificationState>) => void;
  unlockAchievement: (achievementId: string) => void;
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  updateStreak: (days: number) => void;
  equipTitle: (titleId: string | null) => void;
  equipBadge: (badgeId: string) => void;
  unequipBadge: (badgeId: string) => void;
  reset: () => void;
}

const initialGamificationState: GamificationState = {
  level: 1,
  currentXP: 0,
  xpToNextLevel: 150,
  streak: 0,
  coins: 0,
  achievements: [],
  activeQuests: [],
  completedQuests: [],
  equippedTitle: null,
  equippedBadges: [],
};

const MAX_EQUIPPED_BADGES = 5;

export const createGamificationSlice: SliceCreator<GamificationState, GamificationActions> = (set, get) => ({
  ...initialGamificationState,

  setGamification: (data) => set(data),

  unlockAchievement: (achievementId) => {
    const current = get().achievements;
    if (!current.includes(achievementId)) {
      set({ achievements: [...current, achievementId] });
    }
  },

  startQuest: (questId) => {
    const active = get().activeQuests;
    const completed = get().completedQuests;
    if (!active.includes(questId) && !completed.includes(questId)) {
      set({ activeQuests: [...active, questId] });
    }
  },

  completeQuest: (questId) => {
    const active = get().activeQuests;
    const completed = get().completedQuests;
    set({
      activeQuests: active.filter(id => id !== questId),
      completedQuests: [...completed, questId],
    });
  },

  updateStreak: (days) => set({ streak: days }),

  equipTitle: (titleId) => set({ equippedTitle: titleId }),

  equipBadge: (badgeId) => {
    const current = get().equippedBadges;
    if (current.length < MAX_EQUIPPED_BADGES && !current.includes(badgeId)) {
      set({ equippedBadges: [...current, badgeId] });
    }
  },

  unequipBadge: (badgeId) => {
    const current = get().equippedBadges;
    set({ equippedBadges: current.filter(id => id !== badgeId) });
  },

  reset: () => set(initialGamificationState),
});

export const gamificationSelectors = {
  level: (state: GamificationState) => state.level,
  xp: (state: GamificationState) => state.currentXP,
  xpProgress: (state: GamificationState) => 
    (state.currentXP / state.xpToNextLevel) * 100,
  streak: (state: GamificationState) => state.streak,
  streakMultiplier: (state: GamificationState) => {
    if (state.streak >= 30) return 2.5;
    if (state.streak >= 14) return 2.0;
    if (state.streak >= 7) return 1.5;
    if (state.streak >= 3) return 1.25;
    return 1.0;
  },
  achievementCount: (state: GamificationState) => state.achievements.length,
  hasAchievement: (achievementId: string) => (state: GamificationState) =>
    state.achievements.includes(achievementId),
  activeQuestCount: (state: GamificationState) => state.activeQuests.length,
  completedQuestCount: (state: GamificationState) => state.completedQuests.length,
  equippedTitle: (state: GamificationState) => state.equippedTitle,
  equippedBadges: (state: GamificationState) => state.equippedBadges,
};
