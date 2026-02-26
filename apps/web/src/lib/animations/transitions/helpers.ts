/**
 * Animation Helper Functions & Utilities
 *
 * Factory functions for creating custom transitions,
 * performance optimization constants, and accessibility helpers.
 */

import { Variants, Transition } from 'framer-motion';

import { easings, staggerConfigs } from './core';

// ==================== HELPER FUNCTIONS ====================

/**
 * Creates a staggered container variant
 */
export function createStaggerContainer(config: keyof typeof staggerConfigs = 'normal'): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        ...staggerConfigs[config],
      },
    },
  };
}

/**
 * Creates a delayed animation
 */
export function withDelay(variants: Variants, delay: number): Variants {
  const newVariants: Variants = {};

  Object.keys(variants).forEach((key) => {
    const variant = variants[key];
    if (variant && typeof variant === 'object' && 'transition' in variant) {
      newVariants[key] = {
        ...variant,
        transition: {
           
          ...(variant.transition as Transition), // safe downcast – structural boundary
          delay,
        },
      };
    } else if (variant) {
      newVariants[key] = variant;
    }
  });

  return newVariants;
}

/**
 * Creates a custom spring transition
 */
export function createSpring(stiffness: number, damping: number): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
  };
}

/**
 * Creates a custom tween transition
 */
export function createTween(
  duration: number,
  easing: keyof typeof easings = 'easeInOut'
): Transition {
  return {
    duration,
    ease: easings[easing],
  };
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================

/**
 * GPU-accelerated transform properties
 * Use these for 60 FPS animations
 */
export const gpuAccelerated = {
  // Always use transform instead of top/left
  translateX: true,
  translateY: true,
  scale: true,
  rotate: true,
  opacity: true,

  // Use will-change sparingly
  willChange: 'transform, opacity',
} as const;

/**
 * Animation-safe CSS properties
 * These won't cause layout thrashing
 */
export const safeCSSProps = ['transform', 'opacity', 'filter', 'backdrop-filter'] as const;

// ==================== ACCESSIBILITY ====================

/**
 * Respects user's motion preferences
 */
export function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns appropriate transition based on motion preference
 */
export function getAccessibleTransition(
  normalTransition: Transition,
  reducedTransition?: Transition
): Transition {
  if (getReducedMotion()) {
    return reducedTransition || { duration: 0 };
  }
  return normalTransition;
}
