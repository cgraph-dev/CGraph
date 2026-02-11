/**
 * Core Animation Configuration
 *
 * Easing functions, spring configurations, and duration presets
 * used as building blocks for all animations.
 */

import { springs as sharedSprings } from '@cgraph/animation-constants';

// ==================== EASING FUNCTIONS ====================

export const easings = {
  // Standard easings
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],

  // Spring-like easings
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],

  // Smooth easings
  smooth: [0.22, 1, 0.36, 1],
  snappy: [0.87, 0, 0.13, 1],
} as const;

// ==================== SPRING CONFIGURATIONS ====================

export const springs = {
  // Gentle spring for smooth transitions
  gentle: { type: 'spring' as const, ...sharedSprings.default },

  // Default spring for most UI elements
  default: { type: 'spring' as const, ...sharedSprings.stiff },

  // Bouncy spring for playful interactions
  bouncy: { type: 'spring' as const, ...sharedSprings.snappy },

  // Snappy spring for quick feedback
  snappy: { type: 'spring' as const, ...sharedSprings.snappy },

  // Smooth spring for cards and panels
  smooth: { type: 'spring' as const, ...sharedSprings.stiff },
} as const;

// ==================== DURATION PRESETS ====================

export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  smooth: 0.35,
  slow: 0.5,
  cinematic: 0.75,
} as const;

// ==================== STAGGER CONFIGURATIONS ====================

export const staggerConfigs = {
  // Quick stagger for small lists (5-10 items)
  quick: {
    delayChildren: 0.02,
    staggerChildren: 0.02,
  },

  // Normal stagger for medium lists (10-20 items)
  normal: {
    delayChildren: 0.03,
    staggerChildren: 0.03,
  },

  // Slow stagger for large lists or dramatic effect
  slow: {
    delayChildren: 0.05,
    staggerChildren: 0.05,
  },

  // Very slow for hero sections
  cinematic: {
    delayChildren: 0.1,
    staggerChildren: 0.1,
  },
} as const;
