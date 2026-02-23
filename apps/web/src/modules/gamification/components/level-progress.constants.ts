/**
 * Level progress bar constant definitions.
 * @module
 */
import type { Transition } from 'framer-motion';

// ── XP Calculation ──────────────────────────────────────────────────

const BASE_XP = 100;
const XP_EXPONENT = 1.8;

/** XP required to reach a given level. */
export function calculateXPForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, XP_EXPONENT));
}

/** Streak-based XP multiplier thresholds. */
export function getStreakMultiplier(days: number): number {
  if (days >= 7) return 2.0;
  if (days >= 3) return 1.5;
  return 1.0;
}

// ── Notification timing ─────────────────────────────────────────────

/** How long (ms) the "+XP" toast stays visible. */
export const XP_NOTIFICATION_DURATION = 3000;

// ── Shared framer-motion presets ────────────────────────────────────

export const glowPulseCompact = {
  opacity: [0.3, 0.6, 0.3],
  scale: [1, 1.2, 1],
};

export const glowPulseExpanded = {
  opacity: [0.2, 0.5, 0.2],
  scale: [1, 1.3, 1],
};

export const glowTransitionCompact: Transition = { duration: 2, repeat: Infinity };
export const glowTransitionExpanded: Transition = { duration: 3, repeat: Infinity };

export const shimmerTransition: Transition = {
  duration: 3,
  repeat: Infinity,
  ease: 'linear' as const,
};

export const progressBarTransitionCompact: Transition = { duration: 1, ease: 'easeOut' as const };
export const progressBarTransitionExpanded: Transition = {
  duration: 1.5,
  ease: 'easeOut' as const,
};

export const barShimmerTransition: Transition = {
  duration: 2,
  repeat: Infinity,
  ease: 'linear' as const,
};
