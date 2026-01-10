/**
 * Theme System - Index
 * 
 * Central export for the CGraph theming system.
 * 
 * @version 4.0.0
 * @since v0.7.36
 */

export {
  themeEngine,
  getAllThemes,
  getThemeById,
  THEME_REGISTRY,
  THEME_DARK,
  THEME_LIGHT,
  THEME_MATRIX,
  THEME_HOLO_CYAN,
  THEME_HOLO_PURPLE,
  THEME_HOLO_GOLD,
  THEME_MIDNIGHT,
} from './ThemeEngine';

export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  ThemePreferences,
} from './ThemeEngine';
