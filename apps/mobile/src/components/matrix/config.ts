/**
 * Matrix Cipher Background Animation - Mobile Configuration
 * 
 * @description Default configuration and presets for mobile Matrix animation.
 * Optimized for battery life and smooth performance on mobile devices.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { MatrixMobileConfig, IntensityPreset, CharacterSetType } from './types';

// =============================================================================
// CHARACTER SETS
// =============================================================================

/**
 * Katakana characters (classic Matrix style)
 */
export const KATAKANA_CHARS = 
  'アイウエオカキクケコサシスセソタチツテトナニヌネノ' +
  'ハヒフヘホマミムメモヤユヨラリルレロワヲン';

/**
 * Latin characters
 */
export const LATIN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Numbers
 */
export const NUMBER_CHARS = '0123456789';

/**
 * Binary
 */
export const BINARY_CHARS = '01';

/**
 * Hex
 */
export const HEX_CHARS = '0123456789ABCDEF';

/**
 * Mixed characters
 */
export const MIXED_CHARS = KATAKANA_CHARS + LATIN_CHARS + NUMBER_CHARS;

/**
 * Get character set by type
 */
export function getCharacterSet(type: CharacterSetType): string[] {
  switch (type) {
    case 'katakana':
      return KATAKANA_CHARS.split('');
    case 'latin':
      return LATIN_CHARS.split('');
    case 'numbers':
      return NUMBER_CHARS.split('');
    case 'binary':
      return BINARY_CHARS.split('');
    case 'hex':
      return HEX_CHARS.split('');
    case 'mixed':
    default:
      return MIXED_CHARS.split('');
  }
}

/**
 * Get a random character from a set
 */
export function getRandomChar(chars: string[]): string {
  if (chars.length === 0) return '';
  return chars[Math.floor(Math.random() * chars.length)] ?? '';
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default mobile configuration
 * Balanced for visual appeal, smooth animation, and battery life
 */
export const DEFAULT_CONFIG: MatrixMobileConfig = {
  columnCount: 28,           // More columns for denser effect
  fontSize: 13,              // Slightly smaller for more columns
  minSpeed: 3,               // Faster minimum
  maxSpeed: 9,               // Faster maximum
  minLength: 8,              // Longer minimum trails
  maxLength: 22,             // Longer maximum trails
  changeFrequency: 0.08,     // Higher for more cipher morphing
  trailFade: 0.92,
  frameInterval: 16,         // ~60 FPS target (RAF handles actual timing)
  characterSet: 'katakana',
};

// =============================================================================
// INTENSITY PRESETS
// =============================================================================

/**
 * Low intensity - Maximum battery savings with cipher effect
 */
export const LOW_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 15,
  fontSize: 15,
  minSpeed: 2,
  maxSpeed: 5,
  minLength: 6,
  maxLength: 14,
  changeFrequency: 0.05,
  trailFade: 0.88,
  frameInterval: 33, // ~30 FPS
};

/**
 * Medium intensity - Balanced with good cipher animation
 */
export const MEDIUM_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 28,
  fontSize: 13,
  minSpeed: 3,
  maxSpeed: 9,
  minLength: 8,
  maxLength: 22,
  changeFrequency: 0.08,
  trailFade: 0.92,
  frameInterval: 16, // ~60 FPS
};

/**
 * High intensity - Best visuals with active cipher morphing
 */
export const HIGH_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 42,
  fontSize: 11,
  minSpeed: 4,
  maxSpeed: 12,
  minLength: 10,
  maxLength: 28,
  changeFrequency: 0.12,
  trailFade: 0.94,
  frameInterval: 16, // ~60 FPS
};

/**
 * Intensity presets map
 */
export const INTENSITY_PRESETS: Record<IntensityPreset, Partial<MatrixMobileConfig>> = {
  low: LOW_INTENSITY,
  medium: MEDIUM_INTENSITY,
  high: HIGH_INTENSITY,
};

/**
 * Get configuration for intensity level
 */
export function getConfigForIntensity(intensity: IntensityPreset): MatrixMobileConfig {
  return {
    ...DEFAULT_CONFIG,
    ...INTENSITY_PRESETS[intensity],
  };
}

/**
 * Create configuration with custom overrides
 */
export function createConfig(
  intensity: IntensityPreset = 'medium',
  overrides?: Partial<MatrixMobileConfig>
): MatrixMobileConfig {
  return {
    ...DEFAULT_CONFIG,
    ...INTENSITY_PRESETS[intensity],
    ...overrides,
  };
}

export default DEFAULT_CONFIG;
