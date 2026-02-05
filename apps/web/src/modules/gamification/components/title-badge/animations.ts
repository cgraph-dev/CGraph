/**
 * TitleBadge Animation Keyframes
 *
 * 25+ animation configurations for title badges.
 * Animations are organized by category:
 * - Basic: shimmer, glow, pulse, rainbow, wave, sparkle, bounce, float
 * - Elemental: fire, ice, electric
 * - Advanced: holographic, matrix, plasma, crystalline, ethereal
 * - Cosmic: cosmic, aurora, void
 * - Premium: lightning, nature, glitch, neon_flicker, inferno, blizzard, storm, divine, shadow
 */

// ==================== BASIC ANIMATIONS ====================

export const shimmerAnimation = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const glowAnimation = (glowColor: string) => ({
  boxShadow: [`0 0 5px ${glowColor}`, `0 0 15px ${glowColor}`, `0 0 5px ${glowColor}`],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
});

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const rainbowAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const waveAnimation = {
  y: [0, -2, 0, 2, 0],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const sparkleAnimation = {
  opacity: [1, 0.6, 1],
  scale: [1, 1.1, 1],
  transition: {
    duration: 0.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const bounceAnimation = {
  y: [0, -4, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: 'easeOut' as const,
  },
};

export const floatAnimation = {
  y: [0, -3, 0, 3, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ==================== ADVANCED ANIMATIONS ====================

/** Holographic: 3D prismatic color shift */
export const holographicAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  filter: [
    'hue-rotate(0deg) brightness(1)',
    'hue-rotate(180deg) brightness(1.2)',
    'hue-rotate(360deg) brightness(1)',
  ],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

/** Matrix: Cascading digital characters effect */
export const matrixAnimation = {
  textShadow: [
    '0 0 5px #00ff00, 0 2px 0 rgba(0,255,0,0.3)',
    '0 0 10px #00ff00, 0 4px 0 rgba(0,255,0,0.5)',
    '0 0 5px #00ff00, 0 2px 0 rgba(0,255,0,0.3)',
  ],
  opacity: [1, 0.85, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'steps(3)' as const,
  },
};

/** Plasma: Flowing energy field */
export const plasmaAnimation = {
  backgroundPosition: ['0% 50%', '50% 100%', '100% 50%', '50% 0%', '0% 50%'],
  boxShadow: [
    '0 0 10px rgba(139, 92, 246, 0.5)',
    '0 0 20px rgba(236, 72, 153, 0.5)',
    '0 0 10px rgba(59, 130, 246, 0.5)',
    '0 0 20px rgba(139, 92, 246, 0.5)',
    '0 0 10px rgba(139, 92, 246, 0.5)',
  ],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

/** Crystalline: Growing crystal formations */
export const crystallineAnimation = {
  boxShadow: [
    '0 0 5px rgba(147, 197, 253, 0.5), inset 0 0 5px rgba(147, 197, 253, 0.2)',
    '0 0 15px rgba(147, 197, 253, 0.7), inset 0 0 10px rgba(147, 197, 253, 0.4)',
    '0 0 5px rgba(147, 197, 253, 0.5), inset 0 0 5px rgba(147, 197, 253, 0.2)',
  ],
  scale: [1, 1.02, 1],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/** Ethereal: Ghost-like fade in/out */
export const etherealAnimation = {
  opacity: [0.6, 1, 0.6],
  filter: ['blur(0px)', 'blur(0.5px)', 'blur(0px)'],
  y: [0, -2, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ==================== COSMIC ANIMATIONS ====================

/** Cosmic: Starfield background */
export const cosmicAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%'],
  boxShadow: [
    '0 0 10px rgba(99, 102, 241, 0.4)',
    '0 0 20px rgba(99, 102, 241, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
    '0 0 10px rgba(99, 102, 241, 0.4)',
  ],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

/** Aurora: Northern lights effect */
export const auroraAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  boxShadow: [
    '0 0 10px rgba(34, 211, 238, 0.4)',
    '0 0 15px rgba(74, 222, 128, 0.5)',
    '0 0 10px rgba(168, 85, 247, 0.4)',
    '0 0 15px rgba(34, 211, 238, 0.5)',
    '0 0 10px rgba(34, 211, 238, 0.4)',
  ],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

/** Void: Black hole distortion */
export const voidAnimation = {
  boxShadow: [
    '0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(139, 92, 246, 0.3)',
    '0 0 20px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(139, 92, 246, 0.5)',
    '0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(139, 92, 246, 0.3)',
  ],
  scale: [1, 0.98, 1.02, 1],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ==================== PREMIUM ANIMATIONS ====================

/** Lightning: Random electric arcs */
export const lightningAnimation = {
  boxShadow: [
    '0 0 5px rgba(234, 179, 8, 0.3)',
    '0 0 20px rgba(234, 179, 8, 0.8), 0 0 40px rgba(234, 179, 8, 0.4)',
    '0 0 5px rgba(234, 179, 8, 0.3)',
    '0 0 25px rgba(234, 179, 8, 0.9), 0 0 50px rgba(234, 179, 8, 0.5)',
    '0 0 5px rgba(234, 179, 8, 0.3)',
  ],
  opacity: [1, 1, 0.9, 1, 1],
  transition: {
    duration: 0.8,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.1, 0.2, 0.3, 1],
  },
};

/** Nature: Growing vines/leaves */
export const natureAnimation = {
  boxShadow: [
    '0 0 8px rgba(34, 197, 94, 0.4)',
    '0 0 16px rgba(34, 197, 94, 0.6), 0 0 24px rgba(74, 222, 128, 0.3)',
    '0 0 8px rgba(34, 197, 94, 0.4)',
  ],
  scale: [1, 1.03, 1],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/** Glitch: Digital corruption */
export const glitchAnimation = {
  x: [0, -2, 2, -1, 0],
  textShadow: [
    '0 0 0 transparent',
    '2px 0 0 rgba(255, 0, 0, 0.5), -2px 0 0 rgba(0, 255, 255, 0.5)',
    '-2px 0 0 rgba(255, 0, 0, 0.5), 2px 0 0 rgba(0, 255, 255, 0.5)',
    '0 0 0 transparent',
    '0 0 0 transparent',
  ],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2,
    ease: 'linear' as const,
  },
};

/** Neon flicker: Neon sign effect */
export const neonFlickerAnimation = {
  opacity: [1, 0.8, 1, 1, 0.9, 1],
  boxShadow: [
    '0 0 10px rgba(236, 72, 153, 0.8)',
    '0 0 5px rgba(236, 72, 153, 0.4)',
    '0 0 15px rgba(236, 72, 153, 1)',
    '0 0 10px rgba(236, 72, 153, 0.8)',
    '0 0 5px rgba(236, 72, 153, 0.6)',
    '0 0 10px rgba(236, 72, 153, 0.8)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.1, 0.2, 0.5, 0.8, 1],
  },
};

/** Inferno: Intense fire particles */
export const infernoAnimation = {
  boxShadow: [
    '0 0 10px rgba(239, 68, 68, 0.6), 0 -5px 15px rgba(251, 146, 60, 0.4)',
    '0 0 20px rgba(239, 68, 68, 0.8), 0 -8px 25px rgba(251, 146, 60, 0.6)',
    '0 0 10px rgba(239, 68, 68, 0.6), 0 -5px 15px rgba(251, 146, 60, 0.4)',
  ],
  y: [0, -1, 0],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/** Blizzard: Swirling ice/snow */
export const blizzardAnimation = {
  boxShadow: [
    '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(219, 234, 254, 0.3)',
    '0 0 15px rgba(147, 197, 253, 0.7), 0 0 30px rgba(219, 234, 254, 0.5)',
    '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(219, 234, 254, 0.3)',
  ],
  scale: [1, 1.01, 0.99, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/** Storm: Lightning + clouds */
export const stormAnimation = {
  boxShadow: [
    '0 0 10px rgba(100, 116, 139, 0.5)',
    '0 0 25px rgba(234, 179, 8, 0.8), 0 0 40px rgba(100, 116, 139, 0.6)',
    '0 0 10px rgba(100, 116, 139, 0.5)',
    '0 0 15px rgba(100, 116, 139, 0.6)',
  ],
  opacity: [1, 1, 0.95, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.15, 0.2, 1],
  },
};

/** Divine: Golden rays + particles */
export const divineAnimation = {
  boxShadow: [
    '0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
    '0 0 25px rgba(251, 191, 36, 0.7), 0 0 50px rgba(251, 191, 36, 0.4)',
    '0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
  ],
  filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/** Shadow: Dark wisps + smoke */
export const shadowAnimation = {
  boxShadow: [
    '0 0 10px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(0, 0, 0, 0.5)',
    '0 0 20px rgba(0, 0, 0, 0.9), 0 8px 25px rgba(0, 0, 0, 0.7)',
    '0 0 10px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(0, 0, 0, 0.5)',
  ],
  y: [0, 1, 0],
  opacity: [0.9, 1, 0.9],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};
