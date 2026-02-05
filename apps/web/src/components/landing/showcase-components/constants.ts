/**
 * Showcase Components - Constants
 */

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const DEFAULT_STAGGER = 0.03;
export const DEFAULT_DURATION = 0.6;
export const DEFAULT_COUNTER_DURATION = 2;
export const DEFAULT_INTERVAL = 5000;

// =============================================================================
// SPRING CONFIGS
// =============================================================================

export const CARD_SPRING_CONFIG = { stiffness: 300, damping: 30 };
export const CARD_TRANSITION_SPRING = { stiffness: 200, damping: 25 };
export const MAGNETIC_SPRING_CONFIG = { stiffness: 150, damping: 15 };
export const TILT_SPRING_CONFIG = { stiffness: 300, damping: 30 };
export const TAB_SPRING_CONFIG = { stiffness: 300, damping: 30 };

// =============================================================================
// FLOATING CARD
// =============================================================================

export const DEFAULT_FLOAT_RANGE = 20;
export const DEFAULT_ROTATE_RANGE = 5;
export const DEFAULT_FLOAT_DURATION = 6;

// =============================================================================
// PARALLAX
// =============================================================================

export const DEFAULT_PARALLAX_SPEED = 0.5;

// =============================================================================
// MAGNETIC GRID
// =============================================================================

export const MAGNETIC_DISTANCE = 200;
export const MAGNETIC_FORCE_MULTIPLIER = 0.1;

// =============================================================================
// PERSPECTIVE TILT
// =============================================================================

export const DEFAULT_PERSPECTIVE = 1000;
export const DEFAULT_MAX_TILT = 15;

// =============================================================================
// COLORS
// =============================================================================

export const DEFAULT_PROGRESS_COLOR = '#10b981';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

export const REVEAL_DIRECTIONS = {
  up: { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
};

export const EASE_OUT_CUBIC = [0.22, 1, 0.36, 1];
