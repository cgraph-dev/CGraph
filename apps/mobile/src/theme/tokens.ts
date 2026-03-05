/**
 * CGraph Mobile Design Tokens — mirrors web CSS custom properties.
 * @module theme/tokens
 */

/** Spacing scale (px) — matches web --space-* values */
export const space = {
  0: 0,
  px: 1,
  '0.5': 2,
  1: 4,
  '1.5': 6,
  2: 8,
  '2.5': 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Border radii — matches web --radius-* */
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

/** Z-index layers — matches web --z-* */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const;

/** Duration scale (ms) — matches web --duration-* */
export const duration = {
  instant: 50,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

/** Layout dimensions */
export const layout = {
  sidebarWidth: 240,
  headerHeight: 48,
  tabBarHeight: 56,
  bottomSheetHandle: 24,
} as const;
