/**
 * User profile type definitions.
 * @module
 */
// Profile types and constants
export interface UserProfileData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  isVerified: boolean;
  isPremium: boolean;
  karma: number;
  createdAt: string;
  mutualFriends?: number;
  location?: string;
  website?: string;
  // Gamification stats
  level?: number;
  totalXP?: number;
  currentXP?: number;
  loginStreak?: number;
  achievementCount?: number;
  totalAchievements?: number;
  messagesSent?: number;
  postsCreated?: number;
  friendsCount?: number;
  // Title system
  equippedTitle?: string | null;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

// Default rarity color for fallback
export const defaultRarityColor = {
  bg: 'bg-gray-500/20',
  border: 'border-gray-500/30',
  text: 'text-gray-400',
};

// Rarity color mapping
export const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  mythic: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400' },
};
