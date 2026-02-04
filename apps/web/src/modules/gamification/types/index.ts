/**
 * Gamification Module Types
 *
 * Type definitions for gamification functionality.
 *
 * @module modules/gamification/types
 * @version 1.0.0
 */

/**
 * XP event types
 */
export type XPEventType =
  | 'message_sent'
  | 'forum_post'
  | 'forum_reply'
  | 'reaction_given'
  | 'reaction_received'
  | 'friend_added'
  | 'group_joined'
  | 'daily_login'
  | 'achievement_unlocked'
  | 'quest_completed'
  | 'referral'
  | 'premium_bonus';

/**
 * XP event
 */
export interface XPEvent {
  id: string;
  type: XPEventType;
  amount: number;
  multiplier: number;
  totalXP: number;
  description: string;
  timestamp: string;
}

/**
 * Level info
 */
export interface Level {
  level: number;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  progress: number;
  title?: string;
}

/**
 * Achievement category
 */
export type AchievementCategory =
  | 'social'
  | 'forums'
  | 'messaging'
  | 'groups'
  | 'special'
  | 'seasonal';

/**
 * Achievement rarity
 */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  coinReward?: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  isSecret?: boolean;
}

/**
 * Badge
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: AchievementRarity;
  category: string;
  earnedAt?: string;
  isEquipped?: boolean;
}

/**
 * Avatar border
 */
export interface AvatarBorder {
  id: string;
  name: string;
  imageUrl: string;
  animatedUrl?: string;
  rarity: AchievementRarity;
  isAnimated: boolean;
  price?: number;
  ownedAt?: string;
  isEquipped?: boolean;
}

/**
 * Seasonal event
 */
export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  themeColor: string;
  rewards: EventReward[];
  challenges: EventChallenge[];
  isActive: boolean;
}

/**
 * Event reward
 */
export interface EventReward {
  id: string;
  type: 'xp' | 'badge' | 'border' | 'item' | 'coins';
  value: string | number;
  name: string;
  description: string;
  iconUrl: string;
  requiredPoints: number;
  claimed?: boolean;
}

/**
 * Event challenge
 */
export interface EventChallenge {
  id: string;
  name: string;
  description: string;
  type: XPEventType;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  pointsReward: number;
  completedAt?: string;
}

/**
 * Prestige tier
 */
export interface PrestigeTier {
  tier: number;
  name: string;
  iconUrl: string;
  color: string;
  requiredLevel: number;
  bonuses: PrestigeBonus[];
}

/**
 * Prestige bonus
 */
export interface PrestigeBonus {
  type: 'xp_multiplier' | 'coin_multiplier' | 'storage' | 'badge_slot';
  value: number;
  description: string;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  prestigeTier?: number;
  change?: number;
}

/**
 * Leaderboard type
 */
export type LeaderboardType = 'global' | 'friends' | 'weekly' | 'monthly' | 'forum' | 'group';

/**
 * Quest
 */
export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  objectives: QuestObjective[];
  xpReward: number;
  coinReward?: number;
  badgeReward?: Badge;
  expiresAt?: string;
  completedAt?: string;
}

/**
 * Quest objective
 */
export interface QuestObjective {
  id: string;
  description: string;
  type: XPEventType;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
}

/**
 * Referral
 */
export interface Referral {
  id: string;
  referredUserId: string;
  referredUsername: string;
  status: 'pending' | 'completed' | 'rewarded';
  xpReward: number;
  coinReward?: number;
  createdAt: string;
  completedAt?: string;
}
