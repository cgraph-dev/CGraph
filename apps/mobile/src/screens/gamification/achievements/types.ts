/**
 * Types and constants for the Achievements screen.
 *
 * @module screens/gamification/achievements/types
 */

// ============================================================================
// TYPES
// ============================================================================

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory =
  | 'all'
  | 'social'
  | 'content'
  | 'engagement'
  | 'special'
  | 'collector';

export interface AchievementWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: string;
  xpReward: number;
  coinReward: number;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RARITY_COLORS: Record<
  AchievementRarity,
  { bg: string; text: string; border: string }
> = {
  common: { bg: '#374151', text: '#9ca3af', border: '#4b5563' },
  uncommon: { bg: '#064e3b', text: '#34d399', border: '#10b981' },
  rare: { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6' },
  epic: { bg: '#581c87', text: '#c084fc', border: '#a855f7' },
  legendary: { bg: '#78350f', text: '#fcd34d', border: '#f59e0b' },
};

export const CATEGORIES: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'content', name: 'Content', icon: 'document-text' },
  { id: 'engagement', name: 'Engagement', icon: 'flame' },
  { id: 'special', name: 'Special', icon: 'star' },
  { id: 'collector', name: 'Collector', icon: 'albums' },
];

export const RARITIES: { id: AchievementRarity | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'epic', name: 'Epic' },
  { id: 'legendary', name: 'Legendary' },
];
