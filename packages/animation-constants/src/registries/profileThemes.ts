/**
 * Profile Themes — shared across web and mobile.
 *
 * Unified 25-theme set: 5 free + 5 earned + 15 shop.
 * Canonical slugs match backend @presets in CGraph.Gamification.ProfileTheme.
 *
 * @module animation-constants/registries/profileThemes
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Unlock tier for a profile theme. */
export type ThemeUnlockTier = 'free' | 'earned' | 'shop';

/** A preset theme entry. `primary` and `accent` are `null` for the custom theme. */
export interface ProfileThemePreset {
  readonly id: string;
  readonly name: string;
  readonly primary: string | null;
  readonly accent: string | null;
  readonly tier: ThemeUnlockTier;
}

/** Resolved theme applied to the profile card (never null). */
export interface ProfileTheme {
  primary: string;
  accent: string;
}

// ─── Presets (25 total: 5 free + 5 earned + 15 shop) ────────────────────────

export const PROFILE_THEME_PRESETS: readonly ProfileThemePreset[] = [
  // ── Free (5) ──────────────────────────────────────────────
  { id: 'default', name: 'Default', primary: '#1e1f22', accent: '#5865f2', tier: 'free' },
  { id: 'midnight', name: 'Midnight', primary: '#0d0d2b', accent: '#7b2fff', tier: 'free' },
  { id: 'sakura', name: 'Sakura', primary: '#2d0a1a', accent: '#e8105f', tier: 'free' },
  { id: 'forest', name: 'Forest', primary: '#0a1a0d', accent: '#228b22', tier: 'free' },
  { id: 'ocean', name: 'Ocean', primary: '#001a2e', accent: '#00bfff', tier: 'free' },

  // ── Earned (5) — unlocked via achievements / reputation ───
  { id: 'sunset', name: 'Sunset', primary: '#1a0a00', accent: '#ff6b35', tier: 'earned' },
  { id: 'cyber', name: 'Cyber', primary: '#0a001a', accent: '#00f5ff', tier: 'earned' },
  { id: 'gothic', name: 'Gothic', primary: '#1e1e2e', accent: '#dc143c', tier: 'earned' },
  { id: 'gold', name: 'Gold', primary: '#1a1400', accent: '#ffd60a', tier: 'earned' },
  { id: 'arctic', name: 'Arctic', primary: '#0a1a2e', accent: '#b0e0e6', tier: 'earned' },

  // ── Shop (15) — purchasable with Nodes ────────────────────
  { id: 'aurora', name: 'Aurora', primary: '#0a0f1a', accent: '#6ee7b7', tier: 'shop' },
  { id: 'neon-city', name: 'Neon City', primary: '#0f0818', accent: '#ff00ff', tier: 'shop' },
  { id: 'steampunk', name: 'Steampunk', primary: '#1a1208', accent: '#cd7f32', tier: 'shop' },
  { id: 'galaxy', name: 'Galaxy', primary: '#05050f', accent: '#8b5cf6', tier: 'shop' },
  { id: 'volcanic', name: 'Volcanic', primary: '#1a0800', accent: '#ff4500', tier: 'shop' },
  { id: 'holographic', name: 'Holographic', primary: '#0f0f1a', accent: '#e0c3fc', tier: 'shop' },
  { id: 'retro-arcade', name: 'Retro Arcade', primary: '#0a0a1a', accent: '#39ff14', tier: 'shop' },
  { id: 'kawaii', name: 'Kawaii', primary: '#1a0a14', accent: '#ff69b4', tier: 'shop' },
  { id: 'royal-purple', name: 'Royal Purple', primary: '#120a1e', accent: '#9b59b6', tier: 'shop' },
  { id: 'nature-zen', name: 'Nature Zen', primary: '#0a1408', accent: '#8fbc8f', tier: 'shop' },
  {
    id: 'minimalist-dark',
    name: 'Minimalist Dark',
    primary: '#121212',
    accent: '#ffffff',
    tier: 'shop',
  },
  {
    id: 'minimalist-light',
    name: 'Minimalist Light',
    primary: '#f5f5f5',
    accent: '#333333',
    tier: 'shop',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    primary: '#1a0812',
    accent: '#ffb7c5',
    tier: 'shop',
  },
  {
    id: 'space-explorer',
    name: 'Space Explorer',
    primary: '#050510',
    accent: '#00d4ff',
    tier: 'shop',
  },
  { id: 'custom', name: 'Custom', primary: null, accent: null, tier: 'shop' },
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
