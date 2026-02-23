/**
 * Matrix Cipher Background Animation - Configuration Presets
 *
 * @description Pre-built configuration presets for different use cases:
 * high-quality, power-saver, minimal, and intense.
 *
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { MatrixConfig } from './types';
import {
  DEFAULT_CONFIG,
  DEFAULT_PERFORMANCE,
  DEFAULT_CHARACTERS,
  DEFAULT_COLUMNS,
  DEFAULT_EFFECTS,
  DEFAULT_FONT,
} from './config-defaults';

// =============================================================================
// CONFIGURATION PRESETS
// =============================================================================

/**
 * High performance preset - Maximum visual quality
 */
export const PRESET_HIGH_QUALITY: Partial<MatrixConfig> = {
  name: 'high-quality',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 60,
    maxColumns: 220, // Even more columns
    adaptiveQuality: false,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.95,
    spacing: 12,
    minSpeed: 7,
    maxSpeed: 20,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 5,
    enableBloom: true,
    bloomIntensity: 0.85,
    enableVignette: true,
    vignetteIntensity: 0.35,
    enableScanlines: true,
    scanlineOpacity: 0.02,
    speedMultiplier: 1.3,
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 13,
    sizeVariation: true,
  },
};

/**
 * Power saver preset - Optimized for auth pages with smooth animation
 * Balances visual quality with performance for all devices
 */
export const PRESET_POWER_SAVER: Partial<MatrixConfig> = {
  name: 'power-saver',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 50, // Higher for smoother animation
    maxColumns: 80, // More columns
    adaptiveQuality: true,
    throttleOnBlur: true,
    throttledFPS: 15,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.7,
    spacing: 16,
    minSpeed: 6, // Fast falling
    maxSpeed: 16, // Fast falling
    minLength: 8,
    maxLength: 25,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 3,
    enableBloom: true,
    bloomIntensity: 0.75,
    enableVignette: true,
    vignetteIntensity: 0.2,
    enableScanlines: false,
    enableCRTEffect: false,
    trailFade: 0.9, // Longer trails
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 14,
    minSize: 11,
    maxSize: 17,
    sizeVariation: true,
  },
};

/**
 * Minimal preset - Subtle background effect
 */
export const PRESET_MINIMAL: Partial<MatrixConfig> = {
  name: 'minimal',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 40,
    maxColumns: 50,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.5,
    spacing: 22,
    minSpeed: 3,
    maxSpeed: 8,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 2,
    enableBloom: true,
    bloomIntensity: 0.5,
    enableVignette: true,
    vignetteIntensity: 0.2,
    trailFade: 0.9,
    backgroundFade: 0.03,
    speedMultiplier: 0.8,
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 14,
  },
};

/**
 * Intense preset - Maximum density and effects with cipher animation
 */
export const PRESET_INTENSE: Partial<MatrixConfig> = {
  name: 'intense',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 60,
    maxColumns: 280, // Maximum columns
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 1,
    spacing: 10, // Very tight spacing
    minSpeed: 8,
    maxSpeed: 24, // Very fast
    minLength: 12,
    maxLength: 40,
  },
  characters: {
    ...DEFAULT_CHARACTERS,
    changeFrequency: 0.18, // Very active morphing
    minChangeInterval: 1,
    maxChangeInterval: 5,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 5,
    enableBloom: true,
    bloomIntensity: 1,
    enableVignette: true,
    vignetteIntensity: 0.4,
    trailFade: 0.95,
    speedMultiplier: 1.5, // Maximum speed
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 11,
  },
};

/**
 * All available presets
 */
export const CONFIG_PRESETS = {
  default: DEFAULT_CONFIG,
  'high-quality': PRESET_HIGH_QUALITY,
  'power-saver': PRESET_POWER_SAVER,
  minimal: PRESET_MINIMAL,
  intense: PRESET_INTENSE,
} as const;

export type ConfigPresetName = keyof typeof CONFIG_PRESETS;
