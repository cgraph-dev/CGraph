/**
 * useReferrals - Referral Program Hook
 *
 * Manages referral program state including codes, stats, tiers, and leaderboard.
 *
 * Features:
 * - Referral code management
 * - Statistics tracking
 * - Reward tier progress and claiming
 * - Leaderboard data
 * - Share functionality
 * - Caching for performance
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as referralService from '../services/referralService';
import type {
  ReferralCode,
  ReferralStats,
  Referral,
  RewardTier,
  LeaderboardEntry,
} from '../services/referralService';

// Re-export types
export type { ReferralCode, ReferralStats, Referral, RewardTier, LeaderboardEntry };

interface UseReferralsReturn {
  // Data
  referralCode: ReferralCode | null;
  stats: ReferralStats | null;
  referrals: Referral[];
  rewardTiers: RewardTier[];
  leaderboard: LeaderboardEntry[];

  // Loading states
  isLoading: boolean;
  isLoadingReferrals: boolean;
  isLoadingLeaderboard: boolean;
  isClaiming: boolean;

  // Error state
  error: Error | null;

  // Computed values
  currentRank: number;
  nextTier: RewardTier | null;
  progressToNextTier: number;
  hasUnclaimedRewards: boolean;

  // Actions
  loadReferralData: () => Promise<void>;
  loadReferrals: (status?: 'pending' | 'verified' | 'rejected') => Promise<void>;
  loadLeaderboard: (period?: 'daily' | 'weekly' | 'monthly' | 'all_time') => Promise<void>;
  claimReward: (tierId: string) => Promise<boolean>;
  copyReferralCode: () => Promise<void>;
  shareReferralLink: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CACHE_DURATION = 60 * 1000; // 1 minute

/**
 * Hook for referrals.
 *
 */
export function useReferrals(): UseReferralsReturn {
  // Data state
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);

  // Cache refs
  const cacheRef = useRef<{
    data: { timestamp: number } | null;
    referrals: { timestamp: number; status?: string } | null;
    leaderboard: { timestamp: number; period?: string } | null;
  }>({
    data: null,
    referrals: null,
    leaderboard: null,
  });

  // Computed values
  const currentRank = stats?.rank ?? 0;

  const nextTier = rewardTiers.find((tier) => !tier.achieved) ?? null;

  const progressToNextTier =
    nextTier && stats
      ? Math.min(100, (stats.verifiedReferrals / nextTier.referralsRequired) * 100)
      : 100;

  const hasUnclaimedRewards = rewardTiers.some((tier) => tier.achieved && !tier.claimed);

  // Load main referral data (code, stats, tiers)
  const loadReferralData = useCallback(async () => {
    const now = Date.now();
    if (cacheRef.current.data && now - cacheRef.current.data.timestamp < CACHE_DURATION) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [codeData, statsData, tiersData] = await Promise.all([
        referralService.getReferralCode(),
        referralService.getReferralStats(),
        referralService.getRewardTiers(),
      ]);

      setReferralCode(codeData);
      setStats(statsData);
      setRewardTiers(tiersData);
      cacheRef.current.data = { timestamp: now };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load referral data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load referrals list
  const loadReferrals = useCallback(async (status?: 'pending' | 'verified' | 'rejected') => {
    const now = Date.now();
    const cache = cacheRef.current.referrals;
    if (cache && now - cache.timestamp < CACHE_DURATION && cache.status === status) {
      return;
    }

    setIsLoadingReferrals(true);

    try {
      const result = await referralService.getReferrals({ status, limit: 50 });
      setReferrals(result.referrals);
      cacheRef.current.referrals = { timestamp: now, status };
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, []);

  // Load leaderboard
  const loadLeaderboard = useCallback(
    async (period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') => {
      const now = Date.now();
      const cache = cacheRef.current.leaderboard;
      if (cache && now - cache.timestamp < CACHE_DURATION && cache.period === period) {
        return;
      }

      setIsLoadingLeaderboard(true);

      try {
        const result = await referralService.getLeaderboard({ period, limit: 50 });
        setLeaderboard(result.entries);
        cacheRef.current.leaderboard = { timestamp: now, period };
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    },
    []
  );

  // Claim a tier reward
  const claimReward = useCallback(async (tierId: string): Promise<boolean> => {
    setIsClaiming(true);

    try {
      const result = await referralService.claimTierReward(tierId);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Update local tier state
        setRewardTiers((prev) =>
          prev.map((tier) => (tier.id === tierId ? { ...tier, claimed: true } : tier))
        );

        // Invalidate cache to refresh stats
        cacheRef.current.data = null;

        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to claim reward:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, []);

  // Copy referral code to clipboard
  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;

    try {
      await Clipboard.setStringAsync(referralCode.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [referralCode]);

  // Share referral link
  const shareReferralLink = useCallback(async () => {
    if (!referralCode) return;

    try {
      const shareData = await referralService.getShareMessage();

      await Share.share({
        title: shareData.title,
        message:
          Platform.OS === 'ios' ? shareData.message : `${shareData.message}\n${shareData.url}`,
        url: Platform.OS === 'ios' ? shareData.url : undefined,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      // User cancelled or error
      console.error('Share failed:', err);
    }
  }, [referralCode]);

  // Refresh all data
  const refresh = useCallback(async () => {
    // Clear cache
    cacheRef.current = { data: null, referrals: null, leaderboard: null };

    // Reload everything
    await Promise.all([loadReferralData(), loadReferrals(), loadLeaderboard()]);
  }, [loadReferralData, loadReferrals, loadLeaderboard]);

  // Initial load
  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  return {
    // Data
    referralCode,
    stats,
    referrals,
    rewardTiers,
    leaderboard,

    // Loading states
    isLoading,
    isLoadingReferrals,
    isLoadingLeaderboard,
    isClaiming,

    // Error state
    error,

    // Computed values
    currentRank,
    nextTier,
    progressToNextTier,
    hasUnclaimedRewards,

    // Actions
    loadReferralData,
    loadReferrals,
    loadLeaderboard,
    claimReward,
    copyReferralCode,
    shareReferralLink,
    refresh,
  };
}

export default useReferrals;
