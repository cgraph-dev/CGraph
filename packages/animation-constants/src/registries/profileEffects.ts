/**
 * Profile Effect Registry — shared across web and mobile.
 *
 * Defines the canonical catalogue of profile background effects
 * with rarity tiers and Lottie file references.
 *
 * @module animation-constants/registries/profileEffects
 */

/** Rarity tiers matching the border system */
export type ProfileEffectRarity = 'FREE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL';

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
    rarity: 'FREE',
    free: true,
    lottieFile: null,
    description: 'No effect',
  },
  {
    id: 'effect_sparkle',
    name: 'Sparkle',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'effect_sparkle.json',
    description: 'Gentle floating sparkles',
  },
  {
    id: 'effect_autumn',
    name: 'Autumn Leaves',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'effect_autumn.json',
    description: 'Drifting autumn leaves',
  },
  {
    id: 'effect_snow',
    name: 'Snowfall',
    rarity: 'RARE',
    free: false,
    lottieFile: 'effect_snow.json',
    description: 'Soft snowflakes falling',
  },
  {
    id: 'effect_fireflies',
    name: 'Fireflies',
    rarity: 'RARE',
    free: false,
    lottieFile: 'effect_fireflies.json',
    description: 'Glowing fireflies drifting',
  },
  {
    id: 'effect_sakura_petals',
    name: 'Sakura Drift',
    rarity: 'RARE',
    free: false,
    lottieFile: 'effect_sakura.json',
    description: 'Cherry blossom petals',
  },
  {
    id: 'effect_magician',
    name: 'The Magician',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'effect_magician.json',
    description: 'Arcane energy and spell circles',
  },
  {
    id: 'effect_neon_rain',
    name: 'Neon Rain',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'effect_neon_rain.json',
    description: 'Cyberpunk neon drip',
  },
  {
    id: 'effect_galaxy_drift',
    name: 'Galaxy Drift',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'effect_galaxy.json',
    description: 'Stars and nebula swirling',
  },
  {
    id: 'effect_fire_vortex',
    name: 'Fire Vortex',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'effect_fire_vortex.json',
    description: 'Raging flame tornado',
  },
  {
    id: 'effect_divine_light',
    name: 'Divine Light',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'effect_divine.json',
    description: 'Heavenly rays and orbs',
  },
  {
    id: 'effect_void_rift',
    name: 'Void Rift',
    rarity: 'LEGENDARY',
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
