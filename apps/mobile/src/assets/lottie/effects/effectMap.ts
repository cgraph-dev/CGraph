/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Profile Effect Lottie asset map.
 *
 * Maps profile effect IDs to their Lottie JSON require() calls.
 * All entries point to placeholder.json until real assets are created.
 *
 * @module assets/lottie/effects/effectMap
 */

const placeholder = require('./placeholder.json');

/**
 * Maps effect IDs → Lottie JSON source.
 *
 * When real assets are ready, replace each `placeholder` with:
 *   require('./effect_sparkle.json')
 */
export const PROFILE_EFFECT_ASSET_MAP: Record<string, unknown> = {
  // COMMON
  effect_sparkle: placeholder,
  effect_autumn: placeholder,

  // RARE
  effect_snow: placeholder,
  effect_fireflies: placeholder,
  effect_sakura_petals: placeholder,

  // EPIC
  effect_magician: placeholder,
  effect_neon_rain: placeholder,
  effect_galaxy_drift: placeholder,

  // LEGENDARY
  effect_fire_vortex: placeholder,
  effect_divine_light: placeholder,
  effect_void_rift: placeholder,
};

/** Fallback source for missing effects */
export const PROFILE_EFFECT_FALLBACK = placeholder;

/**
 * Resolve a Lottie source for a given effect ID.
 * Returns undefined for 'effect_none' or unknown IDs.
 */
export function getProfileEffectSource(effectId: string | null): unknown | undefined {
  if (!effectId || effectId === 'effect_none') return undefined;
  return PROFILE_EFFECT_ASSET_MAP[effectId] ?? PROFILE_EFFECT_FALLBACK;
}
