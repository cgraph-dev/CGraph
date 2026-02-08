/**
 * CSS Variable Utilities for Theme System
 *
 * Handles conversion of theme objects to CSS custom properties,
 * injection into the DOM, and helper utilities.
 */

import type { AppTheme } from './theme-types';

/**
 * Convert camelCase string to kebab-case
 */
export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Extract CSS variables from a theme object
 */
export function getCSSVariables(theme: AppTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    vars[`--theme-color-${kebabCase(key)}`] = value;
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
      vars[`--theme-${component}-${kebabCase(key)}`] = value;
    });
  });

  return vars;
}

/**
 * Inject CSS variables from a theme into the document root
 */
export function injectCSSVariables(theme: AppTheme): void {
  const root = document.documentElement;
  const vars = getCSSVariables(theme);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Apply body classes for a given theme, removing any previous theme classes
 */
export function applyBodyClasses(theme: AppTheme): void {
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
