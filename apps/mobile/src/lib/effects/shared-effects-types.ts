/**
 * Shared Types, Interfaces, Default Configs & Styles for Shader Effects
 */

import { durations } from '@cgraph/animation-constants';
import { StyleSheet } from 'react-native';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ShaderType =
  | 'scanlines'
  | 'holographic'
  | 'glitch'
  | 'chromatic'
  | 'grain'
  | 'vignette'
  | 'crt';

export interface ScanlineConfig {
  opacity: number; // 0-1
  speed: number; // Animation speed in ms
  color: string;
  spacing: number; // Pixels between lines
  thickness: number; // Line thickness in pixels
  direction: 'horizontal' | 'vertical';
  animated: boolean;
}

export interface GlitchConfig {
  intensity: number; // 0-1
  frequency: number; // Glitches per second
  colorShift: boolean;
  sliceCount: number; // Number of glitch slices
  duration: number; // Glitch duration in ms
}

export interface ChromaticConfig {
  offset: number; // Pixel offset for RGB channels
  angle: number; // Direction of aberration in degrees
  animated: boolean;
  pulseSpeed: number;
}

export interface HolographicConfig {
  colors: string[];
  speed: number;
  angle: number;
  intensity: number;
}

export interface GrainConfig {
  opacity: number;
  size: number;
  animated: boolean;
  speed: number;
}

export interface VignetteConfig {
  intensity: number; // 0-1
  radius: number; // 0-1 from center
  softness: number; // 0-1 edge softness
  color: string;
}

export interface CRTConfig {
  scanlines: boolean;
  curvature: number; // 0-1
  vignette: boolean;
  flicker: boolean;
  flickerIntensity: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_SCANLINE_CONFIG: ScanlineConfig = {
  opacity: 0.1,
  speed: 3000,
  color: 'rgba(0, 255, 255, 0.1)',
  spacing: 4,
  thickness: 1,
  direction: 'horizontal',
  animated: true,
};

export const DEFAULT_GLITCH_CONFIG: GlitchConfig = {
  intensity: 0.5,
  frequency: 2,
  colorShift: true,
  sliceCount: 5,
  duration: durations.fast.ms,
};

export const DEFAULT_CHROMATIC_CONFIG: ChromaticConfig = {
  offset: 2,
  angle: 0,
  animated: false,
  pulseSpeed: 2000,
};

export const DEFAULT_HOLOGRAPHIC_CONFIG: HolographicConfig = {
  colors: ['#ff0080', '#ff8c00', '#ffff00', '#00ff00', '#00ffff', '#ff0080'],
  speed: 3000,
  angle: 45,
  intensity: 0.3,
};

export const DEFAULT_GRAIN_CONFIG: GrainConfig = {
  opacity: 0.05,
  size: 2,
  animated: true,
  speed: 100,
};

export const DEFAULT_VIGNETTE_CONFIG: VignetteConfig = {
  intensity: 0.5,
  radius: 0.7,
  softness: 0.5,
  color: '#000000',
};

export const DEFAULT_CRT_CONFIG: CRTConfig = {
  scanlines: true,
  curvature: 0.1,
  vignette: true,
  flicker: true,
  flickerIntensity: 0.02,
};

// ============================================================================
// Shared Styles
// ============================================================================

export const sharedStyles = StyleSheet.create({
  effectContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  holographicWrapper: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
  },
  grainDot: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
  },
});
