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
 *
 * @version 1.0.0
 * @since 2026-01-18
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementRarity } from '@/stores/gamificationStore';

// ==================== TYPE DEFINITIONS ====================

export interface AnimatedBadgeProps {
  /** Achievement data */
  achievement: Achievement;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show animation effects */
  animated?: boolean;
  /** Show progress bar for incomplete achievements */
  showProgress?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the badge is equipped in showcase */
  isEquipped?: boolean;
  /** Additional className */
  className?: string;
}

// ==================== RARITY CONFIGURATIONS ====================

export const RARITY_COLORS: Record<
  AchievementRarity,
  {
    primary: string;
    secondary: string;
    glow: string;
    gradient: string;
    particle: string;
    bg: string;
  }
> = {
  common: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    glow: 'rgba(156, 163, 175, 0.4)',
    gradient: 'from-gray-400 to-gray-500',
    particle: '#9ca3af',
    bg: 'bg-gray-500/10',
  },
  uncommon: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-400 to-green-500',
    particle: '#10b981',
    bg: 'bg-emerald-500/10',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-400 to-indigo-500',
    particle: '#3b82f6',
    bg: 'bg-blue-500/10',
  },
  epic: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.6)',
    gradient: 'from-purple-400 to-violet-500',
    particle: '#8b5cf6',
    bg: 'bg-purple-500/10',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.6)',
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    particle: '#f59e0b',
    bg: 'bg-amber-500/10',
  },
  mythic: {
    primary: '#ec4899',
    secondary: '#db2777',
    glow: 'rgba(236, 72, 153, 0.7)',
    gradient: 'from-pink-400 via-rose-400 to-red-500',
    particle: '#ec4899',
    bg: 'bg-pink-500/10',
  },
};

// ==================== SIZE CONFIGURATIONS ====================

const SIZE_CONFIG = {
  xs: { badge: 32, icon: 16, ring: 36, particles: 4 },
  sm: { badge: 40, icon: 20, ring: 44, particles: 6 },
  md: { badge: 56, icon: 28, ring: 62, particles: 8 },
  lg: { badge: 72, icon: 36, ring: 80, particles: 10 },
  xl: { badge: 96, icon: 48, ring: 104, particles: 12 },
};

// ==================== ANIMATION VARIANTS ====================

// Common: Subtle shimmer across the badge
const shimmerAnimation = {
  backgroundPosition: ['200% 0%', '-200% 0%'],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Uncommon: Soft pulsing glow
const pulseGlowAnimation = (glowColor: string) => ({
  boxShadow: [
    `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
    `0 0 16px ${glowColor}, 0 0 32px ${glowColor}`,
    `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
});

// Rare: Rotating gradient ring
const rotatingRingAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Legendary: Aurora wave effect
const auroraAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Mythic: Reality distortion
const voidDistortionAnimation = {
  scale: [1, 1.02, 0.98, 1],
  rotate: [0, 2, -2, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ==================== PARTICLE COMPONENT ====================

interface ParticleProps {
  index: number;
  total: number;
  radius: number;
  color: string;
  reverse?: boolean;
  delay?: number;
}

function OrbitingParticle({ index, total, radius, color, reverse = false, delay = 0 }: ParticleProps) {
  const angle = (index / total) * 360;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4,
        height: 4,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
        top: '50%',
        left: '50%',
        marginTop: -2,
        marginLeft: -2,
        transformOrigin: `2px ${radius}px`,
      }}
      initial={{ rotate: angle }}
      animate={{
        rotate: reverse ? [angle, angle - 360] : [angle, angle + 360],
      }}
      transition={{
        duration: reverse ? 5 : 3,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    />
  );
}

// ==================== MAIN COMPONENT ====================

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
  const progress = achievement.maxProgress > 0
    ? (achievement.progress / achievement.maxProgress) * 100
    : 0;
  const isCompleted = achievement.unlocked;

  // Render animation effects based on rarity
  const renderRarityEffects = useCallback(() => {
    if (!animated || !isCompleted) return null;

    switch (achievement.rarity) {
      case 'common':
        // Subtle shimmer overlay
        return (
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.primary}30, transparent)`,
              backgroundSize: '200% 100%',
            }}
            animate={shimmerAnimation}
          />
        );

      case 'uncommon':
        // Pulsing glow ring
        return (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={pulseGlowAnimation(colors.glow)}
          />
        );

      case 'rare':
        // Rotating gradient ring
        return (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: config.ring,
              height: config.ring,
              top: '50%',
              left: '50%',
              marginTop: -config.ring / 2,
              marginLeft: -config.ring / 2,
              background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
              opacity: 0.6,
            }}
            animate={rotatingRingAnimation}
          >
            {/* Inner mask */}
            <div
              className="absolute bg-dark-900 rounded-full"
              style={{
                inset: 3,
              }}
            />
          </motion.div>
        );

      case 'epic':
        // Dual-layer orbiting particles
        return (
          <>
            {/* Inner orbit */}
            {Array.from({ length: config.particles }).map((_, i) => (
              <OrbitingParticle
                key={`inner-${i}`}
                index={i}
                total={config.particles}
                radius={config.badge / 2 + 4}
                color={colors.primary}
              />
            ))}
            {/* Outer orbit (reverse) */}
            {Array.from({ length: config.particles / 2 }).map((_, i) => (
              <OrbitingParticle
                key={`outer-${i}`}
                index={i}
                total={config.particles / 2}
                radius={config.badge / 2 + 12}
                color={colors.secondary}
                reverse
                delay={i * 0.2}
              />
            ))}
          </>
        );

      case 'legendary':
        // Multi-color aurora effect
        return (
          <>
            <motion.div
              className="absolute inset-[-4px] rounded-full pointer-events-none overflow-hidden"
              style={{
                background: `linear-gradient(45deg, ${colors.primary}60, ${colors.secondary}60, #f59e0b60, ${colors.primary}60)`,
                backgroundSize: '300% 300%',
                filter: 'blur(4px)',
              }}
              animate={auroraAnimation}
            />
            {/* Pulsing outer glow */}
            <motion.div
              className="absolute inset-[-8px] rounded-full pointer-events-none"
              style={{
                boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Sparkle particles */}
            {Array.from({ length: 6 }).map((_, i) => (
              <OrbitingParticle
                key={`sparkle-${i}`}
                index={i}
                total={6}
                radius={config.badge / 2 + 8}
                color="#fbbf24"
                delay={i * 0.3}
              />
            ))}
          </>
        );

      case 'mythic':
        // Reality-bending void effect
        return (
          <>
            {/* Void distortion background */}
            <motion.div
              className="absolute inset-[-6px] rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, transparent 30%, ${colors.primary}40 60%, ${colors.secondary}60 100%)`,
                filter: 'blur(2px)',
              }}
              animate={voidDistortionAnimation}
            />
            {/* Inner void */}
            <motion.div
              className="absolute inset-[-12px] rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}80, transparent, ${colors.secondary}80, transparent, ${colors.primary}80)`,
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {/* Outer void ring */}
            <motion.div
              className="absolute inset-[-16px] rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from 180deg, transparent, ${colors.primary}60, transparent, ${colors.secondary}60, transparent)`,
              }}
              animate={{
                rotate: [360, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {/* Particle streams */}
            {Array.from({ length: 8 }).map((_, i) => (
              <OrbitingParticle
                key={`void-${i}`}
                index={i}
                total={8}
                radius={config.badge / 2 + 14}
                color={i % 2 === 0 ? colors.primary : colors.secondary}
                reverse={i % 2 === 1}
                delay={i * 0.15}
              />
            ))}
            {/* Intense glow */}
            <motion.div
              className="absolute inset-[-4px] rounded-full pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
                  `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
                  `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        );

      default:
        return null;
    }
  }, [animated, isCompleted, achievement.rarity, colors, config]);

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
      {renderRarityEffects()}

      {/* Main badge container */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          isCompleted
            ? `bg-gradient-to-br ${colors.gradient}`
            : 'bg-dark-700 grayscale',
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
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Badge icon */}
        <span
          className={cn(
            'text-center select-none',
            !isCompleted && 'opacity-50'
          )}
          style={{
            fontSize: config.icon,
            lineHeight: 1,
          }}
        >
          {isCompleted || !achievement.isHidden ? achievement.icon : '❓'}
        </span>

        {/* Progress ring (for incomplete achievements) */}
        {showProgress && !isCompleted && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            width={config.badge}
            height={config.badge}
          >
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
          className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
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

// ==================== BADGE WITH TOOLTIP ====================

export interface AnimatedBadgeWithTooltipProps extends AnimatedBadgeProps {
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

export function AnimatedBadgeWithTooltip({
  showTooltip = true,
  ...props
}: AnimatedBadgeWithTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = RARITY_COLORS[props.achievement.rarity];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatedBadge {...props} />

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50',
              'px-4 py-3 rounded-xl',
              'bg-dark-800/95 backdrop-blur-xl',
              'border border-white/10',
              'shadow-xl shadow-black/50',
              'min-w-[200px] max-w-[280px]',
              'pointer-events-none'
            )}
          >
            <div className="text-center space-y-2">
              {/* Title */}
              <p className="font-bold text-white">
                {props.achievement.unlocked || !props.achievement.isHidden
                  ? props.achievement.title
                  : '???'}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-400">
                {props.achievement.unlocked || !props.achievement.isHidden
                  ? props.achievement.description
                  : 'Complete hidden requirements to unlock'}
              </p>

              {/* Rarity badge */}
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary,
                  }}
                >
                  {props.achievement.rarity}
                </span>
                <span className="text-xs text-gray-500">
                  +{props.achievement.xpReward} XP
                </span>
              </div>

              {/* Progress bar */}
              {!props.achievement.unlocked && props.achievement.maxProgress > 1 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {props.achievement.progress} / {props.achievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(props.achievement.progress / props.achievement.maxProgress) * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Unlocked date */}
              {props.achievement.unlocked && props.achievement.unlockedAt && (
                <p className="text-xs text-gray-500 pt-1">
                  Unlocked {new Date(props.achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}

              {/* Title reward */}
              {props.achievement.titleReward && (
                <p className="text-xs text-primary-400 pt-1">
                  Rewards: "{props.achievement.titleReward}" title
                </p>
              )}
            </div>

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-dark-800/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedBadge;
