/**
 * Theme Registry and Management System
 *
 * Central theme management with runtime switching, CSS variable injection,
 * and smooth theme transitions.
 */

import type { AppTheme, ThemeAPI, ThemeCategory } from './theme-types';
import { defaultTheme } from './presets/default-theme';
import { matrixTheme } from './presets/matrix-theme';

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
      console.warn('Cannot unregister default theme');
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
      console.error(`Theme '${themeId}' not found`);
      return false;
    }

    this.currentTheme = theme;
    this.injectCSSVariables(theme);
    this.applyBodyClasses(theme);

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
      console.error('Invalid theme IDs for switching');
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
      const theme = JSON.parse(json) as AppTheme;

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
   * Get CSS variables from theme
   */
  getCSSVariables(theme: AppTheme): Record<string, string> {
    const vars: Record<string, string> = {};

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      vars[`--theme-color-${this.kebabCase(key)}`] = value;
    });

    // Typography
    Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
      vars[`--theme-font-${key}`] = value;
    });
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      vars[`--theme-font-size-${key}`] = value;
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      vars[`--theme-font-weight-${key}`] = String(value);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      vars[`--theme-line-height-${key}`] = String(value);
    });
    Object.entries(theme.typography.letterSpacing).forEach(([key, value]) => {
      vars[`--theme-letter-spacing-${key}`] = value;
    });

    // Layout
    Object.entries(theme.layout.borderRadius).forEach(([key, value]) => {
      vars[`--theme-radius-${key}`] = value;
    });
    Object.entries(theme.layout.spacing).forEach(([key, value]) => {
      vars[`--theme-spacing-${key}`] = value;
    });
    Object.entries(theme.layout.shadows).forEach(([key, value]) => {
      vars[`--theme-shadow-${key}`] = value;
    });
    Object.entries(theme.layout.transitions).forEach(([key, value]) => {
      vars[`--theme-transition-${key}`] = value;
    });

    // Components
    Object.entries(theme.components).forEach(([component, styles]) => {
      Object.entries(styles as Record<string, string>).forEach(([key, value]) => {
        vars[`--theme-${component}-${this.kebabCase(key)}`] = value;
      });
    });

    return vars;
  }

  /**
   * Inject CSS variables into document
   */
  private injectCSSVariables(theme: AppTheme): void {
    const root = document.documentElement;
    const vars = this.getCSSVariables(theme);

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    this.cssVariablesInjected = true;
  }

  /**
   * Apply body classes for theme
   */
  private applyBodyClasses(theme: AppTheme): void {
    // Remove existing theme classes
    document.body.classList.forEach((className) => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });

    // Add new theme classes
    document.body.classList.add(`theme-${theme.id}`);
    document.body.classList.add(`theme-category-${theme.category}`);

    if (theme.isPremium) {
      document.body.classList.add('theme-premium');
    }

    // Add effect classes
    if (theme.effects.scanlines) {
      document.body.classList.add('theme-effect-scanlines');
    }
    if (theme.effects.vignette) {
      document.body.classList.add('theme-effect-vignette');
    }
    if (theme.effects.chromatic) {
      document.body.classList.add('theme-effect-chromatic');
    }
  }

  /**
   * Convert camelCase to kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Validate theme against accessibility standards
   */
  validateAccessibility(theme: AppTheme): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check contrast ratios (simplified check)
    const bgLuminance = this.getLuminance(theme.colors.background);
    const textLuminance = this.getLuminance(theme.colors.textPrimary);
    const contrastRatio = this.getContrastRatio(bgLuminance, textLuminance);

    if (contrastRatio < 4.5) {
      errors.push(
        `Text contrast ratio ${contrastRatio.toFixed(2)}:1 is below WCAG AA standard (4.5:1)`
      );
    } else if (contrastRatio < 7) {
      warnings.push(
        `Text contrast ratio ${contrastRatio.toFixed(2)}:1 is below WCAG AAA standard (7:1)`
      );
    }

    // Check focus indicators
    if (!theme.accessibility.focusIndicators) {
      errors.push('Focus indicators are disabled - required for accessibility');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    }) as [number, number, number];

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : null;
  }

  /**
   * Calculate contrast ratio between two luminance values
   */
  private getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
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
