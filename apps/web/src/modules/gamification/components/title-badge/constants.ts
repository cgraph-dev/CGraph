/**
 * TitleBadge Constants
 *
 * Style configurations for title badges.
 */

import type { TitleRarity } from '@/data/titles';
import type { RarityGradientMap, SizeClassMap } from './types';

/**
 * Size class configurations
 */
export const SIZE_CLASSES: SizeClassMap = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded',
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-lg',
  lg: 'text-base px-3 py-1.5 rounded-xl',
};

/**
 * Rarity gradient configurations
 */
export const RARITY_GRADIENTS: RarityGradientMap = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-yellow-500 via-amber-500 to-orange-500',
  mythic: 'from-red-500 via-pink-500 to-rose-500',
  unique: 'from-pink-500 via-purple-500 to-indigo-500',
};

/**
 * High-tier rarities that show sparkle icons
 */
export const SPARKLE_RARITIES: TitleRarity[] = ['legendary', 'mythic', 'unique'];
