/**
 * RankBadge — Displays a forum rank badge next to usernames.
 *
 * Shows the rank image (small icon) with a tooltip for rank name + score range.
 * Falls back to a colored text badge if no image is configured.
 *
 * @module modules/forums/components/leaderboard-widget/rank-badge
 */

import { useState } from 'react';
import type { ForumRank } from '@cgraph/shared-types';

// ── Types ──────────────────────────────────────────────────────────────

export interface RankBadgeProps {
  /** Rank name (e.g., "Veteran"). */
  rankName: string;
  /** URL of the rank badge image. */
  rankImage?: string | null;
  /** Hex color for the badge. */
  rankColor: string;
  /** Display size variant. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional full rank object for tooltip details. */
  rank?: ForumRank | null;
  /** Additional CSS class names. */
  className?: string;
}

// ── Size Map ───────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: { icon: 16, text: 'text-[10px]', px: 'px-1', py: 'py-0', gap: 'gap-0.5' },
  md: { icon: 20, text: 'text-xs', px: 'px-1.5', py: 'py-0.5', gap: 'gap-1' },
  lg: { icon: 24, text: 'text-sm', px: 'px-2', py: 'py-1', gap: 'gap-1.5' },
} as const;

// ── Component ──────────────────────────────────────────────────────────

export function RankBadge({
  rankName,
  rankImage,
  rankColor,
  size = 'sm',
  rank,
  className = '',
}: RankBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const s = SIZE_MAP[size];

  const tooltipText = rank
    ? `${rank.name}: ${rank.minScore}${rank.maxScore != null ? `–${rank.maxScore}` : '+'} pts`
    : rankName;

  return (
    <span
      className={`relative inline-flex items-center ${s.gap} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {rankImage ? (
        <img
          src={rankImage}
          alt={rankName}
          width={s.icon}
          height={s.icon}
          className="shrink-0 rounded-sm object-contain"
          loading="lazy"
        />
      ) : (
        <span
          className={`inline-flex items-center justify-center rounded ${s.px} ${s.py} ${s.text} font-semibold leading-none`}
          style={{
            backgroundColor: `${rankColor}20`,
            color: rankColor,
            border: `1px solid ${rankColor}40`,
          }}
        >
          {rankName}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-dark-800 px-2 py-1 text-[11px] text-gray-200 shadow-lg ring-1 ring-white/10"
          role="tooltip"
        >
          {tooltipText}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-dark-800" />
        </span>
      )}
    </span>
  );
}

export default RankBadge;
