/**
 * Profile Effect Registry — shared across web and mobile.
 *
 * Defines the canonical catalogue of profile background effects
 * with rarity tiers and Lottie file references.
 *
 * @module animation-constants/registries/profileEffects
 */

/** Rarity tiers matching the border system */
export type ProfileEffectRarity =
  | 'free'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

/** A single profile effect entry */
export interface ProfileEffectEntry {
  /** Unique effect ID */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Rarity tier */
  readonly rarity: ProfileEffectRarity;
  /** Whether the effect is free (always unlocked) */
  readonly free: boolean;
  /** Lottie JSON filename (null = no effect) */
  readonly lottieFile: string | null;
  /** Short description shown in the picker */
  readonly description: string;
}

/**
 * Canonical registry of all 12 profile effects.
 *
 * Designed to accept unlimited items later —
 * simply append new entries to the array.
 */
export const PROFILE_EFFECT_REGISTRY: readonly ProfileEffectEntry[] = [
  {
    id: 'effect_none',
    name: 'None',
    rarity: 'free',
    free: true,
    lottieFile: null,
    description: 'No effect',
  },
  {
    id: 'effect_sparkle',
    name: 'Sparkle',
    rarity: 'common',
    free: false,
    lottieFile: 'effect_sparkle.json',
    description: 'Gentle floating sparkles',
  },
  {
    id: 'effect_autumn',
    name: 'Autumn Leaves',
    rarity: 'common',
    free: false,
    lottieFile: 'effect_autumn.json',
    description: 'Drifting autumn leaves',
  },
  {
    id: 'effect_snow',
    name: 'Snowfall',
    rarity: 'rare',
    free: false,
    lottieFile: 'effect_snow.json',
    description: 'Soft snowflakes falling',
  },
  {
    id: 'effect_fireflies',
    name: 'Fireflies',
    rarity: 'rare',
    free: false,
    lottieFile: 'effect_fireflies.json',
    description: 'Glowing fireflies drifting',
  },
  {
    id: 'effect_sakura_petals',
    name: 'Sakura Drift',
    rarity: 'rare',
    free: false,
    lottieFile: 'effect_sakura.json',
    description: 'Cherry blossom petals',
  },
  {
    id: 'effect_magician',
    name: 'The Magician',
    rarity: 'epic',
    free: false,
    lottieFile: 'effect_magician.json',
    description: 'Arcane energy and spell circles',
  },
  {
    id: 'effect_neon_rain',
    name: 'Neon Rain',
    rarity: 'epic',
    free: false,
    lottieFile: 'effect_neon_rain.json',
    description: 'Cyberpunk neon drip',
  },
  {
    id: 'effect_galaxy_drift',
    name: 'Galaxy Drift',
    rarity: 'epic',
    free: false,
    lottieFile: 'effect_galaxy.json',
    description: 'Stars and nebula swirling',
  },
  {
    id: 'effect_fire_vortex',
    name: 'Fire Vortex',
    rarity: 'legendary',
    free: false,
    lottieFile: 'effect_fire_vortex.json',
    description: 'Raging flame tornado',
  },
  {
    id: 'effect_divine_light',
    name: 'Divine Light',
    rarity: 'legendary',
    free: false,
    lottieFile: 'effect_divine.json',
    description: 'Heavenly rays and orbs',
  },
  {
    id: 'effect_void_rift',
    name: 'Void Rift',
    rarity: 'legendary',
    free: false,
    lottieFile: 'effect_void_rift.json',
    description: 'Dark dimensional tear',
  },
] as const;

/** Look up a profile effect by ID */
export function getProfileEffectById(id: string): ProfileEffectEntry | undefined {
  return PROFILE_EFFECT_REGISTRY.find((e) => e.id === id);
}

/** Get all free profile effects */
export function getFreeProfileEffects(): ProfileEffectEntry[] {
  return PROFILE_EFFECT_REGISTRY.filter((e) => e.free);
}

/** Get profile effects by rarity */
export function getProfileEffectsByRarity(rarity: ProfileEffectRarity): ProfileEffectEntry[] {
  return PROFILE_EFFECT_REGISTRY.filter((e) => e.rarity === rarity);
}
