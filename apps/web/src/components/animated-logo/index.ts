/**
 * AnimatedLogo module barrel exports
 */

// Main component
export { default } from './page';

// Sub-components
export { CircuitBoardLogo } from './CircuitBoardLogo';

// Types
export type {
  AnimatedLogoProps,
  CircuitBoardLogoProps,
  ColorPalette,
  ColorDefinition,
  SizeDimensions,
  SvgFilterIds,
} from './types';

// Constants
export {
  SIZE_MAP,
  COLOR_PALETTES,
  TRACE_DRAW_VARIANTS,
  NODE_APPEAR_VARIANTS,
  PULSE_VARIANTS,
  SPLASH_TIMINGS,
} from './constants';
