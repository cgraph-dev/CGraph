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
export { CircuitBoardLogo } from './circuit-board-logo';
export { SvgDefs } from './svg/svg-defs';
export { CLetterTraces } from './svg/c-letter-traces';
export { GLetterTraces } from './svg/g-letter-traces';
export { CircuitNodes } from './svg/circuit-nodes';
export { CentralHub } from './svg/central-hub';
export { DataFlowParticles } from './svg/data-flow-particles';

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
