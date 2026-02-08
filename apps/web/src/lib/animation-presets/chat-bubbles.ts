/**
 * Animation Presets - Chat Bubble Animations
 *
 * Chat bubble animation configurations for different bubble styles.
 */

import { type Transition, type TargetAndTransition } from 'framer-motion';

import { springs } from './presets';

// =============================================================================
// CHAT BUBBLE ANIMATIONS BY STYLE
// =============================================================================

// Chat bubble style types - matches app bubble IDs
export type ChatBubbleStyleId =
  | 'bubble-default'
  | 'bubble-pill'
  | 'bubble-sharp'
  | 'bubble-telegram'
  | 'bubble-imessage'
  | 'bubble-discord'
  | 'bubble-whatsapp'
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
    transition: { delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
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
  'bubble-telegram': (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { delay, ...springs.snappy },
  }),
  'bubble-imessage': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.7, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-discord': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.2 },
  }),
  'bubble-whatsapp': (_isOwn: boolean, delay: number) => ({
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
    transition: { delay, duration: 0.3 },
  }),
  'bubble-cloud': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  'bubble-modern': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};
