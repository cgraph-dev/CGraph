/**
 * useGamification Hook
 *
 * React hook for accessing gamification features throughout the app.
 * Provides stats, achievements, quests, and leaderboard data with caching.
 *
 * @module hooks/useGamification
 * @since v0.8.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import gamificationService, {
  GamificationStats,
  AchievementWithProgress,
  UserQuest,
  LeaderboardData,
  XpTransaction,
  StreakClaimResult,
} from '../services/gamificationService';

// Cache duration in milliseconds
const CACHE_DURATION = 30000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface GamificationState {
  stats: GamificationStats | null;
  achievements: AchievementWithProgress[];
  activeQuests: UserQuest[];
  dailyQuests: UserQuest[];
  weeklyQuests: UserQuest[];
  leaderboard: LeaderboardData | null;
  xpHistory: XpTransaction[];
  isLoading: boolean;
  error: string | null;
}

interface UseGamificationReturn extends GamificationState {
  // Refresh functions
  refreshStats: () => Promise<void>;
  refreshAchievements: (category?: string) => Promise<void>;
  refreshQuests: () => Promise<void>;
  refreshLeaderboard: (category: string) => Promise<void>;
  refreshXpHistory: () => Promise<void>;

  // Actions
  claimStreak: () => Promise<StreakClaimResult | null>;
  acceptQuest: (questId: string) => Promise<UserQuest | null>;
  claimQuestRewards: (userQuestId: string) => Promise<boolean>;

  // Computed values
  canClaimStreak: boolean;
  unclaimedQuests: UserQuest[];
  completedAchievements: AchievementWithProgress[];
  inProgressAchievements: AchievementWithProgress[];
}

export function useGamification(): UseGamificationReturn {
  const [state, setState] = useState<GamificationState>({
    stats: null,
    achievements: [],
    activeQuests: [],
    dailyQuests: [],
    weeklyQuests: [],
    leaderboard: null,
    xpHistory: [],
    isLoading: false,
    error: null,
  });

  // Cache refs
  const cacheRef = useRef<{
    stats?: CacheEntry<GamificationStats>;
    achievements?: CacheEntry<AchievementWithProgress[]>;
    quests?: CacheEntry<{ active: UserQuest[]; daily: UserQuest[]; weekly: UserQuest[] }>;
    leaderboard?: CacheEntry<LeaderboardData>;
    xpHistory?: CacheEntry<XpTransaction[]>;
  }>({});

  const isCacheValid = useCallback(<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // ==================== REFRESH FUNCTIONS ====================

  const refreshStats = useCallback(
    async (force = false) => {
      if (!force && isCacheValid(cacheRef.current.stats)) {
        setState((prev) => ({ ...prev, stats: cacheRef.current.stats!.data }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const stats = await gamificationService.getGamificationStats();
        cacheRef.current.stats = { data: stats, timestamp: Date.now() };
        setState((prev) => ({ ...prev, stats, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats',
        }));
      }
    },
    [isCacheValid]
  );

  const refreshAchievements = useCallback(async (category?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const achievements = await gamificationService.getAchievements(category);
      cacheRef.current.achievements = { data: achievements, timestamp: Date.now() };
      setState((prev) => ({ ...prev, achievements, isLoading: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load achievements',
      }));
    }
  }, []);

  const refreshQuests = useCallback(async () => {
    if (isCacheValid(cacheRef.current.quests)) {
      const cached = cacheRef.current.quests!.data;
      setState((prev) => ({
        ...prev,
        activeQuests: cached.active,
        dailyQuests: cached.daily,
        weeklyQuests: cached.weekly,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [active, daily, weekly] = await Promise.all([
        gamificationService.getActiveQuests(),
        gamificationService.getDailyQuests(),
        gamificationService.getWeeklyQuests(),
      ]);

      cacheRef.current.quests = {
        data: { active, daily, weekly },
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        activeQuests: active,
        dailyQuests: daily,
        weeklyQuests: weekly,
        isLoading: false,
      }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load quests',
      }));
    }
  }, [isCacheValid]);

  const refreshLeaderboard = useCallback(
    async (category: 'xp' | 'level' | 'coins' | 'streak' | 'messages' | 'posts') => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const leaderboard = await gamificationService.getLeaderboard(category);
        cacheRef.current.leaderboard = { data: leaderboard, timestamp: Date.now() };
        setState((prev) => ({ ...prev, leaderboard, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load leaderboard',
        }));
      }
    },
    []
  );

  const refreshXpHistory = useCallback(async () => {
    if (isCacheValid(cacheRef.current.xpHistory)) {
      setState((prev) => ({ ...prev, xpHistory: cacheRef.current.xpHistory!.data }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const xpHistory = await gamificationService.getXpHistory();
      cacheRef.current.xpHistory = { data: xpHistory, timestamp: Date.now() };
      setState((prev) => ({ ...prev, xpHistory, isLoading: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load XP history',
      }));
    }
  }, [isCacheValid]);

  // ==================== ACTIONS ====================

  const claimStreak = useCallback(async (): Promise<StreakClaimResult | null> => {
    try {
      const result = await gamificationService.claimDailyStreak();
      // Invalidate stats cache and refresh
      cacheRef.current.stats = undefined;
      await refreshStats(true);
      return result;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to claim streak',
      }));
      return null;
    }
  }, [refreshStats]);

  const acceptQuest = useCallback(
    async (questId: string): Promise<UserQuest | null> => {
      try {
        const userQuest = await gamificationService.acceptQuest(questId);
        // Invalidate quests cache and refresh
        cacheRef.current.quests = undefined;
        await refreshQuests();
        return userQuest;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || 'Failed to accept quest',
        }));
        return null;
      }
    },
    [refreshQuests]
  );

  const claimQuestRewards = useCallback(
    async (userQuestId: string): Promise<boolean> => {
      try {
        await gamificationService.claimQuestRewards(userQuestId);
        // Invalidate caches and refresh
        cacheRef.current.stats = undefined;
        cacheRef.current.quests = undefined;
        await Promise.all([refreshStats(true), refreshQuests()]);
        return true;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || 'Failed to claim rewards',
        }));
        return false;
      }
    },
    [refreshStats, refreshQuests]
  );

  // ==================== COMPUTED VALUES ====================

  const canClaimStreak = state.stats
    ? !state.stats.lastStreakClaim ||
      new Date(state.stats.lastStreakClaim).toDateString() !== new Date().toDateString()
    : false;

  const unclaimedQuests = [
    ...state.activeQuests,
    ...state.dailyQuests,
    ...state.weeklyQuests,
  ].filter((q) => q.completed && !q.claimed);

  const completedAchievements = state.achievements.filter((a) => a.unlocked);
  const inProgressAchievements = state.achievements.filter((a) => !a.unlocked && a.progress > 0);

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    ...state,
    refreshStats,
    refreshAchievements,
    refreshQuests,
    refreshLeaderboard,
    refreshXpHistory,
    claimStreak,
    acceptQuest,
    claimQuestRewards,
    canClaimStreak,
    unclaimedQuests,
    completedAchievements,
    inProgressAchievements,
  };
}

export default useGamification;
