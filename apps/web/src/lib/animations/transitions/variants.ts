/**
 * Component Animation Variants
 *
 * Framer Motion variants for common UI components including
 * page transitions, list items, cards, buttons, modals,
 * notifications, loading states, skeletons, and badges.
 */

import { Variants } from 'framer-motion';

import { durations, springs } from './core';

// ==================== PAGE TRANSITION VARIANTS ====================

export const pageTransitions = {
  // Fade transition for subtle page changes
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.normal },
  },

  // Slide from right (for forward navigation)
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: springs.smooth,
  },

  // Slide from left (for back navigation)
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: springs.smooth,
  },

  // Slide from bottom (for modal/sheet)
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: springs.smooth,
  },

  // Scale and fade (for popovers)
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: springs.gentle,
  },

  // Blur transition (for focus changes)
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: { duration: durations.smooth },
  },
} as const;

// ==================== LIST ITEM VARIANTS ====================

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast },
  },
};

export const listItemVariantsSlide: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: durations.fast },
  },
};

export const listItemVariantsScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: durations.fast },
  },
};

// ==================== CARD VARIANTS ====================

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
};

export const cardVariantsSubtle: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  hover: {
    scale: 1.01,
    y: -2,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.99,
    transition: springs.snappy,
  },
};

// ==================== BUTTON VARIANTS ====================

export const buttonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.95,
    transition: springs.snappy,
  },
};

export const buttonVariantsSubtle: Variants = {
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
};

// ==================== MODAL VARIANTS ====================

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: durations.fast },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

// ==================== NOTIFICATION VARIANTS ====================

export const notificationVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: durations.fast },
  },
};

// ==================== LOADING VARIANTS ====================

export const loadingVariants: Variants = {
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== SKELETON VARIANTS ====================

export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ==================== BADGE VARIANTS ====================

export const badgeVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: springs.bouncy,
  },
  exit: {
    scale: 0,
    rotate: 180,
    transition: { duration: durations.fast },
  },
};
