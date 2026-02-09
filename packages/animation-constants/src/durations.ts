/**
 * Duration constants in milliseconds.
 *
 * Unified from:
 *   apps/web/src/lib/animations.ts (durations)
 *   apps/mobile/src/lib/animations.ts (timings)
 *   apps/mobile/src/lib/animations/AnimationLibrary.ts (TIMING_PRESETS)
 */

export interface DurationPreset {
  /** Duration in milliseconds */
  readonly ms: number;
}

export const durations = {
  /** ~100 ms — near-instant micro-interactions */
  instant:  { ms: 100 },
  /** 150 ms — fast feedback (button press, toggle) */
  fast:     { ms: 150 },
  /** 200 ms — default UI transitions */
  normal:   { ms: 200 },
  /** 300 ms — moderate transitions (modals, panels) */
  slow:     { ms: 300 },
  /** 400 ms — smooth, deliberate motion */
  smooth:   { ms: 400 },
  /** 500 ms — attention-grabbing motion */
  slower:   { ms: 500 },
  /** 600 ms — dramatic reveals */
  dramatic: { ms: 600 },
  /** 1000 ms — very slow, ambient motion */
  verySlow: { ms: 1000 },
  /** 50 ms — per-item stagger step */
  stagger:  { ms: 50 },
} as const satisfies Record<string, DurationPreset>;
