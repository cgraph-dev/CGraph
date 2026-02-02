/**
 * Gamification Types
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: AchievementCategory;
  xpReward: number;
  coinReward: number;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  currentProgress?: number;
  targetProgress?: number;
  unlockedAt?: string;
}

export type AchievementCategory =
  | 'social'
  | 'messaging'
  | 'groups'
  | 'forums'
  | 'gaming'
  | 'special'
  | 'seasonal';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementRequirement {
  type: string;
  target: number;
  current?: number;
}

export interface Quest {
  id: string;
  name: string;
  title?: string;
  description: string;
  type: QuestType;
  xpReward: number;
  rewardXP?: number;
  coinReward: number;
  rewardCoins?: number;
  requirements: QuestRequirement[];
  progress: number;
  isCompleted: boolean;
  expiresAt?: string;
  claimedAt?: string;
}

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';

export interface QuestRequirement {
  action: string;
  target: number;
  current: number;
  description: string;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  color: string;
  requirement: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  description?: string;
  timestamp?: string;
  createdAt?: string;
}
