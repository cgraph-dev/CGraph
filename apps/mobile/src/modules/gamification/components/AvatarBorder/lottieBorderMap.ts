/**
 * Lottie border asset map — maps border IDs to require() calls.
 *
 * Only RARE/EPIC/LEGENDARY/MYTHIC borders are included (they use LottieView).
 * FREE/COMMON borders use StaticRing and are excluded from this map.
 *
 * @module gamification/components/AvatarBorder/lottieBorderMap
 */

/* eslint-disable @typescript-eslint/no-require-imports */

/** Placeholder Lottie JSON used when a border's asset is not yet generated */
export const LOTTIE_BORDER_FALLBACK = require('../../../../assets/lottie/borders/placeholder.json');

/**
 * Map of border IDs → Lottie JSON require() calls.
 *
 * As Lottie JSON files are generated and placed into
 * apps/mobile/src/assets/lottie/borders/, add their require() entries here.
 *
 * The key matches `BorderRegistryEntry.id`, the value is a require() call.
 */
export const LOTTIE_BORDER_MAP: Record<string, unknown> = {
  // ─── FREE (4) ────────────────────────────────────────────────────────
  'border_8bit_free_01': require('../../../../assets/lottie/borders/8bit_free_01.json'),
  'border_kawaii_free_01': require('../../../../assets/lottie/borders/kawaii_free_01.json'),
  'border_elemental_water_free_01': require('../../../../assets/lottie/borders/elemental_water_free_01.json'),
  'border_gothic_free_01': require('../../../../assets/lottie/borders/gothic_free_01.json'),

  // ─── COMMON (8) ─────────────────────────────────────────────────────
  'border_anime_common_01': require('../../../../assets/lottie/borders/anime_common_01.json'),
  'border_cyberpunk_common_01': require('../../../../assets/lottie/borders/cyberpunk_common_01.json'),
  'border_japanese_common_01': require('../../../../assets/lottie/borders/japanese_common_01.json'),
  'border_elemental_fire_common_01': require('../../../../assets/lottie/borders/elemental_fire_common_01.json'),
  'border_elemental_earth_common_01': require('../../../../assets/lottie/borders/elemental_earth_common_01.json'),
  'border_elemental_air_common_01': require('../../../../assets/lottie/borders/elemental_air_common_01.json'),
  'border_cosmic_common_01': require('../../../../assets/lottie/borders/cosmic_common_01.json'),
  'border_gothic_common_01': require('../../../../assets/lottie/borders/gothic_common_01.json'),

  // ─── RARE (10) ──────────────────────────────────────────────────────
  'border_8bit_rare_01': require('../../../../assets/lottie/borders/8bit_rare_01.json'),
  'border_anime_rare_01': require('../../../../assets/lottie/borders/anime_rare_01.json'),
  'border_cyberpunk_rare_01': require('../../../../assets/lottie/borders/cyberpunk_rare_01.json'),
  'border_japanese_rare_01': require('../../../../assets/lottie/borders/japanese_rare_01.json'),
  'border_gothic_rare_01': require('../../../../assets/lottie/borders/gothic_rare_01.json'),
  'border_kawaii_rare_01': require('../../../../assets/lottie/borders/kawaii_rare_01.json'),
  'border_elemental_fire_rare_01': require('../../../../assets/lottie/borders/elemental_fire_rare_01.json'),
  'border_elemental_water_rare_01': require('../../../../assets/lottie/borders/elemental_water_rare_01.json'),
  'border_elemental_earth_rare_01': require('../../../../assets/lottie/borders/elemental_earth_rare_01.json'),
  'border_cosmic_rare_01': require('../../../../assets/lottie/borders/cosmic_rare_01.json'),

  // ─── EPIC (8) ───────────────────────────────────────────────────────
  'border_8bit_epic_01': require('../../../../assets/lottie/borders/8bit_epic_01.json'),
  'border_anime_epic_01': require('../../../../assets/lottie/borders/anime_epic_01.json'),
  'border_cyberpunk_epic_01': require('../../../../assets/lottie/borders/cyberpunk_epic_01.json'),
  'border_japanese_epic_01': require('../../../../assets/lottie/borders/japanese_epic_01.json'),
  'border_kawaii_epic_01': require('../../../../assets/lottie/borders/kawaii_epic_01.json'),
  'border_elemental_fire_epic_01': require('../../../../assets/lottie/borders/elemental_fire_epic_01.json'),
  'border_elemental_air_epic_01': require('../../../../assets/lottie/borders/elemental_air_epic_01.json'),
  'border_cosmic_epic_01': require('../../../../assets/lottie/borders/cosmic_epic_01.json'),

  // ─── LEGENDARY (8) ─────────────────────────────────────────────────
  'border_8bit_legendary_01': require('../../../../assets/lottie/borders/8bit_legendary_01.json'),
  'border_anime_legendary_01': require('../../../../assets/lottie/borders/anime_legendary_01.json'),
  'border_cyberpunk_legendary_01': require('../../../../assets/lottie/borders/cyberpunk_legendary_01.json'),
  'border_japanese_legendary_01': require('../../../../assets/lottie/borders/japanese_legendary_01.json'),
  'border_gothic_legendary_01': require('../../../../assets/lottie/borders/gothic_legendary_01.json'),
  'border_elemental_water_legendary_01': require('../../../../assets/lottie/borders/elemental_water_legendary_01.json'),
  'border_elemental_earth_legendary_01': require('../../../../assets/lottie/borders/elemental_earth_legendary_01.json'),
  'border_cosmic_legendary_01': require('../../../../assets/lottie/borders/cosmic_legendary_01.json'),

  // ─── MYTHIC (4) ────────────────────────────────────────────────────
  'border_cyberpunk_mythic_01': require('../../../../assets/lottie/borders/cyberpunk_mythic_01.json'),
  'border_cosmic_mythic_01': require('../../../../assets/lottie/borders/cosmic_mythic_01.json'),
  'border_elemental_fire_mythic_01': require('../../../../assets/lottie/borders/elemental_fire_mythic_01.json'),
  'border_anime_mythic_01': require('../../../../assets/lottie/borders/anime_mythic_01.json'),
};

/**
 * Resolve a border ID to its Lottie source.
 * Falls back to the placeholder if the asset isn't available yet.
 */
export function getLottieBorderSource(borderId: string): unknown {
  return LOTTIE_BORDER_MAP[borderId] ?? LOTTIE_BORDER_FALLBACK;
}
