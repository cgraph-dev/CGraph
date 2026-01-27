/**
 * Gamification Stores
 *
 * Zustand stores for gamification state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import type { Achievement, Quest, Title, XPTransaction } from './types';

// Re-export legacy store
export { useGamificationStore as useLegacyGamificationStore } from '@/stores/gamificationStore';

export interface GamificationState {
  // User progress
  currentXP: number;
  totalXP: number;
  level: number;
  coins: number;

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: string[];

  // Quests
  activeQuests: Quest[];
  completedQuests: string[];

  // Titles
  titles: Title[];
  equippedTitle: string | null;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;

  // XP History
  recentXPGains: XPTransaction[];

  // Actions
  addXP: (amount: number, source: string) => void;
  spendCoins: (amount: number) => boolean;
  unlockAchievement: (id: string) => void;
  completeQuest: (id: string) => void;
  claimReward: (questId: string) => void;
  equipTitle: (titleId: string | null) => void;
  updateStreak: () => void;

  // Computed
  getCurrentLevel: () => number;
  getProgress: () => number;
  getXPForNextLevel: () => number;
  checkAchievementProgress: (id: string) => number;
}

// XP required per level (exponential growth)
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentXP: 0,
      totalXP: 0,
      level: 1,
      coins: 0,
      achievements: [],
      unlockedAchievements: [],
      activeQuests: [],
      completedQuests: [],
      titles: [],
      equippedTitle: null,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      recentXPGains: [],

      // Actions
      addXP: (amount, source) => {
        const state = get();
        const newTotalXP = state.totalXP + amount;
        let newLevel = state.level;
        let newCurrentXP = state.currentXP + amount;

        // Level up logic
        while (newCurrentXP >= getXPForLevel(newLevel)) {
          newCurrentXP -= getXPForLevel(newLevel);
          newLevel++;
        }

        const transaction: XPTransaction = {
          id: Date.now().toString(),
          amount,
          source,
          timestamp: new Date().toISOString(),
        };

        set({
          currentXP: newCurrentXP,
          totalXP: newTotalXP,
          level: newLevel,
          recentXPGains: [transaction, ...state.recentXPGains.slice(0, 9)],
        });
      },

      spendCoins: (amount) => {
        const state = get();
        if (state.coins >= amount) {
          set({ coins: state.coins - amount });
          return true;
        }
        return false;
      },

      unlockAchievement: (id) => {
        const state = get();
        if (!state.unlockedAchievements.includes(id)) {
          set({
            unlockedAchievements: [...state.unlockedAchievements, id],
          });
        }
      },

      completeQuest: (id) => {
        const state = get();
        if (!state.completedQuests.includes(id)) {
          set({
            completedQuests: [...state.completedQuests, id],
          });
        }
      },

      claimReward: (questId) => {
        const state = get();
        const quest = state.activeQuests.find((q) => q.id === questId);
        if (quest && state.completedQuests.includes(questId)) {
          set({
            coins: state.coins + (quest.rewardCoins || 0),
            activeQuests: state.activeQuests.filter((q) => q.id !== questId),
          });
          state.addXP(quest.rewardXP || 0, `Quest: ${quest.title}`);
        }
      },

      equipTitle: (titleId) => {
        set({ equippedTitle: titleId });
      },

      updateStreak: () => {
        const state = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (state.lastActiveDate === today) return;

        if (state.lastActiveDate === yesterday) {
          const newStreak = state.currentStreak + 1;
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, state.longestStreak),
            lastActiveDate: today,
          });
        } else {
          set({
            currentStreak: 1,
            lastActiveDate: today,
          });
        }
      },

      // Computed
      getCurrentLevel: () => get().level,

      getProgress: () => {
        const state = get();
        const xpNeeded = getXPForLevel(state.level);
        return (state.currentXP / xpNeeded) * 100;
      },

      getXPForNextLevel: () => {
        return getXPForLevel(get().level);
      },

      checkAchievementProgress: (id) => {
        const state = get();
        const achievement = state.achievements.find((a) => a.id === id);
        if (!achievement) return 0;
        const current = achievement.currentProgress ?? 0;
        const target = achievement.targetProgress ?? 1;
        return Math.min(100, (current / target) * 100);
      },
    }),
    {
      name: 'cgraph-gamification',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        currentXP: state.currentXP,
        totalXP: state.totalXP,
        level: state.level,
        coins: state.coins,
        unlockedAchievements: state.unlockedAchievements,
        completedQuests: state.completedQuests,
        equippedTitle: state.equippedTitle,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
      }),
    }
  )
);
