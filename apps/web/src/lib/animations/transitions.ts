/**
 * Animation Transitions Library
 *
 * Centralized animation variants and transitions for consistent motion design
 * throughout the CGraph application. All animations target 60 FPS performance
 * with GPU-accelerated transforms.
 */

import { Variants, Transition } from 'framer-motion';

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
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },

  // Default spring for most UI elements
  default: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },

  // Bouncy spring for playful interactions
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },

  // Snappy spring for quick feedback
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },

  // Smooth spring for cards and panels
  smooth: {
    type: 'spring' as const,
    stiffness: 250,
    damping: 28,
  },
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
          ...(variant.transition as Transition),
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
