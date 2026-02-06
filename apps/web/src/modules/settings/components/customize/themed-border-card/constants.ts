/**
 * ThemedBorderCard Constants
 *
 * Configuration and static data
 */

import type { SizeConfig } from './types';

/**
 * Size configurations for card variants
 */
export const SIZE_CONFIG: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    container: 'w-20 h-20',
    avatar: 'w-12 h-12',
    text: 'text-[10px]',
    badge: 'text-[8px] px-1',
  },
  md: {
    container: 'w-28 h-28',
    avatar: 'w-16 h-16',
    text: 'text-xs',
    badge: 'text-[10px] px-1.5',
  },
  lg: {
    container: 'w-36 h-36',
    avatar: 'w-20 h-20',
    text: 'text-sm',
    badge: 'text-xs px-2',
  },
};

/**
 * Column classes for grid layouts
 */
export const COLUMN_CLASSES: Record<3 | 4 | 5 | 6, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

/**
 * Animation types that have particle effects
 */
export const PARTICLE_ANIMATION_TYPES = ['fire', 'electric', 'legendary', 'mythic'] as const;
