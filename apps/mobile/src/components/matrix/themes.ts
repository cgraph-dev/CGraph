/**
 * Matrix Cipher Background Animation - Mobile Themes
 * 
 * @description Color themes for mobile Matrix animation.
 * Optimized for mobile displays with vibrant colors.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { ThemePreset, MatrixMobileTheme } from './types';

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

export const MATRIX_GREEN: MatrixMobileTheme = {
  id: 'matrix-green',
  primaryColor: '#00ff41',
  secondaryColor: '#00cc33',
  tertiaryColor: '#008822',
  backgroundColor: '#0a0a0a',
  glowColor: '#00ff41',
};

export const CYBER_BLUE: MatrixMobileTheme = {
  id: 'cyber-blue',
  primaryColor: '#00d4ff',
  secondaryColor: '#0099cc',
  tertiaryColor: '#005577',
  backgroundColor: '#050810',
  glowColor: '#00d4ff',
};

export const BLOOD_RED: MatrixMobileTheme = {
  id: 'blood-red',
  primaryColor: '#ff1744',
  secondaryColor: '#cc1133',
  tertiaryColor: '#880022',
  backgroundColor: '#0a0505',
  glowColor: '#ff1744',
};

export const GOLDEN: MatrixMobileTheme = {
  id: 'golden',
  primaryColor: '#ffc107',
  secondaryColor: '#cc9900',
  tertiaryColor: '#886600',
  backgroundColor: '#080604',
  glowColor: '#ffc107',
};

export const PURPLE_HAZE: MatrixMobileTheme = {
  id: 'purple-haze',
  primaryColor: '#e040fb',
  secondaryColor: '#aa00cc',
  tertiaryColor: '#660088',
  backgroundColor: '#08050a',
  glowColor: '#e040fb',
};

export const NEON_PINK: MatrixMobileTheme = {
  id: 'neon-pink',
  primaryColor: '#ff4081',
  secondaryColor: '#cc3366',
  tertiaryColor: '#882244',
  backgroundColor: '#0a0508',
  glowColor: '#ff4081',
};

export const ICE: MatrixMobileTheme = {
  id: 'ice',
  primaryColor: '#e0f7fa',
  secondaryColor: '#80deea',
  tertiaryColor: '#4dd0e1',
  backgroundColor: '#051015',
  glowColor: '#e0f7fa',
};

export const FIRE: MatrixMobileTheme = {
  id: 'fire',
  primaryColor: '#ff6d00',
  secondaryColor: '#ff3d00',
  tertiaryColor: '#dd2c00',
  backgroundColor: '#0a0500',
  glowColor: '#ff9100',
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

export const THEME_REGISTRY: Record<ThemePreset, MatrixMobileTheme> = {
  'matrix-green': MATRIX_GREEN,
  'cyber-blue': CYBER_BLUE,
  'blood-red': BLOOD_RED,
  'golden': GOLDEN,
  'purple-haze': PURPLE_HAZE,
  'neon-pink': NEON_PINK,
  'ice': ICE,
  'fire': FIRE,
};

/**
 * Get theme by preset name
 */
export function getTheme(preset: ThemePreset): MatrixMobileTheme {
  return THEME_REGISTRY[preset] || MATRIX_GREEN;
}

/**
 * Get all available themes for selection
 */
export function getAllThemes(): Array<{ id: ThemePreset; name: string; color: string }> {
  return [
    { id: 'matrix-green', name: 'Matrix Green', color: '#00ff41' },
    { id: 'cyber-blue', name: 'Cyber Blue', color: '#00d4ff' },
    { id: 'blood-red', name: 'Blood Red', color: '#ff1744' },
    { id: 'golden', name: 'Golden', color: '#ffc107' },
    { id: 'purple-haze', name: 'Purple Haze', color: '#e040fb' },
    { id: 'neon-pink', name: 'Neon Pink', color: '#ff4081' },
    { id: 'ice', name: 'Ice', color: '#e0f7fa' },
    { id: 'fire', name: 'Fire', color: '#ff6d00' },
  ];
}

export default THEME_REGISTRY;
