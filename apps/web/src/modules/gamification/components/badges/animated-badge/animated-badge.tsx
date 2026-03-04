/**
 * AnimatedBadge Component
 *
 * Displays achievement badges with rarity-based animations.
 * Each rarity tier has unique visual effects that make badges feel special.
 *
 * Animation Tiers:
 * - Common: Subtle shimmer
 * - Uncommon: Soft pulsing glow
 * - Rare: Rotating gradient ring
 * - Epic: Dual-layer particle orbit
 * - Legendary: Multi-color aurora effect
 * - Mythic: Reality-bending void distortion
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AnimatedBadgeProps } from './types';
import { RARITY_COLORS, SIZE_CONFIG } from './constants';
import { RarityEffects } from './rarity-effects';

/**
 * unknown for the gamification module.
 */
/**
 * Animated Badge component.
 */
export function AnimatedBadge({
  achievement,
  size = 'md',
  animated = true,
  showProgress = true,
  onClick,
  isEquipped = false,
  className,
}: AnimatedBadgeProps) {
  const config = SIZE_CONFIG[size];
  const colors = RARITY_COLORS[achievement.rarity];

  // Progress calculation
  const progress =
    achievement.maxProgress > 0 ? (achievement.progress / achievement.maxProgress) * 100 : 0;
  const isCompleted = achievement.unlocked;

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        width: config.ring + 8,
        height: config.ring + 8,
      }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      {/* Rarity effects layer */}
      {animated && isCompleted && (
        <RarityEffects rarity={achievement.rarity} colors={colors} config={config} />
      )}

      {/* Main badge container */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          isCompleted ? `bg-gradient-to-br ${colors.gradient}` : 'bg-dark-700 grayscale',
          isEquipped && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-900'
        )}
        style={{
          width: config.badge,
          height: config.badge,
          boxShadow: isCompleted ? `0 0 16px ${colors.glow}` : undefined,
        }}
        animate={
          isCompleted && animated
            ? {
                boxShadow: [
                  `0 0 16px ${colors.glow}`,
                  `0 0 24px ${colors.glow}`,
                  `0 0 16px ${colors.glow}`,
                ],
              }
            : undefined
        }
        transition={{
          duration: durations.loop.ms / 1000,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Badge icon */}
        <span
          className={cn('select-none text-center', !isCompleted && 'opacity-50')}
          style={{
            fontSize: config.icon,
            lineHeight: 1,
          }}
        >
          {isCompleted || !achievement.isHidden ? achievement.icon : '❓'}
        </span>

        {/* Progress ring (for incomplete achievements) */}
        {showProgress && !isCompleted && progress > 0 && (
          <svg className="absolute inset-0 -rotate-90" width={config.badge} height={config.badge}>
            <circle
              cx={config.badge / 2}
              cy={config.badge / 2}
              r={config.badge / 2 - 2}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
              strokeDasharray={`${(progress / 100) * Math.PI * (config.badge - 4)} ${Math.PI * (config.badge - 4)}`}
              strokeLinecap="round"
              opacity={0.6}
            />
          </svg>
        )}
      </motion.div>

      {/* Equipped indicator */}
      {isEquipped && (
        <motion.div
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <span className="text-[8px]">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AnimatedBadge;
