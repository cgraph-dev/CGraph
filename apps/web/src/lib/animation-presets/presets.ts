/**
 * Animation Presets - Core Presets
 *
 * Spring, tween, stagger, and entrance animation configurations.
 *
 * Numeric constants are sourced from @cgraph/animation-constants —
 * the canonical shared package for platform-agnostic values.
 * This file wraps them with Framer-Motion–specific fields (e.g. `type: 'spring'`).
 */

import { type Transition, type Variants } from 'framer-motion';
import {
  springs as sharedSprings,
  stagger as sharedStagger,
  durations as sharedDurations,
} from '@cgraph/animation-constants';

// =============================================================================
// DURATION PRESETS IN SECONDS (sourced from @cgraph/animation-constants)
// =============================================================================

/**
 * Duration presets in seconds — for inline use where only a raw number is needed.
 *
 * Prefer `tweens.*` when a full Framer Motion transition object is appropriate.
 * Use `durationsSec.*` for CSS transitions, setTimeout, or partial overrides.
 *
 * @example
 * ```tsx
 * style={{ transition: `opacity ${durationsSec.normal}s ease-out` }}
 * ```
 */
export const durationsSec = {
  instant: sharedDurations.instant.ms / 1000,
  fast: sharedDurations.fast.ms / 1000,
  normal: sharedDurations.normal.ms / 1000,
  slow: sharedDurations.slow.ms / 1000,
  smooth: sharedDurations.smooth.ms / 1000,
  slower: sharedDurations.slower.ms / 1000,
  dramatic: sharedDurations.dramatic.ms / 1000,
  verySlow: sharedDurations.verySlow.ms / 1000,
} as const;

// =============================================================================
// SPRING PRESETS (sourced from @cgraph/animation-constants + FM type tag)
// =============================================================================

const toFMSpring = (s: { stiffness: number; damping: number; mass: number }) =>
  ({ type: 'spring' as const, stiffness: s.stiffness, damping: s.damping }) as const;

export const springs = {
  gentle: toFMSpring(sharedSprings.gentle),
  default: toFMSpring(sharedSprings.default),
  bouncy: toFMSpring(sharedSprings.bouncy),
  snappy: toFMSpring(sharedSprings.snappy),
  superBouncy: toFMSpring(sharedSprings.superBouncy),
  dramatic: toFMSpring(sharedSprings.dramatic),
  wobbly: toFMSpring(sharedSprings.wobbly),
  stiff: toFMSpring(sharedSprings.stiff),
  smooth: toFMSpring(sharedSprings.smooth),
  ultraSmooth: toFMSpring(sharedSprings.ultraSmooth),
} as const;

// =============================================================================
// TWEEN PRESETS
// =============================================================================

export const tweens = {
  /** 0.1s — near-instant snap */
  instant: { duration: sharedDurations.instant.ms / 1000, ease: 'easeOut' },
  /** 0.15s — quick feedback (toggle, button) */
  quickFade: { duration: sharedDurations.fast.ms / 1000, ease: 'easeOut' },
  /** 0.2s — fast UI response */
  fast: { duration: sharedDurations.normal.ms / 1000, ease: 'easeOut' },
  /** 0.25s — brisk transition */
  brisk: { duration: 0.25, ease: 'easeOut' },
  /** 0.3s — standard UI transition */
  standard: { duration: sharedDurations.slow.ms / 1000, ease: 'easeInOut' },
  /** 0.4s — deliberate panel/modal transition */
  moderate: { duration: sharedDurations.smooth.ms / 1000, ease: 'easeInOut' },
  /** 0.5s — smooth, attention-getting */
  smooth: { duration: sharedDurations.slower.ms / 1000, ease: [0.4, 0, 0.2, 1] },
  /** 0.6s — emphatic reveal */
  emphatic: { duration: sharedDurations.dramatic.ms / 1000, ease: 'easeOut' },
  /** 0.8s — dramatic entrance */
  dramatic: { duration: sharedDurations.extended.ms / 1000, ease: [0.16, 1, 0.3, 1] },
  /** 1s — slow reveal, loading loops */
  slow: { duration: sharedDurations.verySlow.ms / 1000, ease: 'easeInOut' },
  /** 1.5s — extended ambient motion */
  verySlow: { duration: sharedDurations.ambient.ms / 1000, ease: 'easeInOut' },
  /** 2s — ambient glow/pulse loop */
  ambient: { duration: sharedDurations.loop.ms / 1000, ease: 'linear' },
  /** 2.5s — slow ambient cycle */
  ambientSlow: { duration: 2.5, ease: 'linear' },
  /** 3s — background decoration loop */
  decorative: { duration: sharedDurations.cinematic.ms / 1000, ease: 'linear' },
  /** 4s — very slow ambient background */
  glacial: { duration: 4, ease: 'easeInOut' },
} satisfies Record<string, Transition>;

/**
 * Create a looping transition from a tween preset.
 * Usage: `transition={loop(tweens.ambient)}` instead of `transition={{ duration: sharedDurations.loop.ms / 1000, repeat: Infinity }}`
 */
export const loop = (base: Transition): Transition => ({ ...base, repeat: Infinity });

/**
 * Create a looping transition with a pause between cycles.
 * Usage: `transition={loopWithDelay(tweens.slow, 1)}` instead of `transition={{ duration: sharedDurations.verySlow.ms / 1000, repeat: Infinity, repeatDelay: 1 }}`
 */
export const loopWithDelay = (base: Transition, repeatDelay: number): Transition => ({
  ...base,
  repeat: Infinity,
  repeatDelay,
});

// =============================================================================
// STAGGER CONFIGURATIONS (sourced from @cgraph/animation-constants)
// =============================================================================

export const staggerConfigs = {
  fast: sharedStagger.fast,
  standard: sharedStagger.standard,
  slow: { staggerChildren: 0.1, delayChildren: 0.2 },
  grid: sharedStagger.grid,
} as const;

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

export const entranceVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: tweens.standard },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springs.default },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: springs.default },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: springs.default },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: springs.default },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: springs.bouncy },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1, transition: springs.snappy },
  },
  slideUp: {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: springs.smooth },
  },
  flip: {
    hidden: { rotateX: -90, opacity: 0 },
    visible: { rotateX: 0, opacity: 1, transition: springs.dramatic },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: sharedDurations.slower.ms / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },
};
