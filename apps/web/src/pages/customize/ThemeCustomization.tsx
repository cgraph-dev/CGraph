/**
 * ThemeCustomization Module
 *
 * This file re-exports from the modularized theme-customization directory.
 * The original 944-line file has been split into:
 * - types.ts (~40 lines) - Type definitions
 * - constants.ts (~300 lines) - MOCK_THEMES data
 * - ThemeCard.tsx (~170 lines) - Theme card component
 * - page.tsx (~350 lines) - Main component
 * - index.ts - Barrel exports
 */
export type {
  ThemeCategory,
  Theme,
  ThemeCardProps,
  CategoryTab,
} from './theme-customization/index';
export { MOCK_THEMES, ThemeCard } from './theme-customization/index';
export { default } from './theme-customization/index';
