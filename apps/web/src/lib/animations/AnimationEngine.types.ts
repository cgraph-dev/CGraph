/**
 * Animation Engine - Types & Presets
 *
 * Type definitions, interfaces, and animation preset constants
 * extracted from AnimationEngine.ts.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

// gsap namespace types (gsap.EaseFunction, gsap.TweenVars) are globally
// declared via `declare namespace gsap` in gsap's type definitions — no import needed.

// =============================================================================
// TYPES
// =============================================================================

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string | gsap.EaseFunction;
  repeat?: number;
  yoyo?: boolean;
  stagger?: number;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  velocity?: number;
  clamp?: boolean;
}

export interface GestureConfig {
  enableHaptic?: boolean;
  threshold?: number;
  direction?: 'horizontal' | 'vertical' | 'all';
  bounds?: { min: number; max: number };
}

export interface SequenceStep {
  target: HTMLElement | string;
  animation: gsap.TweenVars;
  label?: string;
}

// =============================================================================
// ANIMATION PRESETS (Mobile-Inspired)
// =============================================================================

export const ANIMATION_PRESETS = {
  // Entrance animations inspired by mobile
  slideInFromRight: {
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromLeft: {
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromBottom: {
    from: { y: 100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromTop: {
    from: { y: -100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },

  // Scale animations
  scaleIn: {
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' },
  },
  scaleOut: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 0, opacity: 0, duration: 0.2, ease: 'back.in(1.7)' },
  },

  // Bounce animations (React Native style)
  bounceIn: {
    from: { scale: 0, opacity: 0 },
    to: {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    },
  },

  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: 0.3, ease: 'power1.out' },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0, duration: 0.2, ease: 'power1.in' },
  },

  // Rotation animations
  rotateIn: {
    from: { rotation: -180, scale: 0, opacity: 0 },
    to: { rotation: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' },
  },

  // Flip animations
  flipIn: {
    from: { rotationY: -90, opacity: 0 },
    to: { rotationY: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
  },

  // Shake animation (error feedback)
  shake: {
    from: { x: 0 },
    to: {
      x: 0,
      keyframes: {
        '0%': { x: 0 },
        '25%': { x: -10 },
        '50%': { x: 10 },
        '75%': { x: -10 },
        '100%': { x: 0 },
      },
      duration: 0.4,
      ease: 'power2.inOut',
    },
  },

  // Pulse animation
  pulse: {
    from: { scale: 1 },
    to: {
      scale: 1,
      keyframes: {
        '0%': { scale: 1 },
        '50%': { scale: 1.05 },
        '100%': { scale: 1 },
      },
      duration: 0.6,
      ease: 'sine.inOut',
    },
  },

  // Glow effect
  glowPulse: {
    from: { boxShadow: '0 0 5px rgba(16, 185, 129, 0.3)' },
    to: {
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    },
  },
} as const;
