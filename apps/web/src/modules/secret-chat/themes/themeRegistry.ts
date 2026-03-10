/**
 * Secret Chat Theme Registry
 *
 * Maps 12 secret chat themes to CSS class names and metadata.
 * Themes are ultra-lightweight CSS-only — no Lottie or heavy assets.
 *
 * @module modules/secret-chat/themes/themeRegistry
 */

import type { SecretTheme, SecretThemeId } from '../store/types';

/** Complete registry of all 12 secret chat themes */
export const SECRET_THEMES: ReadonlyArray<SecretTheme> = [
  {
    id: 'void',
    name: 'Void',
    description: 'Pure darkness — minimal, distraction-free',
    className: 'secret-theme-void',
    previewColor: '#0a0a0a',
  },
  {
    id: 'redacted',
    name: 'Redacted',
    description: 'Classified documents aesthetic with strikethrough accents',
    className: 'secret-theme-redacted',
    previewColor: '#1a1a1a',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep navy with subtle starfield undertones',
    className: 'secret-theme-midnight',
    previewColor: '#0d1b2a',
  },
  {
    id: 'signal',
    name: 'Signal',
    description: 'Inspired by Signal — clean blue-on-dark',
    className: 'secret-theme-signal',
    previewColor: '#2c6bed',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Ethereal translucency with faded whisper tones',
    className: 'secret-theme-ghost',
    previewColor: '#3d3d5c',
  },
  {
    id: 'cipher',
    name: 'Cipher',
    description: 'Matrix-green terminal aesthetic',
    className: 'secret-theme-cipher',
    previewColor: '#0d2818',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Polished black with silver-gray accents',
    className: 'secret-theme-onyx',
    previewColor: '#121212',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Dark purple corona with amber highlights',
    className: 'secret-theme-eclipse',
    previewColor: '#1a0a2e',
  },
  {
    id: 'static',
    name: 'Static',
    description: 'TV-static noise grain with monochrome palette',
    className: 'secret-theme-static',
    previewColor: '#2a2a2a',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Deep charcoal with subtle edge glow',
    className: 'secret-theme-shadow',
    previewColor: '#1c1c1c',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Volcanic glass — dark with iridescent shimmers',
    className: 'secret-theme-obsidian',
    previewColor: '#0e0e14',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    description: 'Deep ocean black with bioluminescent blue accents',
    className: 'secret-theme-abyss',
    previewColor: '#020818',
  },
] as const;

/** Map of theme IDs to theme metadata for O(1) lookup */
export const THEME_MAP: ReadonlyMap<SecretThemeId, SecretTheme> = new Map(
  SECRET_THEMES.map((theme) => [theme.id, theme])
);

/**
 * Look up a theme by its ID.
 *
 * @param id - Theme identifier
 * @returns The theme metadata, falling back to "void" if not found
 */
export function getSecretTheme(id: SecretThemeId): SecretTheme {
  return THEME_MAP.get(id) ?? SECRET_THEMES[0]!;
}

/**
 * Get the CSS class for a theme ID.
 *
 * @param id - Theme identifier
 * @returns CSS class name string
 */
export function getSecretThemeClass(id: SecretThemeId): string {
  return getSecretTheme(id).className;
}
