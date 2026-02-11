/**
 * Animation Presets for the CustomizationDemo
 *
 * Self-contained spring + variant definitions for the landing app.
 * Mirrors the web app's animation-presets/presets.ts without external deps.
 *
 * @module components/customization-demo/animations
 */

import type { Variants, Transition } from 'framer-motion';

// =============================================================================
// SPRING PRESETS
// =============================================================================

export const springs = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 } as Transition,
  default: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 10 } as Transition,
  snappy: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
  superBouncy: { type: 'spring', stiffness: 500, damping: 8 } as Transition,
  dramatic: { type: 'spring', stiffness: 80, damping: 12 } as Transition,
  wobbly: { type: 'spring', stiffness: 250, damping: 5 } as Transition,
  stiff: { type: 'spring', stiffness: 600, damping: 30 } as Transition,
  smooth: { type: 'spring', stiffness: 150, damping: 20 } as Transition,
  ultraSmooth: { type: 'spring', stiffness: 100, damping: 25 } as Transition,
};

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

// =============================================================================
// STAGGER CONTAINERS
// =============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
