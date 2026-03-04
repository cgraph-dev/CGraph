/**
 * TitleBadge Component
 *
 * Displays a user's equipped title with animated styling based on rarity.
 * Used in user profiles, chat messages, and leaderboards.
 *
 * Features:
 * - 25 dynamic animations (shimmer, glow, pulse, rainbow, holographic, etc.)
 * - Rarity-based styling with gradients and glows
 * - Tooltip with title description
 * - Click handler for title shop/selection
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { RARITY_COLORS, getTitleById } from '@/data/titles';
import type { TitleBadgeProps, TitleAnimationType } from './types';
import { SIZE_CLASSES, RARITY_GRADIENTS, SPARKLE_RARITIES } from './constants';
import { sparkleAnimation } from './animations';
import { useAnimationConfig } from './hooks/useAnimationConfig';
import { TitleBadgeTooltip } from './title-badge-tooltip';

/**
 * unknown for the gamification module.
 */
/**
 * Title Badge component.
 */
export function TitleBadge({
  title,
  size = 'sm',
  animated = true,
  showTooltip = true,
  onClick,
  className,
}: TitleBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Resolve title object
  const titleData = useMemo(() => {
    if (typeof title === 'string') {
      return getTitleById(title);
    }
    return title;
  }, [title]);

  // Compute derived values (safe even if titleData is null)
  const rarityColor = titleData ? RARITY_COLORS[titleData.rarity] : RARITY_COLORS.common;
  const gradient = titleData ? RARITY_GRADIENTS[titleData.rarity] : RARITY_GRADIENTS.common;

  // Get animation hook - must be called unconditionally (Rules of Hooks)
  const { getAnimation } = useAnimationConfig({
    animated,
     
    animationType: titleData?.animation?.type as TitleAnimationType | undefined, // type assertion: optional animation type from data
    glowColor: rarityColor.glow,
  });

  // Early return after all hooks (Rules of Hooks compliance)
  if (!titleData) return null;

  // Shimmer gradient for shimmer animation
  const shimmerStyle =
    titleData.animation.type === 'shimmer' && animated
      ? {
          backgroundImage: `linear-gradient(90deg, ${rarityColor.primary}, ${rarityColor.secondary}, ${rarityColor.primary})`,
          backgroundSize: '200% 100%',
        }
      : undefined;

  // Rainbow gradient style
  const rainbowStyle =
    titleData.animation.type === 'rainbow' && animated
      ? {
          background:
            'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
          backgroundSize: '400% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }
      : undefined;

  const showSparkle = SPARKLE_RARITIES.includes(titleData.rarity);

  return (
    <div className="relative inline-flex items-center">
      <motion.button
        className={cn(
          'inline-flex items-center gap-1 font-semibold',
          'border transition-all',
          SIZE_CLASSES[size],
          onClick ? 'cursor-pointer' : 'cursor-default',
          `bg-gradient-to-r ${gradient}`,
          'border-white/20 text-white',
          className
        )}
        style={{
          ...shimmerStyle,
          boxShadow:
            animated && titleData.animation.type === 'glow'
              ? `0 0 10px ${rarityColor.glow}`
              : undefined,
        }}
        animate={getAnimation()}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sparkle icon for legendary+ */}
        {showSparkle && (
          <motion.span animate={sparkleAnimation}>
            <SparklesIcon className="h-3 w-3" />
          </motion.span>
        )}

        {/* Title Text */}
        <span style={rainbowStyle}>{titleData.displayName}</span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <TitleBadgeTooltip title={titleData} rarityColor={rarityColor} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TitleBadge;
