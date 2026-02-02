/**
 * Preset Themes - 12 professional theme presets
 *
 * Themes:
 * 1. Default Dark (Matrix-inspired)
 * 2. Dark Matrix (Pure green on black)
 * 3. Cyberpunk (Neon pink/cyan)
 * 4. Nord (Arctic blue/white)
 * 5. Dracula (Purple/pink on dark)
 * 6. Gruvbox (Retro warm colors)
 * 7. Aurora (Northern lights)
 * 8. Ocean (Deep blue/teal)
 * 9. Ember (Fire orange/red)
 * 10. Midnight (Deep purple/blue)
 * 11. Dawn (Soft pink/orange)
 * 12. Forest (Earth green/brown)
 *
 * @version 1.0.0
 * @since v0.10.0
 */

import {
  type ThemeConfig,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_SHADOWS,
  DEFAULT_LAYOUT,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_PERFORMANCE,
} from './CustomizationEngine';

// ============================================================================
// 1. DEFAULT DARK (Matrix-inspired)
// ============================================================================

export const DEFAULT_DARK_THEME: ThemeConfig = {
  name: 'Default Dark',
  version: '1.0.0',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    surface: {
      base: '#111827',
      elevated: '#1f2937',
      overlay: '#374151',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    status: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    glassmorphism: {
      tint: '#1f2937',
      opacity: 0.2,
    },
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  borderRadius: DEFAULT_BORDER_RADIUS,
  shadows: DEFAULT_SHADOWS,
  effects: {
    blur: {
      enabled: true,
      intensity: 75,
      perComponent: { cards: 75, modals: 85, headers: 60 },
    },
    particles: {
      enabled: true,
      density: 'medium',
      color: '#8b5cf6',
    },
    glow: {
      enabled: true,
      intensity: 'moderate',
      color: '#10b981',
    },
    borderGradients: { enabled: true, speed: 1.0 },
    scanlines: { enabled: false, opacity: 10, speed: 10 },
    glassmorphism: 'default',
  },
  animations: {
    speed: 1.0,
    intensity: 'intense',
    categories: {
      screenTransitions: true,
      componentEntrance: true,
      microInteractions: true,
      particleEffects: true,
    },
    springPhysics: { tension: 120, friction: 15 },
    haptics: { enabled: true, strength: 'medium' },
  },
  layout: DEFAULT_LAYOUT,
  accessibility: DEFAULT_ACCESSIBILITY,
  performance: DEFAULT_PERFORMANCE,
};

// ============================================================================
// 2. DARK MATRIX (Pure green on black)
// ============================================================================

export const DARK_MATRIX_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Dark Matrix',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#00ff41', // Matrix green
      600: '#00cc34',
      700: '#009927',
      800: '#00661a',
      900: '#003b00',
    },
    secondary: {
      50: '#0a0f0a',
      100: '#0f1f0f',
      200: '#1a2f1a',
      300: '#253f25',
      400: '#304f30',
      500: '#3b5f3b',
      600: '#466f46',
      700: '#517f51',
      800: '#5c8f5c',
      900: '#679f67',
    },
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    surface: {
      base: '#000000',
      elevated: '#0a0f0a',
      overlay: '#1a2f1a',
    },
    text: {
      primary: '#00ff41',
      secondary: '#00cc34',
      tertiary: '#009927',
      inverse: '#000000',
    },
    status: {
      success: '#00ff41',
      error: '#ff0033',
      warning: '#ffcc00',
      info: '#00ccff',
    },
    glassmorphism: {
      tint: '#003b00',
      opacity: 0.3,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'ultra',
      color: '#00ff41',
    },
    glow: {
      enabled: true,
      intensity: 'intense',
      color: '#00ff41',
    },
    scanlines: { enabled: true, opacity: 15, speed: 8 },
    glassmorphism: 'holographic',
  },
};

// ============================================================================
// 3. CYBERPUNK (Neon pink/cyan)
// ============================================================================

export const CYBERPUNK_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Cyberpunk',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ff00ff', // Neon magenta
      600: '#db2777',
      700: '#be185d',
      800: '#9f1239',
      900: '#831843',
    },
    secondary: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#00f5ff', // Neon cyan
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    accent: {
      50: '#fef9c3',
      100: '#fef08a',
      200: '#fde047',
      300: '#facc15',
      400: '#eab308',
      500: '#ffff00', // Neon yellow
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    surface: {
      base: '#0a0a0a',
      elevated: '#1a1a2e',
      overlay: '#16213e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#00f5ff',
      tertiary: '#ff00ff',
      inverse: '#0a0a0a',
    },
    status: {
      success: '#00ff00',
      error: '#ff0055',
      warning: '#ffaa00',
      info: '#00f5ff',
    },
    glassmorphism: {
      tint: '#16213e',
      opacity: 0.25,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'high',
      color: '#ff00ff',
    },
    glow: {
      enabled: true,
      intensity: 'intense',
      color: '#00f5ff',
    },
    borderGradients: { enabled: true, speed: 1.5 },
    scanlines: { enabled: true, opacity: 20, speed: 12 },
    glassmorphism: 'neon',
  },
};

// ============================================================================
// 4. NORD (Arctic blue/white)
// ============================================================================

export const NORD_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Nord',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#eceff4',
      100: '#e5e9f0',
      200: '#d8dee9',
      300: '#81a1c1',
      400: '#88c0d0',
      500: '#5e81ac',
      600: '#4c566a',
      700: '#434c5e',
      800: '#3b4252',
      900: '#2e3440',
    },
    secondary: {
      50: '#eceff4',
      100: '#e5e9f0',
      200: '#d8dee9',
      300: '#d8dee9',
      400: '#d8dee9',
      500: '#d8dee9',
      600: '#4c566a',
      700: '#434c5e',
      800: '#3b4252',
      900: '#2e3440',
    },
    accent: {
      50: '#ebcb8b',
      100: '#ebcb8b',
      200: '#d08770',
      300: '#bf616a',
      400: '#b48ead',
      500: '#88c0d0',
      600: '#81a1c1',
      700: '#5e81ac',
      800: '#4c566a',
      900: '#3b4252',
    },
    surface: {
      base: '#2e3440',
      elevated: '#3b4252',
      overlay: '#434c5e',
    },
    text: {
      primary: '#eceff4',
      secondary: '#d8dee9',
      tertiary: '#4c566a',
      inverse: '#2e3440',
    },
    status: {
      success: '#a3be8c',
      error: '#bf616a',
      warning: '#ebcb8b',
      info: '#88c0d0',
    },
    glassmorphism: {
      tint: '#3b4252',
      opacity: 0.2,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'low',
      color: '#88c0d0',
    },
    glow: {
      enabled: true,
      intensity: 'subtle',
      color: '#5e81ac',
    },
    glassmorphism: 'frosted',
  },
};

// ============================================================================
// 5. DRACULA (Purple/pink on dark)
// ============================================================================

export const DRACULA_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Dracula',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#f8f8f2',
      100: '#f8f8f2',
      200: '#f8f8f2',
      300: '#bd93f9',
      400: '#bd93f9',
      500: '#bd93f9',
      600: '#9580cc',
      700: '#6d6d99',
      800: '#44475a',
      900: '#282a36',
    },
    secondary: {
      50: '#f8f8f2',
      100: '#f8f8f2',
      200: '#6272a4',
      300: '#6272a4',
      400: '#6272a4',
      500: '#6272a4',
      600: '#44475a',
      700: '#44475a',
      800: '#282a36',
      900: '#21222c',
    },
    accent: {
      50: '#ffb86c',
      100: '#ff79c6',
      200: '#ff79c6',
      300: '#ff79c6',
      400: '#ff79c6',
      500: '#ff79c6',
      600: '#ff5555',
      700: '#f1fa8c',
      800: '#50fa7b',
      900: '#8be9fd',
    },
    surface: {
      base: '#282a36',
      elevated: '#44475a',
      overlay: '#6272a4',
    },
    text: {
      primary: '#f8f8f2',
      secondary: '#bd93f9',
      tertiary: '#6272a4',
      inverse: '#282a36',
    },
    status: {
      success: '#50fa7b',
      error: '#ff5555',
      warning: '#ffb86c',
      info: '#8be9fd',
    },
    glassmorphism: {
      tint: '#44475a',
      opacity: 0.25,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'medium',
      color: '#bd93f9',
    },
    glow: {
      enabled: true,
      intensity: 'moderate',
      color: '#ff79c6',
    },
    glassmorphism: 'crystal',
  },
};

// ============================================================================
// 6. GRUVBOX (Retro warm colors)
// ============================================================================

export const GRUVBOX_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Gruvbox',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#fbf1c7',
      100: '#ebdbb2',
      200: '#d5c4a1',
      300: '#bdae93',
      400: '#a89984',
      500: '#b8bb26',
      600: '#98971a',
      700: '#79740e',
      800: '#665c54',
      900: '#3c3836',
    },
    secondary: {
      50: '#fbf1c7',
      100: '#ebdbb2',
      200: '#d5c4a1',
      300: '#bdae93',
      400: '#a89984',
      500: '#928374',
      600: '#7c6f64',
      700: '#665c54',
      800: '#504945',
      900: '#3c3836',
    },
    accent: {
      50: '#fb4934',
      100: '#fe8019',
      200: '#fabd2f',
      300: '#b8bb26',
      400: '#8ec07c',
      500: '#83a598',
      600: '#d3869b',
      700: '#d65d0e',
      800: '#cc241d',
      900: '#b16286',
    },
    surface: {
      base: '#282828',
      elevated: '#3c3836',
      overlay: '#504945',
    },
    text: {
      primary: '#ebdbb2',
      secondary: '#d5c4a1',
      tertiary: '#bdae93',
      inverse: '#282828',
    },
    status: {
      success: '#b8bb26',
      error: '#fb4934',
      warning: '#fabd2f',
      info: '#83a598',
    },
    glassmorphism: {
      tint: '#3c3836',
      opacity: 0.2,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'low',
      color: '#b8bb26',
    },
    glow: {
      enabled: true,
      intensity: 'subtle',
      color: '#fe8019',
    },
    glassmorphism: 'ember',
  },
};

// ============================================================================
// 7. AURORA (Northern lights)
// ============================================================================

export const AURORA_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Aurora',
  author: 'CGraph',
  colors: {
    primary: {
      50: '#e0f2fe',
      100: '#bae6fd',
      200: '#7dd3fc',
      300: '#38bdf8',
      400: '#0ea5e9',
      500: '#4ade80',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    accent: {
      50: '#fae8ff',
      100: '#f5d0fe',
      200: '#f0abfc',
      300: '#e879f9',
      400: '#d946ef',
      500: '#c026d3',
      600: '#a21caf',
      700: '#86198f',
      800: '#701a75',
      900: '#581c87',
    },
    surface: {
      base: '#0f172a',
      elevated: '#1e293b',
      overlay: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    status: {
      success: '#4ade80',
      error: '#fb7185',
      warning: '#fbbf24',
      info: '#38bdf8',
    },
    glassmorphism: {
      tint: '#1e293b',
      opacity: 0.2,
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    particles: {
      enabled: true,
      density: 'high',
      color: '#c026d3',
    },
    glow: {
      enabled: true,
      intensity: 'intense',
      color: '#38bdf8',
    },
    glassmorphism: 'aurora',
  },
};

// ============================================================================
// 8-12. Additional Themes (Ocean, Ember, Midnight, Dawn, Forest)
// ============================================================================

export const OCEAN_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Ocean',
  author: 'CGraph',
  colors: {
    ...DEFAULT_DARK_THEME.colors,
    primary: {
      50: '#e0f2fe',
      100: '#bae6fd',
      200: '#7dd3fc',
      300: '#38bdf8',
      400: '#0ea5e9',
      500: '#0891b2',
      600: '#0e7490',
      700: '#155e75',
      800: '#164e63',
      900: '#0c4a6e',
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    glassmorphism: 'ocean',
  },
};

export const EMBER_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Ember',
  author: 'CGraph',
  colors: {
    ...DEFAULT_DARK_THEME.colors,
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    glassmorphism: 'ember',
  },
};

export const MIDNIGHT_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Midnight',
  author: 'CGraph',
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    glassmorphism: 'midnight',
  },
};

export const DAWN_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Dawn',
  author: 'CGraph',
  colors: {
    ...DEFAULT_DARK_THEME.colors,
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#fda4af',
      600: '#fb7185',
      700: '#f43f5e',
      800: '#e11d48',
      900: '#be123c',
    },
  },
  effects: {
    ...DEFAULT_DARK_THEME.effects,
    glassmorphism: 'dawn',
  },
};

export const FOREST_THEME: ThemeConfig = {
  ...DEFAULT_DARK_THEME,
  name: 'Forest',
  author: 'CGraph',
  colors: {
    ...DEFAULT_DARK_THEME.colors,
    primary: {
      50: '#f7fee7',
      100: '#ecfccb',
      200: '#d9f99d',
      300: '#bef264',
      400: '#a3e635',
      500: '#84cc16',
      600: '#65a30d',
      700: '#4d7c0f',
      800: '#3f6212',
      900: '#365314',
    },
  },
};

// ============================================================================
// PRESET THEMES ARRAY
// ============================================================================

export const PRESET_THEMES: ThemeConfig[] = [
  DEFAULT_DARK_THEME,
  DARK_MATRIX_THEME,
  CYBERPUNK_THEME,
  NORD_THEME,
  DRACULA_THEME,
  GRUVBOX_THEME,
  AURORA_THEME,
  OCEAN_THEME,
  EMBER_THEME,
  MIDNIGHT_THEME,
  DAWN_THEME,
  FOREST_THEME,
];

export default PRESET_THEMES;
