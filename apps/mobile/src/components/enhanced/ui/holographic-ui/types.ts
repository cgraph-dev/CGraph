/**
 * Holographic UI Types and Constants
 */


// =============================================================================
// TYPES
// =============================================================================

export interface HolographicTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
}

export interface HolographicConfig {
  intensity: 'subtle' | 'medium' | 'intense';
  colorTheme: 'cyan' | 'green' | 'purple' | 'gold' | 'custom';
  customColors?: HolographicTheme;
  enableScanlines: boolean;
  enableFlicker: boolean;
  enableHaptics: boolean;
  glitchProbability: number;
}

// =============================================================================
// COLOR THEMES
// =============================================================================

export const HOLOGRAPHIC_THEMES: Record<string, HolographicTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.9)',
    secondary: 'rgba(0, 200, 255, 0.7)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.5)',
    scanline: 'rgba(0, 255, 255, 0.1)',
    background: 'rgba(0, 20, 40, 0.95)',
  },
  green: {
    primary: 'rgba(0, 255, 100, 0.9)',
    secondary: 'rgba(50, 255, 150, 0.7)',
    accent: 'rgba(100, 255, 150, 1)',
    glow: 'rgba(0, 255, 100, 0.5)',
    scanline: 'rgba(0, 255, 100, 0.1)',
    background: 'rgba(0, 30, 20, 0.95)',
  },
  purple: {
    primary: 'rgba(200, 100, 255, 0.9)',
    secondary: 'rgba(150, 50, 255, 0.7)',
    accent: 'rgba(220, 150, 255, 1)',
    glow: 'rgba(180, 80, 255, 0.5)',
    scanline: 'rgba(180, 80, 255, 0.1)',
    background: 'rgba(30, 10, 50, 0.95)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.9)',
    secondary: 'rgba(255, 180, 30, 0.7)',
    accent: 'rgba(255, 220, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.5)',
    scanline: 'rgba(255, 200, 50, 0.1)',
    background: 'rgba(40, 30, 10, 0.95)',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 *
 */
export function getTheme(
  colorTheme: HolographicConfig['colorTheme'],
  customColors?: HolographicTheme
): HolographicTheme {
  if (colorTheme === 'custom' && customColors) return customColors;
  return HOLOGRAPHIC_THEMES[colorTheme] ?? HOLOGRAPHIC_THEMES.cyan;
}

/**
 *
 */
export function getIntensityMultiplier(intensity: HolographicConfig['intensity']): number {
  return {
    subtle: 0.5,
    medium: 1,
    intense: 1.5,
  }[intensity];
}
