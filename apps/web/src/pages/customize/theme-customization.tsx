/**
 * ThemeCustomization Module
 *
 * This file re-exports from the modularized theme-customization directory.
 * The original 944-line file has been split into:
 * - types.ts (~40 lines) - Type definitions
 * - constants.ts - Theme constants (mock data removed)
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
export { ThemeCard } from './theme-customization/index';
export { default } from './theme-customization/index';
