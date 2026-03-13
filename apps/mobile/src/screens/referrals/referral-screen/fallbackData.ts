/**
 * Fallback data for referral screen when API is unavailable
 */

import type { ReferralCode, ReferralStats, Referral, RewardTier, LeaderboardEntry } from './types';

export interface FallbackData {
  referralCode: ReferralCode;
  stats: ReferralStats;
  referrals: Referral[];
  rewardTiers: RewardTier[];
  leaderboard: LeaderboardEntry[];
}

/**
 * Generate fallback data.
 *
 */
export function generateFallbackData(): FallbackData {
  const referralCode: ReferralCode = {
    code: 'CGRAPH2026',
    url: 'https://cgraph.app/join?ref=CGRAPH2026',
    usageCount: 12,
    maxUsage: 100,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const stats: ReferralStats = {
    totalReferrals: 12,
    verifiedReferrals: 8,
    pendingReferrals: 4,
    rank: 42,
    rankChange: 5,
    totalRewardsEarned: {
      xp: 2400,
      coins: 500,
      premium_days: 7,
    },
  };

  const referrals: Referral[] = [
    {
      id: '1',
      referredUserId: 'u1',
      referredUsername: 'CryptoFan',
      referredAvatarUrl: null,
      status: 'verified',
      createdAt: '2026-01-10T00:00:00Z',
      verifiedAt: '2026-01-11T00:00:00Z',
      rewardsClaimed: true,
    },
    {
      id: '2',
      referredUserId: 'u2',
      referredUsername: 'BlockchainDev',
      referredAvatarUrl: null,
      status: 'verified',
      createdAt: '2026-01-09T00:00:00Z',
      verifiedAt: '2026-01-10T00:00:00Z',
      rewardsClaimed: true,
    },
    {
      id: '3',
      referredUserId: 'u3',
      referredUsername: 'NewUser123',
      referredAvatarUrl: null,
      status: 'pending',
      createdAt: '2026-01-12T00:00:00Z',
      rewardsClaimed: false,
    },
  ];

  const rewardTiers: RewardTier[] = [
    {
      id: '1',
      name: 'Beginner',
      description: 'Get started with referrals',
      referralsRequired: 3,
      rewards: [
        { type: 'xp', amount: 500, description: '500 XP' },
        { type: 'badge', description: 'Recruiter Badge' },
      ],
      achieved: true,
      claimed: true,
    },
    {
      id: '2',
      name: 'Rising Star',
      description: 'Growing your network',
      referralsRequired: 10,
      rewards: [
        { type: 'xp', amount: 1500, description: '1500 XP' },
        { type: 'coins', amount: 200, description: '200 Coins' },
        { type: 'title', description: '"Recruiter" Title' },
      ],
      achieved: false,
      claimed: false,
    },
    {
      id: '3',
      name: 'Community Builder',
      description: 'Making a real impact',
      referralsRequired: 25,
      rewards: [
        { type: 'xp', amount: 5000, description: '5000 XP' },
        { type: 'premium', amount: 7, description: '7 Days Premium' },
        { type: 'badge', description: 'Gold Recruiter Badge' },
      ],
      achieved: false,
      claimed: false,
    },
    {
      id: '4',
      name: 'Legend',
      description: 'Top referrer status',
      referralsRequired: 100,
      rewards: [
        { type: 'xp', amount: 20000, description: '20000 XP' },
        { type: 'premium', amount: 30, description: '30 Days Premium' },
        { type: 'title', description: '"Legend" Title' },
        { type: 'badge', description: 'Diamond Recruiter Badge' },
      ],
      achieved: false,
      claimed: false,
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      userId: 'l1',
      username: 'TopRecruiter',
      avatarUrl: null,
      referralCount: 256,
      isCurrentUser: false,
    },
    {
      rank: 2,
      userId: 'l2',
      username: 'CommunityKing',
      avatarUrl: null,
      referralCount: 198,
      isCurrentUser: false,
    },
    {
      rank: 3,
      userId: 'l3',
      username: 'NetworkQueen',
      avatarUrl: null,
      referralCount: 187,
      isCurrentUser: false,
    },
    {
      rank: 42,
      userId: 'current',
      username: 'You',
      avatarUrl: null,
      referralCount: 8,
      isCurrentUser: true,
    },
  ];

  return { referralCode, stats, referrals, rewardTiers, leaderboard };
}
