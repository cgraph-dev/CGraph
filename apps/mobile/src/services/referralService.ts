/**
 * Referral Service
 *
 * API service for managing referral program features including:
 * - Referral codes and links
 * - Referral statistics and tracking
 * - Reward tiers and claiming
 * - Leaderboard rankings
 *
 * @module services/referralService
 * @since v0.9.0
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface ReferralCode {
  code: string;
  url: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  verifiedReferrals: number;
  pendingReferrals: number;
  rejectedReferrals?: number;
  rank: number;
  rankChange: number;
  totalRewardsEarned: {
    xp: number;
    coins: number;
    premium_days: number;
  };
}

export interface Referral {
  id: string;
  referredUserId: string;
  referredUsername: string;
  referredDisplayName?: string;
  referredAvatarUrl: string | null;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  rewardsClaimed: boolean;
}

export interface RewardTier {
  id: string;
  name: string;
  description: string;
  referralsRequired: number;
  rewards: {
    type: 'xp' | 'coins' | 'premium' | 'badge' | 'title';
    amount?: number;
    description: string;
    iconUrl?: string;
  }[];
  achieved: boolean;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl: string | null;
  referralCount: number;
  isCurrentUser: boolean;
}

// API Response Types
interface ReferralCodeResponse {
  code: string;
  url: string;
  usage_count: number;
  max_usage?: number;
  created_at: string;
  expires_at?: string;
}

interface ReferralStatsResponse {
  total_referrals: number;
  verified_referrals: number;
  pending_referrals: number;
  rejected_referrals?: number;
  rank: number;
  rank_change: number;
  total_rewards_earned: {
    xp: number;
    coins: number;
    premium_days: number;
  };
}

interface ReferralResponse {
  id: string;
  referred_user_id: string;
  referred_username: string;
  referred_display_name?: string;
  referred_avatar_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verified_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  rewards_claimed: boolean;
}

interface RewardTierResponse {
  id: string;
  name: string;
  description: string;
  referrals_required: number;
  rewards: {
    type: 'xp' | 'coins' | 'premium' | 'badge' | 'title';
    amount?: number;
    description: string;
    icon_url?: string;
  }[];
  achieved: boolean;
  claimed: boolean;
}

interface LeaderboardEntryResponse {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url: string | null;
  referral_count: number;
  is_current_user: boolean;
}

// ============================================================================
// TRANSFORMERS
// ============================================================================

function transformReferralCode(data: ReferralCodeResponse): ReferralCode {
  return {
    code: data.code,
    url: data.url,
    usageCount: data.usage_count,
    maxUsage: data.max_usage,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

function transformStats(data: ReferralStatsResponse): ReferralStats {
  return {
    totalReferrals: data.total_referrals,
    verifiedReferrals: data.verified_referrals,
    pendingReferrals: data.pending_referrals,
    rejectedReferrals: data.rejected_referrals,
    rank: data.rank,
    rankChange: data.rank_change,
    totalRewardsEarned: {
      xp: data.total_rewards_earned.xp,
      coins: data.total_rewards_earned.coins,
      premium_days: data.total_rewards_earned.premium_days,
    },
  };
}

function transformReferral(data: ReferralResponse): Referral {
  return {
    id: data.id,
    referredUserId: data.referred_user_id,
    referredUsername: data.referred_username,
    referredDisplayName: data.referred_display_name,
    referredAvatarUrl: data.referred_avatar_url,
    status: data.status,
    createdAt: data.created_at,
    verifiedAt: data.verified_at,
    rejectedAt: data.rejected_at,
    rejectionReason: data.rejection_reason,
    rewardsClaimed: data.rewards_claimed,
  };
}

function transformRewardTier(data: RewardTierResponse): RewardTier {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    referralsRequired: data.referrals_required,
    rewards: data.rewards.map((r) => ({
      type: r.type,
      amount: r.amount,
      description: r.description,
      iconUrl: r.icon_url,
    })),
    achieved: data.achieved,
    claimed: data.claimed,
  };
}

function transformLeaderboardEntry(data: LeaderboardEntryResponse): LeaderboardEntry {
  return {
    rank: data.rank,
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    referralCount: data.referral_count,
    isCurrentUser: data.is_current_user,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current user's referral code
 */
export async function getReferralCode(): Promise<ReferralCode> {
  const response = await api.get<{ data: ReferralCodeResponse }>('/api/v1/referrals/code');
  return transformReferralCode(response.data.data);
}

/**
 * Generate a new referral code (if allowed)
 */
export async function generateReferralCode(): Promise<ReferralCode> {
  const response = await api.post<{ data: ReferralCodeResponse }>('/api/v1/referrals/code');
  return transformReferralCode(response.data.data);
}

/**
 * Get referral statistics
 */
export async function getReferralStats(): Promise<ReferralStats> {
  const response = await api.get<{ data: ReferralStatsResponse }>('/api/v1/referrals/stats');
  return transformStats(response.data.data);
}

/**
 * Get list of referrals
 */
export async function getReferrals(params?: {
  status?: 'pending' | 'verified' | 'rejected';
  page?: number;
  limit?: number;
}): Promise<{ referrals: Referral[]; total: number; hasMore: boolean }> {
  const response = await api.get<{
    data: ReferralResponse[];
    meta: { total: number; has_more: boolean };
  }>('/api/v1/referrals', { params });

  return {
    referrals: response.data.data.map(transformReferral),
    total: response.data.meta.total,
    hasMore: response.data.meta.has_more,
  };
}

/**
 * Get reward tiers
 */
export async function getRewardTiers(): Promise<RewardTier[]> {
  const response = await api.get<{ data: RewardTierResponse[] }>('/api/v1/referrals/tiers');
  return response.data.data.map(transformRewardTier);
}

/**
 * Claim rewards for a tier
 */
export async function claimTierReward(tierId: string): Promise<{
  success: boolean;
  rewards: { type: string; amount: number; description: string }[];
}> {
  const response = await api.post<{
    data: { success: boolean; rewards: { type: string; amount: number; description: string }[] };
  }>(`/api/v1/referrals/tiers/${tierId}/claim`);
  return response.data.data;
}

/**
 * Get referral leaderboard
 */
export async function getLeaderboard(params?: {
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  page?: number;
  limit?: number;
}): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  const response = await api.get<{
    data: LeaderboardEntryResponse[];
    meta: { total: number };
  }>('/api/v1/referrals/leaderboard', { params });

  return {
    entries: response.data.data.map(transformLeaderboardEntry),
    total: response.data.meta.total,
  };
}

/**
 * Apply a referral code (for new users)
 */
export async function applyReferralCode(code: string): Promise<{
  success: boolean;
  referrerUsername: string;
  bonusReceived: { type: string; amount: number }[];
}> {
  const response = await api.post<{
    data: {
      success: boolean;
      referrer_username: string;
      bonus_received: { type: string; amount: number }[];
    };
  }>('/api/v1/referrals/apply', { code });

  return {
    success: response.data.data.success,
    referrerUsername: response.data.data.referrer_username,
    bonusReceived: response.data.data.bonus_received,
  };
}

/**
 * Get shareable referral message
 */
export async function getShareMessage(): Promise<{
  title: string;
  message: string;
  url: string;
}> {
  const response = await api.get<{
    data: { title: string; message: string; url: string };
  }>('/api/v1/referrals/share-message');
  return response.data.data;
}

export default {
  getReferralCode,
  generateReferralCode,
  getReferralStats,
  getReferrals,
  getRewardTiers,
  claimTierReward,
  getLeaderboard,
  applyReferralCode,
  getShareMessage,
};
