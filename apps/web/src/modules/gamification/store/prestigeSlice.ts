/**
 * Prestige system store slice.
 * @module
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

// Re-export all types from submodule
export type {
  PrestigeBonuses,
  LifetimeStats,
  PrestigeHistoryEntry,
  PrestigeReward,
  PrestigeTier,
  PrestigeRequirements,
  PrestigeData,
  PrestigeState,
} from './prestige-types';

import type { PrestigeState, PrestigeTier } from './prestige-types';
import { calculateBonuses, calculateXpRequired, getDefaultRewardsForLevel } from './prestige-utils';

const logger = createLogger('prestigeStore');

/**
 * Prestige Store
 *
 * Manages the prestige system with:
 * - Prestige levels and XP tracking
 * - Permanent bonus calculations
 * - Exclusive rewards
 * - Prestige history
 */

// ==================== STORE IMPLEMENTATION ====================

export const usePrestigeStore = create<PrestigeState>()(
  persist(
    (set, get) => ({
      prestige: null,
      requirements: null,
      canPrestige: false,
      allTiers: [],
      leaderboard: [],
      isLoading: false,
      isPrestiging: false,

      fetchPrestige: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/api/v1/prestige');
          if (response.data) {
            set({
              prestige: response.data.prestige,
              requirements: response.data.nextPrestigeRequirements,
              canPrestige: response.data.canPrestige,
            });
          }
        } catch (error) {
          logger.error('Failed to fetch prestige data:', error);
          // Set default data for new users
          set({
            prestige: {
              level: 0,
              xp: 0,
              xpToNext: 100000,
              bonuses: { xp: 0, coins: 0, karma: 0, dropRate: 0 },
              lifetime: { xp: 0, karma: 0, coinsEarned: 0, messages: 0 },
              totalResets: 0,
              lastPrestigeAt: null,
              exclusiveTitles: [],
              exclusiveBorders: [],
              exclusiveEffects: [],
            },
            requirements: {
              requiredXp: 100000,
              currentXp: 0,
              progress: 0,
              nextLevel: 1,
            },
            canPrestige: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchRewards: async () => {
        try {
          const response = await api.get('/api/v1/prestige/rewards');
          if (response.data?.rewards) {
            set({ allTiers: response.data.rewards });
          }
        } catch (error) {
          logger.error('Failed to fetch prestige rewards:', error);
          // Generate default tiers
          const tiers: PrestigeTier[] = Array.from({ length: 20 }, (_, i) => ({
            level: i + 1,
            xpRequired: calculateXpRequired(i),
            bonuses: calculateBonuses(i + 1),
            exclusiveRewards: getDefaultRewardsForLevel(i + 1),
          }));
          set({ allTiers: tiers });
        }
      },

      fetchLeaderboard: async (limit = 50, offset = 0) => {
        try {
          const response = await api.get('/api/v1/prestige/leaderboard', {
            params: { limit, offset },
          });
          if (response.data?.leaderboard) {
            set({ leaderboard: response.data.leaderboard });
          }
        } catch (error) {
          logger.error('Failed to fetch prestige leaderboard:', error);
        }
      },

      performPrestige: async () => {
        const state = get();
        if (!state.canPrestige || state.isPrestiging) {
          return { success: false };
        }

        set({ isPrestiging: true });
        try {
          const response = await api.post('/api/v1/prestige/reset');
          if (response.data?.success) {
            set({
              prestige: response.data.prestige,
              canPrestige: false,
            });

            // Refresh requirements
            await get().fetchPrestige();

            return {
              success: true,
              rewards: response.data.rewards,
            };
          }
          return { success: false };
        } catch (error) {
          logger.error('Failed to perform prestige:', error);
          return { success: false };
        } finally {
          set({ isPrestiging: false });
        }
      },

      getProgressPercent: () => {
        const { requirements } = get();
        if (!requirements || requirements.requiredXp === 0) return 0;
        return Math.min(100, (requirements.currentXp / requirements.requiredXp) * 100);
      },

      getBonusForLevel: (level: number) => {
        return calculateBonuses(level);
      },

      getXpWithBonus: (baseXp: number) => {
        const { prestige } = get();
        if (!prestige) return baseXp;
        return Math.round(baseXp * (1 + prestige.bonuses.xp));
      },

      getCoinWithBonus: (baseCoins: number) => {
        const { prestige } = get();
        if (!prestige) return baseCoins;
        return Math.round(baseCoins * (1 + prestige.bonuses.coins));
      },
    }),
    {
      name: 'cgraph-prestige',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        prestige: state.prestige,
        allTiers: state.allTiers,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const usePrestigeLevel = () => usePrestigeStore((state) => state.prestige?.level ?? 0);

export const usePrestigeBonuses = () =>
  usePrestigeStore(
    (state) => state.prestige?.bonuses ?? { xp: 0, coins: 0, karma: 0, dropRate: 0 }
  );

export const useCanPrestige = () => usePrestigeStore((state) => state.canPrestige);

export const usePrestigeProgress = () =>
  usePrestigeStore((state) => ({
    progress: state.getProgressPercent(),
    requirements: state.requirements,
    canPrestige: state.canPrestige,
  }));

export default usePrestigeStore;
