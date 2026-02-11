/**
 * Inlined spring presets from @cgraph/animation-constants
 * Avoids cross-package dependency in the standalone landing app.
 */
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  default: { type: 'spring' as const, stiffness: 170, damping: 26 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  stiff: { type: 'spring' as const, stiffness: 300, damping: 30 },
  smooth: { type: 'spring' as const, stiffness: 150, damping: 20 },
} as const;
