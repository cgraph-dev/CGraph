/**
 * Advanced Effects - Type Definitions
 * Shared types for all advanced effect components
 */

import type { ReactNode } from 'react';
import type { useScroll } from 'framer-motion';

// =============================================================================
// NOISE & VISUAL EFFECTS
// =============================================================================

export interface NoiseOverlayProps {
  opacity?: number;
  className?: string;
}

export interface ChromaticTextProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export interface DistortionWaveProps {
  children: ReactNode;
  className?: string;
}

// =============================================================================
// 3D & PARALLAX EFFECTS
// =============================================================================

export interface ParallaxLayerProps {
  children: ReactNode;
  depth: number;
  className?: string;
}

export interface ParallaxSceneProps {
  children: ReactNode;
  className?: string;
  sensitivity?: number;
}

export interface Float3DProps {
  children: ReactNode;
  className?: string;
  range?: number;
  speed?: number;
  rotate?: boolean;
  delay?: number;
}

// =============================================================================
// SVG & GRADIENT EFFECTS
// =============================================================================

export interface MorphingBlobProps {
  color?: string;
  size?: number;
  className?: string;
  speed?: number;
}

export interface LiquidGradientProps {
  colors?: string[];
  className?: string;
  speed?: number;
}

export interface AuroraBackgroundProps {
  colors?: string[];
  className?: string;
  speed?: number;
}

// =============================================================================
// CURSOR EFFECTS
// =============================================================================

export interface CursorTrailProps {
  color?: string;
  size?: number;
  trailLength?: number;
  fadeSpeed?: number;
}

export interface MagneticCursorProps {
  children: ReactNode;
  className?: string;
}

// =============================================================================
// TEXT EFFECTS
// =============================================================================

export interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  trigger?: boolean;
  scrambleChars?: string;
}

export interface GlitchTextProps {
  children: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export interface WordProps {
  children: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}

export interface VelocityTextProps {
  children: string;
  className?: string;
  baseVelocity?: number;
}

// =============================================================================
// CARD & REVEAL EFFECTS
// =============================================================================

export interface SpotlightRevealProps {
  children: ReactNode;
  className?: string;
  spotlightSize?: number;
}

export interface HolographicCardProps {
  children: ReactNode;
  className?: string;
}

// =============================================================================
// LAYOUT EFFECTS
// =============================================================================

export interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  columns?: number;
  staggerDelay?: number;
}

export interface InfiniteMarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

export interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface GlarePosition {
  x: number;
  y: number;
}
