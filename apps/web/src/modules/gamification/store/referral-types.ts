/**
 * Referral System Types
 *
 * Complete MyBB-style referral system type definitions for:
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

// Store state interface
export interface ReferralState {
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
