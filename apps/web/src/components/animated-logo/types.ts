/**
 * AnimatedLogo types
 * Extracted from AnimatedLogo.tsx for modularity
 */

import type { Variants } from 'motion/react';

/**
 * Props for the AnimatedLogo component
 */
export interface AnimatedLogoProps {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  /** Whether to show the CGraph text below the logo */
  showText?: boolean;
  /** Animation variant */
  variant?: 'default' | 'loading' | 'splash' | 'hero';
  /** Callback when animation completes (splash variant) */
  onAnimationComplete?: () => void;
  /** Color scheme */
  color?: ColorPalette;
}

/**
 * Color palette options
 */
export type ColorPalette = 'default' | 'cyan' | 'emerald' | 'purple';

/**
 * Color definition
 */
export interface ColorDefinition {
  primary: string;
  secondary: string;
  tertiary: string;
}

/**
 * Size dimensions
 */
export interface SizeDimensions {
  container: number;
  text: string;
  logo: number;
}

/**
 * Props for CircuitBoardLogo component
 */
export interface CircuitBoardLogoProps {
  /** Size of the logo in pixels */
  logoSize: number;
  /** Enable draw animations */
  isAnimated?: boolean;
  /** Enable continuous loading animation */
  isLoading?: boolean;
  /** Enable full splash screen animation sequence */
  isSplash?: boolean;
  /** Color scheme */
  color?: ColorPalette;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * SVG filter IDs for unique instance identification
 */
export interface SvgFilterIds {
  primaryGrad: string;
  secondaryGrad: string;
  tertiaryGrad: string;
  glow: string;
  nodeGlow: string;
  particleGlow: string;
}

// Re-export Variants type for convenience
export type { Variants };
