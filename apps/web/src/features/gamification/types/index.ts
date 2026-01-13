/**
 * Gamification Types
 * 
 * TypeScript types and interfaces for gamification feature.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward: number;
  targetProgress: number;
  currentProgress: number;
  isSecret: boolean;
  unlockedAt?: string;
}

export type AchievementCategory = 
  | 'messaging'
  | 'forums'
  | 'social'
  | 'engagement'
  | 'premium'
  | 'special';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  category: AchievementCategory;
  targetProgress: number;
  currentProgress: number;
  rewardXP: number;
  rewardCoins: number;
  rewardItems?: QuestRewardItem[];
  expiresAt: string;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface QuestRewardItem {
  type: 'badge' | 'title' | 'theme' | 'sticker';
  id: string;
  name: string;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  color: string;
  backgroundColor?: string;
  isAnimated: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement: TitleRequirement;
  isEquipped: boolean;
  unlockedAt?: string;
}

export interface TitleRequirement {
  type: 'level' | 'achievement' | 'purchase' | 'event' | 'special';
  value: string | number;
  description: string;
}

export interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  timestamp: string;
  multiplier?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  title?: string;
  isCurrentUser: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string;
  multiplier: number;
  nextMilestone: number;
  milestoneReward: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'title' | 'theme' | 'avatar_border' | 'sticker_pack';
  price: number;
  currency: 'coins' | 'premium';
  previewImage?: string;
  isLimited: boolean;
  stock?: number;
  expiresAt?: string;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend' | 'purchase';
  description: string;
  itemId?: string;
  timestamp: string;
}
