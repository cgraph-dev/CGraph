/**
 * CGraph Mobile Typography System — matches web type scale.
 * @module theme/typography
 */

/** Font sizes (px) — matches web --text-* */
export const fontSize = {
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
} as const;

/** Line height multipliers — matches web --leading-* */
export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.375,
  relaxed: 1.5,
} as const;

/** Font weight strings for React Native */
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Letter spacing values (em equivalent → px at base size) */
export const letterSpacing = {
  tight: -0.13,   // -0.01em * 13
  normal: 0,
  wide: 0.26,     // 0.02em * 13
} as const;
