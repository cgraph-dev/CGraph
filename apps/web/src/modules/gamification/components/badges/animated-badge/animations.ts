/**
 * Animation variants for rarity-based effects
 */

// Common: Subtle shimmer across the badge
export const shimmerAnimation = {
  backgroundPosition: ['200% 0%', '-200% 0%'],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Uncommon: Soft pulsing glow
export const pulseGlowAnimation = (glowColor: string) => ({
  boxShadow: [
    `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
    `0 0 16px ${glowColor}, 0 0 32px ${glowColor}`,
    `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
});

// Rare: Rotating gradient ring
export const rotatingRingAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

// Legendary: Aurora wave effect
export const auroraAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Mythic: Reality distortion
export const voidDistortionAnimation = {
  scale: [1, 1.02, 0.98, 1],
  rotate: [0, 2, -2, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};
