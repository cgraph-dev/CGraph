/**
 * Nameplate Registry — shared across web and mobile.
 *
 * Defines the canonical catalogue of decorative username nameplates
 * with rarity tiers, Lottie file references, text effects, emblems,
 * and particle overlays. Inspired by Naraka Bladepoint nameplate system.
 *
 * Nameplates render as a horizontal bar (300×48px canvas) behind the
 * username text and are shown across multiple UI surfaces:
 * - Friend list entries
 * - Group/channel member lists
 * - Forum member cards
 * - Online user panels
 * - Profile cards
 * - Chat message headers (optional)
 *
 * @module animation-constants/registries/nameplates
 */

/** Rarity tiers matching the global system */
export type NameplateRarity = 'FREE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL';

/** Text effect applied to the username on this nameplate */
export type NameplateTextEffect =
  | 'none'
  | 'glow'
  | 'metallic'
  | 'holographic'
  | 'fire'
  | 'ice'
  | 'neon'
  | 'glitch'
  | 'rainbow'
  | 'shadow'
  | 'emboss';

/** Particle overlay type rendered on top of the nameplate bar */
export type NameplateParticleType =
  | 'none'
  | 'sparkles'
  | 'flames'
  | 'snowflakes'
  | 'petals'
  | 'lightning'
  | 'bubbles'
  | 'stars'
  | 'embers'
  | 'mist';

/** Border style around the nameplate bar */
export type NameplateBorderStyle =
  | 'none'
  | 'solid'
  | 'gradient'
  | 'animated'
  | 'double'
  | 'glow';

/** A single nameplate entry */
export interface NameplateEntry {
  /** Unique nameplate ID */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Rarity tier */
  readonly rarity: NameplateRarity;
  /** Whether the nameplate is always unlocked */
  readonly free: boolean;
  /** Lottie JSON filename (null = no background, plain text) */
  readonly lottieFile: string | null;
  /** Text color to use on top of this nameplate background */
  readonly textColor: string;
  /** Short description shown in the picker */
  readonly description: string;
  /** Text effect applied to username text (glow, metallic, etc.) */
  readonly textEffect: NameplateTextEffect;
  /** Optional secondary/gradient text color for metallic/rainbow effects */
  readonly textColorSecondary: string | null;
  /** Emblem icon shown before the username (emoji or icon key) */
  readonly emblem: string | null;
  /** Particle overlay on the nameplate bar */
  readonly particleType: NameplateParticleType;
  /** Gradient colors for the bar background (used when no lottie) */
  readonly barGradient: readonly [string, string] | null;
  /** Border style around the nameplate */
  readonly borderStyle: NameplateBorderStyle;
  /** Border color (can be gradient start color) */
  readonly borderColor: string | null;
  /** Category/theme tag for filtering */
  readonly category: string;
}

/**
 * Canonical registry of all nameplates.
 *
 * Designed to accept unlimited items later —
 * simply append new entries to the array.
 */
export const NAMEPLATE_REGISTRY: readonly NameplateEntry[] = [
  // ─── FREE ──────────────────────────────────────────
  {
    id: 'plate_none',
    name: 'None',
    rarity: 'FREE',
    free: true,
    lottieFile: null,
    textColor: '#ffffff',
    description: 'Plain text, no background',
    textEffect: 'none',
    textColorSecondary: null,
    emblem: null,
    particleType: 'none',
    barGradient: null,
    borderStyle: 'none',
    borderColor: null,
    category: 'basic',
  },
  {
    id: 'plate_simple_dark',
    name: 'Shadow',
    rarity: 'FREE',
    free: true,
    lottieFile: 'plate_shadow.json',
    textColor: '#ffffff',
    description: 'Dark translucent bar with subtle shadow',
    textEffect: 'shadow',
    textColorSecondary: null,
    emblem: null,
    particleType: 'none',
    barGradient: ['#1a1a2e', '#16213e'],
    borderStyle: 'solid',
    borderColor: '#ffffff20',
    category: 'basic',
  },
  {
    id: 'plate_starter',
    name: 'Starter',
    rarity: 'FREE',
    free: true,
    lottieFile: null,
    textColor: '#e2e8f0',
    description: 'Minimal frosted glass bar',
    textEffect: 'none',
    textColorSecondary: null,
    emblem: null,
    particleType: 'none',
    barGradient: ['#334155', '#1e293b'],
    borderStyle: 'solid',
    borderColor: '#475569',
    category: 'basic',
  },
  // ─── COMMON ────────────────────────────────────────
  {
    id: 'plate_gold_shimmer',
    name: 'Gold',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_gold.json',
    textColor: '#1a1a1a',
    description: 'Shimmering gold gradient bar',
    textEffect: 'metallic',
    textColorSecondary: '#b8860b',
    emblem: '✦',
    particleType: 'sparkles',
    barGradient: ['#ffd700', '#b8860b'],
    borderStyle: 'gradient',
    borderColor: '#ffd700',
    category: 'metallic',
  },
  {
    id: 'plate_sakura',
    name: 'Sakura',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_sakura.json',
    textColor: '#4a0020',
    description: 'Cherry blossom petals drifting across',
    textEffect: 'glow',
    textColorSecondary: '#ff69b4',
    emblem: '🌸',
    particleType: 'petals',
    barGradient: ['#ffb7c5', '#ff69b4'],
    borderStyle: 'solid',
    borderColor: '#ff69b440',
    category: 'nature',
  },
  {
    id: 'plate_ocean_wave',
    name: 'Ocean Wave',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_ocean.json',
    textColor: '#ffffff',
    description: 'Gentle ocean waves rolling across',
    textEffect: 'glow',
    textColorSecondary: '#00bfff',
    emblem: '🌊',
    particleType: 'bubbles',
    barGradient: ['#006994', '#00bfff'],
    borderStyle: 'solid',
    borderColor: '#00bfff30',
    category: 'nature',
  },
  {
    id: 'plate_silver',
    name: 'Silver',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_silver.json',
    textColor: '#1a1a2e',
    description: 'Polished silver with subtle reflections',
    textEffect: 'metallic',
    textColorSecondary: '#c0c0c0',
    emblem: '◆',
    particleType: 'sparkles',
    barGradient: ['#c0c0c0', '#808080'],
    borderStyle: 'gradient',
    borderColor: '#c0c0c0',
    category: 'metallic',
  },
  // ─── RARE ──────────────────────────────────────────
  {
    id: 'plate_cyber_bar',
    name: 'Cyber Bar',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_cyber.json',
    textColor: '#00f5ff',
    description: 'Neon circuit-traced bar with data streams',
    textEffect: 'neon',
    textColorSecondary: '#ff00ff',
    emblem: '⚡',
    particleType: 'lightning',
    barGradient: ['#0a0a2e', '#1a0033'],
    borderStyle: 'animated',
    borderColor: '#00f5ff',
    category: 'cyberpunk',
  },
  {
    id: 'plate_fire',
    name: 'Flame',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_fire.json',
    textColor: '#ffffff',
    description: 'Flickering flame bar with ember particles',
    textEffect: 'fire',
    textColorSecondary: '#ff4500',
    emblem: '🔥',
    particleType: 'embers',
    barGradient: ['#8b0000', '#ff4500'],
    borderStyle: 'glow',
    borderColor: '#ff4500',
    category: 'elemental',
  },
  {
    id: 'plate_galaxy',
    name: 'Galaxy',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_galaxy.json',
    textColor: '#ffffff',
    description: 'Starfield and nebula swirl with twinkling stars',
    textEffect: 'glow',
    textColorSecondary: '#c084fc',
    emblem: '✧',
    particleType: 'stars',
    barGradient: ['#0d0221', '#2d1b69'],
    borderStyle: 'gradient',
    borderColor: '#8b5cf6',
    category: 'cosmic',
  },
  {
    id: 'plate_frost',
    name: 'Frost',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_frost.json',
    textColor: '#e0f2fe',
    description: 'Frozen ice crystals with cold mist',
    textEffect: 'ice',
    textColorSecondary: '#67e8f9',
    emblem: '❄',
    particleType: 'snowflakes',
    barGradient: ['#164e63', '#0e7490'],
    borderStyle: 'glow',
    borderColor: '#67e8f9',
    category: 'elemental',
  },
  {
    id: 'plate_forest_spirit',
    name: 'Forest Spirit',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_forest.json',
    textColor: '#d1fae5',
    description: 'Living vines and floating leaves',
    textEffect: 'glow',
    textColorSecondary: '#34d399',
    emblem: '🌿',
    particleType: 'petals',
    barGradient: ['#064e3b', '#047857'],
    borderStyle: 'solid',
    borderColor: '#34d39940',
    category: 'nature',
  },
  // ─── EPIC ──────────────────────────────────────────
  {
    id: 'plate_hearts',
    name: 'Love',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_hearts.json',
    textColor: '#ffffff',
    description: 'Floating hearts with sparkle trail',
    textEffect: 'glow',
    textColorSecondary: '#ec4899',
    emblem: '💖',
    particleType: 'sparkles',
    barGradient: ['#831843', '#ec4899'],
    borderStyle: 'animated',
    borderColor: '#ec4899',
    category: 'fantasy',
  },
  {
    id: 'plate_void',
    name: 'Void',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_void.json',
    textColor: '#c0f0ff',
    description: 'Dark dimensional rift with void energy',
    textEffect: 'glitch',
    textColorSecondary: '#7c3aed',
    emblem: '◈',
    particleType: 'mist',
    barGradient: ['#0f0024', '#1e0040'],
    borderStyle: 'animated',
    borderColor: '#7c3aed',
    category: 'dark',
  },
  {
    id: 'plate_aurora',
    name: 'Aurora Borealis',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_aurora.json',
    textColor: '#ffffff',
    description: 'Northern lights dancing across the bar',
    textEffect: 'rainbow',
    textColorSecondary: null,
    emblem: '✦',
    particleType: 'sparkles',
    barGradient: ['#064e3b', '#7c3aed'],
    borderStyle: 'gradient',
    borderColor: '#34d399',
    category: 'cosmic',
  },
  {
    id: 'plate_thunder',
    name: 'Thunder',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_thunder.json',
    textColor: '#fef08a',
    description: 'Crackling lightning bolts across a storm cloud',
    textEffect: 'neon',
    textColorSecondary: '#facc15',
    emblem: '⚡',
    particleType: 'lightning',
    barGradient: ['#1e1b4b', '#312e81'],
    borderStyle: 'glow',
    borderColor: '#facc15',
    category: 'elemental',
  },
  {
    id: 'plate_blood_moon',
    name: 'Blood Moon',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_blood_moon.json',
    textColor: '#fca5a5',
    description: 'Crimson moon rising with dark energy',
    textEffect: 'glow',
    textColorSecondary: '#dc2626',
    emblem: '🌙',
    particleType: 'embers',
    barGradient: ['#450a0a', '#7f1d1d'],
    borderStyle: 'animated',
    borderColor: '#dc2626',
    category: 'dark',
  },
  // ─── LEGENDARY ─────────────────────────────────────
  {
    id: 'plate_divine',
    name: 'Divine',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'plate_divine.json',
    textColor: '#ffd700',
    description: 'Heavenly golden radiance with divine wings',
    textEffect: 'metallic',
    textColorSecondary: '#fff7ed',
    emblem: '👑',
    particleType: 'sparkles',
    barGradient: ['#854d0e', '#fbbf24'],
    borderStyle: 'animated',
    borderColor: '#ffd700',
    category: 'divine',
  },
  {
    id: 'plate_phoenix',
    name: 'Phoenix',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'plate_phoenix.json',
    textColor: '#fef3c7',
    description: 'Rising phoenix flames with ash particles',
    textEffect: 'fire',
    textColorSecondary: '#f97316',
    emblem: '🔱',
    particleType: 'flames',
    barGradient: ['#7c2d12', '#ea580c'],
    borderStyle: 'glow',
    borderColor: '#f97316',
    category: 'mythical',
  },
  {
    id: 'plate_dragon_scale',
    name: 'Dragon Scale',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'plate_dragon.json',
    textColor: '#fde68a',
    description: 'Shimmering dragon scales with mystic aura',
    textEffect: 'metallic',
    textColorSecondary: '#dc2626',
    emblem: '🐉',
    particleType: 'embers',
    barGradient: ['#1c1917', '#44403c'],
    borderStyle: 'double',
    borderColor: '#fbbf24',
    category: 'mythical',
  },
  {
    id: 'plate_eternal_frost',
    name: 'Eternal Frost',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'plate_eternal_frost.json',
    textColor: '#e0f2fe',
    description: 'Ancient ice enchantment with crystal formations',
    textEffect: 'ice',
    textColorSecondary: '#06b6d4',
    emblem: '💎',
    particleType: 'snowflakes',
    barGradient: ['#083344', '#155e75'],
    borderStyle: 'animated',
    borderColor: '#06b6d4',
    category: 'elemental',
  },
  // ─── MYTHICAL ──────────────────────────────────────
  {
    id: 'plate_cosmic_sovereign',
    name: 'Cosmic Sovereign',
    rarity: 'MYTHICAL',
    free: false,
    lottieFile: 'plate_cosmic_sovereign.json',
    textColor: '#ffffff',
    description: 'Reality-bending cosmic energy with dimensional rifts',
    textEffect: 'holographic',
    textColorSecondary: null,
    emblem: '⚜',
    particleType: 'stars',
    barGradient: ['#0c0a1d', '#1e1b4b'],
    borderStyle: 'animated',
    borderColor: '#a78bfa',
    category: 'cosmic',
  },
  {
    id: 'plate_inferno_lord',
    name: 'Inferno Lord',
    rarity: 'MYTHICAL',
    free: false,
    lottieFile: 'plate_inferno_lord.json',
    textColor: '#fef3c7',
    description: 'Ultimate flame mastery with hellfire eruption',
    textEffect: 'fire',
    textColorSecondary: '#fbbf24',
    emblem: '🔱',
    particleType: 'flames',
    barGradient: ['#450a0a', '#b91c1c'],
    borderStyle: 'animated',
    borderColor: '#ef4444',
    category: 'mythical',
  },
  {
    id: 'plate_void_emperor',
    name: 'Void Emperor',
    rarity: 'MYTHICAL',
    free: false,
    lottieFile: 'plate_void_emperor.json',
    textColor: '#c4b5fd',
    description: 'Absolute void control with matter-dissolving tendrils',
    textEffect: 'glitch',
    textColorSecondary: '#a855f7',
    emblem: '◈',
    particleType: 'mist',
    barGradient: ['#0a0015', '#1e0040'],
    borderStyle: 'animated',
    borderColor: '#a855f7',
    category: 'dark',
  },
] as const;

/** All available nameplate categories for filtering */
export const NAMEPLATE_CATEGORIES = [
  'all', 'basic', 'metallic', 'nature', 'cyberpunk',
  'elemental', 'cosmic', 'fantasy', 'dark', 'divine', 'mythical',
] as const;
export type NameplateCategory = (typeof NAMEPLATE_CATEGORIES)[number];

/** Look up a nameplate by ID */
export function getNameplateById(id: string): NameplateEntry | undefined {
  return NAMEPLATE_REGISTRY.find((n) => n.id === id);
}

/** Get all free nameplates */
export function getFreeNameplates(): NameplateEntry[] {
  return NAMEPLATE_REGISTRY.filter((n) => n.free);
}

/** Get nameplates by rarity */
export function getNameplatesByRarity(rarity: NameplateRarity): NameplateEntry[] {
  return NAMEPLATE_REGISTRY.filter((n) => n.rarity === rarity);
}

/** Get nameplates by category */
export function getNameplatesByCategory(category: NameplateCategory): NameplateEntry[] {
  if (category === 'all') return [...NAMEPLATE_REGISTRY];
  return NAMEPLATE_REGISTRY.filter((n) => n.category === category);
}
