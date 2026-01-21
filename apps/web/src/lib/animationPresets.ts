/**
 * Animation Presets Library
 *
 * Centralized animation configurations for consistent, smooth animations
 * across the entire application. Matches the landing page's animation quality.
 */

import { type Transition, type Variants, type TargetAndTransition } from 'framer-motion';

// =============================================================================
// SPRING PRESETS
// =============================================================================

export const springs = {
  /** Gentle, slow spring for delicate movements */
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  /** Default balanced spring */
  default: { type: 'spring' as const, stiffness: 200, damping: 20 },
  /** Bouncy, playful spring */
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 },
  /** Quick, snappy spring for UI interactions */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  /** Very bouncy for emphasis */
  superBouncy: { type: 'spring' as const, stiffness: 500, damping: 8 },
  /** Dramatic, theatrical spring */
  dramatic: { type: 'spring' as const, stiffness: 80, damping: 12 },
  /** Wobbly, unstable spring */
  wobbly: { type: 'spring' as const, stiffness: 250, damping: 5 },
  /** Stiff, immediate spring */
  stiff: { type: 'spring' as const, stiffness: 600, damping: 30 },
  /** Smooth, elegant spring for cards */
  smooth: { type: 'spring' as const, stiffness: 150, damping: 15 },
  /** Ultra-smooth for large movements */
  ultraSmooth: { type: 'spring' as const, stiffness: 100, damping: 20 },
} as const;

// =============================================================================
// TWEEN PRESETS
// =============================================================================

export const tweens = {
  /** Quick fade */
  quickFade: { duration: 0.15, ease: 'easeOut' as const },
  /** Standard transition */
  standard: { duration: 0.3, ease: 'easeInOut' as const },
  /** Smooth, longer transition */
  smooth: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as readonly number[] },
  /** Dramatic entrance */
  dramatic: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as readonly number[] },
  /** Subtle background animation */
  ambient: { duration: 3, ease: 'linear' as const, repeat: Infinity },
} as const;

// =============================================================================
// STAGGER CONFIGURATIONS
// =============================================================================

export const staggerConfigs = {
  /** Fast stagger for lists */
  fast: { staggerChildren: 0.03, delayChildren: 0 },
  /** Standard stagger */
  standard: { staggerChildren: 0.05, delayChildren: 0.1 },
  /** Slow stagger for dramatic reveals */
  slow: { staggerChildren: 0.1, delayChildren: 0.2 },
  /** Very fast for grids */
  grid: { staggerChildren: 0.02, delayChildren: 0 },
} as const;

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

export const entranceVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: tweens.standard },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springs.default },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: springs.default },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: springs.default },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: springs.default },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: springs.bouncy },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1, transition: springs.snappy },
  },
  slideUp: {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: springs.smooth },
  },
  flip: {
    hidden: { rotateX: -90, opacity: 0 },
    visible: { rotateX: 0, opacity: 1, transition: springs.dramatic },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  },
};

// =============================================================================
// CHAT BUBBLE ANIMATIONS BY STYLE
// =============================================================================

// Chat bubble style types - matches app bubble IDs
export type ChatBubbleStyleId =
  | 'bubble-default'
  | 'bubble-pill'
  | 'bubble-sharp'
  | 'bubble-telegram'
  | 'bubble-imessage'
  | 'bubble-discord'
  | 'bubble-whatsapp'
  | 'bubble-retro'
  | 'bubble-neon'
  | 'bubble-minimal'
  | 'bubble-cloud'
  | 'bubble-modern'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'default';

export const chatBubbleAnimations: Record<
  string,
  (
    isOwn: boolean,
    delay: number
  ) => {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    transition: Transition;
  }
> = {
  // Standard style names
  rounded: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.bouncy },
  }),
  sharp: (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  cloud: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  modern: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
  retro: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { delay, ...springs.dramatic },
  }),
  default: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, ...springs.default },
  }),

  // App-specific bubble IDs (mapped to animations)
  'bubble-default': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-pill': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, borderRadius: '0px' },
    animate: { opacity: 1, scale: 1, borderRadius: '9999px' },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-sharp': (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 30 : -30 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  'bubble-telegram': (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { delay, ...springs.snappy },
  }),
  'bubble-imessage': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.7, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-discord': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.2 },
  }),
  'bubble-whatsapp': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.9, y: 5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-retro': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { delay, ...springs.dramatic },
  }),
  'bubble-neon': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-minimal': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration: 0.3 },
  }),
  'bubble-cloud': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-modern': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

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

export default springs;
