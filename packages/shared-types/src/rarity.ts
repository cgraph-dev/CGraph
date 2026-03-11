/**
 * Canonical rarity tier definitions — single source of truth.
 *
 * Mirrors `CGraph.Cosmetics.Rarity` from the Elixir backend.
 * All frontend packages MUST import rarity from here rather than
 * defining local copies.
 *
 * 7-tier system: free → common → uncommon → rare → epic → legendary → mythic
 *
 * @module shared-types/rarity
 */

/**
 * Ordered list of all rarity tiers from lowest to highest.
 * The array index doubles as the numeric rank.
 */
export const RARITY_TIERS = [
  'free',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const;

/** A single rarity tier value (lowercase, matching backend atoms). */
export type RarityTier = (typeof RARITY_TIERS)[number];

/**
 * Tailwind-compatible text-color classes per rarity.
 * Used by web UI components for consistent coloring.
 */
export const RARITY_COLORS: Record<RarityTier, string> = {
  free: 'text-gray-500',
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-pink-400',
} as const;

/**
 * Human-readable labels per rarity tier.
 */
export const RARITY_LABELS: Record<RarityTier, string> = {
  free: 'Free',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
} as const;

/**
 * Hex color values per rarity tier (for non-Tailwind contexts like mobile).
 */
export const RARITY_HEX_COLORS: Record<RarityTier, string> = {
  free: '#6b7280',
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
  mythic: '#f472b6',
} as const;

/**
 * Return the numeric rank of a rarity tier (0 = free, 6 = mythic).
 * Higher rank = rarer item.
 */
export function rarityRank(tier: RarityTier): number {
  return RARITY_TIERS.indexOf(tier);
}

/**
 * Compare two rarity tiers.
 * Returns negative if `a < b`, zero if equal, positive if `a > b`.
 * Suitable for `Array.prototype.sort()`.
 */
export function compareRarity(a: RarityTier, b: RarityTier): number {
  return rarityRank(a) - rarityRank(b);
}
