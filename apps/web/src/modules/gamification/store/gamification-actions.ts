/**
 * Gamification Store — Mutation Actions
 *
 * Badge management, XP awards, achievement unlocking, quest completion,
 * title equipping, lore unlocking, and streak tracking.
 *
 * @module modules/gamification/store/gamification-actions
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import type { GamificationState } from './gamificationStore.types';
import { calculateXPForLevel, calculateLevelFromXP } from './gamificationStore.utils';

const logger = createLogger('Gamification');

type StoreSet = (
  partial: Partial<GamificationState> | ((state: GamificationState) => Partial<GamificationState>)
) => void;
type StoreGet = () => GamificationState;

// ── Badge Management ───────────────────────────────────────────────────

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new equip badge.
 *
 * @param _set - The _set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createEquipBadge(_set: StoreSet, get: StoreGet) {
  return async (badgeId: string): Promise<void> => {
    const { equippedBadges, achievements } = get();
    const achievement = achievements.find((a) => a.id === badgeId);
    if (!achievement || !achievement.unlocked) {
      logger.warn('Cannot equip badge: Achievement not found or not unlocked');
      return;
    }
    if (equippedBadges.length >= 3) {
      logger.warn('Cannot equip more than 3 badges');
      return;
    }
    if (equippedBadges.includes(badgeId)) {
      return; // Already equipped
    }
    try {
      await api.post(`/api/v1/gamification/badges/${badgeId}/equip`);
      _set({ equippedBadges: [...equippedBadges, badgeId] });
    } catch (error: unknown) {
      logger.warn('Failed to equip badge:', error);
    }
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new unequip badge.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createUnequipBadge(set: StoreSet, get: StoreGet) {
  return async (badgeId: string): Promise<void> => {
    const { equippedBadges } = get();
    if (!equippedBadges.includes(badgeId)) {
      return; // Not equipped
    }
    try {
      await api.post(`/api/v1/gamification/badges/${badgeId}/unequip`);
      set({ equippedBadges: equippedBadges.filter((id) => id !== badgeId) });
    } catch (error: unknown) {
      logger.warn('Failed to unequip badge:', error);
    }
  };
}

// ── XP & Level ─────────────────────────────────────────────────────────

/**
 * Add XP and handle level ups.
 * Used for local state updates after server-side XP awards.
 */
export function createAddXP(set: StoreSet, get: StoreGet) {
  return async (amount: number, source: string): Promise<void> => {
    const { totalXP, level } = get();
    const newTotalXP = totalXP + amount;
    const newLevel = calculateLevelFromXP(newTotalXP);
    const xpForCurrentLevel = calculateXPForLevel(newLevel);
    const newCurrentXP = newTotalXP - xpForCurrentLevel;

    set({
      totalXP: newTotalXP,
      currentXP: newCurrentXP,
      level: newLevel,
    });

    if (newLevel > level) {
      logger.debug(` LEVEL UP! Now level ${newLevel}`);
    }

    logger.debug(`+${amount} XP from ${source} | Total: ${newTotalXP} | Level: ${newLevel}`);
  };
}

// ── Achievement Unlocking ──────────────────────────────────────────────

/**
 * Trigger achievement unlock check on server.
 * Server validates requirements and awards if criteria are met.
 */
export function createUnlockAchievement(set: StoreSet, get: StoreGet) {
  return async (achievementId: string): Promise<void> => {
    const { achievements, recentlyUnlocked } = get();
    const achievement = achievements.find((a) => a.id === achievementId);

    if (!achievement || achievement.unlocked) return;

    try {
      const response = await api.post(`/api/v1/gamification/achievements/${achievementId}/unlock`);
      const result = response.data;

      if (result.success && result.unlocked) {
        set({
          achievements: achievements.map((a) =>
            a.id === achievementId
              ? {
                  ...a,
                  unlocked: true,
                  unlockedAt: result.unlocked_at || new Date().toISOString(),
                }
              : a
          ),
          recentlyUnlocked: [...recentlyUnlocked, achievement].slice(-5),
        });

        if (achievement.xpReward > 0) {
          await get().addXP(achievement.xpReward, `achievement_${achievementId}`);
        }

        if (achievement.loreFragment) {
          await get().unlockLoreEntry(achievement.loreFragment);
        }

        logger.debug(`Achievement unlocked: ${achievement.title}`);
      } else {
        logger.debug(`Achievement not ready: ${achievement.title} - ${result.message}`);
      }
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

// ── Quest Completion & Progress ────────────────────────────────────────

/**
 * Complete a quest and claim rewards.
 */
export function createCompleteQuest(_set: StoreSet, get: StoreGet) {
  return async (questId: string): Promise<void> => {
    const { activeQuests } = get();
    const quest = activeQuests.find((q) => q.id === questId);

    if (!quest || quest.completed) return;

    try {
      const response = await api.post(`/api/v1/quests/${questId}/claim`);
      const rewards = response.data?.rewards || response.data;

      const MAX_COMPLETED_QUESTS = 500;
      const updatedQuests = [
        ...get().completedQuests,
        { ...quest, completed: true, completedAt: new Date().toISOString() },
      ];
      _set({
        activeQuests: activeQuests.filter((q) => q.id !== questId),
        completedQuests: updatedQuests.length > MAX_COMPLETED_QUESTS ? updatedQuests.slice(updatedQuests.length - MAX_COMPLETED_QUESTS) : updatedQuests,
      });

      logger.debug(`Quest completed: ${quest.title}, XP: ${rewards?.xp}, Coins: ${rewards?.coins}`);
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Update quest objective progress.
 */
export function createUpdateQuestProgress(set: StoreSet, get: StoreGet) {
  return (questId: string, objectiveId: string, value: number): void => {
    const { activeQuests } = get();

    set({
      activeQuests: activeQuests.map((quest) =>
        quest.id === questId
          ? {
              ...quest,
              objectives: quest.objectives.map((obj) =>
                obj.id === objectiveId
                  ? {
                      ...obj,
                      currentValue: Math.min(value, obj.targetValue),
                      completed: value >= obj.targetValue,
                    }
                  : obj
              ),
            }
          : quest
      ),
    });
  };
}

// ── Title Equipping ────────────────────────────────────────────────────

/**
 * Equip a title for display.
 */
export function createEquipTitle(set: StoreSet, get: StoreGet) {
  return async (titleId: string): Promise<void> => {
    try {
      await api.post(`/api/v1/titles/${titleId}/equip`);

      const { availableTitles } = get();
      const title = availableTitles.find((t) => t.id === titleId);

      set({
        equippedTitle: title || null,
        availableTitles: availableTitles.map((t) => ({
          ...t,
          isEquipped: t.id === titleId,
        })),
      });
    } catch (error: unknown) {
      logger.error(' Failed to equip title:', error);
    }
  };
}

// ── Lore Unlocking ─────────────────────────────────────────────────────

/**
 * Unlock a lore entry — future feature.
 */
export function createUnlockLoreEntry(_set: StoreSet, _get: StoreGet) {
  return async (_entryId: string): Promise<void> => {
    logger.debug(' Lore system coming soon');
  };
}

// ── Streak / Daily Login ───────────────────────────────────────────────

/**
 * Handle incoming XP awarded socket event.
 * Updates store state with server-authoritative XP/level data.
 */
export function createHandleXPAwarded(set: StoreSet, _get: StoreGet) {
  return (data: {
    amount: number;
    source: string;
    total_xp: number;
    level: number;
    level_up: boolean;
    level_progress: number;
  }): void => {
    set({
      totalXP: data.total_xp,
      level: data.level,
    });

    logger.debug(
      `+${data.amount} XP from ${data.source} | Total: ${data.total_xp} | Level: ${data.level}${data.level_up ? ' LEVEL UP!' : ''}`
    );
  };
}

/**
 * Handle incoming coins awarded socket event.
 */
export function createHandleCoinsAwarded(set: StoreSet, get: StoreGet) {
  return (data: { amount: number; balance: number }): void => {
    // Use server balance if provided, otherwise increment
    const newCoins = data.balance ?? (get() as Record<string, unknown> as { coins?: number }).coins ?? 0;
    set({ xp: get().totalXP } as Partial<GamificationState>);
    logger.debug(`+${data.amount} coins | Balance: ${newCoins}`);
  };
}

// ── Streak / Daily Login (original) ────────────────────────────────────

/**
 * Fetch scoped leaderboard data by scope, category, and period.
 */
export function createFetchScopedLeaderboard(_set: StoreSet, _get: StoreGet) {
  return async (
    scope: 'global' | 'group' | 'board',
    scopeId: string | undefined,
    category: string,
    period: string
  ): Promise<{
    entries: Array<{
      rank: number;
      userId: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
      score: number;
      level: number;
      equippedTitle?: string;
      avatarBorderId?: string | null;
    }>;
    totalCount: number;
    userRank: { rank: number; score: number } | null;
  }> => {
    try {
      const params: Record<string, string> = { category, period, scope };
      if (scopeId) params.scope_id = scopeId;

      const response = await api.get('/api/v1/leaderboard', { params });
      return response.data ?? { entries: [], totalCount: 0, userRank: null };
    } catch (error: unknown) {
      logger.warn('Failed to fetch scoped leaderboard:', error);
      return { entries: [], totalCount: 0, userRank: null };
    }
  };
}

/**
 * Handle rank_changed socket event for real-time leaderboard updates.
 */
export function createHandleRankChanged(_set: StoreSet, _get: StoreGet) {
  return (data: {
    category: string;
    old_rank: number;
    new_rank: number;
    scope?: string;
  }): void => {
    logger.debug(
      `Rank changed in ${data.category}: ${data.old_rank} -> ${data.new_rank}${data.scope ? ` (${data.scope})` : ''}`
    );
  };
}

/**
 * Check daily login and update streak.
 */
export function createCheckDailyLogin(set: StoreSet, get: StoreGet) {
  return async (): Promise<void> => {
    const { lastLoginDate } = get();
    const today = new Date().toISOString().split('T')[0];

    if (lastLoginDate === today) return;

    try {
      const response = await api.post('/api/v1/gamification/streak/claim');
      const data = response.data?.data || response.data;

      set({
        lastLoginDate: today,
        loginStreak: data.streak_days || data.streak || get().loginStreak + 1,
      });

      logger.debug(`Daily login claimed! Streak: ${data.streak_days}, Coins: ${data.coins_earned}`);
    } catch (error: unknown) {
      set({ lastLoginDate: today });
      logger.debug('Daily login already claimed or error:', error);
    }
  };
}
