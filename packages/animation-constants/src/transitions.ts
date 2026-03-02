/**
 * Pre-composed transition presets.
 *
 * Ready-to-use animation configurations for Framer Motion and Reanimated.
 * Each preset bundles initial/animate/exit states with timing from the
 * shared duration, easing, and spring constants.
 *
 * @module animation-constants/transitions
 */

import { durations } from './durations';
import { cubicBeziers } from './easings';
import { springs } from './springs';

// ── Framer Motion Transition Presets ────────────────────────────────────

export const transitions = {
  /** Page enter — subtle fade + slide up, used for route transitions */
  pageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: durations.normal.ms / 1000, ease: cubicBeziers.easeOut },
  },

  /** Modal slide up — spring-driven bottom sheet / modal entrance */
  modalSlideUp: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
    transition: {
      type: 'spring' as const,
      stiffness: springs.gentle.stiffness,
      damping: springs.gentle.damping,
      mass: springs.gentle.mass,
    },
  },

  /** Drawer slide in — right-side drawer with snappy spring */
  drawerSlideIn: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: {
      type: 'spring' as const,
      stiffness: springs.snappy.stiffness,
      damping: springs.snappy.damping,
      mass: springs.snappy.mass,
    },
  },

  /** Simple fade in — for overlays, tooltips, subtle reveals */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast.ms / 1000 },
  },

  /** List item stagger — child items animate in sequence */
  listItemStagger: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },

  /** Spring bounce — emphasis spring for interactive elements */
  springBounce: {
    transition: {
      type: 'spring' as const,
      stiffness: springs.bouncy.stiffness,
      damping: springs.bouncy.damping,
      mass: springs.bouncy.mass,
    },
  },

  /** Scale press — subtle press feedback for tappable elements */
  scalePress: {
    whileTap: { scale: 0.97 },
    transition: {
      type: 'spring' as const,
      stiffness: springs.snappy.stiffness,
      damping: springs.snappy.damping,
      mass: springs.snappy.mass,
    },
  },

  /** Slide down — for dropdowns, notifications entering from top */
  slideDown: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: durations.normal.ms / 1000, ease: cubicBeziers.easeOut },
  },

  /** Scale in — for popovers, context menus */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: durations.fast.ms / 1000, ease: cubicBeziers.easeOut },
  },
} as const;

// ── React Native / Reanimated Presets ───────────────────────────────────

/**
 * Reanimated-compatible presets with raw numeric values.
 * Use with `withTiming`, `withSpring`, `FadeIn`, `SlideInRight`, etc.
 */
export const rnTransitions = {
  /** Page enter timing config */
  pageEnter: { duration: durations.normal.ms, easing: 'easeOut' as const },

  /** Modal slide up spring config */
  modalSlideUp: {
    damping: springs.gentle.damping,
    stiffness: springs.gentle.stiffness,
    mass: springs.gentle.mass,
  },

  /** Simple fade in timing */
  fadeIn: { duration: durations.fast.ms },

  /** Drawer slide spring config */
  drawerSlide: {
    damping: springs.snappy.damping,
    stiffness: springs.snappy.stiffness,
    mass: springs.snappy.mass,
  },

  /** List stagger step in ms */
  listStaggerStep: durations.stagger.ms,
} as const;
