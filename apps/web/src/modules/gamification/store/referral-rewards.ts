/**
 * Referral rewards data and utilities.
 * @module
 */
import { api } from '@/lib/api';
import { ensureArray, isRecord } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { ReferralReward, ReferralState } from './referral-types';

const logger = createLogger('ReferralStore');

// ========================================
// LEADERBOARD
// ========================================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new leaderboard actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
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

        const leaderboard = ensureArray(response.data, 'leaderboard')
          .filter(isRecord)
          .map((entry, index) => ({
            userId: String(entry.user_id ?? ''),
            username: String(entry.username ?? '') || 'Unknown',
            displayName: typeof entry.display_name === 'string' ? entry.display_name : null,
            avatarUrl: typeof entry.avatar_url === 'string' ? entry.avatar_url : null,
            referralCount: Number(entry.referral_count) || 0,
            rank: Number(entry.rank) || index + 1,
            badge: typeof entry.badge === 'string' ? entry.badge : undefined,
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

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new reward actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createRewardActions(
  set: (
    partial: Partial<ReferralState> | ((state: ReferralState) => Partial<ReferralState>)
  ) => void
): Pick<ReferralState, 'fetchRewardTiers' | 'claimReward'> {
  return {
    fetchRewardTiers: async () => {
      try {
        const response = await api.get('/api/v1/referrals/rewards');
        const tiers = ensureArray(response.data, 'tiers')
          .filter(isRecord)
          .map((tier) => ({
            id: String(tier.id ?? ''),
            name: String(tier.name ?? ''),
            referralsRequired: Number(tier.referrals_required) || 0,
            rewards: (Array.isArray(tier.rewards) ? tier.rewards.filter(isRecord) : []).map(
              (r) => ({
                id: String(r.id ?? ''),
                 
                type: (r.type as ReferralReward['type']) || 'xp', // safe downcast — constrained by ReferralReward
                amount: Number(r.amount) || 0,
                description: String(r.description ?? ''),
                claimed: Boolean(r.claimed),
                claimedAt: typeof r.claimed_at === 'string' ? r.claimed_at : null,
              })
            ),
            achieved: Boolean(tier.achieved),
          }));

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

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new validation actions.
 *
 * @param _set - The _set.
 * @returns The newly created instance.
 */
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
