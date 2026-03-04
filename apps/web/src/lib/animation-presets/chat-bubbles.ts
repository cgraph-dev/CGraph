/**
 * Animation Presets - Chat Bubble Animations
 *
 * Chat bubble animation configurations for different bubble styles.
 */

import { durations, springs as sharedSprings, stagger } from '@cgraph/animation-constants';
import { type Transition, type TargetAndTransition } from 'motion/react';

import { springs } from './presets';

// =============================================================================
// CHAT BUBBLE ANIMATIONS BY STYLE
// =============================================================================

// Chat bubble style types - matches app bubble IDs
export type ChatBubbleStyleId =
  | 'bubble-default'
  | 'bubble-pill'
  | 'bubble-sharp'
  | 'bubble-asymmetric'
  | 'bubble-aero'
  | 'bubble-flat'
  | 'bubble-compact'
  | 'bubble-retro'
  | 'bubble-neon'
  | 'bubble-minimal'
  | 'bubble-cloud'
  | 'bubble-modern'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'default';

export const chatBubbleAnimations: Record<
  string,
  (
    isOwn: boolean,
    delay: number
  ) => {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    transition: Transition;
  }
> = {
  // Standard style names
  rounded: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.bouncy },
  }),
  sharp: (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  cloud: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  modern: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: durations.slower.ms / 1000, ease: [0.4, 0, 0.2, 1] },
  }),
  retro: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { delay, ...springs.dramatic },
  }),
  default: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, ...springs.default },
  }),

  // App-specific bubble IDs (mapped to animations)
  'bubble-default': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-pill': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, borderRadius: '0px' },
    animate: { opacity: 1, scale: 1, borderRadius: '9999px' },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-sharp': (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 30 : -30 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  'bubble-asymmetric': (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { delay, ...springs.snappy },
  }),
  'bubble-aero': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.7, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-flat': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: durations.normal.ms / 1000 },
  }),
  'bubble-compact': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.9, y: 5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-retro': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { delay, ...springs.dramatic },
  }),
  'bubble-neon': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { delay, ...springs.bouncy },
  }),
  'bubble-minimal': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration: durations.slow.ms / 1000 },
  }),
  'bubble-cloud': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-modern': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: durations.slower.ms / 1000, ease: [0.4, 0, 0.2, 1] },
  }),
};

// =============================================================================
// DIRECTIONAL ENTRANCE VARIANTS
// =============================================================================

/** Message entrance variant — direction-aware slide + fade */
export const messageEntranceVariants = {
  /** Sent message (slides from right) */
  sent: {
    initial: { opacity: 0, x: 20, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      type: 'spring' as const,
      stiffness: sharedSprings.snappy.stiffness,
      damping: sharedSprings.snappy.damping,
    },
  },
  /** Received message (slides from left) */
  received: {
    initial: { opacity: 0, x: -20, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      type: 'spring' as const,
      stiffness: sharedSprings.snappy.stiffness,
      damping: sharedSprings.snappy.damping,
    },
  },
} as const;

/** Stagger container for batch message arrivals */
export const messageListStagger = {
  animate: {
    transition: {
      staggerChildren: stagger.fast.staggerChildren,
    },
  },
} as const;

/** Typing indicator pulse */
export const typingIndicatorVariants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
} as const;
