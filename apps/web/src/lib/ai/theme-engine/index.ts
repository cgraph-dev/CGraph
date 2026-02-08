/**
 * AI-Powered Theme Engine
 *
 * Intelligent theme generation and adaptation system.
 * Features dynamic color generation, adaptive layouts, and preference learning.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

export type { ThemeColors, ThemeMetadata, AdaptiveTheme, UserPreference } from './types';
export { ColorTheory } from './color-theory';
export { AIThemeEngine, themeEngine } from './ai-theme-engine';
export { themeEngine as default } from './ai-theme-engine';
