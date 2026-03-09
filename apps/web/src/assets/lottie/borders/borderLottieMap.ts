/**
 * Border Lottie Animation Map
 *
 * Maps theme+rarity combinations to their Lottie animation JSON URLs
 * served from the public directory. Loaded on-demand, not bundled.
 */

const BASE = '/lottie/borders';

/**
 * Lookup key: `${theme}_${rarity}`
 * Returns the public URL for that Lottie JSON file.
 */
export const BORDER_LOTTIE_MAP: Record<string, string> = {
  // 8-Bit
  '8bit_free': `${BASE}/8bit_free_01.json`,
  '8bit_rare': `${BASE}/8bit_rare_01.json`,
  '8bit_epic': `${BASE}/8bit_epic_01.json`,
  '8bit_legendary': `${BASE}/8bit_legendary_01.json`,

  // Anime
  anime_common: `${BASE}/anime_common_01.json`,
  anime_rare: `${BASE}/anime_rare_01.json`,
  anime_epic: `${BASE}/anime_epic_01.json`,
  anime_legendary: `${BASE}/anime_legendary_01.json`,
  anime_mythic: `${BASE}/anime_mythic_01.json`,

  // Cosmic
  cosmic_common: `${BASE}/cosmic_common_01.json`,
  cosmic_rare: `${BASE}/cosmic_rare_01.json`,
  cosmic_epic: `${BASE}/cosmic_epic_01.json`,
  cosmic_legendary: `${BASE}/cosmic_legendary_01.json`,
  cosmic_mythic: `${BASE}/cosmic_mythic_01.json`,

  // Cyberpunk
  cyberpunk_common: `${BASE}/cyberpunk_common_01.json`,
  cyberpunk_rare: `${BASE}/cyberpunk_rare_01.json`,
  cyberpunk_epic: `${BASE}/cyberpunk_epic_01.json`,
  cyberpunk_legendary: `${BASE}/cyberpunk_legendary_01.json`,
  cyberpunk_mythic: `${BASE}/cyberpunk_mythic_01.json`,

  // Elemental (sub-element fallbacks)
  elemental_free: `${BASE}/elemental_water_free_01.json`,
  elemental_common: `${BASE}/elemental_air_common_01.json`,
  elemental_rare: `${BASE}/elemental_earth_rare_01.json`,
  elemental_epic: `${BASE}/elemental_air_epic_01.json`,
  elemental_legendary: `${BASE}/elemental_earth_legendary_01.json`,
  elemental_mythic: `${BASE}/elemental_fire_mythic_01.json`,

  // Gothic
  gothic_free: `${BASE}/gothic_free_01.json`,
  gothic_common: `${BASE}/gothic_common_01.json`,
  gothic_rare: `${BASE}/gothic_rare_01.json`,
  gothic_legendary: `${BASE}/gothic_legendary_01.json`,

  // Japanese
  japanese_common: `${BASE}/japanese_common_01.json`,
  japanese_rare: `${BASE}/japanese_rare_01.json`,
  japanese_epic: `${BASE}/japanese_epic_01.json`,
  japanese_legendary: `${BASE}/japanese_legendary_01.json`,

  // Kawaii
  kawaii_free: `${BASE}/kawaii_free_01.json`,
  kawaii_rare: `${BASE}/kawaii_rare_01.json`,
  kawaii_epic: `${BASE}/kawaii_epic_01.json`,

  // General / fallback
  avatar_frame: `${BASE}/avatar-frame.json`,
  profile_frame: `${BASE}/profile-frame.json`,
  // Special
  special_legendary: `${BASE}/avatar-frame.json`,
  special_epic: `${BASE}/profile-frame.json`,
};

/**
 * Get the Lottie URL for a border by its theme and rarity.
 * Returns undefined if no dedicated Lottie animation exists for this combo.
 */
export function getBorderLottieUrl(theme: string, rarity: string): string | undefined {
  return BORDER_LOTTIE_MAP[`${theme}_${rarity}`];
}
