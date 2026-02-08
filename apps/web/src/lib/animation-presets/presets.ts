/**
 * Animation Presets - Core Presets
 *
 * Spring, tween, stagger, and entrance animation configurations.
 */

import { type Variants } from 'framer-motion';

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
