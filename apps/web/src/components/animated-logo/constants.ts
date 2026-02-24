/**
 * AnimatedLogo constants
 * Extracted from AnimatedLogo.tsx for modularity
 */

import type { Variants } from 'framer-motion';
import type { ColorDefinition, SizeDimensions } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * Size presets for different use cases
 */
export const SIZE_MAP: Record<string, SizeDimensions> = {
  sm: { container: 48, text: 'text-xl', logo: 40 },
  md: { container: 80, text: 'text-3xl', logo: 64 },
  lg: { container: 120, text: 'text-4xl', logo: 96 },
  xl: { container: 180, text: 'text-6xl', logo: 144 },
  hero: { container: 280, text: 'text-8xl', logo: 220 },
};

/**
 * Color palettes for different themes
 */
export const COLOR_PALETTES: Record<string, ColorDefinition> = {
  default: {
    primary: '#00d4ff', // Cyan
    secondary: '#8b5cf6', // Purple
    tertiary: '#10b981', // Emerald
  },
  cyan: {
    primary: '#00d4ff',
    secondary: '#06b6d4',
    tertiary: '#0891b2',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    tertiary: '#06b6d4',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    tertiary: '#06b6d4',
  },
};

/**
 * Animation variants for drawing circuit traces
 * Creates an electricity-flowing-through-circuits effect
 */
export const TRACE_DRAW_VARIANTS: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.6, delay, ease: 'easeOut' },
      opacity: { duration: 0.1, delay },
    },
  }),
};

/**
 * Animation variants for nodes appearing
 * Spring-based scale animation for data nodes
 */
export const NODE_APPEAR_VARIANTS: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (_delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: springs.bouncy,
  }),
};

/**
 * Continuous pulse animation for loading state
 */
export const PULSE_VARIANTS: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Splash screen animation timing (in ms)
 */
export const SPLASH_TIMINGS = {
  tracesDrawn: 800,
  nodesAppear: 1600,
  particlesStart: 2200,
  complete: 3500,
  textAppear: 1800,
};
