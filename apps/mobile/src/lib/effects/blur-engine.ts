/**
 * BlurEngine - Cross-Platform Blur System
 *
 * Provides native blur on iOS 13+ and Android 12+
 * With beautiful gradient fallbacks for Android 9-11
 *
 * Features:
 * - Device capability detection
 * - Multi-layer blur simulation for older devices
 * - Progressive intensity scaling
 * - Performance-optimized rendering
 */

import { Platform, Dimensions } from 'react-native';
// Note: expo-device can be used for advanced device tier detection
// import * as Device from 'expo-device';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type BlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extraLight'
  | 'systemMaterial'
  | 'systemThinMaterial'
  | 'systemChromeMaterial'
  | 'systemUltraThinMaterial'
  | 'systemThickMaterial';

export type BlurIntensity = 'ultraLight' | 'light' | 'medium' | 'strong' | 'ultraStrong';

export type BlurStyle =
  | 'standard'
  | 'frosted'
  | 'crystal'
  | 'neon'
  | 'aurora'
  | 'midnight'
  | 'dawn'
  | 'ember'
  | 'ocean'
  | 'holographic';

export interface BlurCapabilities {
  supportsNativeBlur: boolean;
  supportsVibrancy: boolean;
  maxBlurIntensity: number;
  recommendedIntensity: number;
  deviceTier: 'high' | 'mid' | 'low';
  platformVersion: number;
  useFallback: boolean;
}

export interface BlurConfig {
  intensity: number; // 0-100
  tint: BlurTint;
  style: BlurStyle;
  animated?: boolean;
  reducedTransparency?: boolean;
}

export interface BlurFallbackColors {
  background: string;
  overlay: string;
  border: string;
  gradientStart: string;
  gradientEnd: string;
  noise: number; // 0-1 opacity for noise texture
}

export interface BlurLayerConfig {
  type: 'native' | 'gradient' | 'solid';
  intensity: number;
  tint: BlurTint;
  colors: BlurFallbackColors;
  layers: number;
}

// ============================================================================
// Device Capability Detection
// ============================================================================

let cachedCapabilities: BlurCapabilities | null = null;

/**
 * Gets blur capabilities.
 *
 */
export function getBlurCapabilities(): BlurCapabilities {
  if (cachedCapabilities) return cachedCapabilities;

  const { width, height } = Dimensions.get('window');
  const screenSize = width * height;

  if (Platform.OS === 'ios') {
     
    const iosVersion = parseInt(Platform.Version as string, 10);

    cachedCapabilities = {
      supportsNativeBlur: iosVersion >= 13,
      supportsVibrancy: iosVersion >= 13,
      maxBlurIntensity: 100,
      recommendedIntensity: 80,
      deviceTier: screenSize > 500000 ? 'high' : screenSize > 350000 ? 'mid' : 'low',
      platformVersion: iosVersion,
      useFallback: iosVersion < 13,
    };
  } else if (Platform.OS === 'android') {
     
    const androidVersion = Platform.Version as number;

    // Android 12+ (API 31+) supports RenderEffect blur
    // Android 9-11 uses fallback
    const supportsNative = androidVersion >= 31;

    // Determine device tier based on screen size (rough heuristic)
    // In production, would also check Device.totalMemory, deviceYearClass, etc.
    let deviceTier: 'high' | 'mid' | 'low' = 'mid';

    if (screenSize > 500000) {
      deviceTier = 'high';
    } else if (screenSize < 350000) {
      deviceTier = 'low';
    }

    cachedCapabilities = {
      supportsNativeBlur: supportsNative,
      supportsVibrancy: false, // Android doesn't support vibrancy
      maxBlurIntensity: supportsNative ? 100 : 60, // Limit fallback intensity
      recommendedIntensity: supportsNative ? 70 : 40,
      deviceTier,
      platformVersion: androidVersion,
      useFallback: !supportsNative,
    };
  } else {
    // Web or other platforms
    cachedCapabilities = {
      supportsNativeBlur: true, // Assume CSS backdrop-filter support
      supportsVibrancy: true,
      maxBlurIntensity: 100,
      recommendedIntensity: 60,
      deviceTier: 'high',
      platformVersion: 0,
      useFallback: false,
    };
  }

  return cachedCapabilities;
}

/**
 * Clear capabilities cache.
 *
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null;
}

// ============================================================================
// Intensity Mapping
// ============================================================================

const INTENSITY_MAP: Record<BlurIntensity, number> = {
  ultraLight: 10,
  light: 25,
  medium: 50,
  strong: 75,
  ultraStrong: 100,
};

/**
 * Gets intensity value.
 *
 */
export function getIntensityValue(intensity: BlurIntensity | number): number {
  if (typeof intensity === 'number') {
    return Math.max(0, Math.min(100, intensity));
  }
  return INTENSITY_MAP[intensity];
}

/**
 * Scale intensity for device.
 *
 */
export function scaleIntensityForDevice(intensity: number): number {
  const capabilities = getBlurCapabilities();
  const scaled = (intensity / 100) * capabilities.maxBlurIntensity;
  return Math.round(scaled);
}

// ============================================================================
// Blur Style Colors
// ============================================================================

const BLUR_STYLE_COLORS: Record<
  BlurStyle,
  { light: BlurFallbackColors; dark: BlurFallbackColors }
> = {
  standard: {
    light: {
      background: 'rgba(255, 255, 255, 0.72)',
      overlay: 'rgba(255, 255, 255, 0.3)',
      border: 'rgba(255, 255, 255, 0.2)',
      gradientStart: 'rgba(255, 255, 255, 0.8)',
      gradientEnd: 'rgba(240, 240, 240, 0.6)',
      noise: 0.03,
    },
    dark: {
      background: 'rgba(30, 30, 30, 0.72)',
      overlay: 'rgba(0, 0, 0, 0.3)',
      border: 'rgba(255, 255, 255, 0.1)',
      gradientStart: 'rgba(40, 40, 40, 0.8)',
      gradientEnd: 'rgba(20, 20, 20, 0.6)',
      noise: 0.02,
    },
  },
  frosted: {
    light: {
      background: 'rgba(255, 255, 255, 0.85)',
      overlay: 'rgba(200, 220, 255, 0.2)',
      border: 'rgba(255, 255, 255, 0.4)',
      gradientStart: 'rgba(255, 255, 255, 0.9)',
      gradientEnd: 'rgba(230, 240, 255, 0.7)',
      noise: 0.05,
    },
    dark: {
      background: 'rgba(40, 50, 70, 0.85)',
      overlay: 'rgba(100, 150, 200, 0.15)',
      border: 'rgba(100, 150, 200, 0.2)',
      gradientStart: 'rgba(50, 60, 80, 0.9)',
      gradientEnd: 'rgba(30, 40, 60, 0.7)',
      noise: 0.04,
    },
  },
  crystal: {
    light: {
      background: 'rgba(255, 255, 255, 0.6)',
      overlay: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      gradientStart: 'rgba(255, 255, 255, 0.8)',
      gradientEnd: 'rgba(200, 255, 230, 0.5)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(20, 30, 25, 0.75)',
      overlay: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.25)',
      gradientStart: 'rgba(30, 50, 40, 0.85)',
      gradientEnd: 'rgba(16, 40, 30, 0.65)',
      noise: 0.03,
    },
  },
  neon: {
    light: {
      background: 'rgba(30, 20, 50, 0.75)',
      overlay: 'rgba(139, 92, 246, 0.2)',
      border: 'rgba(139, 92, 246, 0.5)',
      gradientStart: 'rgba(50, 30, 80, 0.85)',
      gradientEnd: 'rgba(80, 40, 120, 0.65)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(15, 10, 30, 0.85)',
      overlay: 'rgba(139, 92, 246, 0.25)',
      border: 'rgba(0, 255, 255, 0.4)',
      gradientStart: 'rgba(30, 20, 60, 0.9)',
      gradientEnd: 'rgba(60, 30, 100, 0.7)',
      noise: 0.03,
    },
  },
  aurora: {
    light: {
      background: 'rgba(20, 30, 50, 0.7)',
      overlay: 'rgba(0, 200, 150, 0.15)',
      border: 'rgba(0, 255, 200, 0.3)',
      gradientStart: 'rgba(0, 150, 100, 0.4)',
      gradientEnd: 'rgba(100, 50, 200, 0.4)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(10, 15, 30, 0.85)',
      overlay: 'rgba(0, 255, 170, 0.1)',
      border: 'rgba(0, 255, 200, 0.25)',
      gradientStart: 'rgba(0, 100, 80, 0.5)',
      gradientEnd: 'rgba(80, 40, 150, 0.5)',
      noise: 0.03,
    },
  },
  midnight: {
    light: {
      background: 'rgba(20, 20, 40, 0.8)',
      overlay: 'rgba(50, 50, 100, 0.2)',
      border: 'rgba(100, 100, 200, 0.2)',
      gradientStart: 'rgba(30, 30, 60, 0.85)',
      gradientEnd: 'rgba(10, 10, 30, 0.7)',
      noise: 0.04,
    },
    dark: {
      background: 'rgba(10, 10, 25, 0.9)',
      overlay: 'rgba(30, 30, 80, 0.2)',
      border: 'rgba(80, 80, 160, 0.15)',
      gradientStart: 'rgba(20, 20, 50, 0.95)',
      gradientEnd: 'rgba(5, 5, 20, 0.8)',
      noise: 0.03,
    },
  },
  dawn: {
    light: {
      background: 'rgba(255, 230, 220, 0.75)',
      overlay: 'rgba(255, 150, 100, 0.15)',
      border: 'rgba(255, 180, 150, 0.3)',
      gradientStart: 'rgba(255, 200, 180, 0.85)',
      gradientEnd: 'rgba(255, 150, 200, 0.6)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(50, 30, 40, 0.8)',
      overlay: 'rgba(255, 100, 80, 0.15)',
      border: 'rgba(255, 150, 120, 0.2)',
      gradientStart: 'rgba(80, 40, 50, 0.85)',
      gradientEnd: 'rgba(100, 50, 80, 0.65)',
      noise: 0.03,
    },
  },
  ember: {
    light: {
      background: 'rgba(60, 30, 20, 0.75)',
      overlay: 'rgba(255, 100, 50, 0.2)',
      border: 'rgba(255, 150, 50, 0.4)',
      gradientStart: 'rgba(100, 40, 20, 0.85)',
      gradientEnd: 'rgba(150, 60, 30, 0.65)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(30, 15, 10, 0.85)',
      overlay: 'rgba(255, 80, 30, 0.2)',
      border: 'rgba(255, 120, 50, 0.3)',
      gradientStart: 'rgba(60, 25, 15, 0.9)',
      gradientEnd: 'rgba(100, 40, 20, 0.7)',
      noise: 0.03,
    },
  },
  ocean: {
    light: {
      background: 'rgba(200, 230, 255, 0.75)',
      overlay: 'rgba(0, 150, 255, 0.15)',
      border: 'rgba(0, 200, 255, 0.3)',
      gradientStart: 'rgba(150, 220, 255, 0.85)',
      gradientEnd: 'rgba(100, 180, 255, 0.6)',
      noise: 0.02,
    },
    dark: {
      background: 'rgba(15, 30, 50, 0.85)',
      overlay: 'rgba(0, 100, 200, 0.2)',
      border: 'rgba(0, 150, 255, 0.25)',
      gradientStart: 'rgba(20, 50, 80, 0.9)',
      gradientEnd: 'rgba(10, 30, 60, 0.7)',
      noise: 0.03,
    },
  },
  holographic: {
    light: {
      background: 'rgba(255, 255, 255, 0.5)',
      overlay: 'rgba(255, 0, 255, 0.1)',
      border: 'rgba(0, 255, 255, 0.4)',
      gradientStart: 'rgba(255, 200, 255, 0.6)',
      gradientEnd: 'rgba(200, 255, 255, 0.6)',
      noise: 0.03,
    },
    dark: {
      background: 'rgba(20, 20, 30, 0.75)',
      overlay: 'rgba(0, 255, 255, 0.15)',
      border: 'rgba(255, 0, 255, 0.3)',
      gradientStart: 'rgba(50, 30, 70, 0.8)',
      gradientEnd: 'rgba(30, 50, 70, 0.8)',
      noise: 0.04,
    },
  },
};

/**
 * Gets blur style colors.
 *
 */
export function getBlurStyleColors(style: BlurStyle, tint: BlurTint): BlurFallbackColors {
  const isDark = tint === 'dark' || tint === 'systemMaterial' || tint === 'systemThickMaterial';
  return BLUR_STYLE_COLORS[style][isDark ? 'dark' : 'light'];
}

// ============================================================================
// Blur Configuration Builder
// ============================================================================

/**
 * Creates blur config.
 *
 */
export function createBlurConfig(options: Partial<BlurConfig> = {}): BlurLayerConfig {
  const capabilities = getBlurCapabilities();

  const config: BlurConfig = {
    intensity: options.intensity ?? 50,
    tint: options.tint ?? 'dark',
    style: options.style ?? 'standard',
    animated: options.animated ?? false,
    reducedTransparency: options.reducedTransparency ?? false,
  };

  const scaledIntensity = scaleIntensityForDevice(config.intensity);
  const colors = getBlurStyleColors(config.style, config.tint);

  // Adjust colors based on intensity
  const intensityFactor = scaledIntensity / 100;
  const adjustedColors: BlurFallbackColors = {
    ...colors,
    noise: colors.noise * intensityFactor,
  };

  return {
    type: capabilities.useFallback ? 'gradient' : 'native',
    intensity: scaledIntensity,
    tint: config.tint,
    colors: adjustedColors,
    layers: capabilities.useFallback ? 3 : 1,
  };
}

// ============================================================================
// Tint to Expo Blur Mapping
// ============================================================================

type ExpoBlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extraLight'
  | 'prominent'
  | 'systemUltraThinMaterial'
  | 'systemThinMaterial'
  | 'systemMaterial'
  | 'systemThickMaterial'
  | 'systemChromeMaterial'
  | 'systemUltraThinMaterialLight'
  | 'systemThinMaterialLight'
  | 'systemMaterialLight'
  | 'systemThickMaterialLight'
  | 'systemChromeMaterialLight'
  | 'systemUltraThinMaterialDark'
  | 'systemThinMaterialDark'
  | 'systemMaterialDark'
  | 'systemThickMaterialDark'
  | 'systemChromeMaterialDark'
  | 'regular';

/**
 * Map tint to expo blur.
 *
 */
export function mapTintToExpoBlur(tint: BlurTint): ExpoBlurTint {
  const mapping: Record<BlurTint, ExpoBlurTint> = {
    light: 'light',
    dark: 'dark',
    default: 'default',
    extraLight: 'extraLight',
    systemMaterial: 'systemMaterial',
    systemThinMaterial: 'systemThinMaterial',
    systemChromeMaterial: 'systemChromeMaterial',
    systemUltraThinMaterial: 'systemUltraThinMaterial',
    systemThickMaterial: 'systemThickMaterial',
  };
  return mapping[tint] || 'default';
}

// ============================================================================
// Fallback Gradient Generator
// ============================================================================

export interface FallbackGradientConfig {
  colors: string[];
  locations?: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Generate fallback gradient.
 *
 */
export function generateFallbackGradient(
  style: BlurStyle,
  tint: BlurTint,
  intensity: number
): FallbackGradientConfig {
  const colors = getBlurStyleColors(style, tint);
  const intensityFactor = intensity / 100;

  // Create multi-stop gradient for more natural blur simulation
  return {
    colors: [
      colors.gradientStart,
      adjustOpacity(colors.background, 0.5 + intensityFactor * 0.3),
      colors.gradientEnd,
    ],
    locations: [0, 0.5, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  };
}

function adjustOpacity(color: string, opacity: number): string {
  // Handle rgba format
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))})`;
  }
  return color;
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Should reduce blur.
 *
 */
export function shouldReduceBlur(): boolean {
  const capabilities = getBlurCapabilities();
  return capabilities.deviceTier === 'low' || capabilities.useFallback;
}

/**
 * Gets optimal blur layers.
 *
 */
export function getOptimalBlurLayers(intensity: number): number {
  const capabilities = getBlurCapabilities();

  if (!capabilities.useFallback) return 1; // Native blur uses 1 layer

  // Fallback uses multiple layers for depth simulation
  if (capabilities.deviceTier === 'low') return 2;
  if (intensity > 70) return 4;
  if (intensity > 40) return 3;
  return 2;
}

// ============================================================================
// Export Default Engine
// ============================================================================

const BlurEngine = {
  getCapabilities: getBlurCapabilities,
  clearCache: clearCapabilitiesCache,
  getIntensityValue,
  scaleIntensityForDevice,
  getStyleColors: getBlurStyleColors,
  createConfig: createBlurConfig,
  mapTint: mapTintToExpoBlur,
  generateFallbackGradient,
  shouldReduceBlur,
  getOptimalLayers: getOptimalBlurLayers,
};

export default BlurEngine;
