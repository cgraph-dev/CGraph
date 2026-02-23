/**
 * Matrix Cipher Background Animation - Default Configuration Values
 *
 * @description Default configuration constants for all animation parameters
 * with responsive overrides.
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

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default performance settings
 * Optimized for smooth 60fps on modern devices with adaptive quality
 */
export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  targetFPS: 60,
  maxColumns: 180, // Increased for denser effect
  useWebGL: false, // Canvas 2D is more reliable
  useOffscreenCanvas: false,
  adaptiveQuality: true,
  allowFrameSkip: true,
  maxFrameSkip: 2, // Less aggressive frame skipping
  throttleOnBlur: true,
  throttledFPS: 15, // Slightly higher when throttled
};

/**
 * Default character settings
 * Classic Matrix-style Katakana with faster periodic changes for cipher effect
 */
export const DEFAULT_CHARACTERS: CharacterSetConfig = {
  type: 'katakana',
  includeNumbers: true,
  includeSymbols: false,
  changeFrequency: 0.12, // Higher for more active cipher morphing
  minChangeInterval: 2, // Faster cycling
  maxChangeInterval: 8, // Faster max interval
};

/**
 * Default column behavior
 * Fast-falling columns for authentic Matrix rain effect with higher density
 */
export const DEFAULT_COLUMNS: ColumnConfig = {
  minSpeed: 6, // Faster minimum
  maxSpeed: 18, // Much faster maximum
  minLength: 10, // Longer minimum trails
  maxLength: 35, // Longer maximum trails
  density: 0.85, // Higher density
  spacing: 14, // Tighter spacing for more columns
  randomizeStart: true,
  staggerStart: true,
  staggerDelay: 20, // Faster stagger
  respawnRate: 0.08, // More frequent respawns
  minRespawnDelay: 0,
  maxRespawnDelay: 40, // Much faster respawn
};

/**
 * Default visual effects
 * Enhanced effects for authentic Matrix look with glow and depth
 */
export const DEFAULT_EFFECTS: EffectsConfig = {
  enableDepth: true,
  depthLayers: 4, // More depth layers
  trailFade: 0.92, // Longer trails
  backgroundFade: 0.035, // Subtle background fade
  enableBloom: true,
  bloomIntensity: 0.8, // Strong bloom
  enableScanlines: false,
  scanlineOpacity: 0.03,
  enableCRTEffect: false,
  crtStrength: 0.1,
  enableVignette: true,
  vignetteIntensity: 0.22,
  blendMode: 'source-over',
  speedMultiplier: 1.2, // Global speed boost
};

/**
 * Default font configuration
 * Monospace font with smaller characters for authentic Matrix look
 */
export const DEFAULT_FONT: FontConfig = {
  family: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
  baseSize: 14, // Smaller for dense Matrix effect
  minSize: 10,
  maxSize: 18,
  weight: 'bold', // Bold weight for better visibility with glow
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
        targetFPS: 50, // Higher FPS for smoother mobile
        maxColumns: 60, // More columns on mobile
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
        depthLayers: 2, // Reduced layers for performance
        enableBloom: true, // Keep glow!
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
