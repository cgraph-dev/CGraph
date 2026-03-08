/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Nameplate Lottie asset map.
 *
 * Maps nameplate IDs to their Lottie JSON require() calls.
 * All entries point to placeholder.json until real assets are created.
 *
 * @module assets/lottie/nameplates/nameplateMap
 */

const placeholder = require('./placeholder.json');

/**
 * Maps nameplate IDs → Lottie JSON source.
 *
 * When real assets are ready, replace each `placeholder` with:
 *   require('./plate_gold.json')
 */
export const NAMEPLATE_LOTTIE_MAP: Record<string, unknown> = {
  // FREE
  plate_simple_dark: placeholder,

  // COMMON
  plate_gold_shimmer: placeholder,
  plate_sakura: placeholder,

  // RARE
  plate_cyber_bar: placeholder,
  plate_fire: placeholder,
  plate_galaxy: placeholder,

  // EPIC
  plate_hearts: placeholder,
  plate_void: placeholder,

  // LEGENDARY
  plate_divine: placeholder,
};

/** Fallback source for missing nameplates */
export const NAMEPLATE_FALLBACK = placeholder;

/**
 * Resolve a Lottie source for a given nameplate ID.
 * Returns undefined for 'plate_none' or unknown IDs.
 */
export function getNameplateLottieSource(nameplateId: string | null): unknown | undefined {
  if (!nameplateId || nameplateId === 'plate_none') return undefined;
  return NAMEPLATE_LOTTIE_MAP[nameplateId] ?? NAMEPLATE_FALLBACK;
}
