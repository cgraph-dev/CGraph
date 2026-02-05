import type { ParticleType, ParticleConfig } from '@/types/avatar-borders';

export interface BorderParticleSystemProps {
  /** Container size in pixels */
  size: number;
  /** Particle configuration */
  config: ParticleConfig;
  /** Whether particles are active */
  active?: boolean;
  /** Custom colors */
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Particle density multiplier (0.5 - 2) */
  density?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Use canvas rendering (better for many particles) */
  useCanvas?: boolean;
  /** Reduced motion mode */
  reducedMotion?: boolean;
  /** Custom class name */
  className?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
}

export interface DOMParticleProps {
  particle: Particle;
  type: ParticleType;
}

export interface ParticlePreset {
  gravity: number;
  drag: number;
  minSize: number;
  maxSize: number;
  minLife: number;
  maxLife: number;
  spread: number;
  initialVelocity: { x: number; y: number };
}

export type ParticleColors = {
  primary: string;
  secondary: string;
  accent: string;
};
