/**
 * Theme System - Public API
 *
 * Central export for all theme-related functionality
 */

// Theme Registry and API
export { ThemeRegistry, themeAPI } from './ThemeRegistry';

// Theme Types
export type {
  AppTheme,
  ThemeColors,
  ThemeTypography,
  ThemeLayout,
  ThemeComponents,
  ThemeEffects,
  MatrixThemeConfig,
  ThemeCategory,
  ThemeAPI,
} from './theme-types';

// Built-in Themes
export { defaultTheme } from './presets/default-theme';
export { matrixTheme } from './presets/matrix-theme';

// Theme Utilities
export { useTheme } from './useTheme';
