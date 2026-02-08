/**
 * Theme Accessibility Utilities
 *
 * Provides WCAG-compliant contrast checking, luminance calculations,
 * and accessibility validation for themes.
 */

import type { AppTheme } from './theme-types';

/**
 * Convert a hex color string to its RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Calculate the relative luminance of a color (per WCAG 2.0)
 */
export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  }) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two luminance values (per WCAG 2.0)
 */
export function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate a theme against WCAG accessibility standards
 */
export function validateAccessibility(theme: AppTheme): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check contrast ratios (simplified check)
  const bgLuminance = getLuminance(theme.colors.background);
  const textLuminance = getLuminance(theme.colors.textPrimary);
  const contrastRatio = getContrastRatio(bgLuminance, textLuminance);

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
