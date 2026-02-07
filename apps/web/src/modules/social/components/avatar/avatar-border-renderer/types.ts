/**
 * Type definitions for AvatarBorderRenderer module
 */

import type {
  AvatarBorderConfig,
  BorderTheme,
  ParticleConfig,
  ParticleType,
} from '@/types/avatar-borders';

export interface AvatarBorderRendererProps {
  /** Avatar image URL */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Border configuration (or use store if not provided) */
  border?: AvatarBorderConfig;
  /** Size in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Whether to show particles */
  showParticles?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Whether border is interactive (hover effects) */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Override colors */
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  /** Reduced motion for accessibility */
  reducedMotion?: boolean;
}

export interface ParticleProps {
  config: ParticleConfig;
  containerSize: number;
  index: number;
  total: number;
  colors: BorderColors;
}

export interface BorderColors {
  primary: string;
  secondary: string;
  accent: string;
}

export type { AvatarBorderConfig, BorderTheme, ParticleConfig, ParticleType };
