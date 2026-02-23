/**
 * Type definitions for authentication visual effects.
 * @module modules/auth/components/auth-effects/types
 */
import type { ReactNode } from 'react';

/**
 * Common props for color customization
 */
export interface ColorProps {
  color?: string;
}

/**
 * CyberGrid component props
 */
export interface CyberGridProps extends ColorProps {
  lineWidth?: number;
  cellSize?: number;
  pulseSpeed?: number;
}

/**
 * MorphingBlob component props
 */
export interface MorphingBlobProps extends ColorProps {
  size?: number;
  className?: string;
}

/**
 * FloatingIcons component props
 */
export interface FloatingIconsProps extends ColorProps {}

/**
 * CursorGlow component props
 */
export interface CursorGlowProps extends ColorProps {
  size?: number;
}

/**
 * TiltCard component props
 */
export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/**
 * TextScramble component props
 */
export interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  delay?: number;
}

/**
 * ScanLines component props
 */
export interface ScanLinesProps {
  opacity?: number;
}

/**
 * GlitchText component props
 */
export interface GlitchTextProps {
  text: string;
  className?: string;
}

/**
 * Particle data structure for particle field
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

/**
 * ParticleField component props
 */
export interface ParticleFieldProps {
  particleCount?: number;
  colors?: string[];
  connectionDistance?: number;
  speed?: number;
}

/**
 * AuroraGlow component props
 */
export interface AuroraGlowProps {
  colors?: string[];
  speed?: number;
}
