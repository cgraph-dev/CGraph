/**
 * Chat Effects Constants
 */

import type { MessageEffect } from '@/stores/chatEffectsStore';

/**
 * Effects that should show particle animations
 */
export const PARTICLE_EFFECTS: MessageEffect[] = [
  'confetti',
  'fireworks',
  'sparkle',
  'hearts',
  'stars',
  'snow',
  'fire',
  'sakura',
  'cosmic',
  'explosion',
];

/**
 * Check if an effect should show particles
 */
export function shouldShowParticles(effect: MessageEffect): boolean {
  return PARTICLE_EFFECTS.includes(effect);
}

/**
 * Typing indicator speed map (seconds)
 */
export const TYPING_SPEED_MAP = {
  slow: 0.8,
  normal: 0.5,
  fast: 0.3,
} as const;

/**
 * Typing indicator size map (pixels)
 */
export const TYPING_SIZE_MAP = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;
