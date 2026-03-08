/**
 * Nameplate Registry — shared across web and mobile.
 *
 * Defines the canonical catalogue of decorative username nameplates
 * with rarity tiers, Lottie file references, and text color overrides.
 *
 * Each nameplate is a horizontal bar animation (300×48px canvas)
 * rendered behind the username text.
 *
 * @module animation-constants/registries/nameplates
 */

/** Rarity tiers matching the global system */
export type NameplateRarity = 'FREE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL';

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
}

/**
 * Canonical registry of all 10 nameplates.
 *
 * Designed to accept unlimited items later —
 * simply append new entries to the array.
 */
export const NAMEPLATE_REGISTRY: readonly NameplateEntry[] = [
  {
    id: 'plate_none',
    name: 'None',
    rarity: 'FREE',
    free: true,
    lottieFile: null,
    textColor: '#ffffff',
    description: 'Plain text, no background',
  },
  {
    id: 'plate_simple_dark',
    name: 'Shadow',
    rarity: 'FREE',
    free: true,
    lottieFile: 'plate_shadow.json',
    textColor: '#ffffff',
    description: 'Dark translucent bar with subtle shadow',
  },
  {
    id: 'plate_gold_shimmer',
    name: 'Gold',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_gold.json',
    textColor: '#1a1a1a',
    description: 'Shimmering gold gradient bar',
  },
  {
    id: 'plate_sakura',
    name: 'Sakura',
    rarity: 'COMMON',
    free: false,
    lottieFile: 'plate_sakura.json',
    textColor: '#4a0020',
    description: 'Cherry blossom petals drifting across',
  },
  {
    id: 'plate_cyber_bar',
    name: 'Cyber Bar',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_cyber.json',
    textColor: '#00f5ff',
    description: 'Neon circuit-traced bar',
  },
  {
    id: 'plate_fire',
    name: 'Flame',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_fire.json',
    textColor: '#ffffff',
    description: 'Flickering flame bar',
  },
  {
    id: 'plate_galaxy',
    name: 'Galaxy',
    rarity: 'RARE',
    free: false,
    lottieFile: 'plate_galaxy.json',
    textColor: '#ffffff',
    description: 'Starfield and nebula swirl',
  },
  {
    id: 'plate_hearts',
    name: 'Love',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_hearts.json',
    textColor: '#ffffff',
    description: 'Floating hearts and sparkles',
  },
  {
    id: 'plate_void',
    name: 'Void',
    rarity: 'EPIC',
    free: false,
    lottieFile: 'plate_void.json',
    textColor: '#c0f0ff',
    description: 'Dark dimensional rift energy',
  },
  {
    id: 'plate_divine',
    name: 'Divine',
    rarity: 'LEGENDARY',
    free: false,
    lottieFile: 'plate_divine.json',
    textColor: '#ffd700',
    description: 'Heavenly golden radiance',
  },
] as const;

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
