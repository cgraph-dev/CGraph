/**
 * RarityBadge — colored badge displaying the rarity tier of a cosmetic item.
 *
 * Uses the canonical 7-tier color scheme from the cosmetics manifest:
 *   common=#9CA3AF, uncommon=#22C55E, rare=#3B82F6, epic=#A855F7,
 *   legendary=#F59E0B, mythic=#EF4444, divine=#EC4899
 *
 * @module cosmetics/components/rarity-badge
 */

import type { RarityTier } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Color map (hex + tailwind bg for badge pill)
// ---------------------------------------------------------------------------

const RARITY_BADGE_COLORS: Record<RarityTier, { bg: string; text: string; hex: string }> = {
  free: { bg: 'bg-gray-600/30', text: 'text-gray-400', hex: '#6B7280' },
  common: { bg: 'bg-gray-500/20', text: 'text-gray-300', hex: '#9CA3AF' },
  uncommon: { bg: 'bg-green-500/20', text: 'text-green-400', hex: '#22C55E' },
  rare: { bg: 'bg-blue-500/20', text: 'text-blue-400', hex: '#3B82F6' },
  epic: { bg: 'bg-purple-500/20', text: 'text-purple-400', hex: '#A855F7' },
  legendary: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hex: '#F59E0B' },
  mythic: { bg: 'bg-red-500/20', text: 'text-red-400', hex: '#EF4444' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RarityBadgeProps {
  /** Rarity tier to display. */
  readonly rarity: RarityTier;
  /** Optional size variant. */
  readonly size?: 'sm' | 'md';
}

/**
 * Colored pill badge showing the rarity tier name.
 */
export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const colors = RARITY_BADGE_COLORS[rarity];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} ${sizeClasses}`}
      style={{ borderColor: colors.hex, borderWidth: 1 }}
    >
      {rarity}
    </span>
  );
}
