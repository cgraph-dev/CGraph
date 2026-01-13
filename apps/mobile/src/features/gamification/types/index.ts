/**
 * Gamification Types (Mobile)
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward: number;
  targetProgress: number;
  currentProgress: number;
  isSecret: boolean;
  unlockedAt?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  targetProgress: number;
  currentProgress: number;
  rewardXP: number;
  rewardCoins: number;
  expiresAt: string;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isEquipped: boolean;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  isCurrentUser: boolean;
}
