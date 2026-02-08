/**
 * Gamification Store — Orchestrator
 *
 * Thin entry point that composes initial state with action creators from
 * submodules (gamification-queries and gamification-actions) and wires
 * them into a Zustand store with persistence.
 *
 * @module modules/gamification/store/gamificationStore.impl
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import type { GamificationState } from './gamificationStore.types';

// ── Re-export types for backward compatibility ─────────────────────────
export type {
  AchievementCategory,
  AchievementRarity,
  QuestType,
  Achievement,
  Quest,
  QuestObjective,
  UserTitle,
  LoreEntry,
  LevelInfo,
  GamificationState,
} from './gamificationStore.types';

// ── Re-export XP utilities ─────────────────────────────────────────────
export { calculateXPForLevel, calculateLevelFromXP, XP_REWARDS } from './gamificationStore.utils';

// ── Import action creators from submodules ─────────────────────────────
import {
  createFetchGamificationData,
  createFetchAchievements,
  createFetchQuests,
  createFetchLore,
} from './gamification-queries';

import {
  createEquipBadge,
  createUnequipBadge,
  createAddXP,
  createUnlockAchievement,
  createCompleteQuest,
  createUpdateQuestProgress,
  createEquipTitle,
  createUnlockLoreEntry,
  createCheckDailyLogin,
} from './gamification-actions';

// ==================== STORE IMPLEMENTATION ====================

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────
      level: 1,
      currentXP: 0,
      totalXP: 0,
      achievements: [],
      recentlyUnlocked: [],
      activeQuests: [],
      completedQuests: [],
      availableTitles: [],
      equippedTitle: null,
      loreEntries: [],
      currentChapter: 1,
      loginStreak: 0,
      lastLoginDate: null,
      isLoading: false,
      isLoadingAchievements: false,

      // ── Backward-compatibility aliases ─────────────────────────────
      get xp() {
        return get().totalXP;
      },
      karma: 0,
      get titles() {
        return get().availableTitles;
      },
      get equippedTitleId() {
        return get().equippedTitle?.id || null;
      },
      equippedBadges: [],

      // ── Actions (delegated to submodules) ──────────────────────────
      equipBadge: createEquipBadge(set, get),
      unequipBadge: createUnequipBadge(set, get),
      fetchGamificationData: createFetchGamificationData(set, get),
      fetchAchievements: createFetchAchievements(set, get),
      fetchQuests: createFetchQuests(set, get),
      fetchLore: createFetchLore(set, get),
      addXP: createAddXP(set, get),
      unlockAchievement: createUnlockAchievement(set, get),
      completeQuest: createCompleteQuest(set, get),
      updateQuestProgress: createUpdateQuestProgress(set, get),
      equipTitle: createEquipTitle(set, get),
      unlockLoreEntry: createUnlockLoreEntry(set, get),
      checkDailyLogin: createCheckDailyLogin(set, get),
    }),
    {
      name: 'cgraph-gamification',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        level: state.level,
        currentXP: state.currentXP,
        totalXP: state.totalXP,
        loginStreak: state.loginStreak,
        lastLoginDate: state.lastLoginDate,
      }),
    }
  )
);
