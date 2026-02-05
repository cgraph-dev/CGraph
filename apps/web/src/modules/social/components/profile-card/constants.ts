/**
 * ProfileCard - Constants
 */

import type { SizeConfig, ProfileHoverEffect } from './types';

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

export const SIZE_CONFIG: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    avatar: 48,
    padding: 'p-3',
    titleSize: 'text-sm',
    textSize: 'text-xs',
  },
  md: {
    avatar: 64,
    padding: 'p-4',
    titleSize: 'text-base',
    textSize: 'text-sm',
  },
  lg: {
    avatar: 96,
    padding: 'p-6',
    titleSize: 'text-lg',
    textSize: 'text-base',
  },
};

// =============================================================================
// HOVER EFFECT VARIANTS
// =============================================================================

export const getHoverVariants = (effect: ProfileHoverEffect) => {
  switch (effect) {
    case 'scale':
      return {
        initial: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 },
      };
    case 'tilt':
      return {
        initial: { rotateX: 0, rotateY: 0 },
        hover: { rotateX: 5, rotateY: 5 },
        tap: { scale: 0.98 },
      };
    case 'glow':
      return {
        initial: { boxShadow: '0 0 0 rgba(0,0,0,0)' },
        hover: { boxShadow: '0 0 30px var(--glow-color, rgba(34, 197, 94, 0.5))' },
        tap: { scale: 0.98 },
      };
    case 'border-animate':
      return {
        initial: { borderColor: 'transparent' },
        hover: { borderColor: 'var(--accent-color)' },
        tap: { scale: 0.98 },
      };
    default:
      return {
        initial: { scale: 1 },
        hover: { scale: 1 },
        tap: { scale: 1 },
      };
  }
};

// =============================================================================
// STYLE HELPERS
// =============================================================================

export const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  full: '1.5rem',
};
