/**
 * Animation keyframes and constants for avatar borders
 */

import { durations } from '@cgraph/animation-constants';
import type { BorderTheme, ParticleType } from '@/types/avatar-borders';
import type { BorderColors } from './types';

// ==================== ANIMATION KEYFRAMES ====================

export const ANIMATION_KEYFRAMES = {
  rotate: {
    rotate: [0, 360],
    transition: {
      duration: durations.cinematic.ms / 1000,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: durations.loop.ms / 1000,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  glow: {
    boxShadow: [
      '0 0 10px var(--glow-color)',
      '0 0 25px var(--glow-color)',
      '0 0 10px var(--glow-color)',
    ],
    transition: {
      duration: durations.loop.ms / 1000,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: durations.cinematic.ms / 1000,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
  wave: {
    y: [0, -3, 0, 3, 0],
    transition: {
      duration: durations.loop.ms / 1000,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  spark: {
    opacity: [0.5, 1, 0.5],
    scale: [0.9, 1.1, 0.9],
    transition: {
      duration: durations.slower.ms / 1000,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  float: {
    y: [0, -5, 0],
    transition: {
      duration: durations.cinematic.ms / 1000,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  bounce: {
    scale: [1, 1.08, 1],
    transition: {
      duration: durations.dramatic.ms / 1000,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  },
  ripple: {
    scale: [1, 1.2],
    opacity: [0.6, 0],
    transition: {
      duration: durations.ambient.ms / 1000,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  },
  orbit: (index: number, total: number) => ({
    rotate: [0, 360],
    transition: {
      duration: 4 + index * 0.5,
      repeat: Infinity,
      ease: 'linear' as const,
      delay: (index / total) * 2,
    },
  }),
};

// ==================== HELPER FUNCTIONS ====================

/** Derive animation type from border type */
export function getAnimationTypeFromBorder(borderType: string): string {
  if (borderType.includes('rotating') || borderType.includes('ring')) return 'rotate';
  if (borderType.includes('pulse') || borderType.includes('heartbeat')) return 'pulse';
  if (borderType.includes('glow') || borderType.includes('radiance')) return 'glow';
  if (borderType.includes('shimmer') || borderType.includes('prismatic')) return 'shimmer';
  if (borderType.includes('wave') || borderType.includes('flow')) return 'wave';
  if (borderType.includes('spark') || borderType.includes('fire') || borderType.includes('flame'))
    return 'spark';
  if (borderType.includes('float') || borderType.includes('bubble')) return 'float';
  if (borderType.includes('ripple')) return 'ripple';
  if (borderType.includes('bounce')) return 'bounce';
  if (borderType === 'static' || borderType === 'none') return 'none';
  return 'pulse'; // Default fallback
}

/** Get particle type from border type */
export function getParticleTypeFromBorder(borderType: string): ParticleType {
  if (borderType.includes('fire') || borderType.includes('flame') || borderType.includes('inferno'))
    return 'flame';
  if (
    borderType.includes('sakura') ||
    borderType.includes('cherry') ||
    borderType.includes('petal')
  )
    return 'petal';
  if (
    borderType.includes('spark') ||
    borderType.includes('electric') ||
    borderType.includes('lightning')
  )
    return 'sparkle';
  if (borderType.includes('bubble') || borderType.includes('water')) return 'bubble';
  if (
    borderType.includes('star') ||
    borderType.includes('cosmic') ||
    borderType.includes('stellar')
  )
    return 'star';
  if (borderType.includes('snow') || borderType.includes('frost') || borderType.includes('ice'))
    return 'snowflake';
  if (borderType.includes('leaf') || borderType.includes('nature') || borderType.includes('vine'))
    return 'leaf';
  if (borderType.includes('coin') || borderType.includes('golden')) return 'circle';
  if (borderType.includes('heart')) return 'heart';
  if (borderType.includes('pixel') || borderType.includes('8bit')) return 'pixel';
  if (borderType.includes('gear') || borderType.includes('steampunk')) return 'gear';
  if (borderType.includes('rune') || borderType.includes('ancient')) return 'rune';
  return 'sparkle'; // Default fallback
}

// ==================== THEME-SPECIFIC STYLES ====================

export const getThemeStyles = (theme: BorderTheme, colors: BorderColors): React.CSSProperties => {
  const baseGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;

  const themeOverrides: Partial<Record<BorderTheme, React.CSSProperties>> = {
    '8bit': {
      imageRendering: 'pixelated',
      borderRadius: '0',
    },
    japanese: { borderRadius: '50%' },
    anime: { borderRadius: '50%' },
    cyberpunk: {
      clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
      borderRadius: '4px',
    },
    gothic: { borderRadius: '50%' },
    kawaii: { borderRadius: '50%' },
    steampunk: { borderRadius: '50%' },
    vaporwave: { borderRadius: '50%' },
    nature: { borderRadius: '50%' },
    cosmic: { borderRadius: '50%' },
    elemental: { borderRadius: '50%' },
    fantasy: { borderRadius: '50%' },
    scifi: {
      clipPath: 'polygon(5% 0, 100% 0, 100% 95%, 95% 100%, 0 100%, 0 5%)',
    },
    minimal: { borderRadius: '50%' },
    gaming: { borderRadius: '8px' },
    seasonal: { borderRadius: '50%' },
    achievement: { borderRadius: '50%' },
    premium: { borderRadius: '50%' },
    free: { borderRadius: '50%' },
  };

  return {
    background: baseGradient,
    ...themeOverrides[theme],
  };
};
