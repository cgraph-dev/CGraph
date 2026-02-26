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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ease:        [0.25, 0.1,  0.25, 1.0]  as CubicBezier,
  /** Deceleration — elements entering the screen */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  easeOut:     [0.0,  0.0,  0.2,  1.0]  as CubicBezier,
  /** Acceleration — elements leaving the screen */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  easeIn:      [0.4,  0.0,  1.0,  1.0]  as CubicBezier,
  /** Symmetric ease — layout shifts */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  easeInOut:   [0.4,  0.0,  0.2,  1.0]  as CubicBezier,
  /** Spring-like overshoot feel via bezier */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  spring:      [0.175, 0.885, 0.32, 1.275] as CubicBezier,
  /** Bouncy settle via bezier */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  bounce:      [0.68, -0.55, 0.265, 1.55]  as CubicBezier,
  /** Material Design standard curve */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  material:    [0.4, 0.0, 0.2, 1.0]     as CubicBezier,
  /** Material Design deceleration */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  materialOut: [0.0, 0.0, 0.2, 1.0]     as CubicBezier,
  /** Material Design acceleration */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  materialIn:  [0.4, 0.0, 1.0, 1.0]     as CubicBezier,
  /** Smooth cubic */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  smooth:      [0.25, 0.46, 0.45, 0.94] as CubicBezier,
  /** Quad ease-out */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  quadOut:     [0.25, 0.46, 0.45, 0.94] as CubicBezier,
  /** Expo ease-out */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  expoOut:     [0.19, 1.0, 0.22, 1.0]   as CubicBezier,
  /** Circ ease-out */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  circOut:     [0.075, 0.82, 0.165, 1.0] as CubicBezier,
  /** Back ease-out (slight overshoot) */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  backOut:     [0.175, 0.885, 0.32, 1.275] as CubicBezier,
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
