/**
 * User Entity
 * 
 * Core domain entity representing a user in the CGraph platform.
 */

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  level: number;
  xp: number;
  coins: number;
  isPremium: boolean;
  premiumTier?: PremiumTier;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  walletAddress?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

export type PremiumTier = 'starter' | 'pro' | 'ultimate';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sounds: boolean;
  mentions: boolean;
  directMessages: boolean;
  groupMessages: boolean;
  forumReplies: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: 'everyone' | 'friends' | 'none';
  allowFriendRequests: boolean;
  showActivity: boolean;
}

/**
 * User value object for displaying user info
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: UserStatus;
  level: number;
  title?: string;
  isPremium: boolean;
  premiumTier?: PremiumTier;
}

/**
 * Calculate XP required for a given level
 */
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP for reaching a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): { level: number; currentXP: number; progress: number } {
  let level = 1;
  let remainingXP = totalXP;
  
  while (remainingXP >= getXPForLevel(level)) {
    remainingXP -= getXPForLevel(level);
    level++;
  }
  
  const xpForCurrentLevel = getXPForLevel(level);
  const progress = (remainingXP / xpForCurrentLevel) * 100;
  
  return {
    level,
    currentXP: remainingXP,
    progress,
  };
}
