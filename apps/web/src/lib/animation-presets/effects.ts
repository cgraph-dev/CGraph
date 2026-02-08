/**
 * Animation Presets - Effects & Utilities
 *
 * Hover animations, pulse/glow/fire/electric effects, particle and
 * background animations, and utility helper functions.
 */

import { type Transition } from 'framer-motion';

import { springs, staggerConfigs } from './presets';

// =============================================================================
// HOVER ANIMATIONS
// =============================================================================

export const hoverAnimations = {
  lift: {
    whileHover: { y: -4, transition: springs.snappy },
    whileTap: { scale: 0.98 },
  },
  scale: {
    whileHover: { scale: 1.05, transition: springs.snappy },
    whileTap: { scale: 0.95 },
  },
  glow: (color: string) => ({
    whileHover: {
      boxShadow: `0 0 30px ${color}60`,
      transition: springs.snappy,
    },
  }),
  tilt: {
    whileHover: { rotate: 2, scale: 1.02, transition: springs.wobbly },
  },
  pop: {
    whileHover: { scale: 1.1, y: -2, transition: springs.superBouncy },
    whileTap: { scale: 0.9 },
  },
};

// =============================================================================
// PULSE & GLOW ANIMATIONS
// =============================================================================

export const createPulseAnimation = (color: string, intensity: 'subtle' | 'strong' = 'subtle') => {
  const values =
    intensity === 'subtle'
      ? { min: 10, max: 20, opacity: ['30', '50', '30'] }
      : { min: 15, max: 30, opacity: ['40', '60', '40'] };

  return {
    animate: {
      boxShadow: [
        `0 0 ${values.min}px ${color}${values.opacity[0]}`,
        `0 0 ${values.max}px ${color}${values.opacity[1]}`,
        `0 0 ${values.min}px ${color}${values.opacity[2]}`,
      ],
    },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  };
};

export const createFireAnimation = (colors: string[]) => ({
  animate: {
    boxShadow: [
      `0 -5px 15px ${colors[0]}80, 0 0 20px ${colors[1] || colors[0]}60`,
      `0 -10px 25px ${colors[0]}90, 0 0 30px ${colors[1] || colors[0]}70`,
      `0 -5px 15px ${colors[0]}80, 0 0 20px ${colors[1] || colors[0]}60`,
    ],
    y: [0, -2, 0],
  },
  transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const },
});

export const createElectricAnimation = (color: string) => ({
  animate: {
    boxShadow: [`0 0 5px ${color}`, `0 0 20px ${color}, 0 0 40px ${color}80`, `0 0 5px ${color}`],
  },
  transition: { duration: 0.1, repeat: Infinity, repeatDelay: 0.5 },
});

// =============================================================================
// PARTICLE ANIMATIONS
// =============================================================================

export const particleAnimations = {
  float: (baseY: number = -30) => ({
    animate: {
      y: [0, baseY, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [0.5, 1, 0.5],
    },
  }),
  rise: {
    animate: {
      y: [0, -60],
      x: [0, 10, -10, 0],
      opacity: [0.8, 0],
      scale: [1, 0.3],
    },
  },
  fall: {
    animate: {
      y: [0, 80],
      x: [0, 5, -5, 0],
      opacity: [0.8, 0.4, 0.8],
    },
  },
  sparkle: {
    animate: {
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180],
    },
  },
  orbit: (index: number, total: number, radius: number = 20) => {
    const angle = (index / total) * Math.PI * 2;
    return {
      animate: {
        x: [0, Math.cos(angle) * radius, 0],
        y: [0, Math.sin(angle) * radius, 0],
        opacity: [0, 1, 0],
      },
    };
  },
};

// =============================================================================
// BACKGROUND ANIMATIONS
// =============================================================================

export const backgroundAnimations = {
  gradientShift: {
    animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
    transition: { duration: 5, repeat: Infinity, ease: 'linear' as const },
  },
  aurora: (colors: string[]) => ({
    animate: {
      background: [
        `linear-gradient(45deg, ${colors.join(', ')})`,
        `linear-gradient(135deg, ${colors.join(', ')})`,
        `linear-gradient(225deg, ${colors.join(', ')})`,
        `linear-gradient(315deg, ${colors.join(', ')})`,
        `linear-gradient(405deg, ${colors.join(', ')})`,
      ],
    },
    transition: { duration: 6, repeat: Infinity, ease: 'linear' as const },
  }),
  pulse: (/* color: string - reserved for color-based pulse variants */) => ({
    animate: {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.02, 1],
    },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
  }),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a staggered delay for child elements
 */
export const getStaggerDelay = (
  index: number,
  config: keyof typeof staggerConfigs = 'standard'
) => {
  const stagger = staggerConfigs[config];
  return stagger.delayChildren + index * stagger.staggerChildren;
};

/**
 * Create a transition with repeat
 */
export const createRepeatTransition = (
  duration: number,
  repeat: number = Infinity,
  ease: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' = 'easeInOut'
): Transition => ({
  duration,
  repeat,
  ease,
});

/**
 * Create a spring transition
 */
export const createSpring = (
  preset: keyof typeof springs = 'default',
  delay?: number
): Transition => ({
  ...springs[preset],
  ...(delay !== undefined && { delay }),
});

/**
 * Get rarity-based glow color
 */
export const getRarityGlow = (rarity: string): string => {
  const rarityColors: Record<string, string> = {
    free: '#10b981',
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
    mythic: '#ec4899',
  };
  return (rarityColors[rarity as keyof typeof rarityColors] ?? rarityColors.common) as string;
};

/**
 * Get tier-based glow color
 */
export const getTierGlow = (tier: string): string => {
  const tierColors: Record<string, string> = {
    free: '#10b981',
    premium: '#8b5cf6',
    elite: '#ec4899',
  };
  return (tierColors[tier as keyof typeof tierColors] ?? tierColors.free) as string;
};
