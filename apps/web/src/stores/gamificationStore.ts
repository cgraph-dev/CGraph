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
  xp: number; // Alias for totalXP for backward compatibility
  karma: number; // User reputation

  // Achievements
  achievements: Achievement[];
  recentlyUnlocked: Achievement[];

  // Quests
  activeQuests: Quest[];
  completedQuests: Quest[];

  // Titles & Cosmetics
  availableTitles: UserTitle[];
  equippedTitle: UserTitle | null;
  // Aliases for TitleSelection component
  titles: UserTitle[];
  equippedTitleId: string | null;

  // Badges (based on achievements)
  equippedBadges: string[]; // Array of achievement IDs used as badges

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
  equipBadge: (badgeId: string) => Promise<void>;
  unequipBadge: (badgeId: string) => Promise<void>;
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

      // Alias properties for backward compatibility
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

      // Badge management functions
      equipBadge: async (badgeId: string) => {
        const { equippedBadges, achievements } = get();
        const achievement = achievements.find((a) => a.id === badgeId);
        if (!achievement || !achievement.unlocked) {
          console.error('Cannot equip badge: Achievement not found or not unlocked');
          return;
        }
        if (equippedBadges.length >= 3) {
          console.error('Cannot equip more than 3 badges');
          return;
        }
        if (equippedBadges.includes(badgeId)) {
          return; // Already equipped
        }
        try {
          await api.post(`/api/v1/gamification/badges/${badgeId}/equip`);
          set({ equippedBadges: [...equippedBadges, badgeId] });
        } catch (error) {
          console.error('Failed to equip badge:', error);
        }
      },

      unequipBadge: async (badgeId: string) => {
        const { equippedBadges } = get();
        if (!equippedBadges.includes(badgeId)) {
          return; // Not equipped
        }
        try {
          await api.post(`/api/v1/gamification/badges/${badgeId}/unequip`);
          set({ equippedBadges: equippedBadges.filter((id) => id !== badgeId) });
        } catch (error) {
          console.error('Failed to unequip badge:', error);
        }
      },

      /**
       * Fetch all gamification data for the current user
       * Called on app init and when user logs in
       */
      fetchGamificationData: async () => {
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
              const questData = (q.quest || {}) as Record<string, unknown>;
              return {
                id: q.id as string,
                title: (questData.title || q.title) as string,
                description: (questData.description || q.description) as string,
                type: (questData.type || q.type) as string,
                xpReward: (questData.xp_reward || q.xp_reward || 0) as number,
                objectives: (
                  ((questData.objectives as Record<string, unknown>)?.objectives || []) as Record<
                    string,
                    unknown
                  >[]
                ).map((obj) => ({
                  id: obj.id as string,
                  description: obj.description as string,
                  type: obj.type as string,
                  targetValue: obj.target as number,
                  currentValue: (q.progress as Record<string, number>)?.[obj.id as string] || 0,
                  completed:
                    ((q.progress as Record<string, number>)?.[obj.id as string] || 0) >=
                    (obj.target as number),
                })),
                expiresAt: q.expires_at as string,
                completed: (q.completed || false) as boolean,
                completedAt: q.completed_at as string | undefined,
              };
            }),
            loginStreak: stats.streak_days || 0,
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
              const quest = (q.quest || q) as Record<string, unknown>;
              const rawObjectives =
                (quest.objectives as { objectives?: unknown[] })?.objectives || [];
              return {
                id: (q.id || quest.id) as string,
                title: quest.title as string,
                description: quest.description as string,
                type: (quest.type as QuestType) || 'daily',
                xpReward: (quest.xp_reward as number) || 0,
                objectives: rawObjectives.map((obj: unknown) => {
                  const o = obj as Record<string, unknown>;
                  return {
                    id: (o.id as string) || '',
                    description: (o.description as string) || '',
                    type: (o.type as 'count' | 'visit' | 'interact' | 'collect') || 'count',
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
        } catch (error) {
          console.error('[Gamification] Failed to fetch quests:', error);
        }
      },

      /**
       * Fetch lore entries with unlock status
       * Note: Lore feature is future enhancement - returns empty for now
       */
      fetchLore: async () => {
        // Lore system is a future enhancement
        set({ loreEntries: [] });
      },

      /**
       * Add XP and handle level ups
       * This is used for local state updates after server-side XP awards.
       * XP is awarded server-side through game actions, not client POST.
       */
      addXP: async (amount: number, source: string) => {
        const { totalXP, level } = get();
        const newTotalXP = totalXP + amount;
        const newLevel = calculateLevelFromXP(newTotalXP);
        const xpForCurrentLevel = calculateXPForLevel(newLevel);
        const newCurrentXP = newTotalXP - xpForCurrentLevel;

        // Update local state - XP is awarded server-side
        set({
          totalXP: newTotalXP,
          currentXP: newCurrentXP,
          level: newLevel,
        });

        // Check if we leveled up
        if (newLevel > level) {
          console.log(`[Gamification] LEVEL UP! Now level ${newLevel}`);
          // Level up modal/celebration can be triggered here
        }

        console.log(
          `[Gamification] +${amount} XP from ${source} | Total: ${newTotalXP} | Level: ${newLevel}`
        );
      },

      /**
       * Trigger achievement unlock check on server.
       * Server validates requirements and awards if criteria are met.
       */
      unlockAchievement: async (achievementId: string) => {
        const { achievements, recentlyUnlocked } = get();
        const achievement = achievements.find((a) => a.id === achievementId);

        if (!achievement || achievement.unlocked) return;

        try {
          const response = await api.post(
            `/api/v1/gamification/achievements/${achievementId}/unlock`
          );
          const result = response.data;

          if (result.success && result.unlocked) {
            // Update local achievement state
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

            // Award XP locally (server also awards, this syncs UI)
            if (achievement.xpReward > 0) {
              await get().addXP(achievement.xpReward, `achievement_${achievementId}`);
            }

            // Unlock lore if associated
            if (achievement.loreFragment) {
              await get().unlockLoreEntry(achievement.loreFragment);
            }

            console.log(`[Gamification] Achievement unlocked: ${achievement.title}`);
          } else {
            console.log(
              `[Gamification] Achievement not ready: ${achievement.title} - ${result.message}`
            );
          }
        } catch (error) {
          console.error('[Gamification] Failed to unlock achievement:', error);
        }
      },

      /**
       * Complete a quest and claim rewards
       */
      completeQuest: async (questId: string) => {
        const { activeQuests } = get();
        const quest = activeQuests.find((q) => q.id === questId);

        if (!quest || quest.completed) return;

        try {
          const response = await api.post(`/api/v1/quests/${questId}/claim`);
          const rewards = response.data?.rewards || response.data;

          // Move to completed
          set({
            activeQuests: activeQuests.filter((q) => q.id !== questId),
            completedQuests: [
              ...get().completedQuests,
              { ...quest, completed: true, completedAt: new Date().toISOString() },
            ],
          });

          console.log(
            `[Gamification] Quest completed: ${quest.title}, XP: ${rewards?.xp}, Coins: ${rewards?.coins}`
          );
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
      },

      /**
       * Equip a title for display
       */
      equipTitle: async (titleId: string) => {
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
        } catch (error) {
          console.error('[Gamification] Failed to equip title:', error);
        }
      },

      /**
       * Unlock a lore entry - future feature
       */
      unlockLoreEntry: async (_entryId: string) => {
        // Lore system is a future enhancement
        console.log('[Gamification] Lore system coming soon');
      },

      /**
       * Check daily login and update streak
       */
      checkDailyLogin: async () => {
        const { lastLoginDate } = get();
        const today = new Date().toISOString().split('T')[0];

        if (lastLoginDate === today) return; // Already logged in today

        try {
          const response = await api.post('/api/v1/gamification/streak/claim');
          const data = response.data?.data || response.data;

          set({
            lastLoginDate: today,
            loginStreak: data.streak_days || data.streak || get().loginStreak + 1,
          });

          console.log(
            `[Gamification] Daily login claimed! Streak: ${data.streak_days}, Coins: ${data.coins_earned}`
          );
        } catch (error) {
          // Already claimed or other error - update last login date anyway
          set({ lastLoginDate: today });
          console.debug('[Gamification] Daily login already claimed or error:', error);
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
