import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

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

// ==================== TYPE DEFINITIONS ====================

export interface PrestigeBonuses {
  xp: number; // Percentage as decimal (0.05 = 5%)
  coins: number;
  karma: number;
  dropRate: number;
}

export interface LifetimeStats {
  xp: number;
  karma: number;
  coinsEarned: number;
  messages: number;
}

export interface PrestigeHistoryEntry {
  level: number;
  prestigedAt: string;
  xpAtPrestige: number;
  lifetimeXpAtPrestige: number;
}

export interface PrestigeReward {
  type: 'title' | 'border' | 'effect' | 'badge' | 'xp_bonus' | 'coins';
  name?: string;
  id?: string;
  amount?: number;
}

export interface PrestigeTier {
  level: number;
  xpRequired: number;
  bonuses: PrestigeBonuses;
  exclusiveRewards: PrestigeReward[];
}

export interface PrestigeRequirements {
  requiredXp: number;
  currentXp: number;
  progress: number;
  nextLevel: number;
}

export interface PrestigeData {
  level: number;
  xp: number;
  xpToNext: number;
  bonuses: PrestigeBonuses;
  lifetime: LifetimeStats;
  totalResets: number;
  lastPrestigeAt: string | null;
  exclusiveTitles: string[];
  exclusiveBorders: string[];
  exclusiveEffects: string[];
}

// ==================== STATE INTERFACE ====================

export interface PrestigeState {
  // Current prestige data
  prestige: PrestigeData | null;
  requirements: PrestigeRequirements | null;
  canPrestige: boolean;

  // Tier information
  allTiers: PrestigeTier[];

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    prestigeLevel: number;
    lifetimeXp: number;
    totalResets: number;
  }>;

  // Loading states
  isLoading: boolean;
  isPrestiging: boolean;

  // Actions
  fetchPrestige: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  fetchLeaderboard: (limit?: number, offset?: number) => Promise<void>;
  performPrestige: () => Promise<{ success: boolean; rewards?: PrestigeReward[] }>;

  // Computed
  getProgressPercent: () => number;
  getBonusForLevel: (level: number) => PrestigeBonuses;
  getXpWithBonus: (baseXp: number) => number;
  getCoinWithBonus: (baseCoins: number) => number;
}

// ==================== BONUS CALCULATION ====================

const BONUS_RATES = {
  xp: 0.05, // 5% per prestige level
  coins: 0.03, // 3% per prestige level
  karma: 0.02, // 2% per prestige level
  dropRate: 0.01, // 1% per prestige level
};

function calculateBonuses(level: number): PrestigeBonuses {
  return {
    xp: level * BONUS_RATES.xp,
    coins: level * BONUS_RATES.coins,
    karma: level * BONUS_RATES.karma,
    dropRate: level * BONUS_RATES.dropRate,
  };
}

function calculateXpRequired(level: number): number {
  if (level < 0) return 0;
  if (level === 0) return 100000;
  return Math.round(100000 * Math.pow(1.5, level));
}

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

// ==================== HELPERS ====================

function getDefaultRewardsForLevel(level: number): PrestigeReward[] {
  const rewards: PrestigeReward[] = [
    { type: 'title', name: `Prestige ${level}` },
    { type: 'xp_bonus', amount: 0.05 },
  ];

  if (level >= 3) {
    rewards.push({ type: 'badge', name: 'Dedicated Player Badge' });
  }
  if (level >= 5) {
    rewards.push({ type: 'effect', name: 'Prestige Glow Effect' });
  }
  if (level >= 10) {
    rewards.push({ type: 'border', name: 'Prestige Master Border' });
  }
  if (level >= 15) {
    rewards.push({ type: 'title', name: 'Legendary Prestige' });
  }
  if (level >= 20) {
    rewards.push({ type: 'border', name: 'Transcendent Border' });
  }

  return rewards;
}

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
