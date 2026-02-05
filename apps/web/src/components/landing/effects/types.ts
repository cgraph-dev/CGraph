/**
 * Landing Page Effects - Type Definitions
 */

import type { ReactNode } from 'react';

// =============================================================================
// PARTICLE NETWORK
// =============================================================================

export interface ParticleConfig {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  connectDistance?: number;
  showConnections?: boolean;
  mouseAttraction?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// =============================================================================
// GRADIENT ORB
// =============================================================================

export interface GradientOrbProps {
  color: string;
  size?: number;
  blur?: number;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  animate?: boolean;
  animationDuration?: number;
}

// =============================================================================
// GRID BACKGROUND
// =============================================================================

export interface GridBackgroundProps {
  color?: string;
  size?: number;
  opacity?: number;
  fade?: boolean;
}

export interface DotBackgroundProps extends GridBackgroundProps {
  dotSize?: number;
}

// =============================================================================
// SCANLINES
// =============================================================================

export interface ScanlineProps {
  opacity?: number;
  speed?: number;
  color?: string;
}

// =============================================================================
// GLOW TEXT
// =============================================================================

export interface GlowTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
}

// =============================================================================
// ANIMATED BORDER
// =============================================================================

export interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  borderRadius?: string;
  glowOnHover?: boolean;
}

// =============================================================================
// TILT CARD
// =============================================================================

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  glare?: boolean;
}

// =============================================================================
// MAGNETIC
// =============================================================================

export interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

// =============================================================================
// SPOTLIGHT
// =============================================================================

export interface SpotlightProps {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
}

// =============================================================================
// TYPING TEXT
// =============================================================================

export interface TypingTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

// =============================================================================
// ANIMATED COUNTER
// =============================================================================

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}
