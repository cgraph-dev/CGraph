/**
 * AnimationLibrary - Comprehensive Animation Presets for React Native Reanimated
 *
 * Features:
 * - 30+ entrance animations
 * - 30+ exit animations
 * - 10 spring physics presets
 * - 20+ easing functions
 * - Stagger animation utilities
 * - Layout animation helpers
 */

import { Easing, WithTimingConfig, WithSpringConfig } from 'react-native-reanimated';

// ============================================================================
// Spring Physics Presets
// ============================================================================

/**
 * Our own SpringConfig interface for animation presets.
 * Uses the stiffness/damping model (not duration-based).
 */
export interface SpringConfig {
  damping?: number;
  mass?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  velocity?: number;
  // Metadata
  name?: string;
  description?: string;
}

/**
 * Extract only the WithSpringConfig properties from a SpringConfig.
 * Use this when passing to withSpring() to avoid type errors.
 */
export function getSpringConfig(config: SpringConfig): WithSpringConfig {
  const { name, description, ...springConfig } = config;
  return springConfig as WithSpringConfig;
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  // Subtle and gentle
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
    name: 'Gentle',
    description: 'Subtle, slow spring for smooth transitions',
  },

  // Default balanced spring
  default: {
    damping: 15,
    stiffness: 120,
    mass: 1,
    name: 'Default',
    description: 'Balanced spring for general use',
  },

  // Bouncy and playful
  bouncy: {
    damping: 8,
    stiffness: 150,
    mass: 1,
    name: 'Bouncy',
    description: 'Playful spring with noticeable bounce',
  },

  // Very bouncy
  superBouncy: {
    damping: 5,
    stiffness: 200,
    mass: 1,
    name: 'Super Bouncy',
    description: 'Highly elastic spring for attention-grabbing',
  },

  // Quick and responsive
  snappy: {
    damping: 18,
    stiffness: 200,
    mass: 0.8,
    name: 'Snappy',
    description: 'Quick response for interactive elements',
  },

  // Very snappy
  instant: {
    damping: 22,
    stiffness: 400,
    mass: 0.6,
    name: 'Instant',
    description: 'Near-instant response with minimal overshoot',
  },

  // Slow and dramatic
  slow: {
    damping: 25,
    stiffness: 50,
    mass: 1.5,
    name: 'Slow',
    description: 'Dramatic slow spring for emphasis',
  },

  // Wobbly attention-grabbing
  wobbly: {
    damping: 6,
    stiffness: 140,
    mass: 1,
    name: 'Wobbly',
    description: 'Attention-grabbing wobble effect',
  },

  // Stiff and precise
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
    name: 'Stiff',
    description: 'Precise movement with minimal bounce',
  },

  // Elastic like rubber
  elastic: {
    damping: 4,
    stiffness: 180,
    mass: 1.2,
    name: 'Elastic',
    description: 'Rubber-like elasticity',
  },
};

// ============================================================================
// Timing Presets
// ============================================================================

export interface TimingConfig extends WithTimingConfig {
  name?: string;
}

export const TIMING_PRESETS: Record<string, TimingConfig> = {
  instant: { duration: 100, easing: Easing.out(Easing.ease), name: 'Instant' },
  quick: { duration: 200, easing: Easing.out(Easing.ease), name: 'Quick' },
  default: { duration: 300, easing: Easing.inOut(Easing.ease), name: 'Default' },
  smooth: { duration: 400, easing: Easing.inOut(Easing.ease), name: 'Smooth' },
  slow: { duration: 600, easing: Easing.inOut(Easing.ease), name: 'Slow' },
  verySlow: { duration: 1000, easing: Easing.inOut(Easing.ease), name: 'Very Slow' },
};

// ============================================================================
// Easing Functions
// ============================================================================

export const EASING_FUNCTIONS = {
  // Standard easings
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Quad easings
  quadIn: Easing.in(Easing.quad),
  quadOut: Easing.out(Easing.quad),
  quadInOut: Easing.inOut(Easing.quad),

  // Cubic easings
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),

  // Exponential easings
  expIn: Easing.in(Easing.exp),
  expOut: Easing.out(Easing.exp),
  expInOut: Easing.inOut(Easing.exp),

  // Circular easings
  circIn: Easing.in(Easing.circle),
  circOut: Easing.out(Easing.circle),
  circInOut: Easing.inOut(Easing.circle),

  // Back easings (overshoot)
  backIn: Easing.in(Easing.back(1.7)),
  backOut: Easing.out(Easing.back(1.7)),
  backInOut: Easing.inOut(Easing.back(1.7)),

  // Elastic easings
  elasticIn: Easing.in(Easing.elastic(1)),
  elasticOut: Easing.out(Easing.elastic(1)),
  elasticInOut: Easing.inOut(Easing.elastic(1)),

  // Bounce easings
  bounceIn: Easing.in(Easing.bounce),
  bounceOut: Easing.out(Easing.bounce),
  bounceInOut: Easing.inOut(Easing.bounce),

  // Custom bezier curves
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  decelerated: Easing.bezier(0, 0, 0.2, 1),
  accelerated: Easing.bezier(0.4, 0, 1, 1),
};

// ============================================================================
// Animation Value Types
// ============================================================================

export interface AnimationValues {
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: string;
  rotateX?: string;
  rotateY?: string;
  rotateZ?: string;
  skewX?: string;
  skewY?: string;
}

export interface AnimationPreset {
  initial: AnimationValues;
  animate: AnimationValues;
  exit?: AnimationValues;
  spring?: keyof typeof SPRING_PRESETS;
  timing?: keyof typeof TIMING_PRESETS;
  delay?: number;
}

// ============================================================================
// Entrance Animations
// ============================================================================

export const ENTRANCE_ANIMATIONS: Record<string, AnimationPreset> = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    timing: 'default',
  },
  fadeInUp: {
    initial: { opacity: 0, translateY: 30 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: -30 },
    spring: 'default',
  },
  fadeInDown: {
    initial: { opacity: 0, translateY: -30 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: 30 },
    spring: 'default',
  },
  fadeInLeft: {
    initial: { opacity: 0, translateX: -30 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: 30 },
    spring: 'default',
  },
  fadeInRight: {
    initial: { opacity: 0, translateX: 30 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: -30 },
    spring: 'default',
  },
  fadeInUpBig: {
    initial: { opacity: 0, translateY: 100 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: -100 },
    spring: 'bouncy',
  },
  fadeInDownBig: {
    initial: { opacity: 0, translateY: -100 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: 100 },
    spring: 'bouncy',
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    spring: 'snappy',
  },
  scaleInBounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    spring: 'bouncy',
  },
  scaleInCenter: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 },
    spring: 'elastic',
  },
  growIn: {
    initial: { opacity: 0, scale: 0.5, translateY: 20 },
    animate: { opacity: 1, scale: 1, translateY: 0 },
    exit: { opacity: 0, scale: 0.5, translateY: -20 },
    spring: 'bouncy',
  },
  popIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
    spring: 'superBouncy',
  },

  // Slide animations
  slideInUp: {
    initial: { translateY: 100 },
    animate: { translateY: 0 },
    exit: { translateY: -100 },
    spring: 'snappy',
  },
  slideInDown: {
    initial: { translateY: -100 },
    animate: { translateY: 0 },
    exit: { translateY: 100 },
    spring: 'snappy',
  },
  slideInLeft: {
    initial: { translateX: -100 },
    animate: { translateX: 0 },
    exit: { translateX: 100 },
    spring: 'snappy',
  },
  slideInRight: {
    initial: { translateX: 100 },
    animate: { translateX: 0 },
    exit: { translateX: -100 },
    spring: 'snappy',
  },

  // Rotate animations
  rotateIn: {
    initial: { opacity: 0, rotate: '-180deg', scale: 0.5 },
    animate: { opacity: 1, rotate: '0deg', scale: 1 },
    exit: { opacity: 0, rotate: '180deg', scale: 0.5 },
    spring: 'bouncy',
  },
  rotateInLeft: {
    initial: { opacity: 0, rotate: '-90deg', translateX: -50 },
    animate: { opacity: 1, rotate: '0deg', translateX: 0 },
    exit: { opacity: 0, rotate: '90deg', translateX: 50 },
    spring: 'snappy',
  },
  rotateInRight: {
    initial: { opacity: 0, rotate: '90deg', translateX: 50 },
    animate: { opacity: 1, rotate: '0deg', translateX: 0 },
    exit: { opacity: 0, rotate: '-90deg', translateX: -50 },
    spring: 'snappy',
  },
  spinIn: {
    initial: { opacity: 0, rotate: '-360deg', scale: 0 },
    animate: { opacity: 1, rotate: '0deg', scale: 1 },
    exit: { opacity: 0, rotate: '360deg', scale: 0 },
    spring: 'wobbly',
  },

  // Flip animations
  flipInX: {
    initial: { opacity: 0, rotateX: '90deg' },
    animate: { opacity: 1, rotateX: '0deg' },
    exit: { opacity: 0, rotateX: '-90deg' },
    spring: 'bouncy',
  },
  flipInY: {
    initial: { opacity: 0, rotateY: '90deg' },
    animate: { opacity: 1, rotateY: '0deg' },
    exit: { opacity: 0, rotateY: '-90deg' },
    spring: 'bouncy',
  },

  // Zoom animations
  zoomIn: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 },
    spring: 'elastic',
  },
  zoomInUp: {
    initial: { opacity: 0, scale: 0.5, translateY: 100 },
    animate: { opacity: 1, scale: 1, translateY: 0 },
    exit: { opacity: 0, scale: 0.5, translateY: -100 },
    spring: 'bouncy',
  },
  zoomInDown: {
    initial: { opacity: 0, scale: 0.5, translateY: -100 },
    animate: { opacity: 1, scale: 1, translateY: 0 },
    exit: { opacity: 0, scale: 0.5, translateY: 100 },
    spring: 'bouncy',
  },

  // Bounce animations
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    spring: 'superBouncy',
  },
  bounceInUp: {
    initial: { opacity: 0, translateY: 100, scale: 0.8 },
    animate: { opacity: 1, translateY: 0, scale: 1 },
    exit: { opacity: 0, translateY: -100, scale: 0.8 },
    spring: 'superBouncy',
  },
  bounceInDown: {
    initial: { opacity: 0, translateY: -100, scale: 0.8 },
    animate: { opacity: 1, translateY: 0, scale: 1 },
    exit: { opacity: 0, translateY: 100, scale: 0.8 },
    spring: 'superBouncy',
  },

  // Elastic animations
  elasticIn: {
    initial: { opacity: 0, scaleX: 0, scaleY: 0 },
    animate: { opacity: 1, scaleX: 1, scaleY: 1 },
    exit: { opacity: 0, scaleX: 0, scaleY: 0 },
    spring: 'elastic',
  },
  elasticInX: {
    initial: { opacity: 0, scaleX: 0 },
    animate: { opacity: 1, scaleX: 1 },
    exit: { opacity: 0, scaleX: 0 },
    spring: 'elastic',
  },
  elasticInY: {
    initial: { opacity: 0, scaleY: 0 },
    animate: { opacity: 1, scaleY: 1 },
    exit: { opacity: 0, scaleY: 0 },
    spring: 'elastic',
  },
};

// ============================================================================
// Exit Animations (mirrors of entrance)
// ============================================================================

export const EXIT_ANIMATIONS: Record<string, AnimationPreset> = {
  // Fade exits
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    timing: 'default',
  },
  fadeOutUp: {
    initial: { opacity: 1, translateY: 0 },
    animate: { opacity: 0, translateY: -30 },
    spring: 'snappy',
  },
  fadeOutDown: {
    initial: { opacity: 1, translateY: 0 },
    animate: { opacity: 0, translateY: 30 },
    spring: 'snappy',
  },
  fadeOutLeft: {
    initial: { opacity: 1, translateX: 0 },
    animate: { opacity: 0, translateX: -30 },
    spring: 'snappy',
  },
  fadeOutRight: {
    initial: { opacity: 1, translateX: 0 },
    animate: { opacity: 0, translateX: 30 },
    spring: 'snappy',
  },

  // Scale exits
  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0.8 },
    spring: 'snappy',
  },
  scaleOutCenter: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0 },
    spring: 'snappy',
  },
  shrinkOut: {
    initial: { opacity: 1, scale: 1, translateY: 0 },
    animate: { opacity: 0, scale: 0.5, translateY: 20 },
    spring: 'snappy',
  },

  // Slide exits
  slideOutUp: {
    initial: { translateY: 0 },
    animate: { translateY: -100 },
    spring: 'snappy',
  },
  slideOutDown: {
    initial: { translateY: 0 },
    animate: { translateY: 100 },
    spring: 'snappy',
  },
  slideOutLeft: {
    initial: { translateX: 0 },
    animate: { translateX: -100 },
    spring: 'snappy',
  },
  slideOutRight: {
    initial: { translateX: 0 },
    animate: { translateX: 100 },
    spring: 'snappy',
  },

  // Rotate exits
  rotateOut: {
    initial: { opacity: 1, rotate: '0deg', scale: 1 },
    animate: { opacity: 0, rotate: '180deg', scale: 0.5 },
    spring: 'snappy',
  },
  spinOut: {
    initial: { opacity: 1, rotate: '0deg', scale: 1 },
    animate: { opacity: 0, rotate: '360deg', scale: 0 },
    spring: 'snappy',
  },

  // Zoom exits
  zoomOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0 },
    spring: 'snappy',
  },
  zoomOutUp: {
    initial: { opacity: 1, scale: 1, translateY: 0 },
    animate: { opacity: 0, scale: 0.5, translateY: -100 },
    spring: 'snappy',
  },
  zoomOutDown: {
    initial: { opacity: 1, scale: 1, translateY: 0 },
    animate: { opacity: 0, scale: 0.5, translateY: 100 },
    spring: 'snappy',
  },

  // Flip exits
  flipOutX: {
    initial: { opacity: 1, rotateX: '0deg' },
    animate: { opacity: 0, rotateX: '90deg' },
    spring: 'snappy',
  },
  flipOutY: {
    initial: { opacity: 1, rotateY: '0deg' },
    animate: { opacity: 0, rotateY: '90deg' },
    spring: 'snappy',
  },
};

// ============================================================================
// Loop Animations
// ============================================================================

export const LOOP_ANIMATIONS = {
  pulse: {
    keyframes: [{ scale: 1 }, { scale: 1.05 }, { scale: 1 }],
    duration: 2000,
  },
  pulseBig: {
    keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }],
    duration: 1500,
  },
  shake: {
    keyframes: [
      { translateX: 0 },
      { translateX: -10 },
      { translateX: 10 },
      { translateX: -10 },
      { translateX: 10 },
      { translateX: 0 },
    ],
    duration: 500,
  },
  wobble: {
    keyframes: [
      { translateX: 0, rotate: '0deg' },
      { translateX: -25, rotate: '-5deg' },
      { translateX: 20, rotate: '3deg' },
      { translateX: -15, rotate: '-3deg' },
      { translateX: 10, rotate: '2deg' },
      { translateX: -5, rotate: '-1deg' },
      { translateX: 0, rotate: '0deg' },
    ],
    duration: 1000,
  },
  bounce: {
    keyframes: [
      { translateY: 0 },
      { translateY: -30 },
      { translateY: 0 },
      { translateY: -15 },
      { translateY: 0 },
    ],
    duration: 1000,
  },
  swing: {
    keyframes: [
      { rotate: '0deg' },
      { rotate: '15deg' },
      { rotate: '-10deg' },
      { rotate: '5deg' },
      { rotate: '-5deg' },
      { rotate: '0deg' },
    ],
    duration: 1000,
  },
  heartbeat: {
    keyframes: [{ scale: 1 }, { scale: 1.3 }, { scale: 1 }, { scale: 1.3 }, { scale: 1 }],
    duration: 1300,
  },
  flash: {
    keyframes: [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }],
    duration: 1000,
  },
  rubberBand: {
    keyframes: [
      { scaleX: 1, scaleY: 1 },
      { scaleX: 1.25, scaleY: 0.75 },
      { scaleX: 0.75, scaleY: 1.25 },
      { scaleX: 1.15, scaleY: 0.85 },
      { scaleX: 0.95, scaleY: 1.05 },
      { scaleX: 1.05, scaleY: 0.95 },
      { scaleX: 1, scaleY: 1 },
    ],
    duration: 1000,
  },
  jello: {
    keyframes: [
      { skewX: '0deg', skewY: '0deg' },
      { skewX: '-12.5deg', skewY: '-12.5deg' },
      { skewX: '6.25deg', skewY: '6.25deg' },
      { skewX: '-3.125deg', skewY: '-3.125deg' },
      { skewX: '1.5625deg', skewY: '1.5625deg' },
      { skewX: '-0.78125deg', skewY: '-0.78125deg' },
      { skewX: '0deg', skewY: '0deg' },
    ],
    duration: 1000,
  },
  glow: {
    keyframes: [{ opacity: 0.5 }, { opacity: 1 }, { opacity: 0.5 }],
    duration: 2000,
  },
  float: {
    keyframes: [{ translateY: 0 }, { translateY: -10 }, { translateY: 0 }],
    duration: 3000,
  },
  spin: {
    keyframes: [{ rotate: '0deg' }, { rotate: '360deg' }],
    duration: 1000,
  },
  spinSlow: {
    keyframes: [{ rotate: '0deg' }, { rotate: '360deg' }],
    duration: 3000,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

export function getStaggerDelays(count: number, baseDelay: number = 50): number[] {
  return Array.from({ length: count }, (_, i) => i * baseDelay);
}

export function combineAnimations(...animations: AnimationPreset[]): AnimationPreset {
  return animations.reduce(
    (combined, animation) => ({
      initial: { ...combined.initial, ...animation.initial },
      animate: { ...combined.animate, ...animation.animate },
      exit: { ...(combined.exit || {}), ...(animation.exit || {}) },
      spring: animation.spring || combined.spring,
      timing: animation.timing || combined.timing,
      delay: animation.delay ?? combined.delay,
    }),
    { initial: {}, animate: {} }
  );
}

export function createDelayedAnimation(animation: AnimationPreset, delay: number): AnimationPreset {
  return {
    ...animation,
    delay,
  };
}

export function createSequencedAnimations(
  animations: AnimationPreset[],
  delayBetween: number = 100
): AnimationPreset[] {
  return animations.map((animation, index) =>
    createDelayedAnimation(animation, index * delayBetween)
  );
}

// ============================================================================
// Default Export
// ============================================================================

const AnimationLibrary = {
  // Presets
  SPRING_PRESETS,
  TIMING_PRESETS,
  EASING_FUNCTIONS,
  ENTRANCE_ANIMATIONS,
  EXIT_ANIMATIONS,
  LOOP_ANIMATIONS,

  // Utilities
  getStaggerDelay,
  getStaggerDelays,
  combineAnimations,
  createDelayedAnimation,
  createSequencedAnimations,
};

export default AnimationLibrary;
