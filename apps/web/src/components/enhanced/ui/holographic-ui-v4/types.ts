/**
 * Holographic UI Types and Theme Configuration
 * @version 4.0.0
 */

export interface HoloTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface HoloConfig {
  /** Visual intensity level */
  intensity: 'subtle' | 'medium' | 'intense';
  /** Color preset or custom */
  preset: HoloPreset | 'custom';
  /** Custom theme colors */
  customTheme?: Partial<HoloTheme>;
  /** Enable animated scanlines */
  enableScanlines: boolean;
  /** Enable random flicker effect */
  enableFlicker: boolean;
  /** Enable mouse-based parallax */
  enableParallax: boolean;
  /** Enable 3D transforms */
  enable3D: boolean;
  /** Enable glow effects */
  enableGlow: boolean;
  /** Enable particle effects */
  enableParticles: boolean;
  /** Reduce motion for accessibility */
  reduceMotion: boolean;
  /** Glitch effect probability (0-1) */
  glitchProbability: number;
}

export type HoloPreset = 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';

export const HOLO_PRESETS: Record<HoloPreset, HoloTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.95)',
    secondary: 'rgba(0, 200, 255, 0.8)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.6)',
    scanline: 'rgba(0, 255, 255, 0.1)',
    background: 'rgba(0, 20, 30, 0.95)',
    surface: 'rgba(0, 40, 50, 0.8)',
    text: 'rgba(200, 255, 255, 1)',
    textMuted: 'rgba(100, 200, 200, 0.8)',
    border: 'rgba(0, 255, 255, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 100, 100, 1)',
    info: 'rgba(100, 200, 255, 1)',
  },
  matrix: {
    primary: 'rgba(0, 255, 65, 0.95)',
    secondary: 'rgba(0, 200, 50, 0.8)',
    accent: 'rgba(100, 255, 130, 1)',
    glow: 'rgba(0, 255, 65, 0.6)',
    scanline: 'rgba(0, 255, 65, 0.1)',
    background: 'rgba(0, 20, 10, 0.95)',
    surface: 'rgba(0, 40, 20, 0.8)',
    text: 'rgba(200, 255, 200, 1)',
    textMuted: 'rgba(100, 200, 100, 0.8)',
    border: 'rgba(0, 255, 65, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 100, 100, 1)',
    info: 'rgba(100, 200, 255, 1)',
  },
  purple: {
    primary: 'rgba(200, 100, 255, 0.95)',
    secondary: 'rgba(150, 80, 200, 0.8)',
    accent: 'rgba(230, 150, 255, 1)',
    glow: 'rgba(200, 100, 255, 0.6)',
    scanline: 'rgba(200, 100, 255, 0.1)',
    background: 'rgba(20, 10, 30, 0.95)',
    surface: 'rgba(40, 20, 50, 0.8)',
    text: 'rgba(230, 200, 255, 1)',
    textMuted: 'rgba(180, 150, 200, 0.8)',
    border: 'rgba(200, 100, 255, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 100, 100, 1)',
    info: 'rgba(100, 200, 255, 1)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.95)',
    secondary: 'rgba(200, 150, 40, 0.8)',
    accent: 'rgba(255, 220, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.6)',
    scanline: 'rgba(255, 200, 50, 0.1)',
    background: 'rgba(30, 20, 10, 0.95)',
    surface: 'rgba(50, 40, 20, 0.8)',
    text: 'rgba(255, 240, 200, 1)',
    textMuted: 'rgba(200, 180, 150, 0.8)',
    border: 'rgba(255, 200, 50, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 100, 100, 1)',
    info: 'rgba(100, 200, 255, 1)',
  },
  midnight: {
    primary: 'rgba(100, 150, 255, 0.95)',
    secondary: 'rgba(80, 120, 200, 0.8)',
    accent: 'rgba(150, 180, 255, 1)',
    glow: 'rgba(100, 150, 255, 0.6)',
    scanline: 'rgba(100, 150, 255, 0.1)',
    background: 'rgba(10, 15, 30, 0.95)',
    surface: 'rgba(20, 30, 50, 0.8)',
    text: 'rgba(200, 220, 255, 1)',
    textMuted: 'rgba(120, 150, 200, 0.8)',
    border: 'rgba(100, 150, 255, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 120, 140, 1)',
    info: 'rgba(120, 180, 255, 1)',
  },
};

/**
 * unknown for the enhanced module.
 */
/**
 * Retrieves intensity multiplier.
 *
 * @param intensity - The intensity.
 * @returns The intensity multiplier.
 */
export function getIntensityMultiplier(intensity: HoloConfig['intensity']): number {
  return { subtle: 0.5, medium: 1, intense: 1.5 }[intensity];
}

/**
 * unknown for the enhanced module.
 */
/**
 * Retrieves theme.
 *
 * @param preset - The preset.
 * @param customTheme - The custom theme.
 * @returns The theme.
 */
export function getTheme(
  preset: HoloPreset | 'custom',
  customTheme?: Partial<HoloTheme>
): HoloTheme {
  const base = preset === 'custom' ? HOLO_PRESETS.cyan : HOLO_PRESETS[preset];
  return { ...base, ...customTheme };
}

export const DEFAULT_CONFIG: HoloConfig = {
  intensity: 'medium',
  preset: 'cyan',
  enableScanlines: true,
  enableFlicker: true,
  enableParallax: true,
  enable3D: true,
  enableGlow: true,
  enableParticles: true,
  reduceMotion: false,
  glitchProbability: 0.02,
};
