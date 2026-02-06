/**
 * Constants for AchievementDisplay module
 */

import type { AchievementCategory, AchievementRarity } from '@/modules/gamification/store/types';

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

export const RARITY_GRADIENTS: Record<AchievementRarity, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600',
};

export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  social: '👥',
  messaging: '💬',
  groups: '🏘️',
  forums: '📝',
  gaming: '🎮',
  special: '⭐',
  seasonal: '🎉',
};

export const RARITY_ORDER: Record<AchievementRarity, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

export const CATEGORIES: AchievementCategory[] = [
  'social',
  'messaging',
  'groups',
  'forums',
  'gaming',
  'special',
  'seasonal',
];
