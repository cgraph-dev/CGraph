/**
 * TitleBadge Component
 *
 * Displays a user's equipped title with animated styling based on rarity.
 * Used in user profiles, chat messages, and leaderboards.
 *
 * Features:
 * - Dynamic animations (shimmer, glow, pulse, rainbow, etc.)
 * - Rarity-based styling with gradients and glows
 * - Tooltip with title description
 * - Click handler for title shop/selection
 *
 * @version 0.7.52
 * @since 2026-01-05
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { type Title, type TitleRarity, RARITY_COLORS, getTitleById } from '@/data/titles';

// ==================== TYPE DEFINITIONS ====================

export interface TitleBadgeProps {
  /** Title ID or Title object to display */
  title: string | Title;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show animation (some contexts may want static display) */
  animated?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ==================== ANIMATION KEYFRAMES ====================

const shimmerAnimation = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

const glowAnimation = (glowColor: string) => ({
  boxShadow: [
    `0 0 5px ${glowColor}`,
    `0 0 15px ${glowColor}`,
    `0 0 5px ${glowColor}`,
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
});

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const rainbowAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

const waveAnimation = {
  y: [0, -2, 0, 2, 0],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const sparkleAnimation = {
  opacity: [1, 0.6, 1],
  scale: [1, 1.1, 1],
  transition: {
    duration: 0.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const bounceAnimation = {
  y: [0, -4, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: 'easeOut' as const,
  },
};

const floatAnimation = {
  y: [0, -3, 0, 3, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ==================== SIZE CONFIGURATIONS ====================

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded',
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-lg',
  lg: 'text-base px-3 py-1.5 rounded-xl',
};

// ==================== RARITY GRADIENTS ====================

const RARITY_GRADIENTS: Record<TitleRarity, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-yellow-500 via-amber-500 to-orange-500',
  mythic: 'from-red-500 via-pink-500 to-rose-500',
  unique: 'from-pink-500 via-purple-500 to-indigo-500',
};

// ==================== COMPONENT ====================

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

  if (!titleData) return null;

  const rarityColor = RARITY_COLORS[titleData.rarity];
  const gradient = RARITY_GRADIENTS[titleData.rarity];

  // Get animation based on title configuration
  const getAnimation = () => {
    if (!animated) return {};

    switch (titleData.animation.type) {
      case 'shimmer':
        return shimmerAnimation;
      case 'glow':
        return glowAnimation(rarityColor.glow);
      case 'pulse':
        return pulseAnimation;
      case 'rainbow':
        return rainbowAnimation;
      case 'wave':
        return waveAnimation;
      case 'sparkle':
        return sparkleAnimation;
      case 'bounce':
        return bounceAnimation;
      case 'float':
        return floatAnimation;
      case 'fire':
        return glowAnimation('rgba(239, 68, 68, 0.6)');
      case 'ice':
        return glowAnimation('rgba(59, 130, 246, 0.6)');
      case 'electric':
        return glowAnimation('rgba(234, 179, 8, 0.6)');
      default:
        return {};
    }
  };

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
          background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
          backgroundSize: '400% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }
      : undefined;

  return (
    <div className="relative inline-flex items-center">
      <motion.button
        className={cn(
          'inline-flex items-center gap-1 font-semibold',
          'border transition-all',
          SIZE_CLASSES[size],
          onClick ? 'cursor-pointer' : 'cursor-default',
          // Base styling
          `bg-gradient-to-r ${gradient}`,
          'text-white border-white/20',
          className
        )}
        style={{
          ...shimmerStyle,
          boxShadow: animated && titleData.animation.type === 'glow' 
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
        {(titleData.rarity === 'legendary' || titleData.rarity === 'mythic' || titleData.rarity === 'unique') && (
          <motion.span
            animate={sparkleAnimation}
          >
            <SparklesIcon className="h-3 w-3" />
          </motion.span>
        )}
        
        {/* Title Text */}
        <span style={rainbowStyle}>{titleData.displayName}</span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
              'px-3 py-2 rounded-lg',
              'bg-dark-800/95 backdrop-blur-xl',
              'border border-white/10',
              'shadow-xl shadow-black/50',
              'whitespace-nowrap',
              'pointer-events-none'
            )}
          >
            <div className="text-center">
              <p className="font-semibold text-white text-sm">{titleData.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{titleData.description}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: rarityColor.primary }}
                >
                  {titleData.rarity}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-500 capitalize">{titleData.category}</span>
              </div>
              {titleData.unlockRequirement && (
                <p className="text-[10px] text-gray-500 mt-1 italic">
                  {titleData.unlockRequirement}
                </p>
              )}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== TITLE DISPLAY FOR PROFILES ====================

export interface ProfileTitleDisplayProps {
  titleId: string | null;
  onChangeTitle?: () => void;
  isEditable?: boolean;
  className?: string;
}

export function ProfileTitleDisplay({
  titleId,
  onChangeTitle,
  isEditable = false,
  className,
}: ProfileTitleDisplayProps) {
  if (!titleId) {
    if (isEditable) {
      return (
        <motion.button
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
            'text-xs text-gray-500 border border-dashed border-gray-600',
            'hover:border-primary-500/50 hover:text-primary-400 transition-colors',
            className
          )}
          onClick={onChangeTitle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SparklesIcon className="h-3 w-3" />
          <span>Set Title</span>
        </motion.button>
      );
    }
    return null;
  }

  return (
    <TitleBadge
      title={titleId}
      size="sm"
      onClick={isEditable ? onChangeTitle : undefined}
      className={className}
    />
  );
}

export default TitleBadge;
