/**
 * GlassCard V2 - Type Definitions
 *
 * Types and interfaces for the glassmorphism card component.
 */

import type { StyleProp, ViewStyle } from 'react-native';
import type { BlurStyle, BlurIntensity } from '@/lib/effects/blur-engine';
import type { ParticleType } from '@/lib/effects/particle-system';

export type GlassVariant =
  | 'default'
  | 'frosted'
  | 'crystal'
  | 'neon'
  | 'holographic'
  | 'aurora'
  | 'midnight'
  | 'dawn'
  | 'ember'
  | 'ocean';

export type BorderAnimationMode = 'none' | 'rotate' | 'pulse' | 'shimmer' | 'wave' | 'breathe';

export type PressAnimation = 'none' | 'scale' | 'glow' | 'shadow' | 'all';

export interface VariantConfig {
  blurStyle: BlurStyle;
  backgroundColor: string;
  borderColors: string[];
  glowColor: string;
  overlayGradient: [string, string];
  scanlineColor: string;
}

export interface GlassCardV2Props {
  children: React.ReactNode;
  variant?: GlassVariant;
  intensity?: BlurIntensity;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;

  // Border options
  borderGradient?: boolean;
  borderWidth?: number;
  borderColors?: string[];
  borderAnimation?: BorderAnimationMode;
  borderAnimationDuration?: number;

  // Animation options
  animated?: boolean;
  shimmerSpeed?: number;
  shimmerDirection?: 'left' | 'right' | 'up' | 'down';

  // 3D depth
  depth?: 'flat' | 'shallow' | 'medium' | 'deep';
  shadowColor?: string;

  // Glow options
  innerGlow?: boolean;
  outerGlow?: boolean;
  glowColor?: string;
  glowIntensity?: number;

  // Particle overlay
  particles?: boolean;
  particleType?: ParticleType;
  particleCount?: number;
  particleColors?: string[];

  // Scanlines
  scanlines?: boolean;
  scanlineOpacity?: number;
  scanlineSpeed?: number;

  // Interaction
  pressable?: boolean;
  pressAnimation?: PressAnimation;
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;

  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
}
