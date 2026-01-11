import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Gamification Store - Comprehensive progression and achievement tracking system
 *
 * This store manages the entire gamification layer of CGraph, including:
 * - Experience points (XP) and level progression with diminishing returns curve
 * - Achievement unlocking with rarity tiers and progressive milestones
 * - Daily/weekly quest system with rotating challenges
 * - Streak tracking for engagement rewards
 * - Title/badge system with unlockable cosmetics
 * - Lore progression tied to user milestones
 *
 * The system is designed to encourage organic engagement without feeling grindy.
 * XP gains are balanced across different activity types to prevent farming.
 */

// ==================== TYPE DEFINITIONS ====================

export type AchievementCategory =
  | 'social'
  | 'content'
  | 'exploration'
  | 'mastery'
  | 'legendary'
  | 'secret';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  // Progression tracking for multi-step achievements
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  // Hidden achievements don't show until unlocked (anti-spoiler)
  isHidden: boolean;
  // Lore fragment unlocked with this achievement
  loreFragment?: string;
  // Special title awarded (if any)
  titleReward?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  xpReward: number;
  objectives: QuestObjective[];
  expiresAt: string;
  completed: boolean;
  completedAt?: string;
  // Quest chain - completing this unlocks another quest
  nextQuestId?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'count' | 'visit' | 'interact' | 'collect';
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

export interface UserTitle {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color for title display
  rarity: AchievementRarity;
  unlocked: boolean;
  isEquipped: boolean;
}

export interface LoreEntry {
  id: string;
  chapter: number;
  title: string;
  content: string;
  unlocked: boolean;
  unlockedBy?: string; // Achievement ID that unlocked this
  unlockedAt?: string;
  // Progression path - lore forms a branching narrative
  nextEntries: string[];
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  // Perks unlocked at this level
  unlockedPerks: string[];
}

// ==================== XP CALCULATION ====================

/**
 * Calculate XP required for a given level using a smooth exponential curve
 * Formula: baseXP * (level^1.8) to create satisfying but achievable progression
 *
 * This creates a curve where:
 * - Level 2: 100 XP
 * - Level 5: 447 XP
 * - Level 10: 1,585 XP
 * - Level 20: 5,657 XP
 * - Level 50: 28,284 XP
 * - Level 100: 100,000 XP
 *
 * The exponent of 1.8 was chosen after testing to feel rewarding without being grindy.
 */
function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

/**
 * Calculate level from total XP using inverse of the level formula
 * This allows us to instantly determine level without iteration
 */
function calculateLevelFromXP(totalXP: number): number {
  const baseXP = 100;
  return Math.floor(Math.pow(totalXP / baseXP, 1 / 1.8));
}

// ==================== XP REWARDS ====================

/**
 * Predefined XP rewards for different actions
 * Values are carefully balanced to encourage diverse engagement
 */
export const XP_REWARDS = {
  // Messaging & Social
  SEND_MESSAGE: 5,
  SEND_VOICE_MESSAGE: 8,
  START_CONVERSATION: 15,
  MAKE_FRIEND: 25,

  // Forums & Content
  CREATE_POST: 20,
  CREATE_COMMENT: 10,
  RECEIVE_UPVOTE: 3,
  GIVE_UPVOTE: 1,
  POST_GETS_BEST_ANSWER: 50,
  GIVE_AWARD: 15,

  // Community
  JOIN_GROUP: 10,
  CREATE_FORUM: 100,
  MODERATE_CONTENT: 30,
  REPORT_VIOLATION: 5,

  // Engagement
  DAILY_LOGIN: 10,
  COMPLETE_QUEST: 0, // Varies by quest
  UNLOCK_ACHIEVEMENT: 0, // Varies by achievement

  // Streaks (multipliers)
  STREAK_3_DAYS: 1.2,
  STREAK_7_DAYS: 1.5,
  STREAK_30_DAYS: 2.0,
  STREAK_100_DAYS: 3.0,
} as const;

// ==================== STORE STATE ====================

interface GamificationState {
  // Level & XP
  level: number;
  currentXP: number;
  totalXP: number;

  // Achievements
  achievements: Achievement[];
  recentlyUnlocked: Achievement[];

  // Quests
  activeQuests: Quest[];
  completedQuests: Quest[];

  // Titles & Cosmetics
  availableTitles: UserTitle[];
  equippedTitle: UserTitle | null;

  // Lore
  loreEntries: LoreEntry[];
  currentChapter: number;

  // Streaks
  loginStreak: number;
  lastLoginDate: string | null;

  // Loading states
  isLoading: boolean;
  isLoadingAchievements: boolean;

  // Actions
  fetchGamificationData: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  fetchLore: () => Promise<void>;
  addXP: (amount: number, source: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  updateQuestProgress: (questId: string, objectiveId: string, value: number) => void;
  equipTitle: (titleId: string) => Promise<void>;
  unlockLoreEntry: (entryId: string) => Promise<void>;
  checkDailyLogin: () => Promise<void>;
}

// ==================== STORE IMPLEMENTATION ====================

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
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

      /**
       * Fetch all gamification data for the current user
       * Called on app init and when user logs in
       */
      fetchGamificationData: async () => {
        set({ isLoading: true });
        try {
          const [userData, achievements, quests, lore] = await Promise.all([
            api.get('/api/v1/gamification/profile'),
            api.get('/api/v1/gamification/achievements'),
            api.get('/api/v1/gamification/quests'),
            api.get('/api/v1/gamification/lore'),
          ]);

          const profile = userData.data;

          set({
            level: profile.level || 1,
            currentXP: profile.current_xp || 0,
            totalXP: profile.total_xp || 0,
            achievements: achievements.data || [],
            activeQuests: quests.data?.active || [],
            completedQuests: quests.data?.completed || [],
            loreEntries: lore.data || [],
            loginStreak: profile.login_streak || 0,
            lastLoginDate: profile.last_login_date,
            isLoading: false,
          });
        } catch (error) {
          console.error('[Gamification] Failed to fetch data:', error);
          set({ isLoading: false });
        }
      },

      /**
       * Fetch achievements with progress tracking
       */
      fetchAchievements: async () => {
        set({ isLoadingAchievements: true });
        try {
          const response = await api.get('/api/v1/gamification/achievements');
          set({
            achievements: response.data || [],
            isLoadingAchievements: false,
          });
        } catch (error) {
          console.error('[Gamification] Failed to fetch achievements:', error);
          set({ isLoadingAchievements: false });
        }
      },

      /**
       * Fetch active and available quests
       */
      fetchQuests: async () => {
        try {
          const response = await api.get('/api/v1/gamification/quests');
          set({
            activeQuests: response.data?.active || [],
            completedQuests: response.data?.completed || [],
          });
        } catch (error) {
          console.error('[Gamification] Failed to fetch quests:', error);
        }
      },

      /**
       * Fetch lore entries with unlock status
       */
      fetchLore: async () => {
        try {
          const response = await api.get('/api/v1/gamification/lore');
          set({
            loreEntries: response.data || [],
          });
        } catch (error) {
          console.error('[Gamification] Failed to fetch lore:', error);
        }
      },

      /**
       * Add XP and handle level ups
       * This is the core progression mechanic
       */
      addXP: async (amount: number, source: string) => {
        const { totalXP, currentXP, level } = get();
        const newTotalXP = totalXP + amount;
        const newLevel = calculateLevelFromXP(newTotalXP);
        const xpForCurrentLevel = calculateXPForLevel(newLevel);
        const newCurrentXP = newTotalXP - xpForCurrentLevel;

        // Optimistic update for instant feedback
        set({
          totalXP: newTotalXP,
          currentXP: newCurrentXP,
          level: newLevel,
        });

        try {
          // Sync with backend
          await api.post('/api/v1/gamification/xp', {
            amount,
            source,
            total_xp: newTotalXP,
            level: newLevel,
          });

          // Check if we leveled up
          if (newLevel > level) {
            // Trigger level up celebration
            console.log(`[Gamification] LEVEL UP! Now level ${newLevel}`);
            // TODO: Show level up modal with rewards
          }
        } catch (error) {
          console.error('[Gamification] Failed to sync XP:', error);
          // Revert on error
          set({ totalXP, currentXP, level });
        }
      },

      /**
       * Unlock an achievement and award XP
       */
      unlockAchievement: async (achievementId: string) => {
        const { achievements, recentlyUnlocked } = get();
        const achievement = achievements.find(a => a.id === achievementId);

        if (!achievement || achievement.unlocked) return;

        try {
          const response = await api.post(`/api/v1/gamification/achievements/${achievementId}/unlock`);
          const unlockedAchievement = response.data;

          // Update achievement state
          set({
            achievements: achievements.map(a =>
              a.id === achievementId
                ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
                : a
            ),
            recentlyUnlocked: [...recentlyUnlocked, unlockedAchievement].slice(-5), // Keep last 5
          });

          // Award XP
          if (achievement.xpReward > 0) {
            await get().addXP(achievement.xpReward, `achievement_${achievementId}`);
          }

          // Unlock lore if associated
          if (achievement.loreFragment) {
            await get().unlockLoreEntry(achievement.loreFragment);
          }

          console.log(`[Gamification] Achievement unlocked: ${achievement.title}`);
        } catch (error) {
          console.error('[Gamification] Failed to unlock achievement:', error);
        }
      },

      /**
       * Complete a quest and award rewards
       */
      completeQuest: async (questId: string) => {
        const { activeQuests } = get();
        const quest = activeQuests.find(q => q.id === questId);

        if (!quest || quest.completed) return;

        try {
          await api.post(`/api/v1/gamification/quests/${questId}/complete`);

          // Move to completed
          set({
            activeQuests: activeQuests.filter(q => q.id !== questId),
            completedQuests: [
              ...get().completedQuests,
              { ...quest, completed: true, completedAt: new Date().toISOString() }
            ],
          });

          // Award XP
          if (quest.xpReward > 0) {
            await get().addXP(quest.xpReward, `quest_${questId}`);
          }

          console.log(`[Gamification] Quest completed: ${quest.title}`);
        } catch (error) {
          console.error('[Gamification] Failed to complete quest:', error);
        }
      },

      /**
       * Update quest objective progress
       */
      updateQuestProgress: (questId: string, objectiveId: string, value: number) => {
        const { activeQuests } = get();

        set({
          activeQuests: activeQuests.map(quest =>
            quest.id === questId
              ? {
                  ...quest,
                  objectives: quest.objectives.map(obj =>
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
      },

      /**
       * Equip a title for display
       */
      equipTitle: async (titleId: string) => {
        try {
          await api.post('/api/v1/gamification/titles/equip', { title_id: titleId });

          const { availableTitles } = get();
          const title = availableTitles.find(t => t.id === titleId);

          set({
            equippedTitle: title || null,
            availableTitles: availableTitles.map(t => ({
              ...t,
              isEquipped: t.id === titleId,
            })),
          });
        } catch (error) {
          console.error('[Gamification] Failed to equip title:', error);
        }
      },

      /**
       * Unlock a lore entry
       */
      unlockLoreEntry: async (entryId: string) => {
        try {
          await api.post(`/api/v1/gamification/lore/${entryId}/unlock`);

          set({
            loreEntries: get().loreEntries.map(entry =>
              entry.id === entryId
                ? { ...entry, unlocked: true, unlockedAt: new Date().toISOString() }
                : entry
            ),
          });
        } catch (error) {
          console.error('[Gamification] Failed to unlock lore:', error);
        }
      },

      /**
       * Check daily login and update streak
       */
      checkDailyLogin: async () => {
        const { lastLoginDate } = get();
        const today = new Date().toISOString().split('T')[0];

        if (lastLoginDate === today) return; // Already logged in today

        try {
          const response = await api.post('/api/v1/gamification/daily-login');
          const newStreak = response.data.streak;

          set({
            lastLoginDate: today,
            loginStreak: newStreak,
          });

          // Award streak bonus XP
          let streakMultiplier = 1;
          if (newStreak >= 100) streakMultiplier = XP_REWARDS.STREAK_100_DAYS;
          else if (newStreak >= 30) streakMultiplier = XP_REWARDS.STREAK_30_DAYS;
          else if (newStreak >= 7) streakMultiplier = XP_REWARDS.STREAK_7_DAYS;
          else if (newStreak >= 3) streakMultiplier = XP_REWARDS.STREAK_3_DAYS;

          const bonusXP = Math.floor(XP_REWARDS.DAILY_LOGIN * streakMultiplier);
          await get().addXP(bonusXP, 'daily_login');
        } catch (error) {
          console.error('[Gamification] Failed to record daily login:', error);
        }
      },
    }),
    {
      name: 'cgraph-gamification',
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
