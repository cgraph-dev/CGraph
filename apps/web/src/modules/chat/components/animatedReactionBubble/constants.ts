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
// SUPER REACTION CONFIG (premium feature)
// =============================================================================

export const SUPER_PARTICLE_COUNT = 14;
export const SUPER_PARTICLE_DURATION_MS = 1000;
export const SUPER_PARTICLE_DISTANCE = 80;

export const SUPER_BOUNCE_ANIMATION = {
  scale: [1, 1.8, 0.7, 1.3, 0.95, 1.1, 1],
  rotateZ: [0, -20, 20, -10, 10, -3, 0],
  y: [0, -25, 0],
  transition: {
    duration: 0.8,
    times: [0, 0.15, 0.35, 0.5, 0.65, 0.8, 1],
    ease: 'easeInOut' as const,
  },
};

export const SUPER_GLOW_BURST_ANIMATION = {
  scale: [0, 3, 0],
  opacity: [0, 0.8, 0],
};

export const SUPER_GLOW_BURST_TRANSITION = {
  duration: 0.7,
  ease: 'easeOut' as const,
} as const;

// =============================================================================
// QUICK REACTIONS (used by ReactionPicker)
// =============================================================================

export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👏'] as const;
