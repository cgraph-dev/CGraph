/**
 * WebGL Effects - Type Definitions
 */

// =============================================================================
// SHADER BACKGROUND
// =============================================================================

export type ShaderPreset = 'plasma' | 'warp' | 'flow' | 'nebula' | 'electric';

export interface ShaderBackgroundProps {
  className?: string;
  preset?: ShaderPreset;
  colors?: string[];
  speed?: number;
  intensity?: number;
}

export interface ShaderProgram {
  vertex: string;
  fragment: string;
}

// =============================================================================
// METABALLS
// =============================================================================

export interface MetaballsProps {
  count?: number;
  colors?: string[];
  className?: string;
  speed?: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color?: string;
}

// =============================================================================
// GEOMETRIC PATTERNS
// =============================================================================

export type GeometricPatternType = 'hexagons' | 'triangles' | 'squares' | 'circles';

export interface GeometricPatternProps {
  pattern?: GeometricPatternType;
  color?: string;
  size?: number;
  className?: string;
  animated?: boolean;
}

// =============================================================================
// CONSTELLATION
// =============================================================================

export interface ConstellationProps {
  nodeCount?: number;
  color?: string;
  maxConnections?: number;
  className?: string;
  interactive?: boolean;
}

export interface ConstellationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
}

// =============================================================================
// VORTEX
// =============================================================================

export interface VortexProps {
  color?: string;
  particleCount?: number;
  className?: string;
  speed?: number;
}

export interface VortexParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
}

// =============================================================================
// WAVE MESH
// =============================================================================

export interface WaveMeshProps {
  color?: string;
  rows?: number;
  cols?: number;
  className?: string;
  amplitude?: number;
  speed?: number;
}

// =============================================================================
// DNA HELIX
// =============================================================================

export interface DNAHelixProps {
  color1?: string;
  color2?: string;
  className?: string;
  speed?: number;
}
