/**
 * Mobile Gamification Store
 *
 * Real Zustand store replacing the useGamificationFacade stub.
 * Leverages the existing gamificationService for API calls.
 * Persists level/XP/streak data to AsyncStorage.
 *
 * @module stores/gamificationStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGamificationStats,
  getAchievements,
  getActiveQuests,
  claimDailyStreak,
  equipTitle as equipTitleApi,
  unequipTitle as unequipTitleApi,
  type GamificationStats,
  type AchievementWithProgress,
  type UserQuest,
} from '../services/gamificationService';

// ── Types ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  objectives: {
    id: string;
    description: string;
    targetValue: number;
    currentValue: number;
    completed: boolean;
  }[];
  completed: boolean;
  expiresAt: string | null;
}

// ── Store Interface ────────────────────────────────────────────────────

interface GamificationState {
  // Level & XP
  xp: number;
  level: number;
  coins: number;
  streak: number;
  levelProgress: number;
  xpForNextLevel: number;

  // Achievements
  achievements: Achievement[];
  totalAchievements: number;
  achievementsUnlocked: number;

  // Quests
  activeQuests: Quest[];
  questsCompleted: number;

  // Titles
  currentTitle: string | null;
  equippedTitleId: string | null;

  // Loading
  isLoading: boolean;
  isLoadingAchievements: boolean;
  isLoadingQuests: boolean;

  // Actions
  fetchGamificationData: () => Promise<void>;
  fetchAchievements: (category?: string) => Promise<void>;
  fetchQuests: () => Promise<void>;
  claimDailyStreak: () => Promise<{ coins: number; streak: number } | null>;
  equipTitle: (titleId: string) => Promise<void>;
  unequipTitle: () => Promise<void>;
  handleXPAwarded: (data: {
    amount: number;
    source: string;
    total_xp: number;
    level: number;
    level_up: boolean;
    level_progress: number;
  }) => void;
  handleCoinsAwarded: (data: { amount: number; balance: number }) => void;
  reset: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  xp: 0,
  level: 1,
  coins: 0,
  streak: 0,
  levelProgress: 0,
  xpForNextLevel: 100,
   
  achievements: [] as Achievement[],
  totalAchievements: 0,
  achievementsUnlocked: 0,
   
  activeQuests: [] as Quest[],
  questsCompleted: 0,
   
  currentTitle: null as string | null,
   
  equippedTitleId: null as string | null,
  isLoading: false,
  isLoadingAchievements: false,
  isLoadingQuests: false,
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      fetchGamificationData: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const stats: GamificationStats = await getGamificationStats();
          set({
            xp: stats.xp,
            level: stats.level,
            coins: stats.coins,
            streak: stats.streak,
            levelProgress: stats.levelProgress,
            xpForNextLevel: stats.xpForNextLevel,
            achievementsUnlocked: stats.achievementsUnlocked,
            totalAchievements: stats.totalAchievements,
            questsCompleted: stats.questsCompleted,
            currentTitle: stats.currentTitle,
            equippedTitleId: stats.equippedTitleId,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchAchievements: async (category?: string) => {
        set({ isLoadingAchievements: true });
        try {
          const raw: AchievementWithProgress[] = await getAchievements(category);
          const achievements: Achievement[] = raw.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            rarity: a.rarity,
            category: a.category,
            xpReward: a.xpReward,
            progress: a.progress,
            maxProgress: a.requirement,
            unlocked: a.unlocked,
            unlockedAt: a.unlockedAt,
          }));
          set({ achievements, isLoadingAchievements: false });
        } catch {
          set({ isLoadingAchievements: false });
        }
      },

      fetchQuests: async () => {
        set({ isLoadingQuests: true });
        try {
          const raw: UserQuest[] = await getActiveQuests();
          const quests: Quest[] = raw.map((uq) => ({
            id: uq.id,
            title: uq.quest.name,
            description: uq.quest.description,
            type: uq.quest.type,
            xpReward: uq.quest.rewards.reduce(
              (sum, r) => (r.type === 'xp' ? sum + r.amount : sum),
              0
            ),
            objectives: uq.quest.objectives.map((o) => ({
              id: o.id,
              description: o.description,
              targetValue: o.targetValue,
              currentValue: o.currentValue,
              completed: o.completed,
            })),
            completed: uq.completed,
            expiresAt: uq.quest.expiresAt,
          }));
          set({ activeQuests: quests, isLoadingQuests: false });
        } catch {
          set({ isLoadingQuests: false });
        }
      },

      claimDailyStreak: async () => {
        try {
          const result = await claimDailyStreak();
          set({
            streak: result.streak,
            coins: get().coins + result.coins,
          });
          return { coins: result.coins, streak: result.streak };
        } catch {
          return null;
        }
      },

      equipTitle: async (titleId: string) => {
        try {
          await equipTitleApi(titleId);
          set({ equippedTitleId: titleId });
        } catch {
          // silently fail
        }
      },

      unequipTitle: async () => {
        try {
          await unequipTitleApi();
          set({ equippedTitleId: null, currentTitle: null });
        } catch {
          // silently fail
        }
      },

      reset: () => set(INITIAL_STATE),

      // Socket event handlers for real-time XP updates
      handleXPAwarded: (data: {
        amount: number;
        source: string;
        total_xp: number;
        level: number;
        level_up: boolean;
        level_progress: number;
      }) => {
        set({
          xp: data.total_xp,
          level: data.level,
          levelProgress: data.level_progress,
        });
      },

      handleCoinsAwarded: (data: { amount: number; balance: number }) => {
        set({ coins: data.balance });
      },
    }),
    {
      name: 'cgraph-gamification',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        coins: state.coins,
        streak: state.streak,
        levelProgress: state.levelProgress,
        xpForNextLevel: state.xpForNextLevel,
      }),
    }
  )
);

// ── Selector hooks ───────────────────────────────────────────────────

export const useLevel = () => useGamificationStore((s) => s.level);
export const useXP = () => useGamificationStore((s) => s.xp);
export const useStreak = () => useGamificationStore((s) => s.streak);
export const useAchievements = () => useGamificationStore((s) => s.achievements);
export const useActiveQuests = () => useGamificationStore((s) => s.activeQuests);

export default useGamificationStore;
