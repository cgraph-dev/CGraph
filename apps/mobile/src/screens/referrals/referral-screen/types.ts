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
/**
 * Transforms api referral code.
 *
 */
export function transformApiReferralCode(data: Record<string, unknown>): ReferralCode {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    code: (data.code as string) || 'CGRAPH',

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    url: (data.url as string) || `https://cgraph.app/join?ref=${data.code}`,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    usageCount: (data.usage_count as number) || (data.usageCount as number) || 0,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    maxUsage: (data.max_usage as number) || (data.maxUsage as number) || 100,
    createdAt:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.created_at as string) || (data.createdAt as string) || new Date().toISOString(),
  };
}

/**
 * Transforms api stats.
 *
 */
export function transformApiStats(data: Record<string, unknown>): ReferralStats {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const totalRewardsEarned = (data.total_rewards_earned || data.totalRewardsEarned || {}) as Record<
    string,
    number
  >;
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    totalReferrals: (data.total_referrals as number) || (data.totalReferrals as number) || 0,
    verifiedReferrals:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.verified_referrals as number) || (data.verifiedReferrals as number) || 0,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    pendingReferrals: (data.pending_referrals as number) || (data.pendingReferrals as number) || 0,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    rank: (data.rank as number) || 0,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    rankChange: (data.rank_change as number) || (data.rankChange as number) || 0,
    totalRewardsEarned: {
      xp: totalRewardsEarned.xp || 0,
      coins: totalRewardsEarned.coins || 0,
      premium_days: totalRewardsEarned.premium_days || 0,
    },
  };
}

/**
 * Transforms api referral.
 *
 */
export function transformApiReferral(data: Record<string, unknown>): Referral {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: data.id as string,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    referredUserId: (data.referred_user_id as string) || (data.referredUserId as string),

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    referredUsername: (data.referred_username as string) || (data.referredUsername as string),
    referredAvatarUrl:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.referred_avatar_url as string) || (data.referredAvatarUrl as string) || null,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    status: (data.status as 'pending' | 'verified' | 'rejected') || 'pending',

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (data.created_at as string) || (data.createdAt as string),

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    verifiedAt: (data.verified_at as string) || (data.verifiedAt as string),

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    rewardsClaimed: (data.rewards_claimed as boolean) || (data.rewardsClaimed as boolean) || false,
  };
}

/**
 * Transforms api reward tier.
 *
 */
export function transformApiRewardTier(data: Record<string, unknown>): RewardTier {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const rewards = (data.rewards || []) as Array<Record<string, unknown>>;
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: data.id as string,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    name: data.name as string,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    description: data.description as string,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    referralsRequired: (data.referrals_required as number) || (data.referralsRequired as number),
    rewards: rewards.map((r) => ({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: r.type as 'xp' | 'coins' | 'premium' | 'badge' | 'title',

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      amount: r.amount as number | undefined,

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      description: r.description as string,
    })),

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    achieved: (data.achieved as boolean) || false,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    claimed: (data.claimed as boolean) || false,
  };
}

/**
 * Transforms api leaderboard entry.
 *
 */
export function transformApiLeaderboardEntry(
  data: Record<string, unknown>,
  currentUserId?: string
): LeaderboardEntry {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    rank: data.rank as number,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    userId: (data.user_id as string) || (data.userId as string),

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    username: data.username as string,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    avatarUrl: (data.avatar_url as string) || (data.avatarUrl as string) || null,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    referralCount: (data.referral_count as number) || (data.referralCount as number),
    isCurrentUser:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.is_current_user as boolean) ||
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.isCurrentUser as boolean) ||
      data.user_id === currentUserId,
  };
}
