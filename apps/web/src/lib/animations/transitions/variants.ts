/**
 * Component Animation Variants
 *
 * Framer Motion variants for common UI components including
 * page transitions, list items, cards, buttons, modals,
 * notifications, loading states, skeletons, and badges.
 */

import { type Variants } from 'motion/react';

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
      duration: durations.ambient,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  spin: {
    rotate: 360,
    transition: {
      duration: durations.verySlow,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: durations.dramatic,
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
      duration: durations.ambient,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: durations.loop,
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

// ==================== MESSAGE VARIANTS ====================

/** Entrance/exit animations for chat messages. */
export const messageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -40,
    transition: { duration: durations.fast },
  },
};

/** Slide-in from left/right based on sender. */
export const messageVariantsSlide = {
  own: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: springs.smooth },
    exit: { opacity: 0, x: 30, transition: { duration: durations.fast } },
  },
  other: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: springs.smooth },
    exit: { opacity: 0, x: -30, transition: { duration: durations.fast } },
  },
} as const;

// ==================== PRESENCE VARIANTS ====================

/** Online/offline status pulse animation. */
export const presenceVariants: Variants = {
  offline: {
    scale: 1,
    opacity: 0.4,
  },
  online: {
    scale: [1, 1.3, 1],
    opacity: 1,
    transition: {
      scale: { duration: durations.smooth, times: [0, 0.5, 1] },
      opacity: { duration: durations.normal },
    },
  },
  away: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: durations.loop,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== SEARCH RESULT VARIANTS ====================

/** Search result item entrance animation. */
export const searchResultVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: durations.fast },
  },
};

// ==================== SIDEBAR VARIANTS ====================

/** Sidebar expand/collapse with spring physics. */
export const sidebarVariants: Variants = {
  collapsed: {
    width: 72,
    transition: springs.smooth,
  },
  expanded: {
    width: 280,
    transition: springs.gentle,
  },
};

/** Sidebar item entrance with stagger support. */
export const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

// ==================== SETTINGS PANEL VARIANTS ====================

/** Tab content transition for settings panels. */
export const settingsTabVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: durations.fast },
  },
};

// ==================== VOTE FEEDBACK VARIANTS ====================

/** Upvote/downvote click feedback animation. */
export const voteFeedbackVariants: Variants = {
  idle: { scale: 1, y: 0 },
  upvote: {
    scale: [1, 1.4, 1],
    y: [0, -6, 0],
    transition: { duration: durations.smooth, times: [0, 0.3, 1] },
  },
  downvote: {
    scale: [1, 1.4, 1],
    y: [0, 6, 0],
    transition: { duration: durations.smooth, times: [0, 0.3, 1] },
  },
};
