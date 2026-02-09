/**
 * Stagger / choreography constants.
 *
 * Unified from:
 *   apps/web/src/lib/animation-presets/presets.ts (staggerConfigs)
 *   apps/mobile/src/lib/animations/AnimationLibrary.ts (getStaggerDelay)
 */

export interface StaggerConfig {
  /** Delay between each child, in seconds */
  readonly staggerChildren: number;
  /** Initial delay before the first child animates, in seconds */
  readonly delayChildren: number;
}

export const stagger = {
  /** Fast stagger — toasts, chips */
  fast:     { staggerChildren: 0.03, delayChildren: 0 },
  /** Default stagger — list items */
  standard: { staggerChildren: 0.05, delayChildren: 0.1 },
  /** Slow stagger — cards, heavy elements */
  slow:     { staggerChildren: 0.08, delayChildren: 0.15 },
  /** Grid stagger — grid layouts */
  grid:     { staggerChildren: 0.04, delayChildren: 0.05 },
} as const satisfies Record<string, StaggerConfig>;
