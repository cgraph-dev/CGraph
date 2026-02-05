import type { HolographicTheme, HolographicConfig } from './types';

/**
 * Holographic color themes
 */
export const HOLOGRAPHIC_THEMES = {
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
} as const satisfies Record<string, HolographicTheme>;

/**
 * Safely get a theme by name
 */
export function getTheme(colorTheme: HolographicConfig['colorTheme']): HolographicTheme {
  if (colorTheme === 'custom') return HOLOGRAPHIC_THEMES.cyan;
  return HOLOGRAPHIC_THEMES[colorTheme] ?? HOLOGRAPHIC_THEMES.cyan;
}

/**
 * Intensity multipliers for effects
 */
export const INTENSITY_MULTIPLIERS = {
  subtle: 0.5,
  medium: 1,
  intense: 1.5,
} as const;

/**
 * Status indicator colors
 */
export const STATUS_COLORS = {
  online: 'rgb(50, 255, 100)',
  offline: 'rgb(150, 150, 150)',
  away: 'rgb(255, 200, 50)',
  busy: 'rgb(255, 80, 80)',
} as const;

/**
 * Notification type to color theme mapping
 */
export const NOTIFICATION_THEMES: Record<string, HolographicConfig['colorTheme']> = {
  info: 'cyan',
  success: 'green',
  warning: 'gold',
  error: 'purple',
};

/**
 * CSS keyframes for holographic effects (add to global CSS)
 */
export const holographicStyles = `
  @keyframes holographicShimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
  
  @keyframes scanlineMove {
    0% { transform: translateY(0); }
    100% { transform: translateY(100%); }
  }
  
  @keyframes holoGlitch {
    0%, 100% { transform: translate(0); filter: none; }
    20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
    40% { transform: translate(2px, -2px); filter: hue-rotate(-90deg); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
  }
`;
