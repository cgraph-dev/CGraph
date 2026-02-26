/**
 * Easing curves as cubic-bézier control points.
 *
 * Framework adapters convert these to:
 *   - CSS `cubic-bezier(x1, y1, x2, y2)` strings
 *   - Reanimated `Easing.bezier(x1, y1, x2, y2)`
 *   - Framer Motion `[x1, y1, x2, y2]` tuples
 *
 * Unified from:
 *   apps/web/src/lib/animations.ts (easings)
 *   apps/mobile/src/lib/animations.ts (easings)
 *   apps/mobile/src/lib/animations/AnimationLibrary.ts (EASING_FUNCTIONS)
 */

/** Control points for a cubic bézier: [x1, y1, x2, y2] */
export type CubicBezier = readonly [number, number, number, number];

export const cubicBeziers = {
  /** Standard CSS ease */
  ease:        [0.25, 0.1,  0.25, 1.0],
  /** Deceleration — elements entering the screen */
  easeOut:     [0.0,  0.0,  0.2,  1.0],
  /** Acceleration — elements leaving the screen */
  easeIn:      [0.4,  0.0,  1.0,  1.0],
  /** Symmetric ease — layout shifts */
  easeInOut:   [0.4,  0.0,  0.2,  1.0],
  /** Spring-like overshoot feel via bezier */
  spring:      [0.175, 0.885, 0.32, 1.275],
  /** Bouncy settle via bezier */
  bounce:      [0.68, -0.55, 0.265, 1.55],
  /** Material Design standard curve */
  material:    [0.4, 0.0, 0.2, 1.0],
  /** Material Design deceleration */
  materialOut: [0.0, 0.0, 0.2, 1.0],
  /** Material Design acceleration */
  materialIn:  [0.4, 0.0, 1.0, 1.0],
  /** Smooth cubic */
  smooth:      [0.25, 0.46, 0.45, 0.94],
  /** Quad ease-out */
  quadOut:     [0.25, 0.46, 0.45, 0.94],
  /** Expo ease-out */
  expoOut:     [0.19, 1.0, 0.22, 1.0],
  /** Circ ease-out */
  circOut:     [0.075, 0.82, 0.165, 1.0],
  /** Back ease-out (slight overshoot) */
  backOut:     [0.175, 0.885, 0.32, 1.275],
} as const satisfies Record<string, CubicBezier>;

/**
 * Pre-formatted CSS cubic-bezier() strings for each curve.
 * Useful for inline styles and Tailwind plugins.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const easings = Object.fromEntries(
  Object.entries(cubicBeziers).map(([k, [x1, y1, x2, y2]]) => [
    k,
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
  ]),
) as { readonly [K in keyof typeof cubicBeziers]: string };
