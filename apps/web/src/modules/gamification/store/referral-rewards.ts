import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { ReferralReward, ReferralState } from './referral-types';

const logger = createLogger('ReferralStore');

// ========================================
// LEADERBOARD
// ========================================

export function createLeaderboardActions(
  set: (
    partial: Partial<ReferralState> | ((state: ReferralState) => Partial<ReferralState>)
  ) => void
): Pick<ReferralState, 'fetchLeaderboard'> {
  return {
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
  };
}

// ========================================
// REWARDS
// ========================================

export function createRewardActions(
  set: (
    partial: Partial<ReferralState> | ((state: ReferralState) => Partial<ReferralState>)
  ) => void
): Pick<ReferralState, 'fetchRewardTiers' | 'claimReward'> {
  return {
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
  };
}

// ========================================
// VALIDATION
// ========================================

export function createValidationActions(
  _set: (
    partial: Partial<ReferralState> | ((state: ReferralState) => Partial<ReferralState>)
  ) => void
): Pick<ReferralState, 'validateReferralCode' | 'applyReferralCode'> {
  return {
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
  };
}
