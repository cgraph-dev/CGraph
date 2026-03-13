/**
 * ThemeContextEnhanced — split into theme-enhanced/ subdirectory
 * Re-exports all components for backward compatibility.
 */
export type { ThemeContextValue } from './theme-enhanced';
export { ThemeProviderEnhanced } from './theme-enhanced';
export {
  ThemeContextEnhanced,
  useThemeEnhanced,
  useThemeColors,
  useHolographicTheme,
  useIsSpecialTheme,
  useReducedMotion,
} from './theme-enhanced';
