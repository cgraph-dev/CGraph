/**
 * Gamification Store — Type Definitions
 *
 * All interfaces and types used by the gamification store implementation.
 * Includes achievement, quest, title, lore, and state types.
 *
 * @module modules/gamification/store/gamificationStore.types
 */

// ── Achievement Types ──────────────────────────────────────────────────

export type AchievementCategory =
  | 'social'
  | 'content'
  | 'exploration'
  | 'mastery'
  | 'legendary'
  | 'secret';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

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

// ── Quest Types ────────────────────────────────────────────────────────

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'special';

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

// ── Title & Cosmetics Types ────────────────────────────────────────────

export interface UserTitle {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color for title display
  rarity: AchievementRarity;
  unlocked: boolean;
  isEquipped: boolean;
}

// ── Lore Types ─────────────────────────────────────────────────────────

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

// ── Level Types ────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  // Perks unlocked at this level
  unlockedPerks: string[];
}

// ── Store State Types ──────────────────────────────────────────────────

export interface GamificationState {
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
