/**
 * CustomizationEngine - Core engine for UI customization system
 *
 * Provides 50+ customization options with:
 * - Real-time preview updates
 * - Theme validation
 * - Import/export functionality
 * - Preset management
 * - Undo/redo support
 *
 * @version 1.0.0
 * @since v0.10.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Color from 'color';
import chroma from 'chroma-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type PerformanceMode = 'visual-first' | 'balanced' | 'performance';
export type MotionIntensity = 'minimal' | 'moderate' | 'intense';
export type GlassmorphismVariant =
  | 'default'
  | 'frosted'
  | 'crystal'
  | 'neon'
  | 'holographic'
  | 'aurora'
  | 'midnight'
  | 'dawn'
  | 'ember'
  | 'ocean';

export interface ColorShade {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Base color
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface ColorSystem {
  primary: ColorShade;
  secondary: ColorShade;
  accent: ColorShade;
  surface: {
    base: string;
    elevated: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  glassmorphism: {
    tint: string;
    opacity: number;
  };
}

export interface TypographySystem {
  fontFamily: string;
  baseSize: number; // 12-20px
  scaleRatio: number; // 1.2 (minor third), 1.25 (major third), 1.333 (perfect fourth)
  lineHeight: number; // 1.2 - 1.8
  letterSpacing: number; // -0.05 to 0.1em
  weights: {
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface SpacingSystem {
  gridSize: number; // 4, 8, or 12pt
  scale: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
}

export interface BorderRadiusSystem {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface ShadowSystem {
  intensity: number; // 0-100
  color: string;
  spread: number;
  blur: number;
}

export interface EffectsConfig {
  blur: {
    enabled: boolean;
    intensity: number; // 0-100
    perComponent: {
      cards: number;
      modals: number;
      headers: number;
    };
  };
  particles: {
    enabled: boolean;
    density: 'off' | 'low' | 'medium' | 'high' | 'ultra';
    color: string;
  };
  glow: {
    enabled: boolean;
    intensity: 'off' | 'subtle' | 'moderate' | 'intense';
    color: string;
  };
  borderGradients: {
    enabled: boolean;
    speed: number; // 0.5x - 2x
  };
  scanlines: {
    enabled: boolean;
    opacity: number; // 0-100
    speed: number;
  };
  glassmorphism: GlassmorphismVariant;
}

export interface AnimationConfig {
  speed: number; // 0.5x - 2x
  intensity: MotionIntensity;
  categories: {
    screenTransitions: boolean;
    componentEntrance: boolean;
    microInteractions: boolean;
    particleEffects: boolean;
  };
  springPhysics: {
    tension: number; // 10-300
    friction: number; // 5-40
  };
  haptics: {
    enabled: boolean;
    strength: 'off' | 'light' | 'medium' | 'strong';
  };
}

export interface LayoutConfig {
  density: DensityMode;
  componentScaling: number; // 0.8 - 1.5
  gridLayout: boolean; // true = grid, false = list
  sidebarWidth: number; // percentage or px
  tabBarStyle: 'icon-only' | 'with-labels' | 'hidden';
  perScreen: {
    forums: DensityMode;
    chat: DensityMode;
    groups: DensityMode;
  };
}

export interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  increasedTouchTargets: boolean; // 44pt minimum
  hapticAlternatives: boolean;
}

export interface PerformanceConfig {
  mode: PerformanceMode;
  batterySaver: boolean;
  autoThrottle: boolean; // Auto-reduce effects at <20% battery
}

export interface ThemeConfig {
  name: string;
  version: string;
  author?: string;
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  borderRadius: BorderRadiusSystem;
  shadows: ShadowSystem;
  effects: EffectsConfig;
  animations: AnimationConfig;
  layout: LayoutConfig;
  accessibility: AccessibilityConfig;
  performance: PerformanceConfig;
}

export interface ThemeHistory {
  past: ThemeConfig[];
  present: ThemeConfig;
  future: ThemeConfig[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_COLOR_SYSTEM: ColorSystem = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981', // Base
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  surface: {
    base: '#111827',
    elevated: '#1f2937',
    overlay: '#374151',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
  },
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  glassmorphism: {
    tint: '#1f2937',
    opacity: 0.2,
  },
};

export const DEFAULT_TYPOGRAPHY: TypographySystem = {
  fontFamily: 'System',
  baseSize: 16,
  scaleRatio: 1.25, // Major third
  lineHeight: 1.5,
  letterSpacing: 0,
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const DEFAULT_SPACING: SpacingSystem = {
  gridSize: 8,
  scale: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
};

export const DEFAULT_BORDER_RADIUS: BorderRadiusSystem = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const DEFAULT_SHADOWS: ShadowSystem = {
  intensity: 50,
  color: '#000000',
  spread: 4,
  blur: 12,
};

export const DEFAULT_EFFECTS: EffectsConfig = {
  blur: {
    enabled: true,
    intensity: 75,
    perComponent: {
      cards: 75,
      modals: 85,
      headers: 60,
    },
  },
  particles: {
    enabled: true,
    density: 'medium',
    color: '#8b5cf6',
  },
  glow: {
    enabled: true,
    intensity: 'moderate',
    color: '#10b981',
  },
  borderGradients: {
    enabled: true,
    speed: 1.0,
  },
  scanlines: {
    enabled: false,
    opacity: 10,
    speed: 10,
  },
  glassmorphism: 'default',
};

export const DEFAULT_ANIMATIONS: AnimationConfig = {
  speed: 1.0,
  intensity: 'intense',
  categories: {
    screenTransitions: true,
    componentEntrance: true,
    microInteractions: true,
    particleEffects: true,
  },
  springPhysics: {
    tension: 120,
    friction: 15,
  },
  haptics: {
    enabled: true,
    strength: 'medium',
  },
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  density: 'comfortable',
  componentScaling: 1.0,
  gridLayout: false,
  sidebarWidth: 280,
  tabBarStyle: 'with-labels',
  perScreen: {
    forums: 'spacious',
    chat: 'comfortable',
    groups: 'comfortable',
  },
};

export const DEFAULT_ACCESSIBILITY: AccessibilityConfig = {
  reduceMotion: false,
  highContrast: false,
  increasedTouchTargets: false,
  hapticAlternatives: true,
};

export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  mode: 'visual-first',
  batterySaver: false,
  autoThrottle: true,
};

export const DEFAULT_THEME: ThemeConfig = {
  name: 'Default Dark',
  version: '1.0.0',
  author: 'CGraph',
  colors: DEFAULT_COLOR_SYSTEM,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  borderRadius: DEFAULT_BORDER_RADIUS,
  shadows: DEFAULT_SHADOWS,
  effects: DEFAULT_EFFECTS,
  animations: DEFAULT_ANIMATIONS,
  layout: DEFAULT_LAYOUT,
  accessibility: DEFAULT_ACCESSIBILITY,
  performance: DEFAULT_PERFORMANCE,
};

// ============================================================================
// CUSTOMIZATION ENGINE
// ============================================================================

export class CustomizationEngine {
  private static STORAGE_KEY = '@cgraph/customization';
  private static HISTORY_LIMIT = 50;

  /**
   * Generate color shades from a base color
   */
  static generateColorShades(baseColor: string): ColorShade {
    try {
      const color = chroma(baseColor);

      return {
        50: color.luminance(0.95).hex(),
        100: color.luminance(0.9).hex(),
        200: color.luminance(0.8).hex(),
        300: color.luminance(0.6).hex(),
        400: color.luminance(0.4).hex(),
        500: baseColor, // Base
        600: color.darken(0.5).hex(),
        700: color.darken(1.0).hex(),
        800: color.darken(1.5).hex(),
        900: color.darken(2.0).hex(),
      };
    } catch {
      return DEFAULT_COLOR_SYSTEM.primary;
    }
  }

  /**
   * Validate theme configuration
   */
  static validateTheme(theme: Partial<ThemeConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate colors
    if (theme.colors) {
      const validateColorShade = (shade: unknown, name: string) => {
        const requiredKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
        requiredKeys.forEach((key) => {
          if (!shade[key] || !chroma.valid(shade[key])) {
            errors.push(`Invalid color in ${name}.${key}`);
          }
        });
      };

      if (theme.colors.primary) validateColorShade(theme.colors.primary, 'primary');
      if (theme.colors.secondary) validateColorShade(theme.colors.secondary, 'secondary');
      if (theme.colors.accent) validateColorShade(theme.colors.accent, 'accent');
    }

    // Validate typography
    if (theme.typography) {
      const { baseSize, scaleRatio, lineHeight } = theme.typography;
      if (baseSize && (baseSize < 12 || baseSize > 20)) {
        errors.push('Base font size must be between 12 and 20px');
      }
      if (scaleRatio && (scaleRatio < 1.1 || scaleRatio > 1.5)) {
        errors.push('Scale ratio must be between 1.1 and 1.5');
      }
      if (lineHeight && (lineHeight < 1.2 || lineHeight > 1.8)) {
        errors.push('Line height must be between 1.2 and 1.8');
      }
    }

    // Validate layout
    if (theme.layout) {
      const { componentScaling } = theme.layout;
      if (componentScaling && (componentScaling < 0.8 || componentScaling > 1.5)) {
        errors.push('Component scaling must be between 0.8 and 1.5');
      }
    }

    // Validate animations
    if (theme.animations) {
      const { speed } = theme.animations;
      if (speed && (speed < 0.5 || speed > 2.0)) {
        errors.push('Animation speed must be between 0.5x and 2x');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge partial theme with defaults
   */
  static mergeTheme(partial: Partial<ThemeConfig>): ThemeConfig {
    return {
      ...DEFAULT_THEME,
      ...partial,
      colors: { ...DEFAULT_COLOR_SYSTEM, ...partial.colors },
      typography: { ...DEFAULT_TYPOGRAPHY, ...partial.typography },
      spacing: { ...DEFAULT_SPACING, ...partial.spacing },
      borderRadius: { ...DEFAULT_BORDER_RADIUS, ...partial.borderRadius },
      shadows: { ...DEFAULT_SHADOWS, ...partial.shadows },
      effects: { ...DEFAULT_EFFECTS, ...partial.effects },
      animations: { ...DEFAULT_ANIMATIONS, ...partial.animations },
      layout: { ...DEFAULT_LAYOUT, ...partial.layout },
      accessibility: { ...DEFAULT_ACCESSIBILITY, ...partial.accessibility },
      performance: { ...DEFAULT_PERFORMANCE, ...partial.performance },
    };
  }

  /**
   * Save theme to AsyncStorage
   */
  static async saveTheme(theme: ThemeConfig): Promise<void> {
    try {
      const json = JSON.stringify(theme);
      await AsyncStorage.setItem(this.STORAGE_KEY, json);
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw new Error('Failed to save theme to storage');
    }
  }

  /**
   * Load theme from AsyncStorage
   */
  static async loadTheme(): Promise<ThemeConfig | null> {
    try {
      const json = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!json) return null;

      const theme = JSON.parse(json);
      const validation = this.validateTheme(theme);

      if (!validation.valid) {
        console.warn('Loaded theme has validation errors:', validation.errors);
        return DEFAULT_THEME;
      }

      return theme;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return null;
    }
  }

  /**
   * Export theme as JSON string
   */
  static exportTheme(theme: ThemeConfig): string {
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON string
   */
  static importTheme(json: string): ThemeConfig {
    try {
      const theme = JSON.parse(json);
      const validation = this.validateTheme(theme);

      if (!validation.valid) {
        throw new Error(`Invalid theme: ${validation.errors.join(', ')}`);
      }

      return this.mergeTheme(theme);
    } catch (error) {
      throw new Error(
        `Failed to import theme: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    try {
      return chroma.contrast(color1, color2);
    } catch {
      return 1;
    }
  }

  /**
   * Check if theme is WCAG AAA compliant
   */
  static isAccessible(theme: ThemeConfig): { accessible: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check text contrast
    const textContrast = this.getContrastRatio(
      theme.colors.text.primary,
      theme.colors.surface.base
    );

    if (textContrast < 7) {
      warnings.push('Primary text does not meet WCAG AAA contrast ratio (7:1)');
    }

    // Check button contrast
    const buttonContrast = this.getContrastRatio(
      theme.colors.primary[500],
      theme.colors.surface.base
    );

    if (buttonContrast < 4.5) {
      warnings.push('Primary buttons do not meet WCAG AA contrast ratio (4.5:1)');
    }

    return {
      accessible: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Apply performance optimizations based on device tier
   */
  static optimizeForDevice(theme: ThemeConfig, deviceTier: 'high' | 'mid' | 'low'): ThemeConfig {
    const optimized = { ...theme };

    switch (deviceTier) {
      case 'low':
        // Disable heavy effects
        optimized.effects.particles.enabled = false;
        optimized.effects.blur.intensity = 30;
        optimized.effects.glow.enabled = false;
        optimized.animations.intensity = 'minimal';
        optimized.performance.mode = 'performance';
        break;

      case 'mid':
        // Reduce effect intensity
        optimized.effects.particles.density = 'low';
        optimized.effects.blur.intensity = 50;
        optimized.animations.intensity = 'moderate';
        optimized.performance.mode = 'balanced';
        break;

      case 'high':
        // Keep all effects enabled
        optimized.performance.mode = 'visual-first';
        break;
    }

    return optimized;
  }
}

export default CustomizationEngine;
