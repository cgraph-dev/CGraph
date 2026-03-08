/**
 * Border animation constants — shared across web and mobile.
 *
 * Defines the canonical 42-border catalogue with rarity tiers,
 * theme palettes, and Lottie playback configuration.
 *
 * @module animation-constants/borders
 */

/** Rarity tier for avatar borders */
export type BorderRarity = 'FREE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

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
  '8BIT':            ['#00ff41', '#ff00ff', '#00ffff', '#ffff00'],
  JAPANESE:          ['#e8105f', '#c0392b', '#1a1a2e', '#f0a500'],
  ANIME:             ['#ff6b9d', '#c44dff', '#44d4ff', '#fffb87'],
  CYBERPUNK:         ['#00f5ff', '#ff0055', '#7b2fff', '#1a0a2e'],
  GOTHIC:            ['#6b21a8', '#1e1e2e', '#dc143c', '#c0c0c0'],
  KAWAII:            ['#ffb3d9', '#b3ecff', '#ffe4b5', '#c8f7c5'],
  ELEMENTAL_FIRE:    ['#ff4500', '#ff8c00', '#ffd700'],
  ELEMENTAL_WATER:   ['#006994', '#00bfff', '#7fffd4'],
  ELEMENTAL_EARTH:   ['#3d2b1f', '#8b4513', '#228b22'],
  ELEMENTAL_AIR:     ['#e0f7ff', '#b0e0e6', '#ffffff'],
  COSMIC:            ['#0d0d2b', '#4b0082', '#7b2fff', '#c0f0ff', '#ffffff'],
} as const;

/** Outer glow radius per rarity */
export const BORDER_RARITY_GLOW_RADIUS: Record<BorderRarity, number> = {
  FREE: 0,
  COMMON: 0,
  RARE: 4,
  EPIC: 8,
  LEGENDARY: 14,
  MYTHIC: 22,
} as const;

/** Maximum concurrent animation layers per rarity */
export const BORDER_RARITY_MAX_ANIMATIONS: Record<BorderRarity, number> = {
  FREE: 0,
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHIC: 4,
} as const;

/** Lottie playback speed per rarity (0 = static, no Lottie) */
export const BORDER_RARITY_LOTTIE_SPEED: Record<BorderRarity, number> = {
  FREE: 0,
  COMMON: 0,
  RARE: 0.6,
  EPIC: 0.8,
  LEGENDARY: 1.0,
  MYTHIC: 1.3,
} as const;

/** Scale multiplier for the outer border container relative to avatar size */
export const BORDER_RARITY_SCALE: Record<BorderRarity, number> = {
  FREE: 1.0,
  COMMON: 1.0,
  RARE: 1.08,
  EPIC: 1.12,
  LEGENDARY: 1.2,
  MYTHIC: 1.28,
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
    rarity: 'FREE',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_free_01.json',
  },
  {
    id: 'border_kawaii_free_01',
    name: 'Pastel Circle',
    rarity: 'FREE',
    theme: 'KAWAII',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'kawaii_free_01.json',
  },
  {
    id: 'border_elemental_water_free_01',
    name: 'Calm Ripple',
    rarity: 'FREE',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_water_free_01.json',
  },
  {
    id: 'border_gothic_free_01',
    name: 'Iron Band',
    rarity: 'FREE',
    theme: 'GOTHIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'gothic_free_01.json',
  },

  // ─── COMMON (8) ─── static rings with subtle styling ───────────────
  {
    id: 'border_anime_common_01',
    name: 'Soft Glow',
    rarity: 'COMMON',
    theme: 'ANIME',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'anime_common_01.json',
  },
  {
    id: 'border_cyberpunk_common_01',
    name: 'Neon Trace',
    rarity: 'COMMON',
    theme: 'CYBERPUNK',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_common_01.json',
  },
  {
    id: 'border_japanese_common_01',
    name: 'Ink Stroke',
    rarity: 'COMMON',
    theme: 'JAPANESE',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'japanese_common_01.json',
  },
  {
    id: 'border_elemental_fire_common_01',
    name: 'Warm Ember',
    rarity: 'COMMON',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_common_01.json',
  },
  {
    id: 'border_elemental_earth_common_01',
    name: 'Moss Ring',
    rarity: 'COMMON',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_earth_common_01.json',
  },
  {
    id: 'border_elemental_air_common_01',
    name: 'Breeze Halo',
    rarity: 'COMMON',
    theme: 'ELEMENTAL_AIR',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_air_common_01.json',
  },
  {
    id: 'border_cosmic_common_01',
    name: 'Starlight Band',
    rarity: 'COMMON',
    theme: 'COSMIC',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cosmic_common_01.json',
  },
  {
    id: 'border_gothic_common_01',
    name: 'Silver Chain',
    rarity: 'COMMON',
    theme: 'GOTHIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'gothic_common_01.json',
  },

  // ─── RARE (10) ─── one animated property (slow rotation) ───────────
  {
    id: 'border_8bit_rare_01',
    name: 'Retro Spinner',
    rarity: 'RARE',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_rare_01.json',
  },
  {
    id: 'border_anime_rare_01',
    name: 'Sakura Drift',
    rarity: 'RARE',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'anime_rare_01.json',
  },
  {
    id: 'border_cyberpunk_rare_01',
    name: 'Circuit Loop',
    rarity: 'RARE',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_rare_01.json',
  },
  {
    id: 'border_japanese_rare_01',
    name: 'Torii Gate',
    rarity: 'RARE',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'japanese_rare_01.json',
  },
  {
    id: 'border_gothic_rare_01',
    name: 'Crimson Thorn',
    rarity: 'RARE',
    theme: 'GOTHIC',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'gothic_rare_01.json',
  },
  {
    id: 'border_kawaii_rare_01',
    name: 'Rainbow Ribbon',
    rarity: 'RARE',
    theme: 'KAWAII',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'kawaii_rare_01.json',
  },
  {
    id: 'border_elemental_fire_rare_01',
    name: 'Flame Wheel',
    rarity: 'RARE',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_rare_01.json',
  },
  {
    id: 'border_elemental_water_rare_01',
    name: 'Tide Ring',
    rarity: 'RARE',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_water_rare_01.json',
  },
  {
    id: 'border_elemental_earth_rare_01',
    name: 'Root Braid',
    rarity: 'RARE',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_earth_rare_01.json',
  },
  {
    id: 'border_cosmic_rare_01',
    name: 'Nebula Arc',
    rarity: 'RARE',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cosmic_rare_01.json',
  },

  // ─── EPIC (8) ─── rotation + shimmer sweep (two animations) ────────
  {
    id: 'border_8bit_epic_01',
    name: 'Glitch Frame',
    rarity: 'EPIC',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: '8bit_epic_01.json',
  },
  {
    id: 'border_anime_epic_01',
    name: 'Spirit Flame',
    rarity: 'EPIC',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'anime_epic_01.json',
  },
  {
    id: 'border_cyberpunk_epic_01',
    name: 'Holo Grid',
    rarity: 'EPIC',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'cyberpunk_epic_01.json',
  },
  {
    id: 'border_japanese_epic_01',
    name: 'Dragon Scale',
    rarity: 'EPIC',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'japanese_epic_01.json',
  },
  {
    id: 'border_kawaii_epic_01',
    name: 'Sugar Rush',
    rarity: 'EPIC',
    theme: 'KAWAII',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'kawaii_epic_01.json',
  },
  {
    id: 'border_elemental_fire_epic_01',
    name: 'Inferno Ring',
    rarity: 'EPIC',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'elemental_fire_epic_01.json',
  },
  {
    id: 'border_elemental_air_epic_01',
    name: 'Storm Vortex',
    rarity: 'EPIC',
    theme: 'ELEMENTAL_AIR',
    rotationDirection: 'cw',
    particleShape: 'none',
    lottieFile: 'elemental_air_epic_01.json',
  },
  {
    id: 'border_cosmic_epic_01',
    name: 'Void Gate',
    rarity: 'EPIC',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'none',
    lottieFile: 'cosmic_epic_01.json',
  },

  // ─── LEGENDARY (8) ─── rotation + glow + particles ─────────────────
  {
    id: 'border_8bit_legendary_01',
    name: 'Arcade Champion',
    rarity: 'LEGENDARY',
    theme: '8BIT',
    rotationDirection: 'cw',
    particleShape: 'orb',
    lottieFile: '8bit_legendary_01.json',
  },
  {
    id: 'border_anime_legendary_01',
    name: 'Super Saiyan',
    rarity: 'LEGENDARY',
    theme: 'ANIME',
    rotationDirection: 'ccw',
    particleShape: 'spark',
    lottieFile: 'anime_legendary_01.json',
  },
  {
    id: 'border_cyberpunk_legendary_01',
    name: 'Netrunner',
    rarity: 'LEGENDARY',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'diamond',
    lottieFile: 'cyberpunk_legendary_01.json',
  },
  {
    id: 'border_japanese_legendary_01',
    name: 'Shogun Crest',
    rarity: 'LEGENDARY',
    theme: 'JAPANESE',
    rotationDirection: 'ccw',
    particleShape: 'orb',
    lottieFile: 'japanese_legendary_01.json',
  },
  {
    id: 'border_gothic_legendary_01',
    name: 'Blood Moon',
    rarity: 'LEGENDARY',
    theme: 'GOTHIC',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'gothic_legendary_01.json',
  },
  {
    id: 'border_elemental_water_legendary_01',
    name: 'Maelstrom',
    rarity: 'LEGENDARY',
    theme: 'ELEMENTAL_WATER',
    rotationDirection: 'ccw',
    particleShape: 'orb',
    lottieFile: 'elemental_water_legendary_01.json',
  },
  {
    id: 'border_elemental_earth_legendary_01',
    name: 'World Tree',
    rarity: 'LEGENDARY',
    theme: 'ELEMENTAL_EARTH',
    rotationDirection: 'cw',
    particleShape: 'diamond',
    lottieFile: 'elemental_earth_legendary_01.json',
  },
  {
    id: 'border_cosmic_legendary_01',
    name: 'Supernova',
    rarity: 'LEGENDARY',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'spark',
    lottieFile: 'cosmic_legendary_01.json',
  },

  // ─── MYTHIC (4) ─── full particle + distortion + bloom ─────────────
  {
    id: 'border_cyberpunk_mythic_01',
    name: 'Digital Ascension',
    rarity: 'MYTHIC',
    theme: 'CYBERPUNK',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'cyberpunk_mythic_01.json',
  },
  {
    id: 'border_cosmic_mythic_01',
    name: 'Event Horizon',
    rarity: 'MYTHIC',
    theme: 'COSMIC',
    rotationDirection: 'ccw',
    particleShape: 'diamond',
    lottieFile: 'cosmic_mythic_01.json',
  },
  {
    id: 'border_elemental_fire_mythic_01',
    name: 'Phoenix Rebirth',
    rarity: 'MYTHIC',
    theme: 'ELEMENTAL_FIRE',
    rotationDirection: 'cw',
    particleShape: 'spark',
    lottieFile: 'elemental_fire_mythic_01.json',
  },
  {
    id: 'border_anime_mythic_01',
    name: 'Kami Mode',
    rarity: 'MYTHIC',
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
