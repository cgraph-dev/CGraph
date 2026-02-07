/**
 * Holographic UI Color Presets and Utilities
 * @module components/enhanced/ui/holographic-ui/presets
 */

import type { HoloTheme, HoloPreset, HoloConfig } from './types';

// =============================================================================
// COLOR PRESETS
// =============================================================================

export const HOLO_PRESETS: Record<HoloPreset, HoloTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.95)',
    secondary: 'rgba(0, 200, 255, 0.8)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.6)',
    scanline: 'rgba(0, 255, 255, 0.08)',
    background: 'rgba(0, 15, 30, 0.98)',
    surface: 'rgba(0, 30, 60, 0.9)',
    text: 'rgba(200, 255, 255, 1)',
    textMuted: 'rgba(100, 180, 200, 0.8)',
    border: 'rgba(0, 255, 255, 0.3)',
    success: 'rgba(0, 255, 150, 1)',
    warning: 'rgba(255, 200, 50, 1)',
    error: 'rgba(255, 80, 100, 1)',
    info: 'rgba(80, 200, 255, 1)',
  },
  matrix: {
    primary: 'rgba(0, 255, 65, 0.95)',
    secondary: 'rgba(0, 200, 50, 0.8)',
    accent: 'rgba(100, 255, 100, 1)',
    glow: 'rgba(0, 255, 65, 0.6)',
    scanline: 'rgba(0, 255, 65, 0.08)',
    background: 'rgba(0, 10, 0, 0.98)',
    surface: 'rgba(0, 20, 5, 0.9)',
    text: 'rgba(180, 255, 180, 1)',
    textMuted: 'rgba(80, 180, 80, 0.8)',
    border: 'rgba(0, 255, 65, 0.3)',
    success: 'rgba(0, 255, 100, 1)',
    warning: 'rgba(200, 255, 0, 1)',
    error: 'rgba(255, 50, 50, 1)',
    info: 'rgba(0, 200, 100, 1)',
  },
  purple: {
    primary: 'rgba(180, 100, 255, 0.95)',
    secondary: 'rgba(140, 60, 255, 0.8)',
    accent: 'rgba(220, 150, 255, 1)',
    glow: 'rgba(180, 80, 255, 0.6)',
    scanline: 'rgba(180, 80, 255, 0.08)',
    background: 'rgba(15, 5, 30, 0.98)',
    surface: 'rgba(30, 15, 60, 0.9)',
    text: 'rgba(230, 200, 255, 1)',
    textMuted: 'rgba(150, 120, 200, 0.8)',
    border: 'rgba(180, 100, 255, 0.3)',
    success: 'rgba(100, 255, 200, 1)',
    warning: 'rgba(255, 180, 100, 1)',
    error: 'rgba(255, 100, 150, 1)',
    info: 'rgba(150, 150, 255, 1)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.95)',
    secondary: 'rgba(255, 170, 30, 0.8)',
    accent: 'rgba(255, 230, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.6)',
    scanline: 'rgba(255, 200, 50, 0.08)',
    background: 'rgba(20, 15, 5, 0.98)',
    surface: 'rgba(40, 30, 15, 0.9)',
    text: 'rgba(255, 240, 200, 1)',
    textMuted: 'rgba(200, 170, 120, 0.8)',
    border: 'rgba(255, 200, 50, 0.3)',
    success: 'rgba(150, 255, 100, 1)',
    warning: 'rgba(255, 180, 50, 1)',
    error: 'rgba(255, 100, 80, 1)',
    info: 'rgba(200, 200, 100, 1)',
  },
  midnight: {
    primary: 'rgba(100, 150, 255, 0.95)',
    secondary: 'rgba(80, 120, 255, 0.8)',
    accent: 'rgba(150, 180, 255, 1)',
    glow: 'rgba(100, 150, 255, 0.6)',
    scanline: 'rgba(100, 150, 255, 0.08)',
    background: 'rgba(8, 12, 25, 0.98)',
    surface: 'rgba(15, 25, 50, 0.9)',
    text: 'rgba(200, 220, 255, 1)',
    textMuted: 'rgba(120, 150, 200, 0.8)',
    border: 'rgba(100, 150, 255, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 120, 140, 1)',
    info: 'rgba(120, 180, 255, 1)',
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get intensity multiplier based on config
 */
export function getIntensityMultiplier(intensity: HoloConfig['intensity']): number {
  return { subtle: 0.5, medium: 1, intense: 1.5 }[intensity ?? 'medium'];
}

/**
 * Get theme from preset with optional custom overrides
 */
export function getTheme(
  preset: HoloPreset | 'custom',
  customTheme?: Partial<HoloTheme>
): HoloTheme {
  const base = preset === 'custom' ? HOLO_PRESETS.cyan : HOLO_PRESETS[preset];
  return { ...base, ...customTheme };
}

// =============================================================================
// CSS KEYFRAMES
// =============================================================================

export const holoStyles = `
  @keyframes holoShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes holoScanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes holoGlitch {
    0%, 100% { transform: translate(0); filter: none; }
    25% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
    50% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
    75% { transform: translate(-1px, -1px); }
  }
  
  @keyframes holoPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;
