/**
 * Referral system store actions.
 * @module
 */
import type { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, isRecord } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type {
  Referral,
  ReferralCode,
  ReferralReward,
  ReferralState,
  ReferralStats,
  ReferralStatus,
} from './referral-types';
import {
  createLeaderboardActions,
  createRewardActions,
  createValidationActions,
} from './referral-rewards';

const logger = createLogger('ReferralStore');

// ========================================
// API MAPPING HELPER
// ========================================

export function mapReferralFromApi(data: Record<string, unknown>): Referral {
  const referrerReward: Record<string, unknown> | undefined = isRecord(data.referrer_reward)
    ? data.referrer_reward
    : undefined;
  const referredReward: Record<string, unknown> | undefined = isRecord(data.referred_reward)
    ? data.referred_reward
    : undefined;

  return {
    id: data.id as string,
    referrerId: data.referrer_id as string,
    referrerUsername: (data.referrer_username as string) || 'Unknown',
    referredId: data.referred_id as string,
    referredUsername: (data.referred_username as string) || 'Unknown',
    referredAvatarUrl: (data.referred_avatar_url as string) || null,
    status: (data.status as ReferralStatus) || 'pending', // safe downcast
    code: (data.code as string) || '',
    source: data.source as string | undefined,
    referrerReward: referrerReward
      ? {
          id: referrerReward.id as string,
          type: (referrerReward.type as ReferralReward['type']) || 'xp', // safe downcast
          amount: (referrerReward.amount as number) || 0,
          description: (referrerReward.description as string) || '',
          claimed: (referrerReward.claimed as boolean) || false,
          claimedAt: (referrerReward.claimed_at as string) || null,
        }
      : undefined,
    referredReward: referredReward
      ? {
          id: referredReward.id as string,
          type: (referredReward.type as ReferralReward['type']) || 'xp', // safe downcast
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

// ========================================
// STORE ACTIONS
// ========================================

export const createReferralActions: StateCreator<ReferralState> = (set, get) => ({
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

  // Leaderboard, Rewards, Validation (from referral-rewards.ts)
  ...createLeaderboardActions(set),
  ...createRewardActions(set),
  ...createValidationActions(set),

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
});
