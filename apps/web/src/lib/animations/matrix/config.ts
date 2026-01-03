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
 * Optimized for smooth 60fps on modern devices with adaptive quality
 */
export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  targetFPS: 60,
  maxColumns: 180,           // Increased for denser effect
  useWebGL: false, // Canvas 2D is more reliable
  useOffscreenCanvas: false,
  adaptiveQuality: true,
  allowFrameSkip: true,
  maxFrameSkip: 2,           // Less aggressive frame skipping
  throttleOnBlur: true,
  throttledFPS: 15,          // Slightly higher when throttled
};

/**
 * Default character settings
 * Classic Matrix-style Katakana with faster periodic changes for cipher effect
 */
export const DEFAULT_CHARACTERS: CharacterSetConfig = {
  type: 'katakana',
  includeNumbers: true,
  includeSymbols: false,
  changeFrequency: 0.12,     // Higher for more active cipher morphing
  minChangeInterval: 2,      // Faster cycling
  maxChangeInterval: 8,      // Faster max interval
};

/**
 * Default column behavior
 * Fast-falling columns for authentic Matrix rain effect with higher density
 */
export const DEFAULT_COLUMNS: ColumnConfig = {
  minSpeed: 6,               // Faster minimum
  maxSpeed: 18,              // Much faster maximum
  minLength: 10,             // Longer minimum trails
  maxLength: 35,             // Longer maximum trails
  density: 0.85,             // Higher density
  spacing: 14,               // Tighter spacing for more columns
  randomizeStart: true,
  staggerStart: true,
  staggerDelay: 20,          // Faster stagger
  respawnRate: 0.08,         // More frequent respawns
  minRespawnDelay: 0,
  maxRespawnDelay: 40,       // Much faster respawn
};

/**
 * Default visual effects
 * Enhanced effects for authentic Matrix look with glow and depth
 */
export const DEFAULT_EFFECTS: EffectsConfig = {
  enableDepth: true,
  depthLayers: 4,            // More depth layers
  trailFade: 0.92,           // Longer trails
  backgroundFade: 0.035,     // Subtle background fade
  enableBloom: true,
  bloomIntensity: 0.8,       // Strong bloom
  enableScanlines: false,
  scanlineOpacity: 0.03,
  enableCRTEffect: false,
  crtStrength: 0.1,
  enableVignette: true,
  vignetteIntensity: 0.22,
  blendMode: 'source-over',
  speedMultiplier: 1.2,      // Global speed boost
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
  version: '2.0.0',
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
        targetFPS: 50,         // Higher FPS for smoother mobile
        maxColumns: 60,        // More columns on mobile
      },
      columns: {
        density: 0.7,
        spacing: 16,
        minSpeed: 5,
        maxSpeed: 14,
        minLength: 8,
        maxLength: 25,
      },
      effects: {
        depthLayers: 2,        // Reduced layers for performance
        enableBloom: true,     // Keep glow!
        bloomIntensity: 0.7,
        enableVignette: true,
        speedMultiplier: 1.1,
      },
      font: {
        baseSize: 12,
      },
    },
    tablet: {
      performance: {
        targetFPS: 55,
        maxColumns: 100,
      },
      columns: {
        density: 0.75,
        spacing: 15,
        minSpeed: 6,
        maxSpeed: 16,
      },
      effects: {
        depthLayers: 3,
        enableBloom: true,
        bloomIntensity: 0.75,
        speedMultiplier: 1.15,
      },
      font: {
        baseSize: 13,
      },
    },
    desktop: {
      // Uses default configuration - maximum quality
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
    maxColumns: 220,         // Even more columns
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
    targetFPS: 50,            // Higher for smoother animation
    maxColumns: 80,           // More columns
    adaptiveQuality: true,
    throttleOnBlur: true,
    throttledFPS: 15,
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 0.7,
    spacing: 16,
    minSpeed: 6,              // Fast falling
    maxSpeed: 16,             // Fast falling
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
    maxColumns: 280,          // Maximum columns
  },
  columns: {
    ...DEFAULT_COLUMNS,
    density: 1,
    spacing: 10,              // Very tight spacing
    minSpeed: 8,
    maxSpeed: 24,             // Very fast
    minLength: 12,
    maxLength: 40,
  },
  characters: {
    ...DEFAULT_CHARACTERS,
    changeFrequency: 0.18,    // Very active morphing
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
    speedMultiplier: 1.5,     // Maximum speed
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
