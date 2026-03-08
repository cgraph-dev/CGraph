/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Gamification Store — Data Fetching Actions
 *
 * All server-side data fetching (stats, achievements, quests, lore).
 * These are extracted from gamificationStore.impl.ts for modularity.
 *
 * @module modules/gamification/store/gamification-queries
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { isRecord } from '@/lib/apiUtils';
import type { QuestType, GamificationState } from './gamificationStore.types';

const logger = createLogger('Gamification');

type StoreSet = (
  partial: Partial<GamificationState> | ((state: GamificationState) => Partial<GamificationState>)
) => void;
type StoreGet = () => GamificationState;

// ── Fetch Gamification Data ────────────────────────────────────────────

/**
 * Fetch all gamification data for the current user.
 * Called on app init and when user logs in.
 */
export function createFetchGamificationData(set: StoreSet, _get: StoreGet) {
  return async (): Promise<void> => {
    set({ isLoading: true });
    try {
      // Fetch stats and achievements first (always available)
      const [statsResult, achievementsResult] = await Promise.allSettled([
        api.get('/api/v1/gamification/stats'),
        api.get('/api/v1/gamification/achievements'),
      ]);

      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null;
      const achievementsRes =
        achievementsResult.status === 'fulfilled' ? achievementsResult.value : null;

      const stats = statsRes?.data?.data || statsRes?.data || {};
      const achievements = achievementsRes?.data?.data || [];

      // Quests are level-gated (level 3+). Only fetch if the user qualifies.
      const userLevel = stats.level || 1;
      let quests: Record<string, unknown>[] = [];
      if (userLevel >= 3) {
        try {
          const questsRes = await api.get('/api/v1/quests/active');
          quests = questsRes?.data?.data || [];
        } catch {
          // Silently handle — quests are non-critical
        }
      }

      set({
        level: stats.level || 1,
        currentXP: stats.xp || 0,
        totalXP: stats.xp || 0,
        achievements: achievements.map((a: Record<string, unknown>) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          category: a.category,
          rarity: a.rarity,
          icon: a.icon,
          xpReward: a.xp_reward || 0,
          progress: a.progress || 0,
          maxProgress: a.max_progress || 1,
          unlocked: a.unlocked || false,
          unlockedAt: a.unlocked_at,
          isHidden: a.is_hidden || false,
          titleReward: a.title_reward,
        })),
        activeQuests: quests.map((q: Record<string, unknown>) => {
          const questData: Record<string, unknown> = isRecord(q.quest) ? q.quest : {};
          const objWrapper = isRecord(questData.objectives) ? questData.objectives : {};
          const rawObjs = Array.isArray(objWrapper.objectives) ? objWrapper.objectives : [];
          const progress: Record<string, number> = isRecord(q.progress)
            ? (q.progress as Record<string, number>) // safe downcast: verified object
            : {};
          return {
            id: q.id as string, // type assertion: API response field

            title: (questData.title || q.title) as string, // type assertion: API response field

            description: (questData.description || q.description) as string, // type assertion: API response field

            type: (questData.type || q.type) as string, // type assertion: API response field

            xpReward: (questData.xp_reward || q.xp_reward || 0) as number, // type assertion: API response field
            objectives: rawObjs.map((raw: unknown) => {
              const obj: Record<string, unknown> = isRecord(raw) ? raw : {};
              const objId = String(obj.id ?? '');
              return {
                id: objId,
                description: String(obj.description ?? ''),
                type: String(obj.type ?? ''),
                targetValue: Number(obj.target) || 0,
                currentValue: progress[objId] || 0,
                completed: (progress[objId] || 0) >= (Number(obj.target) || 0),
              };
            }),

            expiresAt: q.expires_at as string, // type assertion: API response field

            completed: (q.completed || false) as boolean, // type assertion: API response field

            completedAt: q.completed_at as string | undefined, // type assertion: API response field
          };
        }),
        loginStreak: stats.streak_days || 0,
        isLoading: false,
      });
    } catch (error: unknown) {
      logger.error(' Failed to fetch data:', error);
      set({ isLoading: false });
    }
  };
}

// ── Fetch Achievements ─────────────────────────────────────────────────

/**
 * Fetch achievements with progress tracking.
 */
export function createFetchAchievements(set: StoreSet, _get: StoreGet) {
  return async (): Promise<void> => {
    set({ isLoadingAchievements: true });
    try {
      const response = await api.get('/api/v1/gamification/achievements');
      const achievements = response.data?.data || [];
      set({
        achievements: achievements.map((a: Record<string, unknown>) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          category: a.category,
          rarity: a.rarity,
          icon: a.icon,
          xpReward: a.xp_reward || 0,
          progress: a.progress || 0,
          maxProgress: a.max_progress || 1,
          unlocked: a.unlocked || false,
          unlockedAt: a.unlocked_at,
          isHidden: a.is_hidden || false,
          titleReward: a.title_reward,
        })),
        isLoadingAchievements: false,
      });
    } catch (error: unknown) {
      logger.error(' Failed to fetch achievements:', error);
      set({ isLoadingAchievements: false });
    }
  };
}

// ── Fetch Quests ───────────────────────────────────────────────────────

/**
 * Fetch active and available quests.
 * Quests are level-gated (level 3+); skips fetch if user is below required level.
 */
export function createFetchQuests(set: StoreSet, get: StoreGet) {
  return async (): Promise<void> => {
    // Skip if user hasn't reached quest unlock level
    const currentLevel = get().level || 1;
    if (currentLevel < 3) {
      set({ activeQuests: [] });
      return;
    }
    try {
      const [activeResult, dailyResult, weeklyResult] = await Promise.allSettled([
        api.get('/api/v1/quests/active'),
        api.get('/api/v1/quests/daily'),
        api.get('/api/v1/quests/weekly'),
      ]);

      const activeQuests =
        activeResult.status === 'fulfilled' ? activeResult.value.data?.data || [] : [];
      const dailyQuests =
        dailyResult.status === 'fulfilled' ? dailyResult.value.data?.data || [] : [];
      const weeklyQuests =
        weeklyResult.status === 'fulfilled' ? weeklyResult.value.data?.data || [] : [];

      // Combine all quests, filtering for accepted ones
      const allActive = [
        ...activeQuests,
        ...dailyQuests.filter((q: Record<string, unknown>) => q.accepted),
        ...weeklyQuests.filter((q: Record<string, unknown>) => q.accepted),
      ];

      set({
        activeQuests: allActive.map((q: Record<string, unknown>) => {
          const quest: Record<string, unknown> = isRecord(q.quest) ? q.quest : q;

          const rawObjectives = (quest.objectives as { objectives?: unknown[] })?.objectives || []; // safe downcast
          return {
            id: (q.id || quest.id) as string, // type assertion: API response field

            title: quest.title as string, // type assertion: API response field

            description: quest.description as string, // type assertion: API response field

            type: (quest.type as QuestType) || 'daily', // safe downcast

            xpReward: (quest.xp_reward as number) || 0, // type assertion: API response field
            objectives: rawObjectives.map((obj: unknown) => {
              const o: Record<string, unknown> = isRecord(obj) ? obj : {};
              return {
                id: (o.id as string) || '', // type assertion: API response field

                description: (o.description as string) || '', // type assertion: API response field

                type: (o.type as 'count' | 'visit' | 'interact' | 'collect') || 'count', // safe downcast

                targetValue: (o.target_value as number) || (o.targetValue as number) || 1, // type assertion: API response field

                currentValue: (o.current_value as number) || (o.currentValue as number) || 0, // type assertion: API response field

                completed: (o.completed as boolean) || false, // type assertion: API response field
              };
            }),

            expiresAt: q.expires_at as string, // type assertion: API response field

            completed: (q.completed as boolean) || false, // type assertion: API response field

            completedAt: q.completed_at as string | undefined, // type assertion: API response field
          };
        }),
      });
    } catch (error: unknown) {
      logger.error(' Failed to fetch quests:', error);
    }
  };
}

// ── Fetch Lore ─────────────────────────────────────────────────────────

/**
 * Fetch lore entries with unlock status.
 * Note: Lore feature is future enhancement — returns empty for now.
 */
export function createFetchLore(set: StoreSet, _get: StoreGet) {
  return async (): Promise<void> => {
    // Lore system is a future enhancement
    set({ loreEntries: [] });
  };
}

// ── Standalone Fetch Functions (for page-level data) ───────────────────
// These are not store actions — they return data directly for pages to use.

/**
 * Fetch leaderboard entries.
 */
export async function fetchLeaderboard(type: 'global' | 'friends' | 'weekly' = 'global') {
  try {
    const response = await api.get('/api/v1/leaderboard', { params: { type } });
    return response.data?.data || response.data?.leaderboard || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch leaderboard:', error);
    return [];
  }
}

/**
 * Fetch daily reward streak data.
 */
export async function fetchDailyRewards() {
  try {
    const response = await api.get('/api/v1/daily-rewards');
    return response.data?.data || response.data?.rewards || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch daily rewards:', error);
    return [];
  }
}

/**
 * Fetch all cosmetic borders.
 */
export async function fetchBorders() {
  try {
    const response = await api.get('/api/v1/cosmetics/borders');
    return response.data?.data || response.data?.borders || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch borders:', error);
    return [];
  }
}

/**
 * Fetch all cosmetic titles.
 */
export async function fetchTitles() {
  try {
    const response = await api.get('/api/v1/cosmetics/titles');
    return response.data?.data || response.data?.titles || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch titles:', error);
    return [];
  }
}

/**
 * Fetch all cosmetic badges.
 */
export async function fetchBadges() {
  try {
    const response = await api.get('/api/v1/cosmetics/badges');
    return response.data?.data || response.data?.badges || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch badges:', error);
    return [];
  }
}

/**
 * Fetch all available themes.
 */
export async function fetchThemes() {
  try {
    const response = await api.get('/api/v1/themes');
    return response.data?.data || response.data?.themes || [];
  } catch (error: unknown) {
    logger.error('Failed to fetch themes:', error);
    return [];
  }
}

/**
 * Fetch achievements list (standalone, not store action).
 */
export async function fetchAchievementsList() {
  try {
    const response = await api.get('/api/v1/gamification/achievements');
    const raw = response.data?.data || [];
    return raw.map((a: Record<string, unknown>) => ({
      id: a.id ?? '',
      name: (a.name || a.title || '') as string,
      description: (a.description || '') as string,
      icon: (a.icon || '🏆') as string,
      rarity: (a.rarity || 'common') as string,
      progress: (a.progress || 0) as number,
      maxProgress: (a.max_progress || a.maxProgress || 1) as number,
      unlocked: (a.unlocked || false) as boolean,
      reward: {
        xp: (a.xp_reward || (a.reward as Record<string, unknown>)?.xp || 0) as number,
        coins: (a.reward as Record<string, unknown>)?.coins as number | undefined,
        item: (a.reward as Record<string, unknown>)?.item as string | undefined,
      },
    }));
  } catch (error: unknown) {
    logger.error('Failed to fetch achievements:', error);
    return [];
  }
}

/**
 * Fetch quests list (standalone, not store action).
 * Uses Promise.allSettled to gracefully handle 403 from level gate.
 */
export async function fetchQuestsList() {
  try {
    const [activeRes, dailyRes, weeklyRes] = await Promise.allSettled([
      api.get('/api/v1/quests/active'),
      api.get('/api/v1/quests/daily'),
      api.get('/api/v1/quests/weekly'),
    ]);
    const raw = [
      ...(activeRes.status === 'fulfilled' ? activeRes.value.data?.data || [] : []),
      ...(dailyRes.status === 'fulfilled' ? dailyRes.value.data?.data || [] : []),
      ...(weeklyRes.status === 'fulfilled' ? weeklyRes.value.data?.data || [] : []),
    ];
    return raw.map((q: Record<string, unknown>) => {
      const questData = (q.quest && typeof q.quest === 'object' ? q.quest : q) as Record<
        string,
        unknown
      >;
      return {
        id: (q.id || '') as string,
        name: (questData.name || questData.title || q.name || q.title || '') as string,
        description: (questData.description || q.description || '') as string,
        type: (questData.type || q.type || 'daily') as string,
        progress: (q.progress_count || q.progress || 0) as number,
        maxProgress: (questData.max_progress || q.maxProgress || 1) as number,
        completed: (q.completed || false) as boolean,
        reward: {
          xp: (questData.xp_reward || (q.reward as Record<string, unknown>)?.xp || 0) as number,
          coins: (q.reward as Record<string, unknown>)?.coins as number | undefined,
        },
      };
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch quests:', error);
    return [];
  }
}
