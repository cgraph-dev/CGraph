/**
 * Display Name Styles — shared across web and mobile.
 *
 * Defines fonts, text effects, and preset colors for the
 * user's display name. Pure styling — no Lottie needed.
 *
 * @module animation-constants/registries/displayNameStyles
 */

// ─── Font ────────────────────────────────────────────────────────────────────

/** Available name font keys */
export type NameFont =
  | 'default'
  | 'serif'
  | 'rounded'
  | 'bold_italic'
  | 'condensed'
  | 'display'
  | 'mono'
  | 'handwritten';

/** Font configuration applied to the display name Text component */
export interface NameFontConfig {
  readonly label: string;
  readonly fontFamily?: string;
  readonly fontWeight?: string;
  readonly fontStyle?: 'normal' | 'italic';
  readonly letterSpacing?: number;
}

/** All available name fonts */
export const NAME_FONTS: Record<NameFont, NameFontConfig> = {
  default: { label: 'Default', fontWeight: '600' },
  serif: { label: 'Serif', fontFamily: 'Georgia' },
  rounded: { label: 'Rounded', fontWeight: '700' },
  bold_italic: { label: 'Bold Italic', fontWeight: '800', fontStyle: 'italic' },
  condensed: { label: 'Condensed', fontWeight: '300', letterSpacing: -0.5 },
  display: { label: 'Display', fontWeight: '900' },
  mono: { label: 'Mono', fontFamily: 'Courier New' },
  handwritten: { label: 'Handwritten', fontStyle: 'italic', fontWeight: '400' },
} as const;

/** Ordered list of font keys for iteration */
export const NAME_FONT_KEYS: readonly NameFont[] = [
  'default',
  'serif',
  'rounded',
  'bold_italic',
  'condensed',
  'display',
  'mono',
  'handwritten',
] as const;

// ─── Effect ──────────────────────────────────────────────────────────────────

/** Available text effect keys */
export type NameEffect = 'solid' | 'gradient' | 'neon' | 'toon' | 'pop';

/** Effect metadata */
export interface NameEffectConfig {
  readonly label: string;
  readonly description: string;
}

/** All available text effects */
export const NAME_EFFECTS: Record<NameEffect, NameEffectConfig> = {
  solid: { label: 'Solid', description: 'Clean single color' },
  gradient: { label: 'Gradient', description: 'Smooth color blend' },
  neon: { label: 'Neon', description: 'Glowing neon light' },
  toon: { label: 'Toon', description: 'Bold cartoon outline' },
  pop: { label: 'Pop', description: 'Funky offset shadow' },
} as const;

/** Ordered list of effect keys for iteration */
export const NAME_EFFECT_KEYS: readonly NameEffect[] = [
  'solid',
  'gradient',
  'neon',
  'toon',
  'pop',
] as const;

// ─── Colors ──────────────────────────────────────────────────────────────────

/** 12 preset name colors (4 columns × 3 rows in the picker) */
export const NAME_COLORS: readonly string[] = [
  '#ff4d6d',
  '#ff6b35',
  '#ffd60a',
  '#06d6a0',
  '#4cc9f0',
  '#4361ee',
  '#7209b7',
  '#f72585',
  '#ffffff',
  '#adb5bd',
  '#495057',
  '#000000',
] as const;

// ─── Composite style ────────────────────────────────────────────────────────

/** Full display name style configuration */
export interface DisplayNameStyle {
  font: NameFont;
  effect: NameEffect;
  color: string;
  secondaryColor?: string;
}

/** Default display name style */
export const DEFAULT_DISPLAY_NAME_STYLE: DisplayNameStyle = {
  font: 'default',
  effect: 'solid',
  color: '#ffffff',
};
