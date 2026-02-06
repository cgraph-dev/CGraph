/**
 * Seasonal Theme Provider Module
 *
 * Auto-detecting seasonal theme system with particle effects and
 * themed gradients for holidays (Halloween, Winter, Valentine's, etc.).
 *
 * @module modules/gamification/components/events/seasonal-theme-provider
 */

// Main component
export { default } from './SeasonalThemeProvider';

// Sub-components
export { Particle } from './Particle';

// Hooks
export { useSeasonalTheme, SeasonalThemeContext } from './hooks';

// Utilities
export { detectSeasonalTheme } from './utils';

// Types
export type {
  SeasonalTheme,
  SeasonalThemeConfig,
  SeasonalThemeContextValue,
  SeasonalThemeProviderProps,
  ParticleProps,
} from './types';

// Constants
export { SEASONAL_THEMES } from './constants';
