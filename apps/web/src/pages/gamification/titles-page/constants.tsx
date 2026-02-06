/**
 * TitlesPage Constants
 *
 * Configuration and static data
 */

import { TagIcon, ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline';
import type { TitleRarity } from '@/data/titles';
import type { TabConfig, RarityStyle } from './types';

/**
 * Tab configuration for title browser
 */
export const TABS: TabConfig[] = [
  { id: 'owned', label: 'My Titles', icon: <TagIcon className="h-4 w-4" /> },
  { id: 'all', label: 'All Titles', icon: <StarIcon className="h-4 w-4" /> },
  { id: 'purchasable', label: 'Shop', icon: <ShoppingBagIcon className="h-4 w-4" /> },
];

/**
 * Order of rarities from common to unique
 */
export const RARITY_ORDER: TitleRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'unique',
];

/**
 * Styling for each rarity level
 */
export const RARITY_STYLES: Record<TitleRarity, RarityStyle> = {
  common: { bg: 'bg-gray-500/20', gradient: 'from-gray-400 to-gray-600', text: 'text-gray-400' },
  uncommon: {
    bg: 'bg-green-500/20',
    gradient: 'from-green-400 to-green-600',
    text: 'text-green-400',
  },
  rare: { bg: 'bg-blue-500/20', gradient: 'from-blue-400 to-blue-600', text: 'text-blue-400' },
  epic: {
    bg: 'bg-purple-500/20',
    gradient: 'from-purple-400 to-purple-600',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'bg-yellow-500/20',
    gradient: 'from-yellow-400 to-yellow-600',
    text: 'text-yellow-400',
  },
  mythic: { bg: 'bg-pink-500/20', gradient: 'from-pink-400 to-pink-600', text: 'text-pink-400' },
  unique: { bg: 'bg-rose-500/20', gradient: 'from-rose-400 to-rose-600', text: 'text-rose-400' },
};
