/**
 * Landing Page Animation Presets
 *
 * Compatible with reactbits.dev and 21st.dev animation patterns.
 * Easy to customize and extend.
 */

import { Variants, Transition } from 'framer-motion';

// =============================================================================
// SPRING PRESETS (Match reactbits.dev patterns)
// =============================================================================

export const springs = {
  // Gentle, smooth movement
  gentle: { type: 'spring', stiffness: 120, damping: 14 } as Transition,

  // Default balanced spring
  default: { type: 'spring', stiffness: 200, damping: 20 } as Transition,

  // Bouncy, playful movement
  bouncy: { type: 'spring', stiffness: 300, damping: 10 } as Transition,

  // Quick, snappy response
  snappy: { type: 'spring', stiffness: 400, damping: 25 } as Transition,

  // Super bouncy for attention
  superBouncy: { type: 'spring', stiffness: 500, damping: 8 } as Transition,

  // Slow, dramatic entrance
  dramatic: { type: 'spring', stiffness: 80, damping: 12 } as Transition,

  // Wobbly for fun effects
  wobbly: { type: 'spring', stiffness: 250, damping: 5 } as Transition,

  // Stiff for precise movements
  stiff: { type: 'spring', stiffness: 600, damping: 30 } as Transition,
};

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1 },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -180, scale: 0.5 },
  visible: { opacity: 1, rotate: 0, scale: 1 },
};

export const slideInFromBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const flipIn: Variants = {
  hidden: { opacity: 0, rotateX: 90 },
  visible: { opacity: 1, rotateX: 0 },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(20px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
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

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

// =============================================================================
// HOVER ANIMATIONS
// =============================================================================

export const hoverScale = {
  scale: 1.05,
  transition: springs.snappy,
};

export const hoverScaleLarge = {
  scale: 1.1,
  transition: springs.bouncy,
};

export const hoverLift = {
  y: -8,
  scale: 1.02,
  transition: springs.gentle,
};

export const hoverGlow = {
  boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
  transition: { duration: 0.3 },
};

export const hoverRotate = {
  rotate: 5,
  scale: 1.05,
  transition: springs.bouncy,
};

// =============================================================================
// TAP/CLICK ANIMATIONS
// =============================================================================

export const tapScale = { scale: 0.95 };
export const tapScaleSmall = { scale: 0.98 };
export const tapBounce = { scale: 0.9, transition: springs.bouncy };

// =============================================================================
// CONTINUOUS/LOOP ANIMATIONS
// =============================================================================

export const pulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

export const float = {
  y: [0, -10, 0],
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
};

export const glow = {
  opacity: [0.5, 1, 0.5],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

export const rotate360 = {
  rotate: 360,
  transition: { duration: 20, repeat: Infinity, ease: 'linear' },
};

export const breathe = {
  scale: [1, 1.02, 1],
  opacity: [0.8, 1, 0.8],
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
};

export const shimmer = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: { duration: 3, repeat: Infinity, ease: 'linear' },
};

export const wave = {
  rotate: [0, 15, -15, 15, 0],
  transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
};

// =============================================================================
// SCROLL-TRIGGERED ANIMATIONS
// =============================================================================

export const scrollFadeIn = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: springs.gentle,
};

export const scrollScaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-50px' },
  transition: springs.bouncy,
};

export const scrollSlideIn = {
  initial: { opacity: 0, x: -100 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
  transition: springs.gentle,
};

// =============================================================================
// TEXT ANIMATIONS (Character by character)
// =============================================================================

export const textRevealContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const textRevealChar: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

export const textTypewriter: Variants = {
  hidden: { width: 0 },
  visible: { width: '100%', transition: { duration: 2, ease: 'steps(40)' } },
};

// =============================================================================
// 3D TRANSFORM ANIMATIONS
// =============================================================================

export const perspective3D: Variants = {
  hidden: {
    opacity: 0,
    rotateX: 45,
    y: 100,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    transition: springs.gentle,
  },
};

export const cardFlip: Variants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 },
};

export const tiltOnHover = (x: number, y: number) => ({
  rotateX: y * 10,
  rotateY: -x * 10,
  transformPerspective: 1000,
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a delayed variant
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        ...(typeof variants.visible === 'object' && 'transition' in variants.visible
          ? variants.visible.transition
          : {}),
        delay,
      },
    },
  };
}

/**
 * Create stagger children animation
 */
export function createStagger(staggerDelay: number = 0.1): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };
}

/**
 * Create scroll-triggered animation with custom offset
 */
export function createScrollTrigger(
  animation: Variants,
  offset: string = '-100px'
) {
  return {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, margin: offset },
    variants: animation,
  };
}
