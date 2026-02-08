/**
 * AI-Powered Theme Engine
 *
 * Re-export barrel — see ./theme-engine/ for implementation.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

export type { ThemeColors, ThemeMetadata, AdaptiveTheme, UserPreference } from './theme-engine';
export { ColorTheory, AIThemeEngine, themeEngine } from './theme-engine';
export { themeEngine as default } from './theme-engine';
