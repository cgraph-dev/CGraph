/**
 * Referrals API service.
 *
 * Connects the frontend to the backend ReferralController endpoints.
 *
 * @module referrals/services/referrals-api
 */

import { api as apiClient } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferralCode {
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralEntry {
  id: string;
  referredUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
  status: 'pending' | 'confirmed' | 'expired';
  codeUsed: string;
  createdAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
  rank: number | null;
}

export interface RewardTier {
  id: string;
  name: string;
  description: string;
  requiredReferrals: number;
  reward: string;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  referralCount: number;
}

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

interface ApiReferralCode {
  code: string;
  is_active: boolean;
  inserted_at: string;
}

interface ApiReferral {
  id: string;
  referred_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  status: string;
  code_used: string;
  inserted_at: string;
}

interface ApiStats {
  total_referrals: number;
  confirmed_referrals: number;
  pending_referrals: number;
  rewards_earned: number;
  rank: number | null;
}

interface ApiRewardTier {
  id: string;
  name: string;
  description: string;
  required_referrals: number;
  reward: string;
  claimed: boolean;
}

interface ApiLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  referral_count: number;
}

function transformCode(data: ApiReferralCode): ReferralCode {
  return {
    code: data.code,
    isActive: data.is_active,
    createdAt: data.inserted_at,
  };
}

function transformReferral(data: ApiReferral): ReferralEntry {
  return {
    id: data.id,
    referredUser: data.referred_user
      ? {
          id: data.referred_user.id,
          username: data.referred_user.username,
          displayName: data.referred_user.display_name,
          avatar: data.referred_user.avatar_url,
        }
      : null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    status: data.status as ReferralEntry['status'],
    codeUsed: data.code_used,
    createdAt: data.inserted_at,
  };
}

function transformStats(data: ApiStats): ReferralStats {
  return {
    totalReferrals: data.total_referrals,
    confirmedReferrals: data.confirmed_referrals,
    pendingReferrals: data.pending_referrals,
    rewardsEarned: data.rewards_earned,
    rank: data.rank,
  };
}

function transformRewardTier(data: ApiRewardTier): RewardTier {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    requiredReferrals: data.required_referrals,
    reward: data.reward,
    claimed: data.claimed,
  };
}

function transformLeaderboardEntry(data: ApiLeaderboardEntry): LeaderboardEntry {
  return {
    rank: data.rank,
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name,
    avatar: data.avatar_url,
    referralCount: data.referral_count,
  };
}

// ---------------------------------------------------------------------------
// API service
// ---------------------------------------------------------------------------

export const referralsApi = {
  async getCode(): Promise<ReferralCode> {
    const response = await apiClient.get('/api/v1/referrals/code');
    return transformCode(response.data.code ?? response.data);
  },

  async regenerateCode(): Promise<ReferralCode> {
    const response = await apiClient.post('/api/v1/referrals/code/regenerate');
    return transformCode(response.data.code ?? response.data);
  },

  async listReferrals(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<{ referrals: ReferralEntry[]; total: number }> {
    const response = await apiClient.get('/api/v1/referrals', { params });
    return {
      referrals: (response.data.referrals ?? []).map(transformReferral),
      total: response.data.pagination?.total ?? response.data.referrals?.length ?? 0,
    };
  },

  async getStats(): Promise<ReferralStats> {
    const response = await apiClient.get('/api/v1/referrals/stats');
    return transformStats(response.data.stats ?? response.data);
  },

  async getLeaderboard(params?: { period?: string; limit?: number }): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get('/api/v1/referrals/leaderboard', { params });
    return (response.data.leaderboard ?? []).map(transformLeaderboardEntry);
  },

  async getRewardTiers(): Promise<RewardTier[]> {
    const response = await apiClient.get('/api/v1/referrals/rewards');
    return (response.data.tiers ?? []).map(transformRewardTier);
  },

  async claimReward(tierId: string): Promise<void> {
    await apiClient.post(`/api/v1/referrals/rewards/${tierId}/claim`);
  },

  async validateCode(code: string): Promise<{ valid: boolean; referrer?: { username: string } }> {
    const response = await apiClient.get(`/api/v1/referrals/validate/${encodeURIComponent(code)}`);
    return response.data;
  },

  async applyCode(code: string): Promise<void> {
    await apiClient.post('/api/v1/referrals/apply', { code });
  },
};
