/**
 * Animation configs and constants for AnimatedReactionBubble.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

// =============================================================================
// SPRING CONFIGS
// =============================================================================

export const SPRING_SCALE = { stiffness: 400, damping: 15 } as const;
export const SPRING_ROTATE = { stiffness: 300, damping: 20 } as const;
export const SPRING_Y = { stiffness: 300, damping: 15 } as const;

// =============================================================================
// BOUNCE SEQUENCE
// =============================================================================

export const BOUNCE_ANIMATION = {
  scale: [1, 1.4, 0.9, 1.1, 1],
  rotateZ: [0, -10, 10, -5, 0],
  y: [0, -15, 0],
  transition: {
    duration: 0.6,
    times: [0, 0.2, 0.5, 0.7, 1],
    ease: 'easeInOut' as const,
  },
};

// =============================================================================
// GLOW KEYFRAMES
// =============================================================================

export const GLOW_ANIMATION = {
  boxShadow: [
    '0 0 0px rgba(16, 185, 129, 0)',
    '0 0 20px rgba(16, 185, 129, 0.5)',
    '0 0 0px rgba(16, 185, 129, 0)',
  ],
};

export const GLOW_TRANSITION = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
} as const;

// =============================================================================
// SHIMMER
// =============================================================================

export const SHIMMER_GRADIENT =
  'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)';

export const SHIMMER_TRANSITION = {
  duration: 2,
  repeat: Infinity,
  ease: 'linear' as const,
} as const;

// =============================================================================
// PARTICLE CONFIG
// =============================================================================

export const PARTICLE_COUNT = 8;
export const PARTICLE_DURATION_MS = 600;

// =============================================================================
// QUICK REACTIONS (used by ReactionPicker)
// =============================================================================

export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👏'] as const;
