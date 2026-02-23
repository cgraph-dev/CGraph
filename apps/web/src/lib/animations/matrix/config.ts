/**
 * Matrix Cipher Background Animation - Default Configuration
 *
 * @description Default configuration and configuration factory functions.
 * Provides sensible defaults for all animation parameters with responsive overrides.
 *
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { MatrixConfig } from './types';
import { DEFAULT_CONFIG } from './config-defaults';
import { CONFIG_PRESETS, type ConfigPresetName } from './config-presets';

// =============================================================================
// RE-EXPORTS — preserve public API surface
// =============================================================================

export {
  DEFAULT_PERFORMANCE,
  DEFAULT_CHARACTERS,
  DEFAULT_COLUMNS,
  DEFAULT_EFFECTS,
  DEFAULT_FONT,
  DEFAULT_CONFIG,
} from './config-defaults';

export {
  PRESET_HIGH_QUALITY,
  PRESET_POWER_SAVER,
  PRESET_MINIMAL,
  PRESET_INTENSE,
  CONFIG_PRESETS,
  type ConfigPresetName,
} from './config-presets';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deep partial type for nested configuration updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// CONFIGURATION UTILITIES
// =============================================================================

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key as keyof typeof source]; // safe downcast – structural boundary
      const targetValue = target[key as keyof T]; // safe downcast – structural boundary

      if (
        sourceValue !== undefined &&
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== undefined &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge( // type assertion: building merged config object
          // safe downcast – structural boundary
          targetValue as object, // safe downcast – runtime verified
          sourceValue as DeepPartial<object> // safe downcast – runtime verified
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue; // safe downcast – structural boundary
      }
    }
  }

  return result;
}

/**
 * Create a configuration by merging with defaults
 *
 * @param overrides - Partial configuration overrides
 * @returns Complete configuration
 */
export function createConfig(overrides: DeepPartial<MatrixConfig> = {}): MatrixConfig {
  return deepMerge(DEFAULT_CONFIG, overrides);
}

/**
 * Get a preset configuration
 *
 * @param name - Preset name
 * @returns Complete configuration
 */
export function getPreset(name: ConfigPresetName): MatrixConfig {
  const preset = CONFIG_PRESETS[name];
  if (!preset) {
    return DEFAULT_CONFIG;
  }

  if (name === 'default') {
    return DEFAULT_CONFIG;
  }

  return createConfig(preset as DeepPartial<MatrixConfig>); // safe downcast – structural boundary
}

/**
 * Get responsive configuration based on viewport width
 *
 * @param config - Base configuration
 * @param width - Viewport width in pixels
 * @returns Configuration with responsive overrides applied
 */
export function getResponsiveConfig(config: MatrixConfig, width: number): MatrixConfig {
  let responsiveOverrides: DeepPartial<MatrixConfig> = {};

  if (width < 768 && config.responsive.mobile) {
    responsiveOverrides = config.responsive.mobile;
  } else if (width < 1024 && config.responsive.tablet) {
    responsiveOverrides = config.responsive.tablet;
  } else if (config.responsive.desktop) {
    responsiveOverrides = config.responsive.desktop;
  }

  return deepMerge(config, responsiveOverrides);
}

/**
 * Validate a configuration object
 *
 * @param config - Configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateConfig(config: Partial<MatrixConfig>): string[] {
  const errors: string[] = [];

  if (config.performance) {
    const { performance } = config;
    if (
      performance.targetFPS !== undefined &&
      (performance.targetFPS < 1 || performance.targetFPS > 144)
    ) {
      errors.push('performance.targetFPS must be between 1 and 144');
    }
    if (
      performance.maxColumns !== undefined &&
      (performance.maxColumns < 1 || performance.maxColumns > 500)
    ) {
      errors.push('performance.maxColumns must be between 1 and 500');
    }
  }

  if (config.columns) {
    const { columns } = config;
    if (columns.density !== undefined && (columns.density < 0 || columns.density > 1)) {
      errors.push('columns.density must be between 0 and 1');
    }
    if (
      columns.minSpeed !== undefined &&
      columns.maxSpeed !== undefined &&
      columns.minSpeed > columns.maxSpeed
    ) {
      errors.push('columns.minSpeed cannot be greater than columns.maxSpeed');
    }
    if (
      columns.minLength !== undefined &&
      columns.maxLength !== undefined &&
      columns.minLength > columns.maxLength
    ) {
      errors.push('columns.minLength cannot be greater than columns.maxLength');
    }
  }

  if (config.effects) {
    const { effects } = config;
    if (
      effects.depthLayers !== undefined &&
      (effects.depthLayers < 1 || effects.depthLayers > 10)
    ) {
      errors.push('effects.depthLayers must be between 1 and 10');
    }
    if (effects.trailFade !== undefined && (effects.trailFade < 0 || effects.trailFade > 1)) {
      errors.push('effects.trailFade must be between 0 and 1');
    }
  }

  if (config.font) {
    const { font } = config;
    if (font.baseSize !== undefined && (font.baseSize < 4 || font.baseSize > 72)) {
      errors.push('font.baseSize must be between 4 and 72');
    }
  }

  return errors;
}

/**
 * Merge multiple configuration partials
 *
 * @param configs - Array of partial configurations to merge
 * @returns Merged configuration
 */
export function mergeConfigs(...configs: DeepPartial<MatrixConfig>[]): MatrixConfig {
  let result = cloneConfig(DEFAULT_CONFIG);
  for (const config of configs) {
    result = deepMerge(result, config);
  }
  return result;
}

/**
 * Clone a configuration object
 *
 * @param config - Configuration to clone
 * @returns Deep cloned configuration
 */
export function cloneConfig(config: MatrixConfig): MatrixConfig {
  return JSON.parse(JSON.stringify(config));
}

export default DEFAULT_CONFIG;
