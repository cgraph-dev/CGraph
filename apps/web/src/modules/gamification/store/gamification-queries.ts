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
      const [statsRes, achievementsRes, questsRes] = await Promise.all([
        api.get('/api/v1/gamification/stats'),
        api.get('/api/v1/gamification/achievements'),
        api.get('/api/v1/quests/active'),
      ]);

      const stats = statsRes.data?.data || statsRes.data;
      const achievements = achievementsRes.data?.data || [];
      const quests = questsRes.data?.data || [];

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
            id: q.id as string,
            title: (questData.title || q.title) as string,
            description: (questData.description || q.description) as string,
            type: (questData.type || q.type) as string,
            xpReward: (questData.xp_reward || q.xp_reward || 0) as number,
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
            expiresAt: q.expires_at as string,
            completed: (q.completed || false) as boolean,
            completedAt: q.completed_at as string | undefined,
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
 */
export function createFetchQuests(set: StoreSet, _get: StoreGet) {
  return async (): Promise<void> => {
    try {
      const [activeRes, dailyRes, weeklyRes] = await Promise.all([
        api.get('/api/v1/quests/active'),
        api.get('/api/v1/quests/daily'),
        api.get('/api/v1/quests/weekly'),
      ]);

      const activeQuests = activeRes.data?.data || [];
      const dailyQuests = dailyRes.data?.data || [];
      const weeklyQuests = weeklyRes.data?.data || [];

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
            id: (q.id || quest.id) as string,
            title: quest.title as string,
            description: quest.description as string,
            type: (quest.type as QuestType) || 'daily', // safe downcast
            xpReward: (quest.xp_reward as number) || 0,
            objectives: rawObjectives.map((obj: unknown) => {
              const o: Record<string, unknown> = isRecord(obj) ? obj : {};
              return {
                id: (o.id as string) || '',
                description: (o.description as string) || '',
                type: (o.type as 'count' | 'visit' | 'interact' | 'collect') || 'count', // safe downcast
                targetValue: (o.target_value as number) || (o.targetValue as number) || 1,
                currentValue: (o.current_value as number) || (o.currentValue as number) || 0,
                completed: (o.completed as boolean) || false,
              };
            }),
            expiresAt: q.expires_at as string,
            completed: (q.completed as boolean) || false,
            completedAt: q.completed_at as string | undefined,
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
