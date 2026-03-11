/**
 * Border animation constants — shared across web and mobile.
 *
 * Defines the canonical 42-border catalogue with rarity tiers,
 * theme palettes, and Lottie playback configuration.
 *
 * @module animation-constants/borders
 */

/** Rarity tier for avatar borders */
export type BorderRarity =
  | 'free'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

/** Visual theme for avatar borders */
export type BorderTheme =
  | '8BIT'
  | 'JAPANESE'
  | 'ANIME'
  | 'CYBERPUNK'
  | 'GOTHIC'
  | 'KAWAII'
  | 'ELEMENTAL_FIRE'
  | 'ELEMENTAL_WATER'
  | 'ELEMENTAL_EARTH'
  | 'ELEMENTAL_AIR'
  | 'COSMIC';

/** Fixed hex color arrays per theme */
export const BORDER_THEME_PALETTES: Record<BorderTheme, readonly string[]> = {
  '8BIT': ['#00ff41', '#ff00ff', '#00ffff', '#ffff00'],
  JAPANESE: ['#e8105f', '#c0392b', '#1a1a2e', '#f0a500'],
  ANIME: ['#ff6b9d', '#c44dff', '#44d4ff', '#fffb87'],
  CYBERPUNK: ['#00f5ff', '#ff0055', '#7b2fff', '#1a0a2e'],
  GOTHIC: ['#6b21a8', '#1e1e2e', '#dc143c', '#c0c0c0'],
  KAWAII: ['#ffb3d9', '#b3ecff', '#ffe4b5', '#c8f7c5'],
  ELEMENTAL_FIRE: ['#ff4500', '#ff8c00', '#ffd700'],
  ELEMENTAL_WATER: ['#006994', '#00bfff', '#7fffd4'],
  ELEMENTAL_EARTH: ['#3d2b1f', '#8b4513', '#228b22'],
  ELEMENTAL_AIR: ['#e0f7ff', '#b0e0e6', '#ffffff'],
  COSMIC: ['#0d0d2b', '#4b0082', '#7b2fff', '#c0f0ff', '#ffffff'],
} as const;

/** Outer glow radius per rarity */
export const BORDER_RARITY_GLOW_RADIUS: Record<BorderRarity, number> = {
  free: 0,
  common: 0,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 14,
  mythic: 22,
} as const;

/** Maximum concurrent animation layers per rarity */
export const BORDER_RARITY_MAX_ANIMATIONS: Record<BorderRarity, number> = {
  free: 0,
  common: 0,
  uncommon: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
} as const;

/** Lottie playback speed per rarity (0 = static, no Lottie) */
export const BORDER_RARITY_LOTTIE_SPEED: Record<BorderRarity, number> = {
  free: 0,
  common: 0,
  uncommon: 0,
  rare: 0.6,
  epic: 0.8,
  legendary: 1.0,
  mythic: 1.3,
} as const;

/** Scale multiplier for the outer border container relative to avatar size */
export const BORDER_RARITY_SCALE: Record<BorderRarity, number> = {
  free: 1.0,
  common: 1.0,
  uncommon: 1.04,
  rare: 1.08,
  epic: 1.12,
  legendary: 1.2,
  mythic: 1.28,
} as const;

/** Particle shape used by border overlay effects */
export type BorderParticleShape = 'orb' | 'spark' | 'diamond' | 'none';

/** Rotation direction for animated borders */
export type BorderRotationDirection = 'cw' | 'ccw';

/** A single entry in the canonical border registry */
export interface BorderRegistryEntry {
  /** Unique ID, e.g. 'border_cosmic_legendary_01' */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Rarity tier */
  readonly rarity: BorderRarity;
  /** Visual theme */
  readonly theme: BorderTheme;
  /** Rotation direction (alternates within tier) */
  readonly rotationDirection: BorderRotationDirection;
  /** Particle shape — only LEGENDARY/MYTHIC have particles */
  readonly particleShape: BorderParticleShape;
  /** Lottie JSON filename (no path) */
  readonly lottieFile: string;
}

/**
 * The canonical 42-border registry.
 *
 * Distribution:
 *   FREE:      4  (one per core theme color family — static)
 *   COMMON:    8  (varied themes, subtle — static)
 *   RARE:     10  (diverse themes, one animated property)
 *   EPIC:      8  (strong themes, two animated properties)
 *   LEGENDARY: 8  (premium, three + particles)
 *   MYTHIC:    4  (maximum, full particle + distortion)
 *
 * Themes spread evenly: 8BIT, JAPANESE, ANIME, CYBERPUNK, GOTHIC,
 * KAWAII, ELEMENTAL_FIRE, ELEMENTAL_WATER, ELEMENTAL_EARTH,
 * ELEMENTAL_AIR, COSMIC — no theme dominates.
 */
export const BORDER_REGISTRY: readonly BorderRegistryEntry[] = [
  // ─── FREE (4) ─── static rings, no animation ───────────────────────
  {
    id: 'border_8bit_free_01',
    name: 'Pixel Ring',
    rarity: 'free',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_free_01.json',
  },
  {
    id: 'border_kawaii_free_01',
    name: 'Pastel Circle',
    rarity: 'free',
    theme: 'KAWAII',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'kawaii_free_01.json',
  },
  {
    id: 'border_elemental_water_free_01',
    name: 'Calm Ripple',
    rarity: 'free',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_water_free_01.json',
  },
  {
    id: 'border_gothic_free_01',
    name: 'Iron Band',
    rarity: 'free',
    theme: 'GOTHIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'gothic_free_01.json',
  },

  // ─── COMMON (8) ─── static rings with subtle styling ───────────────
  {
    id: 'border_anime_common_01',
    name: 'Soft Glow',
    rarity: 'common',
    theme: 'ANIME',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'anime_common_01.json',
  },
  {
    id: 'border_cyberpunk_common_01',
    name: 'Neon Trace',
    rarity: 'common',
    theme: 'CYBERPUNK',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_common_01.json',
  },
  {
    id: 'border_japanese_common_01',
    name: 'Ink Stroke',
    rarity: 'common',
    theme: 'JAPANESE',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'japanese_common_01.json',
  },
  {
    id: 'border_elemental_fire_common_01',
    name: 'Warm Ember',
    rarity: 'common',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_common_01.json',
  },
  {
    id: 'border_elemental_earth_common_01',
    name: 'Moss Ring',
    rarity: 'common',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_earth_common_01.json',
  },
  {
    id: 'border_elemental_air_common_01',
    name: 'Breeze Halo',
    rarity: 'common',
    theme: 'ELEMENTAL_AIR',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_air_common_01.json',
  },
  {
    id: 'border_cosmic_common_01',
    name: 'Starlight Band',
    rarity: 'common',
    theme: 'COSMIC',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cosmic_common_01.json',
  },
  {
    id: 'border_gothic_common_01',
    name: 'Silver Chain',
    rarity: 'common',
    theme: 'GOTHIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'gothic_common_01.json',
  },

  // ─── RARE (10) ─── one animated property (slow rotation) ───────────
  {
    id: 'border_8bit_rare_01',
    name: 'Retro Spinner',
    rarity: 'rare',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_rare_01.json',
  },
  {
    id: 'border_anime_rare_01',
    name: 'Sakura Drift',
    rarity: 'rare',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'anime_rare_01.json',
  },
  {
    id: 'border_cyberpunk_rare_01',
    name: 'Circuit Loop',
    rarity: 'rare',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_rare_01.json',
  },
  {
    id: 'border_japanese_rare_01',
    name: 'Torii Gate',
    rarity: 'rare',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'japanese_rare_01.json',
  },
  {
    id: 'border_gothic_rare_01',
    name: 'Crimson Thorn',
    rarity: 'rare',
    theme: 'GOTHIC',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'gothic_rare_01.json',
  },
  {
    id: 'border_kawaii_rare_01',
    name: 'Rainbow Ribbon',
    rarity: 'rare',
    theme: 'KAWAII',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'kawaii_rare_01.json',
  },
  {
    id: 'border_elemental_fire_rare_01',
    name: 'Flame Wheel',
    rarity: 'rare',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_rare_01.json',
  },
  {
    id: 'border_elemental_water_rare_01',
    name: 'Tide Ring',
    rarity: 'rare',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_water_rare_01.json',
  },
  {
    id: 'border_elemental_earth_rare_01',
    name: 'Root Braid',
    rarity: 'rare',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_earth_rare_01.json',
  },
  {
    id: 'border_cosmic_rare_01',
    name: 'Nebula Arc',
    rarity: 'rare',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cosmic_rare_01.json',
  },

  // ─── EPIC (8) ─── rotation + shimmer sweep (two animations) ────────
  {
    id: 'border_8bit_epic_01',
    name: 'Glitch Frame',
    rarity: 'epic',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_epic_01.json',
  },
  {
    id: 'border_anime_epic_01',
    name: 'Spirit Flame',
    rarity: 'epic',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'anime_epic_01.json',
  },
  {
    id: 'border_cyberpunk_epic_01',
    name: 'Holo Grid',
    rarity: 'epic',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_epic_01.json',
  },
  {
    id: 'border_japanese_epic_01',
    name: 'Dragon Scale',
    rarity: 'epic',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'japanese_epic_01.json',
  },
  {
    id: 'border_kawaii_epic_01',
    name: 'Sugar Rush',
    rarity: 'epic',
    theme: 'KAWAII',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'kawaii_epic_01.json',
  },
  {
    id: 'border_elemental_fire_epic_01',
    name: 'Inferno Ring',
    rarity: 'epic',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_epic_01.json',
  },
  {
    id: 'border_elemental_air_epic_01',
    name: 'Storm Vortex',
    rarity: 'epic',
    theme: 'ELEMENTAL_AIR',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_air_epic_01.json',
  },
  {
    id: 'border_cosmic_epic_01',
    name: 'Void Gate',
    rarity: 'epic',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cosmic_epic_01.json',
  },

  // ─── LEGENDARY (8) ─── rotation + glow + particles ─────────────────
  {
    id: 'border_8bit_legendary_01',
    name: 'Arcade Champion',
    rarity: 'legendary',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'orb',
    lottieFile: '8bit_legendary_01.json',
  },
  {
    id: 'border_anime_legendary_01',
    name: 'Super Saiyan',
    rarity: 'legendary',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'spark',
    lottieFile: 'anime_legendary_01.json',
  },
  {
    id: 'border_cyberpunk_legendary_01',
    name: 'Netrunner',
    rarity: 'legendary',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'diamond',
    lottieFile: 'cyberpunk_legendary_01.json',
  },
  {
    id: 'border_japanese_legendary_01',
    name: 'Shogun Crest',
    rarity: 'legendary',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'orb',
    lottieFile: 'japanese_legendary_01.json',
  },
  {
    id: 'border_gothic_legendary_01',
    name: 'Blood Moon',
    rarity: 'legendary',
    theme: 'GOTHIC',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'gothic_legendary_01.json',
  },
  {
    id: 'border_elemental_water_legendary_01',
    name: 'Maelstrom',
    rarity: 'legendary',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'ccw',
    particleShape: 'orb',
    lottieFile: 'elemental_water_legendary_01.json',
  },
  {
    id: 'border_elemental_earth_legendary_01',
    name: 'World Tree',
    rarity: 'legendary',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'diamond',
    lottieFile: 'elemental_earth_legendary_01.json',
  },
  {
    id: 'border_cosmic_legendary_01',
    name: 'Supernova',
    rarity: 'legendary',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'spark',
    lottieFile: 'cosmic_legendary_01.json',
  },

  // ─── MYTHIC (4) ─── full particle + distortion + bloom ─────────────
  {
    id: 'border_cyberpunk_mythic_01',
    name: 'Digital Ascension',
    rarity: 'mythic',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'cyberpunk_mythic_01.json',
  },
  {
    id: 'border_cosmic_mythic_01',
    name: 'Event Horizon',
    rarity: 'mythic',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'diamond',
    lottieFile: 'cosmic_mythic_01.json',
  },
  {
    id: 'border_elemental_fire_mythic_01',
    name: 'Phoenix Rebirth',
    rarity: 'mythic',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'elemental_fire_mythic_01.json',
  },
  {
    id: 'border_anime_mythic_01',
    name: 'Kami Mode',
    rarity: 'mythic',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'diamond',
    lottieFile: 'anime_mythic_01.json',
  },
] as const;

/** Get a border entry by ID */
export function getBorderById(id: string): BorderRegistryEntry | undefined {
  return BORDER_REGISTRY.find((b) => b.id === id);
}

/** Get all borders of a given rarity */
export function getBordersByRarity(rarity: BorderRarity): readonly BorderRegistryEntry[] {
  return BORDER_REGISTRY.filter((b) => b.rarity === rarity);
}

/** Get all borders of a given theme */
export function getBordersByTheme(theme: BorderTheme): readonly BorderRegistryEntry[] {
  return BORDER_REGISTRY.filter((b) => b.theme === theme);
}

/** Whether a rarity uses Lottie animation (RARE and above) */
export function isAnimatedRarity(rarity: BorderRarity): boolean {
  return BORDER_RARITY_LOTTIE_SPEED[rarity] > 0;
}
