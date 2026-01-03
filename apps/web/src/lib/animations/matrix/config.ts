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

import type {
  MatrixConfig,
  PerformanceConfig,
  CharacterSetConfig,
  ColumnConfig,
  EffectsConfig,
  FontConfig,
} from './types';
import { MATRIX_GREEN } from './themes';

/**
 * Deep partial type for nested configuration updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default performance settings
 * Optimized for smooth 60fps on modern devices
 */
export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  targetFPS: 60,
  maxColumns: 100,
  useWebGL: false, // Canvas 2D is more reliable
  useOffscreenCanvas: false,
  adaptiveQuality: true,
  allowFrameSkip: true,
  maxFrameSkip: 3,
  throttleOnBlur: true,
  throttledFPS: 10,
};

/**
 * Default character settings
 * Classic Matrix-style Katakana with periodic changes
 */
export const DEFAULT_CHARACTERS: CharacterSetConfig = {
  type: 'katakana',
  includeNumbers: true,
  includeSymbols: false,
  changeFrequency: 0.05,
  minChangeInterval: 3,
  maxChangeInterval: 15,
};

/**
 * Default column behavior
 * Fast-falling columns for authentic Matrix rain effect
 */
export const DEFAULT_COLUMNS: ColumnConfig = {
  minSpeed: 4,               // Faster minimum
  maxSpeed: 12,              // Faster maximum
  minLength: 8,
  maxLength: 28,
  density: 0.75,
  spacing: 16,               // Balanced spacing
  randomizeStart: true,
  staggerStart: true,
  staggerDelay: 30,          // Faster stagger
  respawnRate: 0.05,         // More frequent respawns
  minRespawnDelay: 0,
  maxRespawnDelay: 80,       // Faster respawn
};

/**
 * Default visual effects
 * Enhanced effects for authentic Matrix look with glow and depth
 */
export const DEFAULT_EFFECTS: EffectsConfig = {
  enableDepth: true,
  depthLayers: 3,
  trailFade: 0.88,           // Slightly faster fade for cleaner trails
  backgroundFade: 0.04,      // Subtle background fade
  enableBloom: true,
  bloomIntensity: 0.7,       // Increased bloom
  enableScanlines: false,
  scanlineOpacity: 0.03,
  enableCRTEffect: false,
  crtStrength: 0.1,
  enableVignette: true,
  vignetteIntensity: 0.25,   // Slightly reduced for clearer view
  blendMode: 'source-over',
  speedMultiplier: 1,
};

/**
 * Default font configuration
 * Monospace font with smaller characters for authentic Matrix look
 */
export const DEFAULT_FONT: FontConfig = {
  family: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
  baseSize: 14,              // Smaller for dense Matrix effect
  minSize: 10,
  maxSize: 18,
  weight: 'bold',            // Bold weight for better visibility with glow
  letterSpacing: 0,
  sizeVariation: true,
};

/**
 * Complete default configuration
 */
export const DEFAULT_CONFIG: MatrixConfig = {
  version: '1.0.0',
  name: 'default',
  theme: MATRIX_GREEN,
  performance: DEFAULT_PERFORMANCE,
  characters: DEFAULT_CHARACTERS,
  columns: DEFAULT_COLUMNS,
  effects: DEFAULT_EFFECTS,
  font: DEFAULT_FONT,
  responsive: {
    mobile: {
      performance: {
        targetFPS: 40,         // Smooth on mobile
        maxColumns: 35,
      },
      columns: {
        density: 0.55,
        spacing: 20,
        minSpeed: 4,
        maxSpeed: 11,
      },
      effects: {
        depthLayers: 1,        // Single layer for performance
        enableBloom: true,     // Keep glow!
        bloomIntensity: 0.6,
        enableVignette: false,
      },
      font: {
        baseSize: 13,
      },
    },
    tablet: {
      performance: {
        targetFPS: 50,
        maxColumns: 60,
      },
      columns: {
        density: 0.65,
        spacing: 18,
        minSpeed: 5,
        maxSpeed: 12,
      },
      effects: {
        depthLayers: 2,
        enableBloom: true,
        bloomIntensity: 0.7,
      },
      font: {
        baseSize: 14,
      },
    },
    desktop: {
      // Uses default configuration
    },
  },
  debug: {
    showFPS: false,
    showColumnCount: false,
    logPerformance: false,
    highlightColumns: false,
  },
};

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
    maxColumns: 150,
    adaptiveQuality: false,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.85,
    spacing: 14,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 4,
    enableBloom: true,
    bloomIntensity: 0.7,
    enableVignette: true,
    vignetteIntensity: 0.4,
    enableScanlines: true,
    scanlineOpacity: 0.02,
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 14,
    sizeVariation: true,
  },
};

/**
 * Low power preset - Optimized for auth pages with smooth animation
 * Balances visual quality with performance for all devices
 */
export const PRESET_POWER_SAVER: Partial<MatrixConfig> = {
  name: 'power-saver',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 45,            // Smooth animation (was 30)
    maxColumns: 50,           // More columns
    adaptiveQuality: true,
    throttleOnBlur: true,
    throttledFPS: 10,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.6,
    spacing: 18,
    minSpeed: 5,              // Fast falling
    maxSpeed: 14,             // Fast falling
    minLength: 6,
    maxLength: 20,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 2,
    enableBloom: true,
    bloomIntensity: 0.8,      // Strong bloom for visibility
    enableVignette: true,
    vignetteIntensity: 0.2,
    enableScanlines: false,
    enableCRTEffect: false,
    trailFade: 0.9,           // Longer trails
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
    targetFPS: 30,
    maxColumns: 40,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.4,
    spacing: 24,
    minSpeed: 1,
    maxSpeed: 4,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 2,
    enableBloom: false,
    enableVignette: true,
    vignetteIntensity: 0.2,
    trailFade: 0.88,
    backgroundFade: 0.03,
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 14,
  },
};

/**
 * Intense preset - Maximum density and effects
 */
export const PRESET_INTENSE: Partial<MatrixConfig> = {
  name: 'intense',
  performance: {
    ...DEFAULT_PERFORMANCE,
    targetFPS: 60,
    maxColumns: 200,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 1,
    spacing: 12,
    minSpeed: 4,
    maxSpeed: 15,
  },
  effects: {
    ...DEFAULT_EFFECTS,
    depthLayers: 5,
    enableBloom: true,
    bloomIntensity: 1,
    enableVignette: true,
    vignetteIntensity: 0.5,
    trailFade: 0.96,
    speedMultiplier: 1.5,
  },
  font: {
    ...DEFAULT_FONT,
    baseSize: 12,
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
      const sourceValue = source[key as keyof typeof source];
      const targetValue = target[key as keyof T];
      
      if (
        sourceValue !== undefined &&
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== undefined &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as object,
          sourceValue as DeepPartial<object>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
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
  
  return createConfig(preset as DeepPartial<MatrixConfig>);
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
    if (performance.targetFPS !== undefined && (performance.targetFPS < 1 || performance.targetFPS > 144)) {
      errors.push('performance.targetFPS must be between 1 and 144');
    }
    if (performance.maxColumns !== undefined && (performance.maxColumns < 1 || performance.maxColumns > 500)) {
      errors.push('performance.maxColumns must be between 1 and 500');
    }
  }
  
  if (config.columns) {
    const { columns } = config;
    if (columns.density !== undefined && (columns.density < 0 || columns.density > 1)) {
      errors.push('columns.density must be between 0 and 1');
    }
    if (columns.minSpeed !== undefined && columns.maxSpeed !== undefined && columns.minSpeed > columns.maxSpeed) {
      errors.push('columns.minSpeed cannot be greater than columns.maxSpeed');
    }
    if (columns.minLength !== undefined && columns.maxLength !== undefined && columns.minLength > columns.maxLength) {
      errors.push('columns.minLength cannot be greater than columns.maxLength');
    }
  }
  
  if (config.effects) {
    const { effects } = config;
    if (effects.depthLayers !== undefined && (effects.depthLayers < 1 || effects.depthLayers > 10)) {
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
