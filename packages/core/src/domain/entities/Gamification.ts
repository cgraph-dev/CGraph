/**
 * Gamification Entity
 * 
 * Core domain entities for XP, achievements, quests, and rewards.
 */

export interface AchievementEntity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: Rarity;
  xpReward: number;
  coinReward: number;
  targetProgress: number;
  isSecret: boolean;
  prerequisiteIds: string[];
  createdAt: Date;
}

export type AchievementCategory = 
  | 'messaging'
  | 'forums'
  | 'social'
  | 'engagement'
  | 'premium'
  | 'special';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface UserAchievementEntity {
  id: string;
  oderId: string;
  achievementId: string;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface QuestEntity {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  category: AchievementCategory;
  targetProgress: number;
  rewardXP: number;
  rewardCoins: number;
  rewardItems: QuestRewardItem[];
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export type QuestType = 'daily' | 'weekly' | 'special' | 'event';

export interface QuestRewardItem {
  type: 'badge' | 'title' | 'theme' | 'sticker';
  itemId: string;
}

export interface UserQuestEntity {
  id: string;
  userId: string;
  questId: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  isClaimed: boolean;
  claimedAt?: Date;
}

export interface TitleEntity {
  id: string;
  name: string;
  description: string;
  color: string;
  backgroundColor?: string;
  isAnimated: boolean;
  rarity: Rarity;
  requirement: TitleRequirement;
}

export interface TitleRequirement {
  type: 'level' | 'achievement' | 'purchase' | 'event' | 'special';
  value: string | number;
  description: string;
}

export interface StreakEntity {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Date;
  multiplier: number;
}

// XP reward values
export const XP_REWARDS = {
  // Messaging
  SEND_MESSAGE: 1,
  SEND_FIRST_MESSAGE_OF_DAY: 5,
  RECEIVE_REACTION: 2,
  USE_VOICE_MESSAGE: 3,
  START_CONVERSATION: 5,
  
  // Forums
  CREATE_THREAD: 10,
  REPLY_TO_THREAD: 5,
  RECEIVE_UPVOTE: 3,
  GIVE_UPVOTE: 1,
  THREAD_VIEWED_100: 25,
  THREAD_PINNED: 50,
  
  // Social
  ADD_FRIEND: 5,
  FRIEND_REQUEST_ACCEPTED: 10,
  JOIN_GROUP: 10,
  CREATE_GROUP: 25,
  INVITE_ACCEPTED: 25,
  REFERRAL_SIGNUP: 100,
  
  // Engagement
  DAILY_LOGIN: 10,
  COMPLETE_PROFILE: 50,
  VERIFY_EMAIL: 25,
  ENABLE_2FA: 50,
  
  // Streaks
  WEEKLY_STREAK: 50,
  MONTHLY_STREAK: 200,
  
  // Premium
  FIRST_PURCHASE: 100,
  PREMIUM_SUBSCRIPTION: 500,
} as const;

// Streak multipliers
export const STREAK_MULTIPLIERS: Record<number, number> = {
  7: 1.5,   // 1 week
  14: 1.75, // 2 weeks
  30: 2.0,  // 1 month
  60: 2.25, // 2 months
  90: 2.5,  // 3 months
  180: 3.0, // 6 months
  365: 4.0, // 1 year
};

/**
 * Calculate streak multiplier
 */
export function getStreakMultiplier(streakDays: number): number {
  const thresholds = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (streakDays >= threshold) {
      return STREAK_MULTIPLIERS[threshold] ?? 1.0;
    }
  }
  
  return 1.0;
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  progress: number;
} {
  let level = 1;
  let remainingXP = totalXP;
  
  const getXPForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));
  
  while (remainingXP >= getXPForLevel(level)) {
    remainingXP -= getXPForLevel(level);
    level++;
  }
  
  const xpForNextLevel = getXPForLevel(level);
  
  return {
    level,
    currentXP: remainingXP,
    xpForNextLevel,
    progress: (remainingXP / xpForNextLevel) * 100,
  };
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: '#9CA3AF',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  };
  return colors[rarity];
}

/**
 * Get rarity probability (for drops/rewards)
 */
export function getRarityProbability(rarity: Rarity): number {
  const probabilities: Record<Rarity, number> = {
    common: 0.60,
    uncommon: 0.25,
    rare: 0.10,
    epic: 0.04,
    legendary: 0.01,
  };
  return probabilities[rarity];
}
