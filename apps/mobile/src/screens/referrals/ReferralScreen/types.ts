/**
 * Referral Screen Types
 */

export interface ReferralCode {
  code: string;
  url: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  verifiedReferrals: number;
  pendingReferrals: number;
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
  referredAvatarUrl: string | null;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
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
  }[];
  achieved: boolean;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  referralCount: number;
  isCurrentUser: boolean;
}

// API Transformation functions
export function transformApiReferralCode(data: Record<string, unknown>): ReferralCode {
  return {
    code: (data.code as string) || 'CGRAPH',
    url: (data.url as string) || `https://cgraph.app/join?ref=${data.code}`,
    usageCount: (data.usage_count as number) || (data.usageCount as number) || 0,
    maxUsage: (data.max_usage as number) || (data.maxUsage as number) || 100,
    createdAt:
      (data.created_at as string) || (data.createdAt as string) || new Date().toISOString(),
  };
}

export function transformApiStats(data: Record<string, unknown>): ReferralStats {
  const totalRewardsEarned = (data.total_rewards_earned || data.totalRewardsEarned || {}) as Record<
    string,
    number
  >;
  return {
    totalReferrals: (data.total_referrals as number) || (data.totalReferrals as number) || 0,
    verifiedReferrals:
      (data.verified_referrals as number) || (data.verifiedReferrals as number) || 0,
    pendingReferrals: (data.pending_referrals as number) || (data.pendingReferrals as number) || 0,
    rank: (data.rank as number) || 0,
    rankChange: (data.rank_change as number) || (data.rankChange as number) || 0,
    totalRewardsEarned: {
      xp: totalRewardsEarned.xp || 0,
      coins: totalRewardsEarned.coins || 0,
      premium_days: totalRewardsEarned.premium_days || 0,
    },
  };
}

export function transformApiReferral(data: Record<string, unknown>): Referral {
  return {
    id: data.id as string,
    referredUserId: (data.referred_user_id as string) || (data.referredUserId as string),
    referredUsername: (data.referred_username as string) || (data.referredUsername as string),
    referredAvatarUrl:
      (data.referred_avatar_url as string) || (data.referredAvatarUrl as string) || null,
    status: (data.status as 'pending' | 'verified' | 'rejected') || 'pending',
    createdAt: (data.created_at as string) || (data.createdAt as string),
    verifiedAt: (data.verified_at as string) || (data.verifiedAt as string),
    rewardsClaimed: (data.rewards_claimed as boolean) || (data.rewardsClaimed as boolean) || false,
  };
}

export function transformApiRewardTier(data: Record<string, unknown>): RewardTier {
  const rewards = (data.rewards || []) as Array<Record<string, unknown>>;
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    referralsRequired: (data.referrals_required as number) || (data.referralsRequired as number),
    rewards: rewards.map((r) => ({
      type: r.type as 'xp' | 'coins' | 'premium' | 'badge' | 'title',
      amount: r.amount as number | undefined,
      description: r.description as string,
    })),
    achieved: (data.achieved as boolean) || false,
    claimed: (data.claimed as boolean) || false,
  };
}

export function transformApiLeaderboardEntry(
  data: Record<string, unknown>,
  currentUserId?: string
): LeaderboardEntry {
  return {
    rank: data.rank as number,
    userId: (data.user_id as string) || (data.userId as string),
    username: data.username as string,
    avatarUrl: (data.avatar_url as string) || (data.avatarUrl as string) || null,
    referralCount: (data.referral_count as number) || (data.referralCount as number),
    isCurrentUser:
      (data.is_current_user as boolean) ||
      (data.isCurrentUser as boolean) ||
      data.user_id === currentUserId,
  };
}
