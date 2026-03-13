/**
 * Secret Chat Theme Colors
 *
 * Maps 12 secret chat theme IDs to color palettes for React Native styling.
 * Mobile equivalent of the web CSS-based themeRegistry.
 *
 * @module screens/secret-chat/theme-colors
 */

import type { SecretThemeId } from '@/stores/secretChatStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SecretThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly accent: string;
  readonly bubbleSent: string;
  readonly bubbleReceived: string;
  readonly bubbleTextSent: string;
  readonly bubbleTextReceived: string;
  readonly border: string;
  readonly inputBackground: string;
}

export interface SecretThemeMeta {
  readonly id: SecretThemeId;
  readonly name: string;
  readonly description: string;
  readonly previewColor: string;
}

// ---------------------------------------------------------------------------
// Theme Registry — 12 themes
// ---------------------------------------------------------------------------

export const SECRET_THEMES: ReadonlyArray<SecretThemeMeta> = [
  { id: 'void', name: 'Void', description: 'Pure darkness — minimal, distraction-free', previewColor: '#0a0a0a' },
  { id: 'redacted', name: 'Redacted', description: 'Classified documents aesthetic', previewColor: '#1a1a1a' },
  { id: 'midnight', name: 'Midnight', description: 'Deep navy with subtle starfield undertones', previewColor: '#0d1b2a' },
  { id: 'signal', name: 'Signal', description: 'Inspired by Signal — clean blue-on-dark', previewColor: '#2c6bed' },
  { id: 'ghost', name: 'Ghost', description: 'Ethereal translucency with faded whisper tones', previewColor: '#3d3d5c' },
  { id: 'cipher', name: 'Cipher', description: 'Matrix-green terminal aesthetic', previewColor: '#0d2818' },
  { id: 'onyx', name: 'Onyx', description: 'Polished black with silver-gray accents', previewColor: '#121212' },
  { id: 'eclipse', name: 'Eclipse', description: 'Dark purple corona with amber highlights', previewColor: '#1a0a2e' },
  { id: 'static', name: 'Static', description: 'TV-static noise grain with monochrome palette', previewColor: '#2a2a2a' },
  { id: 'shadow', name: 'Shadow', description: 'Deep charcoal with subtle edge glow', previewColor: '#1c1c1c' },
  { id: 'obsidian', name: 'Obsidian', description: 'Volcanic glass — dark with iridescent shimmers', previewColor: '#0e0e14' },
  { id: 'abyss', name: 'Abyss', description: 'Deep ocean black with bioluminescent blue accents', previewColor: '#020818' },
] as const;

// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

const THEME_COLORS: Record<SecretThemeId, SecretThemeColors> = {
  void: {
    background: '#0a0a0a',
    surface: '#141414',
    text: '#e0e0e0',
    textSecondary: '#707070',
    accent: '#505050',
    bubbleSent: '#1a1a1a',
    bubbleReceived: '#111111',
    bubbleTextSent: '#e0e0e0',
    bubbleTextReceived: '#c0c0c0',
    border: '#222222',
    inputBackground: '#141414',
  },
  redacted: {
    background: '#1a1a1a',
    surface: '#242424',
    text: '#d4d4d4',
    textSecondary: '#808080',
    accent: '#cc3333',
    bubbleSent: '#2d1010',
    bubbleReceived: '#242424',
    bubbleTextSent: '#e0c0c0',
    bubbleTextReceived: '#c0c0c0',
    border: '#333333',
    inputBackground: '#222222',
  },
  midnight: {
    background: '#0d1b2a',
    surface: '#1b2838',
    text: '#c8d6e5',
    textSecondary: '#6b8299',
    accent: '#3b82f6',
    bubbleSent: '#1e3a5f',
    bubbleReceived: '#152238',
    bubbleTextSent: '#dbeafe',
    bubbleTextReceived: '#a8c0d8',
    border: '#253a52',
    inputBackground: '#152238',
  },
  signal: {
    background: '#111b21',
    surface: '#1e2d36',
    text: '#e1e9ec',
    textSecondary: '#8696a0',
    accent: '#2c6bed',
    bubbleSent: '#2c6bed',
    bubbleReceived: '#1e2d36',
    bubbleTextSent: '#ffffff',
    bubbleTextReceived: '#d1d7db',
    border: '#2a3942',
    inputBackground: '#1e2d36',
  },
  ghost: {
    background: '#1a1a2e',
    surface: '#252545',
    text: '#c8c8e0',
    textSecondary: '#7a7a9e',
    accent: '#9b59b6',
    bubbleSent: '#3d2a5c',
    bubbleReceived: '#252545',
    bubbleTextSent: '#e0d0f0',
    bubbleTextReceived: '#b0a0c8',
    border: '#333355',
    inputBackground: '#222240',
  },
  cipher: {
    background: '#0d2818',
    surface: '#143020',
    text: '#a0e8a0',
    textSecondary: '#508050',
    accent: '#00ff41',
    bubbleSent: '#0a3a15',
    bubbleReceived: '#0f2a18',
    bubbleTextSent: '#b0ffb0',
    bubbleTextReceived: '#80c080',
    border: '#1a4028',
    inputBackground: '#0f2a18',
  },
  onyx: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#d4d4d4',
    textSecondary: '#888888',
    accent: '#a0a0a0',
    bubbleSent: '#2a2a2a',
    bubbleReceived: '#1a1a1a',
    bubbleTextSent: '#e8e8e8',
    bubbleTextReceived: '#c0c0c0',
    border: '#2e2e2e',
    inputBackground: '#1a1a1a',
  },
  eclipse: {
    background: '#1a0a2e',
    surface: '#261040',
    text: '#d4b0ff',
    textSecondary: '#8060a0',
    accent: '#f59e0b',
    bubbleSent: '#3d1860',
    bubbleReceived: '#220e38',
    bubbleTextSent: '#f0d8ff',
    bubbleTextReceived: '#c0a0e0',
    border: '#351450',
    inputBackground: '#200c35',
  },
  static: {
    background: '#2a2a2a',
    surface: '#333333',
    text: '#cccccc',
    textSecondary: '#808080',
    accent: '#999999',
    bubbleSent: '#3a3a3a',
    bubbleReceived: '#303030',
    bubbleTextSent: '#e0e0e0',
    bubbleTextReceived: '#b0b0b0',
    border: '#404040',
    inputBackground: '#303030',
  },
  shadow: {
    background: '#1c1c1c',
    surface: '#262626',
    text: '#d0d0d0',
    textSecondary: '#787878',
    accent: '#60a0ff',
    bubbleSent: '#2a3a50',
    bubbleReceived: '#222222',
    bubbleTextSent: '#d0e0ff',
    bubbleTextReceived: '#b8b8b8',
    border: '#303030',
    inputBackground: '#222222',
  },
  obsidian: {
    background: '#0e0e14',
    surface: '#18182a',
    text: '#c0c0d8',
    textSecondary: '#6868a0',
    accent: '#7c3aed',
    bubbleSent: '#2d1a60',
    bubbleReceived: '#161628',
    bubbleTextSent: '#ddd0ff',
    bubbleTextReceived: '#a0a0c0',
    border: '#252540',
    inputBackground: '#141425',
  },
  abyss: {
    background: '#020818',
    surface: '#0a1428',
    text: '#a0c8e8',
    textSecondary: '#406080',
    accent: '#0ea5e9',
    bubbleSent: '#0a2a50',
    bubbleReceived: '#081420',
    bubbleTextSent: '#c0e0ff',
    bubbleTextReceived: '#80a8c8',
    border: '#0f2038',
    inputBackground: '#081420',
  },
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Get the color palette for a secret theme.
 * Falls back to 'void' if the theme ID is unknown.
 */
export function getSecretThemeColors(id: SecretThemeId): SecretThemeColors {
  return THEME_COLORS[id] ?? THEME_COLORS.void;
}

/**
 * Get the theme metadata by ID.
 * Falls back to 'void' if not found.
 */
export function getSecretThemeMeta(id: SecretThemeId): SecretThemeMeta {
  return SECRET_THEMES.find((t) => t.id === id) ?? SECRET_THEMES[0];
}
