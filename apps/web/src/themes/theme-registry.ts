/**
 * Theme Registry and Management System
 *
 * Central theme management with runtime switching, CSS variable injection,
 * and smooth theme transitions.
 */

import type { AppTheme, ThemeAPI, ThemeCategory } from './theme-types';
import { defaultTheme } from './presets/default-theme';
import { matrixTheme } from './presets/matrix-theme';
import { getCSSVariables, injectCSSVariables, applyBodyClasses } from './css-variables';
import { validateAccessibility } from './accessibility';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ThemeRegistry');

/**
 * Theme Registry - Manages all available themes
 */
class ThemeRegistryClass {
  private themes: Map<string, AppTheme> = new Map();
  private currentTheme: AppTheme | null = null;
  private cssVariablesInjected = false;

  // Use getter to silence unused warning while keeping state
  get _cssVarsInjected() {
    return this.cssVariablesInjected;
  }

  constructor() {
    // Register built-in themes
    this.registerTheme(defaultTheme);
    this.registerTheme(matrixTheme);
  }

  /**
   * Register a new theme
   */
  registerTheme(theme: AppTheme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Unregister a theme
   */
  unregisterTheme(themeId: string): boolean {
    if (themeId === 'default') {
      logger.warn('Cannot unregister default theme');
      return false;
    }
    return this.themes.delete(themeId);
  }

  /**
   * Get a theme by ID
   */
  getTheme(themeId: string): AppTheme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Get all registered themes
   */
  getAllThemes(): AppTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get themes by category
   */
  getThemesByCategory(category: ThemeCategory): AppTheme[] {
    return this.getAllThemes().filter((theme) => theme.category === category);
  }

  /**
   * Get premium themes
   */
  getPremiumThemes(): AppTheme[] {
    return this.getAllThemes().filter((theme) => theme.isPremium);
  }

  /**
   * Get free themes
   */
  getFreeThemes(): AppTheme[] {
    return this.getAllThemes().filter((theme) => !theme.isPremium);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): AppTheme {
    return this.currentTheme || defaultTheme;
  }

  /**
   * Validate a theme has required properties
   */
  validateTheme(theme: Partial<AppTheme>): boolean {
    return !!(theme.id && theme.name && theme.colors);
  }

  /**
   * Apply a theme immediately
   */
  applyTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) {
      logger.error(`Theme '${themeId}' not found`);
      return false;
    }

    this.currentTheme = theme;
    injectCSSVariables(theme);
    applyBodyClasses(theme);
    this.cssVariablesInjected = true;

    // Emit theme change event
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme, previousTheme: this.currentTheme },
      })
    );

    return true;
  }

  /**
   * Switch theme with smooth transition
   */
  async switchTheme(fromThemeId: string, toThemeId: string, duration: number = 300): Promise<void> {
    const fromTheme = this.getTheme(fromThemeId);
    const toTheme = this.getTheme(toThemeId);

    if (!fromTheme || !toTheme) {
      logger.error('Invalid theme IDs for switching');
      return;
    }

    // Add transition class to body
    document.body.classList.add('theme-transitioning');
    document.body.style.setProperty('--theme-transition-duration', `${duration}ms`);

    // Apply new theme
    this.applyTheme(toThemeId);

    // Wait for transition
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Remove transition class
    document.body.classList.remove('theme-transitioning');
  }

  /**
   * Create custom theme based on existing theme
   */
  createCustomTheme(baseThemeId: string, overrides: Partial<AppTheme>): AppTheme {
    const baseTheme = this.getTheme(baseThemeId);
    if (!baseTheme) {
      throw new Error(`Base theme '${baseThemeId}' not found`);
    }

    const customTheme: AppTheme = {
      ...baseTheme,
      ...overrides,
      id: overrides.id || `custom-${Date.now()}`,
      name: overrides.name || `Custom ${baseTheme.name}`,
      category: 'custom',
      colors: { ...baseTheme.colors, ...(overrides.colors || {}) },
      typography: { ...baseTheme.typography, ...(overrides.typography || {}) },
      layout: { ...baseTheme.layout, ...(overrides.layout || {}) },
      components: { ...baseTheme.components, ...(overrides.components || {}) },
      effects: { ...baseTheme.effects, ...(overrides.effects || {}) },
      accessibility: { ...baseTheme.accessibility, ...(overrides.accessibility || {}) },
    };

    return customTheme;
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   */
  importTheme(json: string): AppTheme {
    try {
      const theme = JSON.parse(json) as AppTheme; // safe downcast – validated below

      // Validate theme structure
      if (!theme.id || !theme.name || !theme.colors || !theme.typography) {
        throw new Error('Invalid theme structure');
      }

      this.registerTheme(theme);
      return theme;
    } catch (error) {
      throw new Error(
        `Failed to import theme: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get CSS variables from theme (delegates to css-variables module)
   */
  getCSSVariables(theme: AppTheme): Record<string, string> {
    return getCSSVariables(theme);
  }

  /**
   * Validate theme against accessibility standards (delegates to accessibility module)
   */
  validateAccessibility(theme: AppTheme) {
    return validateAccessibility(theme);
  }
}

// Export singleton instance
export const ThemeRegistry = new ThemeRegistryClass();

/**
 * Theme API - Public interface for theme management
 */
export const themeAPI: ThemeAPI = {
  getTheme: (id: string) => ThemeRegistry.getTheme(id),
  getAllThemes: () => ThemeRegistry.getAllThemes(),
  getThemesByCategory: (category: ThemeCategory) => ThemeRegistry.getThemesByCategory(category),
  registerTheme: (theme: AppTheme) => ThemeRegistry.registerTheme(theme),
  unregisterTheme: (id: string) => ThemeRegistry.unregisterTheme(id),
  applyTheme: (id: string) => {
    ThemeRegistry.applyTheme(id);
  },
  getCurrentTheme: () => ThemeRegistry.getCurrentTheme(),
  switchTheme: (fromId: string, toId: string, duration?: number) =>
    ThemeRegistry.switchTheme(fromId, toId, duration),
  createCustomTheme: (base: string, overrides: Partial<AppTheme>) =>
    ThemeRegistry.createCustomTheme(base, overrides),
  exportTheme: (id: string) => ThemeRegistry.exportTheme(id),
  importTheme: (json: string) => ThemeRegistry.importTheme(json),
  getCSSVariables: (theme: AppTheme) => ThemeRegistry.getCSSVariables(theme),
  validateTheme: (theme: Partial<AppTheme>) => ThemeRegistry.validateTheme(theme),
};
