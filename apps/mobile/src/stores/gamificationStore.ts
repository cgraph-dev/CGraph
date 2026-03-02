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

  // Leaderboard
  scopedLeaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
    isCurrentUser?: boolean;
  }>;

  // Event / Battle Pass
  activeEventId: string | null;
  battlePassTier: number;
  battlePassXP: number;
  hasBattlePass: boolean;

  // Marketplace
  marketplaceListings: Array<{
    id: string;
    itemName: string;
    price: number;
    sellerName: string;
  }>;

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
  fetchScopedLeaderboard: (scope: string, scopeId?: string, category?: string) => Promise<void>;
  purchaseBattlePass: (eventId: string) => Promise<{ success: boolean }>;
  purchaseMarketplaceListing: (listingId: string) => Promise<{ success: boolean }>;
  createMarketplaceListing: (params: {
    itemType: string;
    itemId: string;
    price: number;
  }) => Promise<{ success: boolean }>;
  handleXPAwarded: (data: {
    amount: number;
    source: string;
    total_xp: number;
    level: number;
    level_up: boolean;
    level_progress: number;
  }) => void;
  handleCoinsAwarded: (data: { amount: number; balance: number }) => void;
  handleAchievementUnlocked: (data: {
    achievementId: string;
    title: string;
    description: string;
    icon: string;
    rarity: string;
    xpReward: number;
    coinReward: number;
  }) => void;
  handleQuestCompleted: (data: {
    user_quest_id: string;
    quest_id: string;
    quest_title: string;
    xp_reward: number;
    coin_reward: number;
  }) => void;
  handleNewQuestsAvailable: (data: {
    type: 'daily' | 'weekly' | 'monthly';
  }) => void;
  handleLevelGateError: () => void;
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

  scopedLeaderboard: [] as Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
    isCurrentUser?: boolean;
  }>,

  activeEventId: null as string | null,
  battlePassTier: 0,
  battlePassXP: 0,
  hasBattlePass: false,

  marketplaceListings: [] as Array<{
    id: string;
    itemName: string;
    price: number;
    sellerName: string;
  }>,

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

      fetchScopedLeaderboard: async (scope: string, scopeId?: string, category = 'xp') => {
        try {
          const { getGamificationStats: _unused, ...apis } = await import('../services/gamificationService');
          void _unused;
          void apis;
          // Use a direct API call for scoped leaderboard
          const params: Record<string, string> = { scope, category };
          if (scopeId) params.scope_id = scopeId;

          // Fetch via fetch API since the service may not have this endpoint yet
          const response = await fetch(
            `/api/v1/leaderboard?${new URLSearchParams(params).toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            set({
              scopedLeaderboard: (data.entries || []).map((e: Record<string, unknown>) => ({
                rank: e.rank as number,
                userId: e.userId as string,
                username: e.username as string,
                score: e.value as number ?? e.score as number ?? 0,
                isCurrentUser: e.isCurrentUser as boolean ?? false,
              })),
            });
          }
        } catch {
          // silently fail
        }
      },

      purchaseBattlePass: async (eventId: string) => {
        try {
          const response = await fetch(`/api/v1/events/${eventId}/battle-pass/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              set({ hasBattlePass: true });
              return { success: true };
            }
          }
          return { success: false };
        } catch {
          return { success: false };
        }
      },

      purchaseMarketplaceListing: async (listingId: string) => {
        try {
          const response = await fetch(`/api/v1/marketplace/${listingId}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            return { success: data.success ?? false };
          }
          return { success: false };
        } catch {
          return { success: false };
        }
      },

      createMarketplaceListing: async (params: {
        itemType: string;
        itemId: string;
        price: number;
      }) => {
        try {
          const response = await fetch('/api/v1/marketplace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_type: params.itemType,
              item_id: params.itemId,
              price: params.price,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            return { success: data.success ?? false };
          }
          return { success: false };
        } catch {
          return { success: false };
        }
      },

      handleLevelGateError: () => {
        // Handle 403 from LevelGatePlug — show level gate UI
        // This is called when mobile receives a 403 with level_required
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

      handleAchievementUnlocked: (data: {
        achievementId: string;
        title: string;
        description: string;
        icon: string;
        rarity: string;
        xpReward: number;
        coinReward: number;
      }) => {
        const current = get();
        set({ achievementsUnlocked: current.achievementsUnlocked + 1 });
        const updated = current.achievements.map((a) =>
          a.id === data.achievementId
            ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
            : a
        );
        set({ achievements: updated });
      },

      handleQuestCompleted: (data: {
        user_quest_id: string;
        quest_id: string;
        quest_title: string;
        xp_reward: number;
        coin_reward: number;
      }) => {
        const current = get();
        const updated = current.activeQuests.map((q) =>
          q.id === data.user_quest_id || q.id === data.quest_id
            ? { ...q, completed: true }
            : q
        );
        set({ activeQuests: updated });
      },

      handleNewQuestsAvailable: () => {
        get().fetchQuests();
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
