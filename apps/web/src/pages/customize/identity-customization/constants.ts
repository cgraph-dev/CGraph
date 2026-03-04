/**
 * Constants for IdentityCustomization module
 *
 * NOTE: Mock border, title, and badge data has been removed.
 * Border, title, and badge data is now fetched from the backend API:
 * - GET /api/v1/cosmetics/borders
 * - GET /api/v1/cosmetics/titles
 * - GET /api/v1/cosmetics/badges
 */

import type { ProfileLayout, RarityOption, Rarity } from './types';
import type { AvatarBorderType } from '@/modules/settings/store/customization';

export const RARITIES: RarityOption[] = [
  { value: 'common', label: 'Common', color: 'text-gray-400' },
  { value: 'rare', label: 'Rare', color: 'text-blue-400' },
  { value: 'epic', label: 'Epic', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legendary', color: 'text-yellow-400' },
  { value: 'mythic', label: 'Mythic', color: 'text-pink-400' },
];

export const PROFILE_LAYOUTS: ProfileLayout[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional centered layout with avatar on top',
    preview: 'classic',
    unlocked: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Split panel design with side avatar',
    preview: 'modern',
    unlocked: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient single row layout',
    preview: 'compact',
    unlocked: true,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    description: 'Emphasizes badges and achievements',
    preview: 'showcase',
    unlocked: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Stats-focused with progress bars',
    preview: 'gaming',
    unlocked: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean business-style layout',
    preview: 'professional',
    unlocked: false,
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative asymmetric design',
    preview: 'artistic',
    unlocked: false,
  },
];

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };
  return colors[rarity];
}

/**
 * Map legacy border animation types to store AvatarBorderType
 */
export function getV2BorderType(animation: string): AvatarBorderType {
  const animationToV2: Record<string, AvatarBorderType> = {
    none: 'none',
    pulse: 'pulse',
    rotate: 'rotate',
    glow: 'glow',
    spark: 'electric',
    'gradient-rotate': 'rotate',
    flame: 'fire',
    fire: 'fire',
    shimmer: 'ice',
    drip: 'ice',
    particles: 'legendary',
    aurora: 'legendary',
    void: 'mythic',
    electric: 'electric',
  };
  return animationToV2[animation] || 'none';
}

/**
 * Legacy border ID to V2 type mapping for mock borders
 */
export const LEGACY_BORDER_ID_TO_V2_TYPE: Record<string, AvatarBorderType> = {
  b1: 'none',
  b2: 'none',
  b3: 'none',
  b4: 'none',
  b5: 'pulse',
  b6: 'rotate',
  b7: 'glow',
  b8: 'electric',
  b9: 'rotate',
  b10: 'fire',
  b11: 'ice',
  b12: 'glow',
  b13: 'fire',
  b14: 'legendary',
  b15: 'mythic',
  b16: 'fire',
  b17: 'mythic',
  b18: 'legendary',
};
