/**
 * Cosmetics Settings Constants
 *
 * Configuration constants and theme presets.
 */

import { THEME_PRESETS } from '@/stores/theme';
import type { ThemePresetWithId } from './types';

// =============================================================================
// THEME PRESETS
// =============================================================================

/**
 * Convert THEME_PRESETS record to array with id
 */
export const THEME_PRESETS_ARRAY: ThemePresetWithId[] = Object.entries(THEME_PRESETS).map(
  ([id, config]) => ({
    ...config,
    id,
    description: `${config.name} theme`,
    backgroundConfig: config.background,
  })
);

// =============================================================================
// RARITY COLORS
// =============================================================================

/**
 * Gradient colors for rarity badges
 */
export const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 to-orange-600',
  mythic: 'from-pink-400 to-pink-600',
  unique: 'from-cyan-400 via-purple-500 to-pink-500',
};

// =============================================================================
// DEFAULT FILTER STATE
// =============================================================================

/**
 * Default filter state
 */
export const DEFAULT_FILTERS = {
  search: '',
  rarity: 'all' as const,
  theme: 'all' as const,
  showOwned: true,
  showLocked: true,
};
