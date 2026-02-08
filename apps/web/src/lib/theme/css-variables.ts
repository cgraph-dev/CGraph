/**
 * CSS Variable Injection & Document Class Management
 *
 * Handles applying theme tokens (colors, typography, spacing, animations)
 * as CSS custom properties and managing document-level class names.
 *
 * @module lib/theme/css-variables
 * @version 4.0.0
 * @since v0.7.36
 */

import type { Theme, ThemePreferences } from './types';

// =============================================================================
// CSS VARIABLE INJECTION
// =============================================================================

/**
 * Scale a font-size string by the given factor.
 */
function scaledFontSize(size: string, fontScale: number): string {
  const value = parseFloat(size);
  return `${value * fontScale}px`;
}

/**
 * Inject all CSS custom properties derived from a theme onto `document.documentElement`.
 */
export function injectCSSVariables(theme: Theme, settings: ThemePreferences['settings']): void {
  const root = document.documentElement;
  const { colors, typography, spacing, animations } = theme;

  // Color variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, value);
  });

  // Typography variables
  root.style.setProperty('--font-family', typography.fontFamily);
  root.style.setProperty('--font-family-mono', typography.fontFamilyMono);
  root.style.setProperty(
    '--font-size-base',
    scaledFontSize(typography.fontSizeBase, settings.fontScale)
  );
  root.style.setProperty(
    '--font-size-sm',
    scaledFontSize(typography.fontSizeSmall, settings.fontScale)
  );
  root.style.setProperty(
    '--font-size-lg',
    scaledFontSize(typography.fontSizeLarge, settings.fontScale)
  );
  root.style.setProperty(
    '--font-size-xl',
    scaledFontSize(typography.fontSizeXL, settings.fontScale)
  );
  root.style.setProperty(
    '--font-size-xxl',
    scaledFontSize(typography.fontSizeXXL, settings.fontScale)
  );
  root.style.setProperty('--line-height-normal', typography.lineHeightNormal);
  root.style.setProperty('--line-height-tight', typography.lineHeightTight);
  root.style.setProperty('--line-height-loose', typography.lineHeightLoose);

  // Spacing variables
  root.style.setProperty('--spacing-unit', `${spacing.unit}px`);
  root.style.setProperty('--spacing-xs', spacing.xs);
  root.style.setProperty('--spacing-sm', spacing.sm);
  root.style.setProperty('--spacing-md', spacing.md);
  root.style.setProperty('--spacing-lg', spacing.lg);
  root.style.setProperty('--spacing-xl', spacing.xl);
  root.style.setProperty('--spacing-xxl', spacing.xxl);
  root.style.setProperty('--border-radius', spacing.borderRadius);
  root.style.setProperty('--border-radius-lg', spacing.borderRadiusLarge);
  root.style.setProperty('--border-radius-full', spacing.borderRadiusFull);

  // Animation variables
  root.style.setProperty('--duration-fast', animations.durationFast);
  root.style.setProperty('--duration-normal', animations.durationNormal);
  root.style.setProperty('--duration-slow', animations.durationSlow);
  root.style.setProperty('--easing-default', animations.easingDefault);
  root.style.setProperty('--easing-emphasized', animations.easingEmphasized);

  // Message spacing
  root.style.setProperty('--message-spacing', `${16 * settings.messageSpacing}px`);
}

// =============================================================================
// DOCUMENT CLASS MANAGEMENT
// =============================================================================

/**
 * Update document-level CSS classes to reflect the active theme
 * and current accessibility / display settings.
 */
export function updateDocumentClasses(theme: Theme, settings: ThemePreferences['settings']): void {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark', 'theme-matrix', 'theme-holo', 'theme-special');

  // Add category class
  if (theme.category === 'light') {
    root.classList.add('light');
  } else {
    root.classList.add('dark');
  }

  // Add special theme classes
  if (theme.id === 'matrix') {
    root.classList.add('theme-matrix');
  } else if (theme.id.startsWith('holo-')) {
    root.classList.add('theme-holo');
  }
  if (theme.category === 'special') {
    root.classList.add('theme-special');
  }

  // Accessibility classes
  if (settings.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Message display
  root.classList.remove('message-cozy', 'message-compact');
  root.classList.add(`message-${settings.messageDisplay}`);
}
