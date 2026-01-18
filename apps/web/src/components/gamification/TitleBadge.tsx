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
 * - Cross-forum visibility - titles follow user everywhere
 *
 * Animation Types:
 * - Basic: shimmer, glow, pulse, rainbow, wave, sparkle, bounce, float
 * - Elemental: fire, ice, electric
 * - Advanced: holographic, matrix, plasma, crystalline, ethereal
 * - Cosmic: cosmic, aurora, void
 * - Premium: lightning, nature, glitch, neon_flicker, inferno, blizzard, storm, divine, shadow
 *
 * @version 1.0.0
 * @since 2026-01-18
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { type Title, type TitleRarity, RARITY_COLORS, getTitleById } from '@/data/titles';

// ==================== TYPE DEFINITIONS ====================

export type TitleAnimationType =
  | 'shimmer'
  | 'glow'
  | 'pulse'
  | 'rainbow'
  | 'wave'
  | 'sparkle'
  | 'bounce'
  | 'float'
  | 'fire'
  | 'ice'
  | 'electric'
  // New animation types (17 additions)
  | 'holographic'
  | 'matrix'
  | 'plasma'
  | 'crystalline'
  | 'ethereal'
  | 'cosmic'
  | 'lightning'
  | 'nature'
  | 'void'
  | 'aurora'
  | 'glitch'
  | 'neon_flicker'
  | 'inferno'
  | 'blizzard'
  | 'storm'
  | 'divine'
  | 'shadow';

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

// Basic Animations (existing)
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

// ==================== NEW ANIMATION KEYFRAMES ====================

// Holographic: 3D prismatic color shift
const holographicAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  filter: [
    'hue-rotate(0deg) brightness(1)',
    'hue-rotate(180deg) brightness(1.2)',
    'hue-rotate(360deg) brightness(1)',
  ],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Matrix: Cascading digital characters effect
const matrixAnimation = {
  textShadow: [
    '0 0 5px #00ff00, 0 2px 0 rgba(0,255,0,0.3)',
    '0 0 10px #00ff00, 0 4px 0 rgba(0,255,0,0.5)',
    '0 0 5px #00ff00, 0 2px 0 rgba(0,255,0,0.3)',
  ],
  opacity: [1, 0.85, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'steps(3)' as const,
  },
};

// Plasma: Flowing energy field
const plasmaAnimation = {
  backgroundPosition: ['0% 50%', '50% 100%', '100% 50%', '50% 0%', '0% 50%'],
  boxShadow: [
    '0 0 10px rgba(139, 92, 246, 0.5)',
    '0 0 20px rgba(236, 72, 153, 0.5)',
    '0 0 10px rgba(59, 130, 246, 0.5)',
    '0 0 20px rgba(139, 92, 246, 0.5)',
    '0 0 10px rgba(139, 92, 246, 0.5)',
  ],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Crystalline: Growing crystal formations
const crystallineAnimation = {
  boxShadow: [
    '0 0 5px rgba(147, 197, 253, 0.5), inset 0 0 5px rgba(147, 197, 253, 0.2)',
    '0 0 15px rgba(147, 197, 253, 0.7), inset 0 0 10px rgba(147, 197, 253, 0.4)',
    '0 0 5px rgba(147, 197, 253, 0.5), inset 0 0 5px rgba(147, 197, 253, 0.2)',
  ],
  scale: [1, 1.02, 1],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Ethereal: Ghost-like fade in/out
const etherealAnimation = {
  opacity: [0.6, 1, 0.6],
  filter: ['blur(0px)', 'blur(0.5px)', 'blur(0px)'],
  y: [0, -2, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Cosmic: Starfield background
const cosmicAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%'],
  boxShadow: [
    '0 0 10px rgba(99, 102, 241, 0.4)',
    '0 0 20px rgba(99, 102, 241, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
    '0 0 10px rgba(99, 102, 241, 0.4)',
  ],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Lightning: Random electric arcs
const lightningAnimation = {
  boxShadow: [
    '0 0 5px rgba(234, 179, 8, 0.3)',
    '0 0 20px rgba(234, 179, 8, 0.8), 0 0 40px rgba(234, 179, 8, 0.4)',
    '0 0 5px rgba(234, 179, 8, 0.3)',
    '0 0 25px rgba(234, 179, 8, 0.9), 0 0 50px rgba(234, 179, 8, 0.5)',
    '0 0 5px rgba(234, 179, 8, 0.3)',
  ],
  opacity: [1, 1, 0.9, 1, 1],
  transition: {
    duration: 0.8,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.1, 0.2, 0.3, 1],
  },
};

// Nature: Growing vines/leaves
const natureAnimation = {
  boxShadow: [
    '0 0 8px rgba(34, 197, 94, 0.4)',
    '0 0 16px rgba(34, 197, 94, 0.6), 0 0 24px rgba(74, 222, 128, 0.3)',
    '0 0 8px rgba(34, 197, 94, 0.4)',
  ],
  scale: [1, 1.03, 1],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Void: Black hole distortion
const voidAnimation = {
  boxShadow: [
    '0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(139, 92, 246, 0.3)',
    '0 0 20px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(139, 92, 246, 0.5)',
    '0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(139, 92, 246, 0.3)',
  ],
  scale: [1, 0.98, 1.02, 1],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Aurora: Northern lights effect
const auroraAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  boxShadow: [
    '0 0 10px rgba(34, 211, 238, 0.4)',
    '0 0 15px rgba(74, 222, 128, 0.5)',
    '0 0 10px rgba(168, 85, 247, 0.4)',
    '0 0 15px rgba(34, 211, 238, 0.5)',
    '0 0 10px rgba(34, 211, 238, 0.4)',
  ],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Glitch: Digital corruption
const glitchAnimation = {
  x: [0, -2, 2, -1, 0],
  textShadow: [
    '0 0 0 transparent',
    '2px 0 0 rgba(255, 0, 0, 0.5), -2px 0 0 rgba(0, 255, 255, 0.5)',
    '-2px 0 0 rgba(255, 0, 0, 0.5), 2px 0 0 rgba(0, 255, 255, 0.5)',
    '0 0 0 transparent',
    '0 0 0 transparent',
  ],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2,
    ease: 'linear' as const,
  },
};

// Neon flicker: Neon sign effect
const neonFlickerAnimation = {
  opacity: [1, 0.8, 1, 1, 0.9, 1],
  boxShadow: [
    '0 0 10px rgba(236, 72, 153, 0.8)',
    '0 0 5px rgba(236, 72, 153, 0.4)',
    '0 0 15px rgba(236, 72, 153, 1)',
    '0 0 10px rgba(236, 72, 153, 0.8)',
    '0 0 5px rgba(236, 72, 153, 0.6)',
    '0 0 10px rgba(236, 72, 153, 0.8)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.1, 0.2, 0.5, 0.8, 1],
  },
};

// Inferno: Intense fire particles
const infernoAnimation = {
  boxShadow: [
    '0 0 10px rgba(239, 68, 68, 0.6), 0 -5px 15px rgba(251, 146, 60, 0.4)',
    '0 0 20px rgba(239, 68, 68, 0.8), 0 -8px 25px rgba(251, 146, 60, 0.6)',
    '0 0 10px rgba(239, 68, 68, 0.6), 0 -5px 15px rgba(251, 146, 60, 0.4)',
  ],
  y: [0, -1, 0],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Blizzard: Swirling ice/snow
const blizzardAnimation = {
  boxShadow: [
    '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(219, 234, 254, 0.3)',
    '0 0 15px rgba(147, 197, 253, 0.7), 0 0 30px rgba(219, 234, 254, 0.5)',
    '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(219, 234, 254, 0.3)',
  ],
  scale: [1, 1.01, 0.99, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Storm: Lightning + clouds
const stormAnimation = {
  boxShadow: [
    '0 0 10px rgba(100, 116, 139, 0.5)',
    '0 0 25px rgba(234, 179, 8, 0.8), 0 0 40px rgba(100, 116, 139, 0.6)',
    '0 0 10px rgba(100, 116, 139, 0.5)',
    '0 0 15px rgba(100, 116, 139, 0.6)',
  ],
  opacity: [1, 1, 0.95, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.15, 0.2, 1],
  },
};

// Divine: Golden rays + particles
const divineAnimation = {
  boxShadow: [
    '0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
    '0 0 25px rgba(251, 191, 36, 0.7), 0 0 50px rgba(251, 191, 36, 0.4)',
    '0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
  ],
  filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Shadow: Dark wisps + smoke
const shadowAnimation = {
  boxShadow: [
    '0 0 10px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(0, 0, 0, 0.5)',
    '0 0 20px rgba(0, 0, 0, 0.9), 0 8px 25px rgba(0, 0, 0, 0.7)',
    '0 0 10px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(0, 0, 0, 0.5)',
  ],
  y: [0, 1, 0],
  opacity: [0.9, 1, 0.9],
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
  const getAnimation = useCallback(() => {
    if (!animated) return {};

    switch (titleData.animation.type as TitleAnimationType) {
      // Basic animations
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

      // Elemental animations
      case 'fire':
        return glowAnimation('rgba(239, 68, 68, 0.6)');
      case 'ice':
        return glowAnimation('rgba(59, 130, 246, 0.6)');
      case 'electric':
        return glowAnimation('rgba(234, 179, 8, 0.6)');

      // New advanced animations
      case 'holographic':
        return holographicAnimation;
      case 'matrix':
        return matrixAnimation;
      case 'plasma':
        return plasmaAnimation;
      case 'crystalline':
        return crystallineAnimation;
      case 'ethereal':
        return etherealAnimation;
      case 'cosmic':
        return cosmicAnimation;
      case 'lightning':
        return lightningAnimation;
      case 'nature':
        return natureAnimation;
      case 'void':
        return voidAnimation;
      case 'aurora':
        return auroraAnimation;
      case 'glitch':
        return glitchAnimation;
      case 'neon_flicker':
        return neonFlickerAnimation;
      case 'inferno':
        return infernoAnimation;
      case 'blizzard':
        return blizzardAnimation;
      case 'storm':
        return stormAnimation;
      case 'divine':
        return divineAnimation;
      case 'shadow':
        return shadowAnimation;

      default:
        return {};
    }
  }, [animated, titleData.animation.type, rarityColor.glow]);

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
