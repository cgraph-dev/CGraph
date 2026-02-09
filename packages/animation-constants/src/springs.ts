/**
 * Spring physics presets.
 *
 * Each preset stores raw stiffness / damping / mass values
 * that Framer Motion and Reanimated both understand directly.
 */

export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/**
 * Named spring presets — superset of both web and mobile overlapping presets.
 *
 * Sources reconciled from:
 *   apps/web/src/lib/animation-presets/presets.ts  (springs)
 *   apps/mobile/src/lib/animations/AnimationLibrary.ts (SPRING_PRESETS)
 */
export const springs = {
  /** Slow, soft motion — tooltips, subtle reveals */
  gentle:      { stiffness: 120, damping: 14, mass: 1 },
  /** General-purpose motion */
  default:     { stiffness: 170, damping: 26, mass: 1 },
  /** Noticeable overshoot — toggles, switches */
  bouncy:      { stiffness: 300, damping: 10, mass: 1 },
  /** Fast settle, crisp feel — tabs, selections */
  snappy:      { stiffness: 400, damping: 30, mass: 1 },
  /** Heavy overshoot — celebrations, badges */
  superBouncy: { stiffness: 500, damping: 8,  mass: 1 },
  /** Cinematic / hero transitions */
  dramatic:    { stiffness: 200, damping: 20, mass: 2 },
  /** Playful wobble — alerts, warnings */
  wobbly:      { stiffness: 180, damping: 12, mass: 1 },
  /** Rigid, minimal overshoot — snackbars */
  stiff:       { stiffness: 300, damping: 30, mass: 0.8 },
  /** Gentle deceleration — modals, drawers */
  smooth:      { stiffness: 150, damping: 20, mass: 1 },
  /** Very gentle deceleration — background layers */
  ultraSmooth: { stiffness: 100, damping: 18, mass: 1 },
  /** Near-instant — micro-interactions */
  instant:     { stiffness: 500, damping: 35, mass: 0.5 },
  /** Gradual approach — parallax, scrolling */
  slow:        { stiffness: 80,  damping: 20, mass: 1.5 },
  /** Rubber-band overstretch — pull-to-refresh */
  elastic:     { stiffness: 400, damping: 6,  mass: 0.8 },
} as const satisfies Record<string, SpringConfig>;
