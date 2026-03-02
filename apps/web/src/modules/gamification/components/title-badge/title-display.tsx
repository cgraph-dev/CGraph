/**
 * TitleDisplay Component
 *
 * Full title card view for profile pages. Shows the title with full
 * rarity styling, description, animation info, and unlock details.
 * Larger and more detailed than InlineTitle.
 *
 * @module title-badge/title-display
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getTitleById, RARITY_COLORS, type Title, type TitleRarity } from '@/data/titles';

// ── Types ──────────────────────────────────────────────────────────────

export interface TitleDisplayProps {
  /** Title ID string or Title object */
  title: string | Title | null | undefined;
  /** Show unlock requirement info */
  showUnlockInfo?: boolean;
  /** Show description */
  showDescription?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ── Rarity Gradients ───────────────────────────────────────────────────

const CARD_GRADIENTS: Record<TitleRarity, string> = {
  common: 'from-gray-800 to-gray-900 border-gray-700',
  uncommon: 'from-green-900/40 to-gray-900 border-green-700/50',
  rare: 'from-blue-900/40 to-gray-900 border-blue-700/50',
  epic: 'from-purple-900/40 to-gray-900 border-purple-700/50',
  legendary: 'from-yellow-900/30 to-gray-900 border-yellow-700/50',
  mythic: 'from-pink-900/30 to-gray-900 border-pink-700/50',
  unique: 'from-indigo-900/30 via-purple-900/20 to-gray-900 border-indigo-700/50',
};

const RARITY_LABELS: Record<TitleRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
  unique: 'Unique',
};

const SPARKLE_RARITIES: TitleRarity[] = ['legendary', 'mythic', 'unique'];

/**
 * TitleDisplay component.
 *
 * Renders a full title card with rarity-themed styling.
 */
export const TitleDisplay = memo(function TitleDisplay({
  title,
  showUnlockInfo = false,
  showDescription = true,
  onClick,
  className,
}: TitleDisplayProps) {
  const titleData = useMemo(() => {
    if (!title) return null;
    if (typeof title === 'string') return getTitleById(title);
    return title;
  }, [title]);

  if (!titleData) return null;

  const colors = RARITY_COLORS[titleData.rarity] ?? RARITY_COLORS.common;
  const cardGradient = CARD_GRADIENTS[titleData.rarity] ?? CARD_GRADIENTS.common;
  const showSparkle = SPARKLE_RARITIES.includes(titleData.rarity);

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4',
        cardGradient,
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {/* Rarity glow background */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-3xl"
        style={{ background: colors.primary }}
      />

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${colors.primary}20` }}
        >
          {showSparkle ? (
            <SparklesIcon className="h-5 w-5" style={{ color: colors.primary }} />
          ) : (
            <TrophyIcon className="h-5 w-5" style={{ color: colors.primary }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title name */}
          <h4 className="font-bold text-white">{titleData.displayName}</h4>

          {/* Rarity badge */}
          <span
            className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            {RARITY_LABELS[titleData.rarity]}
          </span>

          {/* Description */}
          {showDescription && titleData.description && (
            <p className="mt-2 text-sm text-gray-400">{titleData.description}</p>
          )}

          {/* Unlock requirement */}
          {showUnlockInfo && titleData.unlockRequirement && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-400">Unlock:</span>{' '}
              {titleData.unlockRequirement}
            </p>
          )}

          {/* Price if applicable */}
          {titleData.coinPrice != null && titleData.coinPrice > 0 && (
            <p className="mt-1 text-xs text-yellow-400">
              🪙 {titleData.coinPrice.toLocaleString()} Coins
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default TitleDisplay;
