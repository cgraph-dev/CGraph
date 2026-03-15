/**
 * GradientEngine - Advanced Gradient & Glow System for React Native
 *
 * Features:
 * - Multiple gradient types: linear, radial, conic, sweep
 * - Animated gradients with morphing and rotation
 * - Multi-stop gradients (up to 10 stops)
 * - Glow effect library (soft, hard, neon, holographic)
 * - Shadow system with elevation-based auto-shadows
 * - Border gradient animations
 */

import { ViewStyle } from 'react-native';
import chroma from 'chroma-js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type GradientType = 'linear' | 'radial' | 'conic' | 'sweep' | 'mesh';

export type GlowType = 'soft' | 'hard' | 'neon' | 'holographic' | 'aurora' | 'ember' | 'frost';

export type ShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow' | 'neon' | 'inner';

export interface GradientStop {
  color: string;
  position: number; // 0-1
}

export interface GradientConfig {
  type: GradientType;
  stops: GradientStop[];
  angle?: number; // For linear gradients (degrees)
  center?: { x: number; y: number }; // For radial/conic (0-1)
  radius?: number; // For radial
  animated?: boolean;
  animationDuration?: number;
  animationType?: 'rotate' | 'morph' | 'pulse' | 'shimmer' | 'wave';
}

export interface GlowConfig {
  type: GlowType;
  color: string;
  intensity: number; // 0-1
  spread: number; // 0-100
  blur: number; // 0-100
  animated?: boolean;
  pulseSpeed?: number; // Milliseconds
}

export interface ShadowConfig {
  preset?: ShadowPreset;
  color?: string;
  offset?: { width: number; height: number };
  radius?: number;
  opacity?: number;
  elevation?: number; // Android elevation
}

export interface AnimatedGradientState {
  currentAngle: number;
  currentStops: GradientStop[];
  phase: number;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Interpolate color.
 *
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  try {
    return chroma.mix(color1, color2, t).hex();
  } catch {
    return color1;
  }
}

/**
 * Lighten color.
 *
 */
export function lightenColor(color: string, amount: number): string {
  try {
    return chroma(color).brighten(amount).hex();
  } catch {
    return color;
  }
}

/**
 * Darken color.
 *
 */
export function darkenColor(color: string, amount: number): string {
  try {
    return chroma(color).darken(amount).hex();
  } catch {
    return color;
  }
}

/**
 * Saturate color.
 *
 */
export function saturateColor(color: string, amount: number): string {
  try {
    return chroma(color).saturate(amount).hex();
  } catch {
    return color;
  }
}

/**
 * Sets color alpha.
 *
 */
export function setColorAlpha(color: string, alpha: number): string {
  try {
    return chroma(color).alpha(alpha).css();
  } catch {
    return color;
  }
}

/**
 * Generate color scale.
 *
 */
export function generateColorScale(baseColor: string, steps: number = 9): string[] {
  try {
    const base = chroma(baseColor);
    const scale: string[] = [];

    for (let i = 0; i < steps; i++) {
      const lightness = 0.95 - (i / (steps - 1)) * 0.85;
      scale.push(base.luminance(lightness).hex());
    }

    return scale;
  } catch {
    return Array(steps).fill(baseColor);
  }
}

// ============================================================================
// Gradient Presets
// ============================================================================

export const GRADIENT_PRESETS: Record<string, GradientConfig> = {
  // Solid color variations
  primary: {
    type: 'linear',
    stops: [
      { color: '#10b981', position: 0 },
      { color: '#059669', position: 1 },
    ],
    angle: 135,
  },
  secondary: {
    type: 'linear',
    stops: [
      { color: '#8b5cf6', position: 0 },
      { color: '#7c3aed', position: 1 },
    ],
    angle: 135,
  },

  // Premium gradients
  sunset: {
    type: 'linear',
    stops: [
      { color: '#f97316', position: 0 },
      { color: '#ec4899', position: 0.5 },
      { color: '#8b5cf6', position: 1 },
    ],
    angle: 45,
  },
  ocean: {
    type: 'linear',
    stops: [
      { color: '#06b6d4', position: 0 },
      { color: '#3b82f6', position: 0.5 },
      { color: '#6366f1', position: 1 },
    ],
    angle: 135,
  },
  forest: {
    type: 'linear',
    stops: [
      { color: '#22c55e', position: 0 },
      { color: '#10b981', position: 0.5 },
      { color: '#14b8a6', position: 1 },
    ],
    angle: 45,
  },
  aurora: {
    type: 'linear',
    stops: [
      { color: '#10b981', position: 0 },
      { color: '#06b6d4', position: 0.33 },
      { color: '#8b5cf6', position: 0.66 },
      { color: '#ec4899', position: 1 },
    ],
    angle: 45,
    animated: true,
    animationType: 'rotate',
    animationDuration: 10000,
  },
  neonCyber: {
    type: 'linear',
    stops: [
      { color: '#00ffff', position: 0 },
      { color: '#ff00ff', position: 0.5 },
      { color: '#00ffff', position: 1 },
    ],
    angle: 90,
    animated: true,
    animationType: 'shimmer',
    animationDuration: 3000,
  },
  holographic: {
    type: 'linear',
    stops: [
      { color: '#ff0080', position: 0 },
      { color: '#ff8c00', position: 0.2 },
      { color: '#ffff00', position: 0.4 },
      { color: '#00ff00', position: 0.6 },
      { color: '#00ffff', position: 0.8 },
      { color: '#ff0080', position: 1 },
    ],
    angle: 45,
    animated: true,
    animationType: 'rotate',
    animationDuration: 5000,
  },
  midnight: {
    type: 'radial',
    stops: [
      { color: '#1e3a5f', position: 0 },
      { color: '#0f172a', position: 1 },
    ],
    center: { x: 0.5, y: 0.3 },
  },
  ember: {
    type: 'radial',
    stops: [
      { color: '#fbbf24', position: 0 },
      { color: '#f97316', position: 0.4 },
      { color: '#dc2626', position: 0.7 },
      { color: '#7f1d1d', position: 1 },
    ],
    center: { x: 0.5, y: 0.7 },
    animated: true,
    animationType: 'pulse',
    animationDuration: 2000,
  },
  frost: {
    type: 'linear',
    stops: [
      { color: 'rgba(255, 255, 255, 0.9)', position: 0 },
      { color: 'rgba(200, 220, 255, 0.7)', position: 0.5 },
      { color: 'rgba(150, 200, 255, 0.5)', position: 1 },
    ],
    angle: 180,
  },
  matrix: {
    type: 'linear',
    stops: [
      { color: '#00ff00', position: 0 },
      { color: '#003300', position: 1 },
    ],
    angle: 180,
  },
};

// ============================================================================
// Glow Effect Configurations
// ============================================================================

export const GLOW_PRESETS: Record<GlowType, GlowConfig> = {
  soft: {
    type: 'soft',
    color: '#ffffff',
    intensity: 0.3,
    spread: 20,
    blur: 30,
    animated: false,
  },
  hard: {
    type: 'hard',
    color: '#ffffff',
    intensity: 0.6,
    spread: 5,
    blur: 10,
    animated: false,
  },
  neon: {
    type: 'neon',
    color: '#00ffff',
    intensity: 0.8,
    spread: 15,
    blur: 25,
    animated: true,
    pulseSpeed: 1500,
  },
  holographic: {
    type: 'holographic',
    color: '#ff00ff',
    intensity: 0.7,
    spread: 20,
    blur: 35,
    animated: true,
    pulseSpeed: 2000,
  },
  aurora: {
    type: 'aurora',
    color: '#10b981',
    intensity: 0.5,
    spread: 30,
    blur: 50,
    animated: true,
    pulseSpeed: 3000,
  },
  ember: {
    type: 'ember',
    color: '#f97316',
    intensity: 0.6,
    spread: 15,
    blur: 25,
    animated: true,
    pulseSpeed: 1000,
  },
  frost: {
    type: 'frost',
    color: '#87ceeb',
    intensity: 0.4,
    spread: 25,
    blur: 40,
    animated: false,
  },
};

// ============================================================================
// Shadow Presets
// ============================================================================

export const SHADOW_PRESETS: Record<ShadowPreset, ShadowConfig> = {
  none: {
    offset: { width: 0, height: 0 },
    radius: 0,
    opacity: 0,
    elevation: 0,
  },
  sm: {
    color: '#000000',
    offset: { width: 0, height: 1 },
    radius: 2,
    opacity: 0.05,
    elevation: 1,
  },
  md: {
    color: '#000000',
    offset: { width: 0, height: 4 },
    radius: 6,
    opacity: 0.1,
    elevation: 3,
  },
  lg: {
    color: '#000000',
    offset: { width: 0, height: 10 },
    radius: 15,
    opacity: 0.15,
    elevation: 6,
  },
  xl: {
    color: '#000000',
    offset: { width: 0, height: 20 },
    radius: 25,
    opacity: 0.2,
    elevation: 9,
  },
  '2xl': {
    color: '#000000',
    offset: { width: 0, height: 25 },
    radius: 50,
    opacity: 0.25,
    elevation: 12,
  },
  glow: {
    color: '#10b981',
    offset: { width: 0, height: 0 },
    radius: 20,
    opacity: 0.4,
    elevation: 8,
  },
  neon: {
    color: '#00ffff',
    offset: { width: 0, height: 0 },
    radius: 30,
    opacity: 0.6,
    elevation: 10,
  },
  inner: {
    color: '#000000',
    offset: { width: 0, height: 2 },
    radius: 4,
    opacity: 0.15,
    elevation: 0, // Inner shadows don't use elevation
  },
};

// ============================================================================
// Gradient Generation
// ============================================================================

/**
 * Creates linear gradient.
 *
 */
export function createLinearGradient(config: GradientConfig): {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const angle = config.angle || 0;
  const radians = (angle * Math.PI) / 180;

  // Calculate start and end points based on angle
  const start = {
    x: 0.5 - Math.cos(radians) * 0.5,
    y: 0.5 - Math.sin(radians) * 0.5,
  };
  const end = {
    x: 0.5 + Math.cos(radians) * 0.5,
    y: 0.5 + Math.sin(radians) * 0.5,
  };

  return {
    colors: config.stops.map((s) => s.color),
    locations: config.stops.map((s) => s.position),
    start,
    end,
  };
}

/**
 * Creates radial gradient.
 *
 */
export function createRadialGradient(config: GradientConfig): {
  colors: string[];
  locations: number[];
  center: { x: number; y: number };
  radius: number;
} {
  return {
    colors: config.stops.map((s) => s.color),
    locations: config.stops.map((s) => s.position),
    center: config.center || { x: 0.5, y: 0.5 },
    radius: config.radius || 0.5,
  };
}

// ============================================================================
// Animated Gradient Utilities
// ============================================================================

/**
 * Interpolate gradient stops.
 *
 */
export function interpolateGradientStops(
  stops1: GradientStop[],
  stops2: GradientStop[],
  t: number
): GradientStop[] {
  // Ensure same number of stops by interpolating
  const maxStops = Math.max(stops1.length, stops2.length);
  const result: GradientStop[] = [];

  for (let i = 0; i < maxStops; i++) {
    const s1 = stops1[Math.min(i, stops1.length - 1)];
    const s2 = stops2[Math.min(i, stops2.length - 1)];

    result.push({
      color: interpolateColor(s1.color, s2.color, t),
      position: s1.position + (s2.position - s1.position) * t,
    });
  }

  return result;
}

/**
 * Rotate gradient stops.
 *
 */
export function rotateGradientStops(stops: GradientStop[], offset: number): GradientStop[] {
  return stops
    .map((stop) => ({
      color: stop.color,
      position: (stop.position + offset) % 1,
    }))
    .sort((a, b) => a.position - b.position);
}

/**
 * Calculates animated angle.
 *
 */
export function calculateAnimatedAngle(baseAngle: number, time: number, duration: number): number {
  const progress = (time % duration) / duration;
  return baseAngle + progress * 360;
}

// ============================================================================
// Glow Style Generation
// ============================================================================

/**
 * Creates glow style.
 *
 */
export function createGlowStyle(config: GlowConfig): ViewStyle {
  const { color, intensity, spread, blur } = config;

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: blur * (spread / 50),
    elevation: Math.round(blur / 5), // Android approximation
  };
}

/**
 * Creates multi layer glow.
 *
 */
export function createMultiLayerGlow(config: GlowConfig, layers: number = 3): ViewStyle[] {
  const styles: ViewStyle[] = [];

  for (let i = 0; i < layers; i++) {
    const factor = (i + 1) / layers;
    styles.push({
      shadowColor: config.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: config.intensity * (1 - factor * 0.5),
      shadowRadius: config.blur * factor * (config.spread / 50),
      elevation: Math.round((config.blur * factor) / 5),
    });
  }

  return styles;
}

// ============================================================================
// Shadow Style Generation
// ============================================================================

/**
 * Creates shadow style.
 *
 */
export function createShadowStyle(config: ShadowConfig): ViewStyle {
  const preset = config.preset ? SHADOW_PRESETS[config.preset] : {};
  const merged = { ...preset, ...config };

  return {
    shadowColor: merged.color || '#000000',
    shadowOffset: merged.offset || { width: 0, height: 0 },
    shadowOpacity: merged.opacity || 0,
    shadowRadius: merged.radius || 0,
    elevation: merged.elevation || 0,
  };
}

/**
 * Gets elevation shadow.
 *
 */
export function getElevationShadow(elevation: number): ViewStyle {
  // Generate shadow based on Material Design elevation scale
  const shadowOpacity = Math.min(0.05 + elevation * 0.015, 0.3);
  const shadowRadius = elevation * 0.8;
  const shadowOffset = Math.min(elevation * 0.5, 10);

  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: shadowOffset },
    shadowOpacity,
    shadowRadius,
    elevation,
  };
}

// ============================================================================
// Border Gradient Utilities
// ============================================================================

export interface BorderGradientConfig {
  width: number;
  colors: string[];
  angle?: number;
  animated?: boolean;
  animationDuration?: number;
}

/**
 * Creates border gradient colors.
 *
 */
export function createBorderGradientColors(
  config: BorderGradientConfig,
  time?: number
): {
  colors: [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  let angle = config.angle || 0;

  if (config.animated && time !== undefined && config.animationDuration) {
    angle = calculateAnimatedAngle(angle, time, config.animationDuration);
  }

  const radians = (angle * Math.PI) / 180;

  return {
     
    colors: config.colors as [string, string, ...string[]],
    start: {
      x: 0.5 - Math.cos(radians) * 0.5,
      y: 0.5 - Math.sin(radians) * 0.5,
    },
    end: {
      x: 0.5 + Math.cos(radians) * 0.5,
      y: 0.5 + Math.sin(radians) * 0.5,
    },
  };
}

// ============================================================================
// Default Export
// ============================================================================

const GradientEngine = {
  // Presets
  GRADIENT_PRESETS,
  GLOW_PRESETS,
  SHADOW_PRESETS,

  // Color utilities
  interpolateColor,
  lightenColor,
  darkenColor,
  saturateColor,
  setColorAlpha,
  generateColorScale,

  // Gradient creation
  createLinearGradient,
  createRadialGradient,
  interpolateGradientStops,
  rotateGradientStops,
  calculateAnimatedAngle,

  // Glow creation
  createGlowStyle,
  createMultiLayerGlow,

  // Shadow creation
  createShadowStyle,
  getElevationShadow,

  // Border gradients
  createBorderGradientColors,
};

export default GradientEngine;
