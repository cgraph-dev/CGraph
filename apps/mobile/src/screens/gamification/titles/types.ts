/**
 * Titles Screen - Types & Constants
 *
 * @version 1.0.0
 */

import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

export type TitleTab = 'owned' | 'all' | 'shop';
export type TitleRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'unique';

export interface Title {
  id: string;
  name: string;
  description: string;
  rarity: TitleRarity;
  category: string;
  requirement?: string;
  price?: number;
  isPremium?: boolean;
}

export interface UserTitle extends Title {
  owned: boolean;
  equipped: boolean;
  acquiredAt?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TABS: {
  id: TitleTab;
  name: string;
  icon: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
}[] = [
  { id: 'owned', name: 'Owned', icon: 'ribbon' },
  { id: 'all', name: 'All Titles', icon: 'list' },
  { id: 'shop', name: 'Shop', icon: 'cart' },
];

export const RARITY_COLORS: Record<
  TitleRarity,
  { bg: string; text: string; border: string; gradient: [string, string] }
> = {
  common: { bg: '#374151', text: '#9ca3af', border: '#4b5563', gradient: ['#374151', '#1f2937'] },
  uncommon: { bg: '#064e3b', text: '#34d399', border: '#10b981', gradient: ['#064e3b', '#022c22'] },
  rare: { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6', gradient: ['#1e3a8a', '#1e1b4b'] },
  epic: { bg: '#581c87', text: '#c084fc', border: '#a855f7', gradient: ['#581c87', '#3b0764'] },
  legendary: {
    bg: '#78350f',
    text: '#fcd34d',
    border: '#f59e0b',
    gradient: ['#78350f', '#451a03'],
  },
  mythic: { bg: '#831843', text: '#f472b6', border: '#ec4899', gradient: ['#831843', '#500724'] },
  unique: { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444', gradient: ['#7f1d1d', '#450a0a'] },
};

export const RARITIES: { id: TitleRarity | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'epic', name: 'Epic' },
  { id: 'legendary', name: 'Legendary' },
  { id: 'mythic', name: 'Mythic' },
  { id: 'unique', name: 'Unique' },
];

// ============================================================================
// HELPERS
// ============================================================================

const VALID_RARITIES: readonly TitleRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'unique',
];

function toTitleRarity(value: string): TitleRarity {
  return VALID_RARITIES.includes(value as TitleRarity) ? (value as TitleRarity) : 'common';
}

/** Transform API title response to UserTitle format */
export function transformTitle(
  apiTitle: Record<string, unknown>,
  equippedTitleId: string | null
): UserTitle {
  const id = String(apiTitle.id ?? '');
  const name = String(apiTitle.name ?? '');
  const description = String(apiTitle.description ?? '');
  const rarity = String(apiTitle.rarity ?? 'common');
  const category = String(apiTitle.category ?? 'general');

  return {
    id,
    name,
    description,
    rarity: toTitleRarity(rarity),
    category,
    owned: Boolean(apiTitle.owned ?? false),
    equipped: id === equippedTitleId,
    acquiredAt:
      apiTitle.acquired_at != null
        ? String(apiTitle.acquired_at)
        : apiTitle.acquiredAt != null
          ? String(apiTitle.acquiredAt)
          : undefined,
    requirement: apiTitle.requirement != null ? String(apiTitle.requirement) : undefined,
    price: typeof apiTitle.price === 'number' ? apiTitle.price : undefined,
    isPremium:
      typeof (apiTitle.is_premium ?? apiTitle.isPremium) === 'boolean'
        ? Boolean(apiTitle.is_premium ?? apiTitle.isPremium)
        : undefined,
  };
}
