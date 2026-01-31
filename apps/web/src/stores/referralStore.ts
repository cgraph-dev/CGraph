import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ReferralStore');

/**
 * Referral System Store
 *
 * Complete MyBB-style referral system with:
 * - Unique referral codes/links
 * - Referral tracking
 * - Reward system (XP, coins, badges)
 * - Leaderboard
 * - Statistics
 */

// Referral status
export type ReferralStatus = 'pending' | 'verified' | 'rewarded' | 'expired' | 'rejected';

// Referral
export interface Referral {
  id: string;
  referrerId: string; // User who referred
  referrerUsername: string;
  referredId: string; // User who was referred
  referredUsername: string;
  referredAvatarUrl: string | null;
  status: ReferralStatus;

  // Tracking
  code: string; // Referral code used
  source?: string; // Where they came from

  // Rewards
  referrerReward?: ReferralReward;
  referredReward?: ReferralReward;

  // Dates
  createdAt: string;
  verifiedAt: string | null;
  rewardedAt: string | null;
}

// Referral Reward
export interface ReferralReward {
  id: string;
  type: 'xp' | 'coins' | 'badge' | 'title' | 'premium_days';
  amount: number;
  description: string;
  claimed: boolean;
  claimedAt: string | null;
}

// Referral Code
export interface ReferralCode {
  code: string;
  url: string; // Full referral URL
  shortUrl?: string; // Shortened URL
  usageCount: number;
  maxUsage?: number | null; // Null = unlimited
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// Referral Stats
export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  verifiedReferrals: number;
  totalRewardsEarned: {
    xp: number;
    coins: number;
    premiumDays: number;
  };
  currentStreak: number; // Consecutive months with referrals
  rank: number;
  rankChange: number; // +/- from last period
}

// Leaderboard entry
export interface ReferralLeader {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  referralCount: number;
  rank: number;
  badge?: string;
}

// Reward tier
export interface RewardTier {
  id: string;
  name: string;
  referralsRequired: number;
  rewards: ReferralReward[];
  achieved: boolean;
}

interface ReferralState {
  // User's referrals
  referrals: Referral[];
  pendingReferrals: Referral[];

  // Referral code
  referralCode: ReferralCode | null;

  // Stats
  stats: ReferralStats | null;

  // Leaderboard
  leaderboard: ReferralLeader[];

  // Reward tiers
  rewardTiers: RewardTier[];

  // Loading
  isLoading: boolean;
  isLoadingStats: boolean;

  // Actions - Referral Code
  fetchReferralCode: () => Promise<ReferralCode>;
  regenerateCode: () => Promise<ReferralCode>;

  // Actions - Referrals
  fetchReferrals: () => Promise<void>;
  fetchPendingReferrals: () => Promise<void>;

  // Actions - Stats
  fetchStats: () => Promise<void>;

  // Actions - Leaderboard
  fetchLeaderboard: (period?: 'all' | 'month' | 'week') => Promise<void>;

  // Actions - Rewards
  fetchRewardTiers: () => Promise<void>;
  claimReward: (rewardId: string) => Promise<void>;

  // Actions - Validation
  validateReferralCode: (
    code: string
  ) => Promise<{ valid: boolean; referrer?: { username: string; avatarUrl: string | null } }>;
  applyReferralCode: (code: string) => Promise<void>;

  // Helpers
  getReferralUrl: () => string;

  clearState: () => void;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
  // Initial state
  referrals: [],
  pendingReferrals: [],
  referralCode: null,
  stats: null,
  leaderboard: [],
  rewardTiers: [],
  isLoading: false,
  isLoadingStats: false,

  // ========================================
  // REFERRAL CODE
  // ========================================

  fetchReferralCode: async () => {
    try {
      const response = await api.get('/api/v1/referrals/code');
      const data = response.data.code || response.data;

      const code: ReferralCode = {
        code: data.code,
        url: data.url || `${window.location.origin}/register?ref=${data.code}`,
        shortUrl: data.short_url,
        usageCount: data.usage_count || 0,
        maxUsage: data.max_usage ?? null,
        isActive: data.is_active !== false,
        expiresAt: data.expires_at || null,
        createdAt: data.created_at || new Date().toISOString(),
      };

      set({ referralCode: code });
      return code;
    } catch (error) {
      logger.error('Failed to fetch referral code:', error);
      throw error;
    }
  },

  regenerateCode: async () => {
    try {
      const response = await api.post('/api/v1/referrals/code/regenerate');
      const data = response.data.code || response.data;

      const code: ReferralCode = {
        code: data.code,
        url: data.url || `${window.location.origin}/register?ref=${data.code}`,
        shortUrl: data.short_url,
        usageCount: 0,
        maxUsage: data.max_usage ?? null,
        isActive: true,
        expiresAt: data.expires_at || null,
        createdAt: new Date().toISOString(),
      };

      set({ referralCode: code });
      return code;
    } catch (error) {
      logger.error('Failed to regenerate code:', error);
      throw error;
    }
  },

  // ========================================
  // REFERRALS
  // ========================================

  fetchReferrals: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/v1/referrals');
      const referrals = (ensureArray(response.data, 'referrals') as Record<string, unknown>[]).map(
        mapReferralFromApi
      );
      set({ referrals, isLoading: false });
    } catch (error) {
      logger.error('Failed to fetch referrals:', error);
      set({ isLoading: false });
    }
  },

  fetchPendingReferrals: async () => {
    try {
      const response = await api.get('/api/v1/referrals/pending');
      const pendingReferrals = (
        ensureArray(response.data, 'referrals') as Record<string, unknown>[]
      ).map(mapReferralFromApi);
      set({ pendingReferrals });
    } catch (error) {
      logger.error('Failed to fetch pending referrals:', error);
    }
  },

  // ========================================
  // STATS
  // ========================================

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      const response = await api.get('/api/v1/referrals/stats');
      const data = response.data.stats || response.data;

      const stats: ReferralStats = {
        totalReferrals: data.total_referrals || 0,
        pendingReferrals: data.pending_referrals || 0,
        verifiedReferrals: data.verified_referrals || 0,
        totalRewardsEarned: {
          xp: data.total_xp_earned || 0,
          coins: data.total_coins_earned || 0,
          premiumDays: data.total_premium_days_earned || 0,
        },
        currentStreak: data.current_streak || 0,
        rank: data.rank || 0,
        rankChange: data.rank_change || 0,
      };

      set({ stats, isLoadingStats: false });
    } catch (error) {
      logger.error('Failed to fetch stats:', error);
      set({ isLoadingStats: false });
    }
  },

  // ========================================
  // LEADERBOARD
  // ========================================

  fetchLeaderboard: async (period = 'all') => {
    try {
      const response = await api.get('/api/v1/referrals/leaderboard', {
        params: { period },
      });

      const leaderboard = (
        ensureArray(response.data, 'leaderboard') as Record<string, unknown>[]
      ).map((entry, index) => ({
        userId: entry.user_id as string,
        username: (entry.username as string) || 'Unknown',
        displayName: (entry.display_name as string) || null,
        avatarUrl: (entry.avatar_url as string) || null,
        referralCount: (entry.referral_count as number) || 0,
        rank: (entry.rank as number) || index + 1,
        badge: entry.badge as string | undefined,
      }));

      set({ leaderboard });
    } catch (error) {
      logger.error('Failed to fetch leaderboard:', error);
    }
  },

  // ========================================
  // REWARDS
  // ========================================

  fetchRewardTiers: async () => {
    try {
      const response = await api.get('/api/v1/referrals/rewards');
      const tiers = (ensureArray(response.data, 'tiers') as Record<string, unknown>[]).map(
        (tier) => ({
          id: tier.id as string,
          name: (tier.name as string) || '',
          referralsRequired: (tier.referrals_required as number) || 0,
          rewards: ((tier.rewards as Record<string, unknown>[]) || []).map((r) => ({
            id: r.id as string,
            type: (r.type as ReferralReward['type']) || 'xp',
            amount: (r.amount as number) || 0,
            description: (r.description as string) || '',
            claimed: (r.claimed as boolean) || false,
            claimedAt: (r.claimed_at as string) || null,
          })),
          achieved: (tier.achieved as boolean) || false,
        })
      );

      set({ rewardTiers: tiers });
    } catch (error) {
      logger.error('Failed to fetch reward tiers:', error);
    }
  },

  claimReward: async (rewardId: string) => {
    try {
      await api.post(`/api/v1/referrals/rewards/${rewardId}/claim`);

      // Update local state
      set((state) => ({
        rewardTiers: state.rewardTiers.map((tier) => ({
          ...tier,
          rewards: tier.rewards.map((r) =>
            r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
          ),
        })),
      }));
    } catch (error) {
      logger.error('Failed to claim reward:', error);
      throw error;
    }
  },

  // ========================================
  // VALIDATION
  // ========================================

  validateReferralCode: async (code: string) => {
    try {
      const response = await api.get(`/api/v1/referrals/validate/${code}`);
      const data = response.data;

      return {
        valid: data.valid || false,
        referrer: data.referrer
          ? {
              username: data.referrer.username,
              avatarUrl: data.referrer.avatar_url || null,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Failed to validate code:', error);
      return { valid: false };
    }
  },

  applyReferralCode: async (code: string) => {
    try {
      await api.post('/api/v1/referrals/apply', { code });
    } catch (error) {
      logger.error('Failed to apply referral code:', error);
      throw error;
    }
  },

  // ========================================
  // HELPERS
  // ========================================

  getReferralUrl: () => {
    const { referralCode } = get();
    if (!referralCode) return '';
    return referralCode.url;
  },

  clearState: () => {
    set({
      referrals: [],
      pendingReferrals: [],
      referralCode: null,
      stats: null,
      leaderboard: [],
    });
  },
}));

// ========================================
// API MAPPING HELPER
// ========================================

function mapReferralFromApi(data: Record<string, unknown>): Referral {
  const referrerReward = data.referrer_reward as Record<string, unknown> | undefined;
  const referredReward = data.referred_reward as Record<string, unknown> | undefined;

  return {
    id: data.id as string,
    referrerId: data.referrer_id as string,
    referrerUsername: (data.referrer_username as string) || 'Unknown',
    referredId: data.referred_id as string,
    referredUsername: (data.referred_username as string) || 'Unknown',
    referredAvatarUrl: (data.referred_avatar_url as string) || null,
    status: (data.status as ReferralStatus) || 'pending',
    code: (data.code as string) || '',
    source: data.source as string | undefined,
    referrerReward: referrerReward
      ? {
          id: referrerReward.id as string,
          type: (referrerReward.type as ReferralReward['type']) || 'xp',
          amount: (referrerReward.amount as number) || 0,
          description: (referrerReward.description as string) || '',
          claimed: (referrerReward.claimed as boolean) || false,
          claimedAt: (referrerReward.claimed_at as string) || null,
        }
      : undefined,
    referredReward: referredReward
      ? {
          id: referredReward.id as string,
          type: (referredReward.type as ReferralReward['type']) || 'xp',
          amount: (referredReward.amount as number) || 0,
          description: (referredReward.description as string) || '',
          claimed: (referredReward.claimed as boolean) || false,
          claimedAt: (referredReward.claimed_at as string) || null,
        }
      : undefined,
    createdAt: (data.created_at as string) || new Date().toISOString(),
    verifiedAt: (data.verified_at as string) || null,
    rewardedAt: (data.rewarded_at as string) || null,
  };
}
