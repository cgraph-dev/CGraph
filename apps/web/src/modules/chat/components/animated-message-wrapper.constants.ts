/**
 * Animated message wrapper constants.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { springs, staggerConfigs } from '@/lib/animation-presets';

export const messageVariants = {
  initial: (isOwnMessage: boolean) => ({
    x: isOwnMessage ? 20 : -20,
    opacity: 0,
    scale: 0.97,
  }),
  animate: (custom: { index: number; speedMultiplier: number }) => ({
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      ...springs.snappy,
      delay: custom.index * staggerConfigs.fast.staggerChildren * custom.speedMultiplier,
    },
  }),
  exit: (isOwnMessage: boolean) => ({
    x: isOwnMessage ? 20 : -20,
    opacity: 0,
    scale: 0.95,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as const,
      height: { delay: 0.15, duration: durations.normal.ms / 1000 },
      marginBottom: { delay: 0.15, duration: durations.normal.ms / 1000 },
    },
  }),
  hover: {
    scale: 1.01,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.99,
  },
};
