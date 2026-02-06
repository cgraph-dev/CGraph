import type React from 'react';
import type { ProfileThemeConfig } from '@/data/profileThemes';
import { BACKGROUND_ANIMATIONS, PARTICLE_CONFIGS, type ParticleType } from '@/data/profileThemes';
import type { Particle } from './types';

/** Get background animation props for motion.div */
export function getBackgroundAnimation(theme: ProfileThemeConfig) {
  if (!theme.backgroundAnimation || theme.backgroundAnimation === 'none') {
    return {};
  }

  const animation = BACKGROUND_ANIMATIONS[theme.backgroundAnimation];
  return {
    animate: animation,
    transition: {
      duration: theme.backgroundAnimationDuration || 5,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  };
}

/** Get overlay CSS styles based on overlay type */
export function getOverlayStyles(theme: ProfileThemeConfig): React.CSSProperties {
  switch (theme.overlayType) {
    case 'scanlines':
      return {
        backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,${theme.overlayOpacity || 0.1}) 2px,
            rgba(0,0,0,${theme.overlayOpacity || 0.1}) 4px
          )`,
      };
    case 'holographic':
      return {
        background: `linear-gradient(
            135deg,
            rgba(255,0,255,${theme.overlayOpacity || 0.1}),
            rgba(0,255,255,${theme.overlayOpacity || 0.1}),
            rgba(255,255,0,${theme.overlayOpacity || 0.1})
          )`,
        mixBlendMode: 'overlay' as const,
      };
    case 'grid':
      return {
        backgroundImage: `
            linear-gradient(rgba(255,255,255,${theme.overlayOpacity || 0.05}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,${theme.overlayOpacity || 0.05}) 1px, transparent 1px)
          `,
        backgroundSize: '20px 20px',
      };
    case 'vignette':
      return {
        background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${theme.overlayOpacity || 0.3}) 100%)`,
      };
    case 'noise':
      return {
        opacity: theme.overlayOpacity || 0.05,
        filter: 'url(#noise)',
      };
    case 'rays':
      return {
        background: `conic-gradient(from 0deg at 50% 50%, transparent, rgba(255,255,255,${theme.overlayOpacity || 0.1}), transparent)`,
      };
    default:
      return {};
  }
}

/** Get particle motion animation based on particle type */
export function getParticleAnimation(_particle: Particle, particleType: ParticleType) {
  const config = PARTICLE_CONFIGS[particleType];
  const baseY = config.velocity.y.min < 0 ? -30 : 30;

  return {
    y: [0, baseY, 0],
    x: [0, (Math.random() - 0.5) * 20, 0],
    opacity: [config.opacity.min, config.opacity.max, config.opacity.min],
    scale: config.rotation ? [1, 1.2, 1] : undefined,
    rotate: config.rotation ? [0, 360] : undefined,
  };
}
