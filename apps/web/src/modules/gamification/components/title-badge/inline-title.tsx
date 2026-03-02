/**
 * InlineTitle Component
 *
 * Lightweight inline display of a user's equipped title with rarity-based
 * gradient styling. Designed for embedding alongside usernames in chat,
 * forums, leaderboards, and other compact contexts.
 *
 * Rarity gradients:
 * - common: no gradient (gray text)
 * - uncommon: green
 * - rare: blue
 * - epic: purple
 * - legendary: gold
 * - mythic: pink → purple
 * - unique: rainbow
 *
 * Max ~20 DOM nodes for performance in virtualized lists.
 *
 * @module title-badge/inline-title
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getTitleById, type TitleRarity } from '@/data/titles';

// ── Types ──────────────────────────────────────────────────────────────

export interface InlineTitleData {
  id: string;
  displayName?: string;
  rarity?: TitleRarity;
}

export interface InlineTitleProps {
  /** Title ID string or title data object */
  title: string | InlineTitleData | null | undefined;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Whether to show rarity dot indicator */
  showDot?: boolean;
  /** Additional className */
  className?: string;
}

// ── Rarity Config ──────────────────────────────────────────────────────

const RARITY_CONFIG: Record<TitleRarity, { text: string; gradient?: string; dot: string }> = {
  common: {
    text: 'text-gray-400',
    dot: 'bg-gray-400',
  },
  uncommon: {
    text: 'text-green-400',
    dot: 'bg-green-400',
  },
  rare: {
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  epic: {
    text: '',
    gradient: 'bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent',
    dot: 'bg-purple-400',
  },
  legendary: {
    text: '',
    gradient: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent',
    dot: 'bg-yellow-400',
  },
  mythic: {
    text: '',
    gradient: 'bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent',
    dot: 'bg-pink-400',
  },
  unique: {
    text: '',
    gradient: 'bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent',
    dot: 'bg-indigo-400',
  },
};

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'text-[10px] leading-tight',
  sm: 'text-xs leading-tight',
  md: 'text-sm leading-snug',
};

const DOT_SIZES: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

/**
 * InlineTitle component.
 *
 * Renders a user's equipped title as a compact inline badge.
 * Designed for minimal DOM overhead in lists and chat messages.
 */
export const InlineTitle = memo(function InlineTitle({
  title,
  size = 'sm',
  showDot = false,
  className,
}: InlineTitleProps) {
  const resolved = useMemo(() => {
    if (!title) return null;

    if (typeof title === 'string') {
      const data = getTitleById(title);
      if (!data) return null;
      return { displayName: data.displayName, rarity: data.rarity };
    }

    return {
      displayName: title.displayName ?? title.id,
      rarity: title.rarity ?? ('common' as TitleRarity),
    };
  }, [title]);

  if (!resolved) return null;

  const config = RARITY_CONFIG[resolved.rarity] ?? RARITY_CONFIG.common;
  const textClass = config.gradient ?? config.text;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showDot && (
        <span className={cn('inline-block rounded-full', DOT_SIZES[size], config.dot)} />
      )}
      <span className={textClass}>{resolved.displayName}</span>
    </span>
  );
});

export default InlineTitle;
