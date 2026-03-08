/**
 * Profile Themes — shared across web and mobile.
 *
 * A profile theme is a { primary, accent } color pair that tints
 * the profile card background and interactive elements.
 * 9 curated presets + 1 "custom" entry where users pick freely.
 *
 * @module animation-constants/registries/profileThemes
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A preset theme entry. `primary` and `accent` are `null` for the custom theme. */
export interface ProfileThemePreset {
  readonly id: string;
  readonly name: string;
  readonly primary: string | null;
  readonly accent: string | null;
}

/** Resolved theme applied to the profile card (never null). */
export interface ProfileTheme {
  primary: string;
  accent: string;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export const PROFILE_THEME_PRESETS: readonly ProfileThemePreset[] = [
  { id: 'theme_default', name: 'Default', primary: '#1e1f22', accent: '#5865f2' },
  { id: 'theme_midnight', name: 'Midnight', primary: '#0d0d2b', accent: '#7b2fff' },
  { id: 'theme_sakura', name: 'Sakura', primary: '#2d0a1a', accent: '#e8105f' },
  { id: 'theme_forest', name: 'Forest', primary: '#0a1a0d', accent: '#228b22' },
  { id: 'theme_ocean', name: 'Ocean', primary: '#001a2e', accent: '#00bfff' },
  { id: 'theme_sunset', name: 'Sunset', primary: '#1a0a00', accent: '#ff6b35' },
  { id: 'theme_cyber', name: 'Cyber', primary: '#0a001a', accent: '#00f5ff' },
  { id: 'theme_gothic', name: 'Gothic', primary: '#1e1e2e', accent: '#dc143c' },
  { id: 'theme_gold', name: 'Gold', primary: '#1a1400', accent: '#ffd60a' },
  { id: 'theme_custom', name: 'Custom', primary: null, accent: null },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Default theme matching 'theme_default' preset. */
export const DEFAULT_PROFILE_THEME: ProfileTheme = {
  primary: '#1e1f22',
  accent: '#5865f2',
};

/** Find a preset by its id. Returns `undefined` for unknown ids. */
export function getProfileThemePresetById(id: string): ProfileThemePreset | undefined {
  return PROFILE_THEME_PRESETS.find((p) => p.id === id);
}

/** Check whether a preset is the custom (user-defined) entry. */
export function isCustomTheme(preset: ProfileThemePreset): boolean {
  return preset.primary === null || preset.accent === null;
}
