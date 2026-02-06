/**
 * Referral Dashboard Types
 *
 * Type definitions for the referral dashboard components.
 */

export type LeaderboardPeriod = 'all' | 'month' | 'week';

export interface ReferralLinkCardProps {
  referralCode: {
    url: string;
    code: string;
    usageCount: number;
    maxUsage?: number;
  } | null;
  isLoading: boolean;
  copied: boolean;
  copiedType: 'code' | 'url' | null;
  isRegenerating: boolean;
  onCopyUrl: () => void;
  onCopyCode: () => void;
  onShare: () => void;
  onRegenerate: () => void;
}

export interface StatsCardsProps {
  stats: {
    totalReferrals: number;
    verifiedReferrals: number;
    totalRewardsEarned: { xp: number };
    rank: number;
    rankChange: number;
  } | null;
}

export interface ProgressTierProps {
  nextTier: {
    tier: {
      name: string;
      referralsRequired: number;
      rewards: { description: string }[];
    };
    progress: number;
  } | null;
  verifiedReferrals: number;
}

export interface RecentReferralsProps {
  referrals: {
    id: string;
    referredUsername: string;
    referredAvatarUrl?: string;
    createdAt: string;
    status: string;
  }[];
}

export interface LeaderboardProps {
  leaderboard: {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    rank: number;
    referralCount: number;
  }[];
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}

export interface RewardTiersProps {
  tiers: {
    id: string;
    name: string;
    referralsRequired: number;
    achieved: boolean;
    rewards: {
      id: string;
      description: string;
      claimed: boolean;
    }[];
  }[];
  onClaimReward: (rewardId: string) => void;
}
