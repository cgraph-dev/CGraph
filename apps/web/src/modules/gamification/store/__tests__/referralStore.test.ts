// @ts-nocheck
/**
 * Referral Store Unit Tests
 *
 * Covers: initial state, fetchReferralCode, regenerateCode, fetchReferrals,
 * fetchPendingReferrals, fetchStats, fetchLeaderboard, fetchRewardTiers,
 * claimReward, validateReferralCode, applyReferralCode, getReferralUrl,
 * clearState, mapReferralFromApi, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReferralStore, mapReferralFromApi } from '../referralSlice';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: vi.fn((data: Record<string, unknown>, key: string) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data[key])) return data[key];
    return [];
  }),
}));

import { api } from '@/lib/api';

const mockedApi = vi.mocked(api, { deep: true });

// ── Reset ─────────────────────────────────────────────────────────────

function resetStore() {
  useReferralStore.setState({
    referrals: [],
    pendingReferrals: [],
    referralCode: null,
    stats: null,
    leaderboard: [],
    rewardTiers: [],
    isLoading: false,
    isLoadingStats: false,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('referralStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('has empty referrals', () => {
      expect(useReferralStore.getState().referrals).toEqual([]);
    });

    it('has null referralCode and stats', () => {
      const s = useReferralStore.getState();
      expect(s.referralCode).toBeNull();
      expect(s.stats).toBeNull();
    });

    it('has loading flags false', () => {
      const s = useReferralStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.isLoadingStats).toBe(false);
    });
  });

  // ==================== mapReferralFromApi ====================

  describe('mapReferralFromApi', () => {
    it('maps snake_case API data to camelCase', () => {
      const mapped = mapReferralFromApi({
        id: 'r1',
        referrer_id: 'u1',
        referrer_username: 'alice',
        referred_id: 'u2',
        referred_username: 'bob',
        referred_avatar_url: 'http://img.png',
        status: 'verified',
        code: 'ABC123',
        source: 'twitter',
        created_at: '2026-01-01T00:00:00Z',
        verified_at: '2026-01-02T00:00:00Z',
        rewarded_at: null,
      });

      expect(mapped.referrerId).toBe('u1');
      expect(mapped.referredUsername).toBe('bob');
      expect(mapped.referredAvatarUrl).toBe('http://img.png');
      expect(mapped.status).toBe('verified');
      expect(mapped.source).toBe('twitter');
    });

    it('handles missing optional fields with defaults', () => {
      const mapped = mapReferralFromApi({ id: 'r2' } as Record<string, unknown>);
      expect(mapped.referrerUsername).toBe('Unknown');
      expect(mapped.referredUsername).toBe('Unknown');
      expect(mapped.referredAvatarUrl).toBeNull();
      expect(mapped.status).toBe('pending');
      expect(mapped.code).toBe('');
    });

    it('maps nested reward objects', () => {
      const mapped = mapReferralFromApi({
        id: 'r3',
        referrer_reward: {
          id: 'rw1',
          type: 'coins',
          amount: 500,
          description: '500 coins',
          claimed: true,
          claimed_at: '2026-01-03T00:00:00Z',
        },
      } as Record<string, unknown>);

      expect(mapped.referrerReward?.type).toBe('coins');
      expect(mapped.referrerReward?.amount).toBe(500);
      expect(mapped.referrerReward?.claimed).toBe(true);
    });
  });

  // ==================== fetchReferralCode ====================

  describe('fetchReferralCode', () => {
    it('sets referralCode from API', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          code: {
            code: 'ABC123',
            url: 'https://example.com/register?ref=ABC123',
            usage_count: 5,
            max_usage: 100,
            is_active: true,
            expires_at: null,
            created_at: '2026-01-01T00:00:00Z',
          },
        },
      });

      const result = await useReferralStore.getState().fetchReferralCode();

      expect(result.code).toBe('ABC123');
      expect(result.usageCount).toBe(5);
      expect(useReferralStore.getState().referralCode?.code).toBe('ABC123');
    });

    it('throws on API error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(useReferralStore.getState().fetchReferralCode()).rejects.toThrow();
    });
  });

  // ==================== regenerateCode ====================

  describe('regenerateCode', () => {
    it('sets new code with usageCount=0', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { code: { code: 'NEW456' } },
      });

      const result = await useReferralStore.getState().regenerateCode();
      expect(result.code).toBe('NEW456');
      expect(result.usageCount).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it('throws on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('err'));
      await expect(useReferralStore.getState().regenerateCode()).rejects.toThrow();
    });
  });

  // ==================== fetchReferrals ====================

  describe('fetchReferrals', () => {
    it('populates referrals', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          referrals: [{ id: 'r1', referrer_id: 'u1', referred_id: 'u2', status: 'verified' }],
        },
      });

      await useReferralStore.getState().fetchReferrals();
      expect(useReferralStore.getState().referrals).toHaveLength(1);
      expect(useReferralStore.getState().isLoading).toBe(false);
    });

    it('handles error gracefully', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('err'));
      await useReferralStore.getState().fetchReferrals();
      expect(useReferralStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchPendingReferrals ====================

  describe('fetchPendingReferrals', () => {
    it('populates pendingReferrals', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          referrals: [{ id: 'r2', status: 'pending' }],
        },
      });

      await useReferralStore.getState().fetchPendingReferrals();
      expect(useReferralStore.getState().pendingReferrals).toHaveLength(1);
    });
  });

  // ==================== fetchStats ====================

  describe('fetchStats', () => {
    it('sets stats from API', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          stats: {
            total_referrals: 10,
            pending_referrals: 2,
            verified_referrals: 8,
            total_xp_earned: 5000,
            total_coins_earned: 2000,
            total_premium_days_earned: 30,
            current_streak: 3,
            rank: 5,
            rank_change: 2,
          },
        },
      });

      await useReferralStore.getState().fetchStats();

      const stats = useReferralStore.getState().stats;
      expect(stats?.totalReferrals).toBe(10);
      expect(stats?.totalRewardsEarned.xp).toBe(5000);
      expect(stats?.currentStreak).toBe(3);
      expect(useReferralStore.getState().isLoadingStats).toBe(false);
    });

    it('clears isLoadingStats on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('err'));
      await useReferralStore.getState().fetchStats();
      expect(useReferralStore.getState().isLoadingStats).toBe(false);
    });
  });

  // ==================== fetchLeaderboard ====================

  describe('fetchLeaderboard', () => {
    it('sets leaderboard with mapped data', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          leaderboard: [{ user_id: 'u1', username: 'alice', referral_count: 15, rank: 1 }],
        },
      });

      await useReferralStore.getState().fetchLeaderboard('month');
      const lb = useReferralStore.getState().leaderboard;
      expect(lb).toHaveLength(1);
      expect(lb[0].userId).toBe('u1');
      expect(lb[0].referralCount).toBe(15);
    });
  });

  // ==================== claimReward ====================

  describe('claimReward', () => {
    it('marks reward as claimed in local state', async () => {
      useReferralStore.setState({
        rewardTiers: [
          {
            id: 't1',
            name: 'Bronze',
            referralsRequired: 5,
            achieved: true,
            rewards: [
              {
                id: 'rw1',
                type: 'xp',
                amount: 100,
                description: '100 XP',
                claimed: false,
                claimedAt: null,
              },
            ],
          },
        ],
      });
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      await useReferralStore.getState().claimReward('rw1');
      const tier = useReferralStore.getState().rewardTiers[0];
      expect(tier.rewards[0].claimed).toBe(true);
      expect(tier.rewards[0].claimedAt).toBeTruthy();
    });

    it('throws on API error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('err'));
      await expect(useReferralStore.getState().claimReward('rw1')).rejects.toThrow();
    });
  });

  // ==================== validateReferralCode ====================

  describe('validateReferralCode', () => {
    it('returns valid=true with referrer info', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { valid: true, referrer: { username: 'alice', avatar_url: 'http://img.png' } },
      });

      const result = await useReferralStore.getState().validateReferralCode('ABC');
      expect(result.valid).toBe(true);
      expect(result.referrer?.username).toBe('alice');
    });

    it('returns valid=false on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('err'));
      const result = await useReferralStore.getState().validateReferralCode('BAD');
      expect(result.valid).toBe(false);
    });
  });

  // ==================== applyReferralCode ====================

  describe('applyReferralCode', () => {
    it('calls API with code', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });
      await useReferralStore.getState().applyReferralCode('ABC');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/referrals/apply', { code: 'ABC' });
    });

    it('throws on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Invalid'));
      await expect(useReferralStore.getState().applyReferralCode('BAD')).rejects.toThrow();
    });
  });

  // ==================== Helpers ====================

  describe('getReferralUrl', () => {
    it('returns empty string when no code', () => {
      expect(useReferralStore.getState().getReferralUrl()).toBe('');
    });

    it('returns the url from referralCode', () => {
      useReferralStore.setState({
        referralCode: {
          code: 'ABC',
          url: 'https://example.com/register?ref=ABC',
          usageCount: 0,
          isActive: true,
          expiresAt: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      });
      expect(useReferralStore.getState().getReferralUrl()).toBe(
        'https://example.com/register?ref=ABC'
      );
    });
  });

  describe('clearState', () => {
    it('resets all data to defaults', () => {
      useReferralStore.setState({
        referrals: [{ id: 'r1' } as never],
        referralCode: { code: 'X' } as never,
        stats: { totalReferrals: 5 } as never,
        leaderboard: [{ userId: 'u1' } as never],
      });

      useReferralStore.getState().clearState();

      const s = useReferralStore.getState();
      expect(s.referrals).toEqual([]);
      expect(s.referralCode).toBeNull();
      expect(s.stats).toBeNull();
      expect(s.leaderboard).toEqual([]);
    });
  });
});
