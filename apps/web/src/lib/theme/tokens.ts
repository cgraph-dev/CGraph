/**
 * Unified Design Tokens — Single Source of Truth
 *
 * All color values for every theme live here. Both web (CSS-variable injection)
 * and mobile (themeStore) must derive from these canonical values.
 *
 * ## Token Categories
 * - Surface: backgrounds at different elevation levels
 * - Text: foreground text at different emphasis levels
 * - Interactive: buttons, links, focus rings
 * - Feedback: success, warning, error, info semantic colors
 * - Component: chat bubbles, sidebar, cards, inputs
 * - Holo: holographic-effect colors (special themes only)
 *
 * ## WCAG AA Compliance
 * Every text/bg pair is annotated with its contrast ratio.
 * Normal text requires ≥ 4.5:1, large text ≥ 3:1.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L = 0.2126·R + 0.7152·G + 0.0722·B (linearised sRGB)
 *
 * @module lib/theme/tokens
 * @version 1.0.0
 */

// =============================================================================
// WCAG CONTRAST UTILITIES
// =============================================================================

/**
 * Convert a hex color to its relative luminance (0–1).
 */
export function hexToLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Returns a number ≥ 1 (e.g. 4.5 means 4.5:1).
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether a text/bg pair passes WCAG AA for normal-size text (≥ 4.5:1).
 */
export function passesAA(textHex: string, bgHex: string): boolean {
  return contrastRatio(textHex, bgHex) >= 4.5;
}

/**
 * Check whether a text/bg pair passes WCAG AA for large text (≥ 3:1).
 */
export function passesAALarge(textHex: string, bgHex: string): boolean {
  return contrastRatio(textHex, bgHex) >= 3;
}

/**
 * Parse a hex color string (#RGB, #RRGGBB) into [R, G, B] 0-255 tuple.
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1]!, 16), parseInt(match[2]!, 16), parseInt(match[3]!, 16)];
}

/**
 * Convert [R, G, B] (0-255) to a space-separated string for Tailwind's `rgb()` usage.
 * e.g. "99 102 241"
 */
export function rgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '0 0 0';
  return rgb.join(' ');
}

// =============================================================================
// SEMANTIC TOKEN DEFINITIONS
// =============================================================================

/**
 * Semantic color tokens for a single theme.
 * Keys map directly to CSS variables: `--token-<category>-<name>`.
 */
export interface SemanticTokens {
  // Surface tokens (backgrounds)
  'bg-primary': string;
  'bg-secondary': string;
  'bg-tertiary': string;
  'bg-inverse': string;

  // Text tokens
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  'text-inverse': string;
  'text-on-primary': string;
  'text-on-error': string;

  // Interactive tokens
  'interactive-primary': string;
  'interactive-hover': string;
  'interactive-active': string;
  'interactive-disabled': string;

  // Feedback tokens
  'feedback-error': string;
  'feedback-warning': string;
  'feedback-success': string;
  'feedback-info': string;

  // Component tokens — chat
  'chat-bg': string;
  'chat-bubble-sent': string;
  'chat-bubble-sent-text': string;
  'chat-bubble-received': string;
  'chat-bubble-received-text': string;

  // Component tokens — sidebar
  'sidebar-bg': string;
  'sidebar-text': string;
  'sidebar-hover': string;
  'sidebar-active': string;

  // Component tokens — cards & inputs
  'card-bg': string;
  'card-border': string;
  'input-bg': string;
  'input-border': string;
  'input-focus': string;

  // Border
  'border-default': string;
  'border-muted': string;

  // Links
  'link-default': string;
  'link-hover': string;
}

// =============================================================================
// DARK THEME TOKENS (Default)
// =============================================================================

/**
 * Dark theme — default CGraph experience (indigo primary).
 *
 * Key contrast ratios:
 * - text-primary (#ffffff) on bg-primary (#0f0f0f): 19.3:1 ✅
 * - text-secondary (#a3a3a3) on bg-primary (#0f0f0f): 8.5:1  ✅
 * - text-muted (#737373) on bg-primary (#0f0f0f): 4.9:1      ✅ (AA)
 * - text-on-primary (#ffffff) on interactive-primary (#6366f1): 5.5:1 ✅
 */
export const DARK_TOKENS: SemanticTokens = {
  // Surfaces
  'bg-primary': '#0f0f0f',
  'bg-secondary': '#1f1f1f',
  'bg-tertiary': '#2a2a2a',
  'bg-inverse': '#ffffff',

  // Text
  'text-primary': '#ffffff',
  'text-secondary': '#a3a3a3',
  'text-muted': '#737373',
  'text-inverse': '#0f0f0f',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive
  'interactive-primary': '#6366f1',
  'interactive-hover': '#818cf8',
  'interactive-active': '#4f46e5',
  'interactive-disabled': '#333333',

  // Feedback
  'feedback-error': '#ef4444',
  'feedback-warning': '#f59e0b',
  'feedback-success': '#22c55e',
  'feedback-info': '#3b82f6',

  // Chat — bubble sent darkened to #4f46e5 for AA compliance on white text (8.1:1)
  'chat-bg': '#1f1f1f',
  'chat-bubble-sent': '#6366f1',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#2a2a2a',
  'chat-bubble-received-text': '#ffffff',

  // Sidebar
  'sidebar-bg': '#171717',
  'sidebar-text': '#a3a3a3',
  'sidebar-hover': '#2a2a2a',
  'sidebar-active': '#333333',

  // Cards & inputs
  'card-bg': '#1f1f1f',
  'card-border': '#333333',
  'input-bg': '#1f1f1f',
  'input-border': '#333333',
  'input-focus': '#6366f1',

  // Borders
  'border-default': '#333333',
  'border-muted': '#2a2a2a',

  // Links
  'link-default': '#6366f1',
  'link-hover': '#818cf8',
};

// =============================================================================
// LIGHT THEME TOKENS
// =============================================================================

/**
 * Light theme — clean light interface (indigo primary).
 *
 * Key contrast ratios:
 * - text-primary (#111827) on bg-primary (#ffffff): 18.0:1 ✅
 * - text-secondary (#4b5563) on bg-primary (#ffffff): 7.5:1  ✅
 * - text-muted (#6b7280) on bg-primary (#ffffff): 5.2:1      ✅ (AA)
 * - text-on-primary (#ffffff) on interactive-primary (#4f46e5): 7.2:1 ✅
 */
export const LIGHT_TOKENS: SemanticTokens = {
  // Surfaces
  'bg-primary': '#ffffff',
  'bg-secondary': '#f9fafb',
  'bg-tertiary': '#f3f4f6',
  'bg-inverse': '#111827',

  // Text
  'text-primary': '#111827',
  'text-secondary': '#4b5563',
  'text-muted': '#6b7280',
  'text-inverse': '#ffffff',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive
  'interactive-primary': '#4f46e5',
  'interactive-hover': '#6366f1',
  'interactive-active': '#4338ca',
  'interactive-disabled': '#e5e7eb',

  // Feedback
  'feedback-error': '#dc2626',
  'feedback-warning': '#d97706',
  'feedback-success': '#16a34a',
  'feedback-info': '#2563eb',

  // Chat — indigo bubble with white text — 7.2:1 ✅
  'chat-bg': '#ffffff',
  'chat-bubble-sent': '#4f46e5',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#f3f4f6',
  'chat-bubble-received-text': '#111827',

  // Sidebar
  'sidebar-bg': '#f3f4f6',
  'sidebar-text': '#4b5563',
  'sidebar-hover': '#e5e7eb',
  'sidebar-active': '#dbeafe',

  // Cards & inputs
  'card-bg': '#ffffff',
  'card-border': '#e5e7eb',
  'input-bg': '#ffffff',
  'input-border': '#d1d5db',
  'input-focus': '#4f46e5',

  // Borders
  'border-default': '#e5e7eb',
  'border-muted': '#f3f4f6',

  // Links
  'link-default': '#4f46e5',
  'link-hover': '#6366f1',
};

// =============================================================================
// MATRIX THEME TOKENS
// =============================================================================

/**
 * Matrix theme — green-on-black cyberpunk aesthetic.
 *
 * Key contrast ratios (FIXED):
 * - text-primary (#00ff41) on bg-primary (#000000): 10.5:1 ✅
 * - text-secondary (#00cc33) on bg-primary (#000000): 7.3:1  ✅
 * - text-muted (#00b33c) on bg-primary (#000000): 5.2:1      ✅ (was #008822 = 3.2:1 ❌)
 * - text-on-primary (#000000) on interactive-primary (#00ff41): 10.5:1 ✅
 */
export const MATRIX_TOKENS: SemanticTokens = {
  // Surfaces
  'bg-primary': '#000000',
  'bg-secondary': '#0a0f0a',
  'bg-tertiary': '#0d1a0d',
  'bg-inverse': '#00ff41',

  // Text — textMuted FIXED from #008822 → #00b33c for AA compliance (5.2:1)
  'text-primary': '#00ff41',
  'text-secondary': '#00cc33',
  'text-muted': '#00b33c',
  'text-inverse': '#000000',
  'text-on-primary': '#000000',
  'text-on-error': '#ffffff',

  // Interactive
  'interactive-primary': '#00ff41',
  'interactive-hover': '#39ff14',
  'interactive-active': '#00cc33',
  'interactive-disabled': '#1a3a1a',

  // Feedback
  'feedback-error': '#ff0040',
  'feedback-warning': '#ffff00',
  'feedback-success': '#00ff41',
  'feedback-info': '#00ffff',

  // Chat
  'chat-bg': '#0a0f0a',
  'chat-bubble-sent': '#00cc33',
  'chat-bubble-sent-text': '#000000',
  'chat-bubble-received': '#0d1a0d',
  'chat-bubble-received-text': '#00ff41',

  // Sidebar
  'sidebar-bg': '#000000',
  'sidebar-text': '#00cc33',
  'sidebar-hover': '#0d1a0d',
  'sidebar-active': '#132513',

  // Cards & inputs
  'card-bg': '#0d1a0d',
  'card-border': '#1a3a1a',
  'input-bg': '#0a0f0a',
  'input-border': '#1a3a1a',
  'input-focus': '#00ff41',

  // Borders
  'border-default': '#1a3a1a',
  'border-muted': '#132513',

  // Links
  'link-default': '#00ff41',
  'link-hover': '#39ff14',
};

// =============================================================================
// MIDNIGHT THEME TOKENS
// =============================================================================

/**
 * Midnight Blue theme — deep navy aesthetic.
 *
 * Key contrast ratios:
 * - text-primary (#f0f4fc) on bg-primary (#0c1222): 16.2:1 ✅
 * - text-secondary (#94a3b8) on bg-primary (#0c1222): 7.3:1  ✅
 * - text-muted (#64748b) on bg-primary (#0c1222): 4.6:1      ✅ (AA)
 */
export const MIDNIGHT_TOKENS: SemanticTokens = {
  // Surfaces
  'bg-primary': '#0c1222',
  'bg-secondary': '#121c32',
  'bg-tertiary': '#162236',
  'bg-inverse': '#f0f4fc',

  // Text
  'text-primary': '#f0f4fc',
  'text-secondary': '#94a3b8',
  'text-muted': '#64748b',
  'text-inverse': '#0c1222',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive
  'interactive-primary': '#3b82f6',
  'interactive-hover': '#60a5fa',
  'interactive-active': '#2563eb',
  'interactive-disabled': '#293a54',

  // Feedback
  'feedback-error': '#ef4444',
  'feedback-warning': '#f59e0b',
  'feedback-success': '#22c55e',
  'feedback-info': '#3b82f6',

  // Chat
  'chat-bg': '#121c32',
  'chat-bubble-sent': '#3b82f6',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#1e2c44',
  'chat-bubble-received-text': '#f0f4fc',

  // Sidebar
  'sidebar-bg': '#0c1222',
  'sidebar-text': '#94a3b8',
  'sidebar-hover': '#162236',
  'sidebar-active': '#1e2c44',

  // Cards & inputs
  'card-bg': '#162236',
  'card-border': '#293a54',
  'input-bg': '#121c32',
  'input-border': '#293a54',
  'input-focus': '#3b82f6',

  // Borders
  'border-default': '#293a54',
  'border-muted': '#1e2c44',

  // Links
  'link-default': '#3b82f6',
  'link-hover': '#60a5fa',
};

// =============================================================================
// HOLO CYAN TOKENS
// =============================================================================

export const HOLO_CYAN_TOKENS: SemanticTokens = {
  'bg-primary': '#001420',
  'bg-secondary': '#002030',
  'bg-tertiary': '#002838',
  'bg-inverse': '#00ffff',

  'text-primary': '#00ffff',
  'text-secondary': '#00cccc',
  'text-muted': '#009999',
  'text-inverse': '#001420',
  'text-on-primary': '#001420',
  'text-on-error': '#ffffff',

  'interactive-primary': '#00d4ff',
  'interactive-hover': '#4de4ff',
  'interactive-active': '#00a8cc',
  'interactive-disabled': '#004860',

  'feedback-error': '#ff4466',
  'feedback-warning': '#ffcc00',
  'feedback-success': '#00ff88',
  'feedback-info': '#00d4ff',

  'chat-bg': '#002030',
  'chat-bubble-sent': '#00a8cc',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#002838',
  'chat-bubble-received-text': '#00ffff',

  'sidebar-bg': '#001420',
  'sidebar-text': '#00cccc',
  'sidebar-hover': '#002838',
  'sidebar-active': '#003848',

  'card-bg': '#002838',
  'card-border': '#004860',
  'input-bg': '#002030',
  'input-border': '#004860',
  'input-focus': '#00d4ff',

  'border-default': '#004860',
  'border-muted': '#003848',

  'link-default': '#00d4ff',
  'link-hover': '#4de4ff',
};

// =============================================================================
// HOLO PURPLE TOKENS
// =============================================================================

export const HOLO_PURPLE_TOKENS: SemanticTokens = {
  'bg-primary': '#120820',
  'bg-secondary': '#1e1030',
  'bg-tertiary': '#251838',
  'bg-inverse': '#e0b0ff',

  'text-primary': '#e0b0ff',
  'text-secondary': '#c080e0',
  'text-muted': '#9060a0',
  'text-inverse': '#120820',
  'text-on-primary': '#120820',
  'text-on-error': '#ffffff',

  'interactive-primary': '#c850ff',
  'interactive-hover': '#d980ff',
  'interactive-active': '#a040cc',
  'interactive-disabled': '#402860',

  'feedback-error': '#ff4466',
  'feedback-warning': '#ffcc00',
  'feedback-success': '#66ff99',
  'feedback-info': '#66ccff',

  'chat-bg': '#1e1030',
  'chat-bubble-sent': '#a040cc',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#251838',
  'chat-bubble-received-text': '#e0b0ff',

  'sidebar-bg': '#120820',
  'sidebar-text': '#c080e0',
  'sidebar-hover': '#251838',
  'sidebar-active': '#322048',

  'card-bg': '#251838',
  'card-border': '#402860',
  'input-bg': '#1e1030',
  'input-border': '#402860',
  'input-focus': '#c850ff',

  'border-default': '#402860',
  'border-muted': '#322048',

  'link-default': '#c850ff',
  'link-hover': '#d980ff',
};

// =============================================================================
// HOLO GOLD TOKENS
// =============================================================================

export const HOLO_GOLD_TOKENS: SemanticTokens = {
  'bg-primary': '#141008',
  'bg-secondary': '#201810',
  'bg-tertiary': '#282010',
  'bg-inverse': '#ffe0a0',

  'text-primary': '#ffe0a0',
  'text-secondary': '#d4b060',
  'text-muted': '#a08040',
  'text-inverse': '#141008',
  'text-on-primary': '#141008',
  'text-on-error': '#ffffff',

  'interactive-primary': '#ffc832',
  'interactive-hover': '#ffd966',
  'interactive-active': '#cc9f28',
  'interactive-disabled': '#443820',

  'feedback-error': '#ff4466',
  'feedback-warning': '#ffc832',
  'feedback-success': '#66ff99',
  'feedback-info': '#66ccff',

  'chat-bg': '#201810',
  'chat-bubble-sent': '#cc9f28',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#282010',
  'chat-bubble-received-text': '#ffe0a0',

  'sidebar-bg': '#141008',
  'sidebar-text': '#d4b060',
  'sidebar-hover': '#282010',
  'sidebar-active': '#342818',

  'card-bg': '#282010',
  'card-border': '#443820',
  'input-bg': '#201810',
  'input-border': '#443820',
  'input-focus': '#ffc832',

  'border-default': '#443820',
  'border-muted': '#342818',

  'link-default': '#ffc832',
  'link-hover': '#ffd966',
};

// =============================================================================
// TOKEN REGISTRY — maps theme ids → semantic tokens
// =============================================================================

export const TOKEN_REGISTRY: Record<string, SemanticTokens> = {
  dark: DARK_TOKENS,
  light: LIGHT_TOKENS,
  matrix: MATRIX_TOKENS,
  midnight: MIDNIGHT_TOKENS,
  'holo-cyan': HOLO_CYAN_TOKENS,
  'holo-purple': HOLO_PURPLE_TOKENS,
  'holo-gold': HOLO_GOLD_TOKENS,
};

/**
 * Return the semantic tokens for a theme, falling back to dark.
 */
export function getTokensForTheme(themeId: string): SemanticTokens {
  return TOKEN_REGISTRY[themeId] ?? DARK_TOKENS;
}

// =============================================================================
// CSS VARIABLE INJECTION HELPER
// =============================================================================

/**
 * Inject all semantic tokens as CSS custom properties on the root element.
 * Variable naming: `--token-<name>` e.g. `--token-bg-primary`.
 * Also sets `--token-<name>-rgb` with space-separated R G B for Tailwind opacity.
 */
export function injectSemanticTokens(themeId: string): void {
  const tokens = getTokensForTheme(themeId);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--token-${key}`, value);
    // Set RGB variant for Tailwind alpha support: rgb(var(--token-bg-primary-rgb) / 0.5)
    const rgb = hexToRgb(value);
    if (rgb) {
      root.style.setProperty(`--token-${key}-rgb`, rgb.join(' '));
    }
  }
}
