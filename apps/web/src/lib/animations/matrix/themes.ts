/**
 * Matrix Cipher Background Animation - Theme Presets
 * 
 * @description Pre-defined color themes for the Matrix rain effect.
 * Each theme includes primary, secondary, tertiary colors plus glow effects.
 * Easily extensible for custom themes.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { MatrixTheme, ThemePreset, ColorStop } from './types';

// =============================================================================
// THEME COLOR DEFINITIONS
// =============================================================================

/**
 * Classic Matrix green theme
 * Inspired by the original Matrix movie
 * Enhanced with authentic glow and shadow effects
 */
export const MATRIX_GREEN: MatrixTheme = {
  id: 'matrix-green',
  name: 'Matrix Green',
  preset: 'matrix-green',
  
  primaryColor: '#39ff14',      // Bright neon green (head) - more vivid
  secondaryColor: '#00ff41',    // Electric green (body)
  tertiaryColor: '#00cc33',     // Medium green (tail)
  backgroundColor: '#000000',   // Pure black for contrast
  
  trailGradient: [
    { position: 0, color: '#39ff14', alpha: 1 },
    { position: 0.15, color: '#00ff41', alpha: 0.95 },
    { position: 0.35, color: '#00dd33', alpha: 0.8 },
    { position: 0.6, color: '#00aa22', alpha: 0.5 },
    { position: 0.85, color: '#006611', alpha: 0.25 },
    { position: 1, color: '#003300', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 12,           // Increased for stronger glow
    color: '#39ff14',
    intensity: 1.0,       // Full intensity
    pulsate: true,        // Subtle pulsing
    pulseSpeed: 3000,
  },
  
  depthColors: {
    near: '#39ff14',
    mid: '#00dd33',
    far: '#00aa22',
  },
  
  opacity: {
    head: 1,
    body: 0.85,           // Increased for visibility
    tail: 0.45,           // Increased for longer visible trails
    background: 0.03,
  },
};

/**
 * Cyber blue theme
 * Electric blue for a futuristic feel
 */
export const CYBER_BLUE: MatrixTheme = {
  id: 'cyber-blue',
  name: 'Cyber Blue',
  preset: 'cyber-blue',
  
  primaryColor: '#00d4ff',      // Electric cyan
  secondaryColor: '#0099cc',    // Medium blue
  tertiaryColor: '#005577',     // Dark teal
  backgroundColor: '#050810',   // Deep navy black
  
  trailGradient: [
    { position: 0, color: '#00d4ff', alpha: 1 },
    { position: 0.2, color: '#00bbee', alpha: 0.85 },
    { position: 0.5, color: '#0088aa', alpha: 0.5 },
    { position: 0.8, color: '#004466', alpha: 0.25 },
    { position: 1, color: '#001122', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 5,
    color: '#00d4ff',
    intensity: 0.9,
    pulsate: true,
    pulseSpeed: 2000,
  },
  
  depthColors: {
    near: '#00d4ff',
    mid: '#0088bb',
    far: '#004466',
  },
  
  opacity: {
    head: 1,
    body: 0.75,
    tail: 0.35,
    background: 0.04,
  },
};

/**
 * Blood red theme
 * Deep crimson for a dramatic effect
 */
export const BLOOD_RED: MatrixTheme = {
  id: 'blood-red',
  name: 'Blood Red',
  preset: 'blood-red',
  
  primaryColor: '#ff1744',      // Bright red
  secondaryColor: '#cc1133',    // Medium crimson
  tertiaryColor: '#880022',     // Dark blood
  backgroundColor: '#0a0505',   // Dark red-black
  
  trailGradient: [
    { position: 0, color: '#ff1744', alpha: 1 },
    { position: 0.15, color: '#ee1133', alpha: 0.9 },
    { position: 0.4, color: '#aa0022', alpha: 0.6 },
    { position: 0.7, color: '#660011', alpha: 0.3 },
    { position: 1, color: '#220005', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 6,
    color: '#ff1744',
    intensity: 0.85,
    pulsate: true,
    pulseSpeed: 1500,
  },
  
  depthColors: {
    near: '#ff1744',
    mid: '#aa1133',
    far: '#551122',
  },
  
  opacity: {
    head: 1,
    body: 0.7,
    tail: 0.25,
    background: 0.06,
  },
};

/**
 * Golden theme
 * Luxurious gold/amber effect
 */
export const GOLDEN: MatrixTheme = {
  id: 'golden',
  name: 'Golden',
  preset: 'golden',
  
  primaryColor: '#ffc107',      // Bright gold
  secondaryColor: '#cc9900',    // Medium amber
  tertiaryColor: '#886600',     // Dark bronze
  backgroundColor: '#080604',   // Dark brown-black
  
  trailGradient: [
    { position: 0, color: '#ffc107', alpha: 1 },
    { position: 0.2, color: '#ddaa00', alpha: 0.85 },
    { position: 0.5, color: '#aa7700', alpha: 0.5 },
    { position: 0.8, color: '#664400', alpha: 0.25 },
    { position: 1, color: '#221100', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 4,
    color: '#ffc107',
    intensity: 0.75,
    pulsate: false,
  },
  
  depthColors: {
    near: '#ffc107',
    mid: '#aa8800',
    far: '#665500',
  },
  
  opacity: {
    head: 1,
    body: 0.7,
    tail: 0.3,
    background: 0.05,
  },
};

/**
 * Purple haze theme
 * Mystical violet tones
 */
export const PURPLE_HAZE: MatrixTheme = {
  id: 'purple-haze',
  name: 'Purple Haze',
  preset: 'purple-haze',
  
  primaryColor: '#e040fb',      // Bright purple
  secondaryColor: '#aa00cc',    // Medium violet
  tertiaryColor: '#660088',     // Dark purple
  backgroundColor: '#08050a',   // Dark purple-black
  
  trailGradient: [
    { position: 0, color: '#e040fb', alpha: 1 },
    { position: 0.2, color: '#bb33dd', alpha: 0.85 },
    { position: 0.5, color: '#8822aa', alpha: 0.5 },
    { position: 0.8, color: '#441166', alpha: 0.25 },
    { position: 1, color: '#110022', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 5,
    color: '#e040fb',
    intensity: 0.85,
    pulsate: true,
    pulseSpeed: 2500,
  },
  
  depthColors: {
    near: '#e040fb',
    mid: '#9922bb',
    far: '#551177',
  },
  
  opacity: {
    head: 1,
    body: 0.75,
    tail: 0.3,
    background: 0.05,
  },
};

/**
 * Neon pink theme
 * Hot pink cyberpunk style
 */
export const NEON_PINK: MatrixTheme = {
  id: 'neon-pink',
  name: 'Neon Pink',
  preset: 'neon-pink',
  
  primaryColor: '#ff4081',      // Hot pink
  secondaryColor: '#cc3366',    // Medium rose
  tertiaryColor: '#882244',     // Dark magenta
  backgroundColor: '#0a0508',   // Dark pink-black
  
  trailGradient: [
    { position: 0, color: '#ff4081', alpha: 1 },
    { position: 0.2, color: '#dd3366', alpha: 0.85 },
    { position: 0.5, color: '#aa2255', alpha: 0.5 },
    { position: 0.8, color: '#551133', alpha: 0.25 },
    { position: 1, color: '#220011', alpha: 0.1 },
  ],
  
  glow: {
    enabled: true,
    radius: 5,
    color: '#ff4081',
    intensity: 0.9,
    pulsate: true,
    pulseSpeed: 1800,
  },
  
  depthColors: {
    near: '#ff4081',
    mid: '#bb3366',
    far: '#662244',
  },
  
  opacity: {
    head: 1,
    body: 0.75,
    tail: 0.35,
    background: 0.05,
  },
};

/**
 * Ice theme
 * Cold blue-white frost effect
 */
export const ICE: MatrixTheme = {
  id: 'ice',
  name: 'Ice',
  preset: 'ice',
  
  primaryColor: '#e0f7fa',      // Ice white
  secondaryColor: '#80deea',    // Light cyan
  tertiaryColor: '#4dd0e1',     // Medium cyan
  backgroundColor: '#051015',   // Dark cold blue
  
  trailGradient: [
    { position: 0, color: '#e0f7fa', alpha: 1 },
    { position: 0.15, color: '#b2ebf2', alpha: 0.9 },
    { position: 0.4, color: '#4dd0e1', alpha: 0.6 },
    { position: 0.7, color: '#00acc1', alpha: 0.35 },
    { position: 1, color: '#006064', alpha: 0.15 },
  ],
  
  glow: {
    enabled: true,
    radius: 6,
    color: '#e0f7fa',
    intensity: 0.8,
    pulsate: false,
  },
  
  depthColors: {
    near: '#e0f7fa',
    mid: '#4dd0e1',
    far: '#00838f',
  },
  
  opacity: {
    head: 1,
    body: 0.8,
    tail: 0.4,
    background: 0.03,
  },
};

/**
 * Fire theme
 * Orange-red flame effect
 */
export const FIRE: MatrixTheme = {
  id: 'fire',
  name: 'Fire',
  preset: 'fire',
  
  primaryColor: '#ff6d00',      // Bright orange
  secondaryColor: '#ff3d00',    // Orange-red
  tertiaryColor: '#dd2c00',     // Deep red-orange
  backgroundColor: '#0a0500',   // Dark brown-black
  
  trailGradient: [
    { position: 0, color: '#ffff00', alpha: 1 },      // Yellow tip
    { position: 0.1, color: '#ff9100', alpha: 0.95 }, // Orange
    { position: 0.3, color: '#ff5722', alpha: 0.8 },  // Deep orange
    { position: 0.6, color: '#dd2c00', alpha: 0.5 },  // Red-orange
    { position: 0.85, color: '#8b0000', alpha: 0.25 }, // Dark red
    { position: 1, color: '#2a0a00', alpha: 0.1 },    // Near black
  ],
  
  glow: {
    enabled: true,
    radius: 7,
    color: '#ff6d00',
    intensity: 0.95,
    pulsate: true,
    pulseSpeed: 800,
  },
  
  depthColors: {
    near: '#ff9100',
    mid: '#ff5722',
    far: '#bf360c',
  },
  
  opacity: {
    head: 1,
    body: 0.75,
    tail: 0.3,
    background: 0.06,
  },
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

/**
 * All available themes indexed by preset name
 */
export const THEME_REGISTRY: Record<ThemePreset, MatrixTheme> = {
  'matrix-green': MATRIX_GREEN,
  'cyber-blue': CYBER_BLUE,
  'blood-red': BLOOD_RED,
  'golden': GOLDEN,
  'purple-haze': PURPLE_HAZE,
  'neon-pink': NEON_PINK,
  'ice': ICE,
  'fire': FIRE,
  'custom': MATRIX_GREEN, // Default fallback for custom themes
};

/**
 * Theme metadata for UI display
 */
export const THEME_METADATA = [
  { id: 'matrix-green', name: 'Matrix Green', description: 'Classic green digital rain', icon: '🟢' },
  { id: 'cyber-blue', name: 'Cyber Blue', description: 'Electric blue futuristic style', icon: '🔵' },
  { id: 'blood-red', name: 'Blood Red', description: 'Dramatic crimson effect', icon: '🔴' },
  { id: 'golden', name: 'Golden', description: 'Luxurious amber tones', icon: '🟡' },
  { id: 'purple-haze', name: 'Purple Haze', description: 'Mystical violet vibes', icon: '🟣' },
  { id: 'neon-pink', name: 'Neon Pink', description: 'Hot pink cyberpunk style', icon: '💗' },
  { id: 'ice', name: 'Ice', description: 'Cold blue-white frost', icon: '❄️' },
  { id: 'fire', name: 'Fire', description: 'Warm orange-red flames', icon: '🔥' },
] as const;

// =============================================================================
// THEME UTILITIES
// =============================================================================

/**
 * Get a theme by its preset name
 * 
 * @param preset - Theme preset identifier
 * @returns Theme configuration
 */
export function getTheme(preset: ThemePreset): MatrixTheme {
  return THEME_REGISTRY[preset] || MATRIX_GREEN;
}

/**
 * Get theme by ID (alias for getTheme)
 */
export const getThemeById = getTheme;

/**
 * Create a custom theme by merging with a base theme
 * 
 * @param basePreset - Base theme to extend
 * @param overrides - Custom overrides
 * @returns New custom theme
 */
export function createCustomTheme(
  basePreset: ThemePreset,
  overrides: Partial<MatrixTheme>
): MatrixTheme {
  const base = getTheme(basePreset);
  
  return {
    ...base,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    preset: 'custom',
    glow: {
      ...base.glow,
      ...(overrides.glow || {}),
    },
    opacity: {
      ...base.opacity,
      ...(overrides.opacity || {}),
    },
    depthColors: overrides.depthColors || base.depthColors,
    trailGradient: overrides.trailGradient || base.trailGradient,
  };
}

/**
 * Interpolate between two themes for smooth transitions
 * 
 * @param from - Starting theme
 * @param to - Target theme
 * @param progress - Transition progress (0-1)
 * @returns Interpolated theme
 */
export function interpolateThemes(
  from: MatrixTheme,
  to: MatrixTheme,
  progress: number
): MatrixTheme {
  const t = Math.max(0, Math.min(1, progress));
  
  // Helper to interpolate hex colors
  const lerpColor = (c1: string, c2: string, p: number): string => {
    const hex1 = c1.replace('#', '');
    const hex2 = c2.replace('#', '');
    
    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);
    
    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * p);
    const g = Math.round(g1 + (g2 - g1) * p);
    const b = Math.round(b1 + (b2 - b1) * p);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
  
  return {
    ...to,
    id: `transition-${from.id}-${to.id}`,
    primaryColor: lerpColor(from.primaryColor, to.primaryColor, t),
    secondaryColor: lerpColor(from.secondaryColor, to.secondaryColor, t),
    tertiaryColor: lerpColor(from.tertiaryColor, to.tertiaryColor, t),
    backgroundColor: lerpColor(from.backgroundColor, to.backgroundColor, t),
    glow: {
      ...to.glow,
      intensity: lerp(from.glow.intensity, to.glow.intensity, t),
      radius: lerp(from.glow.radius, to.glow.radius, t),
      color: lerpColor(from.glow.color || from.primaryColor, to.glow.color || to.primaryColor, t),
    },
    opacity: {
      head: lerp(from.opacity.head, to.opacity.head, t),
      body: lerp(from.opacity.body, to.opacity.body, t),
      tail: lerp(from.opacity.tail, to.opacity.tail, t),
      background: lerp(from.opacity.background, to.opacity.background, t),
    },
  };
}

/**
 * Parse a color string to RGB values
 * 
 * @param color - Hex color string
 * @returns Object with r, g, b values (0-255)
 */
export function parseColor(color: string): { r: number; g: number; b: number } {
  const hex = color.replace('#', '');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/**
 * Convert RGB to CSS rgba string
 * 
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @param a - Alpha (0-1)
 * @returns CSS rgba string
 */
export function toRGBA(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Get CSS gradient from trail gradient
 * 
 * @param gradient - Trail gradient color stops
 * @returns CSS linear gradient string
 */
export function trailGradientToCSS(gradient: ColorStop[]): string {
  const stops = gradient
    .map(stop => `${stop.color} ${stop.position * 100}%`)
    .join(', ');
  return `linear-gradient(180deg, ${stops})`;
}

export default THEME_REGISTRY;
