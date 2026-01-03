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
  return chars[Math.floor(Math.random() * chars.length)];
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default mobile configuration
 * Balanced for visual appeal and battery life
 */
export const DEFAULT_CONFIG: MatrixMobileConfig = {
  columnCount: 20,
  fontSize: 14,
  minSpeed: 2,
  maxSpeed: 6,
  minLength: 5,
  maxLength: 15,
  changeFrequency: 0.03,
  trailFade: 0.9,
  frameInterval: 50, // ~20 FPS
  characterSet: 'katakana',
};

// =============================================================================
// INTENSITY PRESETS
// =============================================================================

/**
 * Low intensity - Maximum battery savings
 */
export const LOW_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 10,
  fontSize: 16,
  minSpeed: 1,
  maxSpeed: 3,
  minLength: 4,
  maxLength: 10,
  changeFrequency: 0.02,
  trailFade: 0.85,
  frameInterval: 80, // ~12 FPS
};

/**
 * Medium intensity - Balanced
 */
export const MEDIUM_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 20,
  fontSize: 14,
  minSpeed: 2,
  maxSpeed: 5,
  minLength: 5,
  maxLength: 15,
  changeFrequency: 0.03,
  trailFade: 0.9,
  frameInterval: 50, // ~20 FPS
};

/**
 * High intensity - Best visuals
 */
export const HIGH_INTENSITY: Partial<MatrixMobileConfig> = {
  columnCount: 35,
  fontSize: 12,
  minSpeed: 3,
  maxSpeed: 8,
  minLength: 6,
  maxLength: 20,
  changeFrequency: 0.05,
  trailFade: 0.92,
  frameInterval: 33, // ~30 FPS
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
