/**
 * Forum Theme Store
 *
 * Forum-specific theme types, presets, and hooks.
 * Uses the unified theme store for state management.
 */

// Import directly from the store instance file to avoid circular dependency:
// stores/theme/index.ts re-exports from this file, so importing from the barrel
// would create: stores/theme/index → forumThemeStore → stores/theme/index → TDZ
import { useThemeStore } from '@/stores/theme/store';

// =============================================================================
// TYPES
// =============================================================================

export type ForumThemePreset =
  | 'classic-mybb'
  | 'dark-elite'
  | 'cyberpunk'
  | 'fantasy-guild'
  | 'minimal-pro'
  | 'retro-gaming'
  | 'matrix-code'
  | 'sunset-gradient'
  | 'arctic-frost'
  | 'volcanic'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'neon'
  | 'monochrome'
  | 'custom';

export type ForumTitleAnimation =
  | 'none'
  | 'gradient'
  | 'glow'
  | 'particle-trail'
  | 'letter-reveal'
  | 'holographic'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'neon-flicker'
  | 'matrix';

export type RoleBadgeStyle = 'none' | 'pill' | 'shield' | 'crown' | 'star' | 'diamond' | 'custom';

export interface ForumRoleStyle {
  id: string;
  name: string;
  color: string;
  badgeStyle: RoleBadgeStyle;
  badgeIcon?: string;
  glowEffect: boolean;
  animation?: 'none' | 'pulse' | 'shimmer' | 'rainbow';
}

export interface ForumBannerConfig {
  type: 'image' | 'video' | 'gradient' | 'animated';
  url?: string;
  gradient?: string;
  parallax: boolean;
  overlay: boolean;
  overlayOpacity: number;
  height: number;
  particleEffect?: 'none' | 'snow' | 'stars' | 'embers' | 'matrix' | 'bubbles';
}

export interface ForumTheme {
  id: string;
  name: string;
  preset: ForumThemePreset;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    elevated: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    divider: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    memberColor: string;
    modColor: string;
    adminColor: string;
    ownerColor: string;
  };
  fontFamily: string;
  headerFontFamily: string;
  fontSize: 'sm' | 'md' | 'lg';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth: number;
  glassmorphism: boolean;
  shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
  titleAnimation: ForumTitleAnimation;
  titleAnimationSpeed: number;
  banner: ForumBannerConfig;
  roleStyles: ForumRoleStyle[];
  customCss: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// =============================================================================
// PRESETS
// =============================================================================

const DEFAULT_FORUM_COLORS = {
  primary: '#22c55e',
  secondary: '#16a34a',
  accent: '#4ade80',
  background: '#0f0f0f',
  surface: '#1a1a1a',
  elevated: '#262626',
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#525252',
  border: '#333333',
  divider: '#262626',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
  memberColor: '#a3a3a3',
  modColor: '#22c55e',
  adminColor: '#ef4444',
  ownerColor: '#eab308',
};

export const FORUM_THEME_PRESETS: Record<string, Partial<ForumTheme>> = {
  'dark-elite': {
    name: 'Dark Elite',
    preset: 'dark-elite',
    colors: { ...DEFAULT_FORUM_COLORS, primary: '#BB86FC', secondary: '#03DAC6' },
    borderRadius: 'md',
    glassmorphism: true,
    shadows: 'medium',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'glow',
    titleAnimationSpeed: 2,
  },
  cyberpunk: {
    name: 'Cyberpunk 2077',
    preset: 'cyberpunk',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#00F0FF',
      secondary: '#FF00FF',
      accent: '#FCEE0A',
    },
    borderRadius: 'none',
    glassmorphism: true,
    shadows: 'dramatic',
    borderWidth: 2,
    fontSize: 'md',
    titleAnimation: 'neon-flicker',
    titleAnimationSpeed: 0.5,
  },
  'classic-mybb': {
    name: 'Classic MyBB',
    preset: 'classic-mybb',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#0F4C81',
      secondary: '#1565C0',
      background: '#FFFFFF',
      textPrimary: '#212121',
    },
    borderRadius: 'sm',
    glassmorphism: false,
    shadows: 'subtle',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'none',
    titleAnimationSpeed: 1,
  },
  forest: {
    name: 'Forest',
    preset: 'forest',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#2D6A4F',
      secondary: '#40916C',
      accent: '#95D5B2',
      background: '#1B4332',
      textPrimary: '#D8F3DC',
    },
    borderRadius: 'md',
    glassmorphism: false,
    shadows: 'subtle',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'gradient',
    titleAnimationSpeed: 3,
  },
  ocean: {
    name: 'Ocean',
    preset: 'ocean',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#0077B6',
      secondary: '#00B4D8',
      accent: '#90E0EF',
      background: '#03045E',
      textPrimary: '#CAF0F8',
    },
    borderRadius: 'lg',
    glassmorphism: true,
    shadows: 'medium',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'holographic',
    titleAnimationSpeed: 2,
  },
  sunset: {
    name: 'Sunset',
    preset: 'sunset',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#E63946',
      secondary: '#F4A261',
      accent: '#E9C46A',
      background: '#264653',
      textPrimary: '#F1FAEE',
    },
    borderRadius: 'md',
    glassmorphism: false,
    shadows: 'medium',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'gradient',
    titleAnimationSpeed: 4,
  },
  neon: {
    name: 'Neon',
    preset: 'neon',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#39FF14',
      secondary: '#FF073A',
      accent: '#FF6EC7',
      background: '#0D0D0D',
      textPrimary: '#FFFFFF',
    },
    borderRadius: 'none',
    glassmorphism: true,
    shadows: 'dramatic',
    borderWidth: 2,
    fontSize: 'md',
    titleAnimation: 'electric',
    titleAnimationSpeed: 1,
  },
  monochrome: {
    name: 'Monochrome',
    preset: 'monochrome',
    colors: {
      ...DEFAULT_FORUM_COLORS,
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      accent: '#999999',
      background: '#111111',
      textPrimary: '#E5E5E5',
    },
    borderRadius: 'sm',
    glassmorphism: false,
    shadows: 'none',
    borderWidth: 1,
    fontSize: 'md',
    titleAnimation: 'none',
    titleAnimationSpeed: 1,
  },
};

// =============================================================================
// HOOKS
// =============================================================================

/** Alias: useForumThemeStore maps to the unified theme store */
export const useForumThemeStore = useThemeStore;

export const useActiveForumTheme = () => {
  const themeId = useThemeStore((s) => s.activeForumThemeId);
  return themeId
    ?  
      FORUM_THEME_PRESETS[themeId as keyof typeof FORUM_THEME_PRESETS]
    : FORUM_THEME_PRESETS['dark-elite'];
};

export const useForumThemePresets = () => FORUM_THEME_PRESETS;

// =============================================================================
// CUSTOMIZATION STATE (55 options, 8 categories)
// =============================================================================

import { create } from 'zustand';
import type { ForumCustomizationOptions, CustomizationCategory } from '@cgraph/shared-types';

interface CustomizationState {
  options: ForumCustomizationOptions | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  previewDraft: ForumCustomizationOptions | null;

  // Actions
  fetchCustomization: (forumId: string) => Promise<void>;
  updateCustomization: (
    forumId: string,
    category: CustomizationCategory,
    changes: Record<string, unknown>
  ) => Promise<void>;
  previewCustomization: (category: CustomizationCategory, changes: Record<string, unknown>) => void;
  resetCategory: (forumId: string, category: CustomizationCategory) => Promise<void>;
  clearPreview: () => void;
}

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  options: null,
  loading: false,
  saving: false,
  error: null,
  previewDraft: null,

  fetchCustomization: async (forumId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/v1/forums/${forumId}/customization`);
      const json = await res.json();
      set({ options: json.data, loading: false });
    } catch (_err) {
      set({ error: 'Failed to fetch customization', loading: false });
    }
  },

  updateCustomization: async (
    forumId: string,
    category: CustomizationCategory,
    changes: Record<string, unknown>
  ) => {
    set({ saving: true, error: null });
    try {
      const res = await fetch(`/api/v1/forums/${forumId}/customization/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const json = await res.json();
      set({ options: json.data, saving: false, previewDraft: null });
    } catch (_err) {
      set({ error: 'Failed to save', saving: false });
    }
  },

  previewCustomization: (category: CustomizationCategory, changes: Record<string, unknown>) => {
    const current = get().options;
    if (!current) return;
    const merged = {
      ...current,
      [category]: { ...(current[category] ?? {}), ...changes },
    };
     
    set({ previewDraft: merged as ForumCustomizationOptions });
  },

  resetCategory: async (forumId: string, category: CustomizationCategory) => {
    set({ saving: true, error: null });
    try {
      const res = await fetch(`/api/v1/forums/${forumId}/customization/${category}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      set({ options: json.data, saving: false, previewDraft: null });
    } catch (_err) {
      set({ error: 'Failed to reset', saving: false });
    }
  },

  clearPreview: () => set({ previewDraft: null }),
}));
