/**
 * AnimatedLogo Module
 *
 * Animated circuit-board CGraph logo with splash screen,
 * loading, and interactive animation variants.
 *
 * @module components/animated-logo
 */

// ── Main Component ─────────────────────────────────────────────────────
export { default } from './page';

// ── Sub-components ─────────────────────────────────────────────────────
export { CircuitBoardLogo } from './CircuitBoardLogo';
export { SvgDefs } from './svg/SvgDefs';
export { CLetterTraces } from './svg/CLetterTraces';
export { GLetterTraces } from './svg/GLetterTraces';
export { CircuitNodes } from './svg/CircuitNodes';
export { CentralHub } from './svg/CentralHub';
export { DataFlowParticles } from './svg/DataFlowParticles';

// ── Hooks ──────────────────────────────────────────────────────────────
export { useSplashAnimation } from './useSplashAnimation';

// ── Types ──────────────────────────────────────────────────────────────
export type {
  AnimatedLogoProps,
  CircuitBoardLogoProps,
  ColorPalette,
  ColorDefinition,
  SizeDimensions,
  SvgFilterIds,
} from './types';
export type { SplashAnimationState } from './useSplashAnimation';

// ── Constants ──────────────────────────────────────────────────────────
export {
  SIZE_MAP,
  COLOR_PALETTES,
  TRACE_DRAW_VARIANTS,
  NODE_APPEAR_VARIANTS,
  PULSE_VARIANTS,
  SPLASH_TIMINGS,
} from './constants';
