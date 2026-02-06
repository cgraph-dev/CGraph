/**
 * Theme Configurations
 *
 * Color themes for the audio visualizers.
 */

import type { ThemeConfig, ThemeName } from './types';

/**
 * Available theme configurations
 */
export const THEMES: Record<ThemeName, ThemeConfig> = {
  'matrix-green': {
    primary: '#00ff41',
    secondary: '#39ff14',
    gradient: ['#00ff41', '#003b00'],
    glow: 'rgba(0, 255, 65, 0.5)',
  },
  'cyber-blue': {
    primary: '#00d4ff',
    secondary: '#00ffff',
    gradient: ['#00d4ff', '#001a33'],
    glow: 'rgba(0, 212, 255, 0.5)',
  },
  'neon-pink': {
    primary: '#ff0080',
    secondary: '#ff66b2',
    gradient: ['#ff0080', '#4d0026'],
    glow: 'rgba(255, 0, 128, 0.5)',
  },
  amber: {
    primary: '#fbbf24',
    secondary: '#fde68a',
    gradient: ['#fbbf24', '#451a03'],
    glow: 'rgba(251, 191, 36, 0.5)',
  },
};
