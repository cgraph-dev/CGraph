/**
 * Title Selection Constants
 */

import type { TitleRarity } from '@/data/titles';

export const RARITY_LIST: TitleRarity[] = [
  'free',
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

const RARITY_COLORS: Record<TitleRarity, string> = {
  free: 'text-gray-500 border-gray-700',
  common: 'text-gray-400 border-gray-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-yellow-400 border-yellow-600',
  mythic: 'text-pink-400 border-pink-600',
};

/**
 * unknown for the settings module.
 */
/**
 * Retrieves rarity color.
 *
 * @param rarity - The rarity.
 * @returns The rarity color.
 */
export function getRarityColor(rarity: TitleRarity): string {
  return RARITY_COLORS[rarity] ?? 'text-gray-400';
}
