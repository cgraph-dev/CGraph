/**
 * Theme System - Index
 *
 * Central export for the CGraph theming system.
 *
 * @version 4.0.0
 * @since v0.7.36
 */

// Types
export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  ThemePreferences,
} from './types';

// Theme definitions
export {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ANIMATIONS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_MATRIX,
  THEME_HOLO_CYAN,
  THEME_HOLO_PURPLE,
  THEME_HOLO_GOLD,
  THEME_MIDNIGHT,
  THEME_REGISTRY,
} from './themes';

// Engine
export {
  themeEngine,
  getAllThemes,
  getThemeById,
  setTheme,
  getCurrentTheme,
  subscribeToTheme,
} from './theme-engine';
