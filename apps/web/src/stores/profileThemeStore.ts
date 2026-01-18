import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Profile Theme Store
 *
 * Manages user profile customization including:
 * - 20 profile theme presets
 * - Custom backgrounds (static, animated, video)
 * - 7 profile card layouts
 * - Profile music player settings
 * - Cross-forum identity display
 */

// ==================== TYPE DEFINITIONS ====================

export type ProfileThemePreset =
  | 'minimalist-dark'
  | 'minimalist-light'
  | 'gradient-aurora'
  | 'cyberpunk-neon'
  | 'fantasy-castle'
  | 'space-explorer'
  | 'ocean-deep'
  | 'forest-mystic'
  | 'desert-oasis'
  | 'arctic-tundra'
  | 'volcanic-fury'
  | 'steampunk'
  | 'synthwave'
  | 'vaporwave'
  | 'gothic'
  | 'kawaii'
  | 'industrial'
  | 'nature-zen'
  | 'abstract-art'
  | 'gaming-rgb'
  | 'holographic'
  | 'custom';

export type ProfileCardLayout =
  | 'minimal'
  | 'compact'
  | 'detailed'
  | 'gaming'
  | 'social'
  | 'creator'
  | 'custom';

export type ProfileBackgroundType = 'color' | 'gradient' | 'image' | 'video' | 'animated' | 'particles';

export type ProfileHoverEffect = 'none' | 'scale' | 'tilt' | 'glow' | 'particles' | 'border-animate';

export interface ProfileThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface ProfileBackground {
  type: ProfileBackgroundType;
  value: string; // Color, gradient, URL, or animation preset
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
  blur?: number;
}

export interface ProfileTheme {
  id: string;
  name: string;
  preset: ProfileThemePreset;
  colors: ProfileThemeColors;
  background: ProfileBackground;
  cardLayout: ProfileCardLayout;
  hoverEffect: ProfileHoverEffect;
  // Typography
  fontFamily: string;
  // Effects
  glassmorphism: boolean;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showParticles: boolean;
  particleType?: string;
  // Music
  musicEnabled: boolean;
  musicUrl?: string;
  musicAutoplay: boolean;
  musicVolume: number;
  // Metadata
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCardConfig {
  layout: ProfileCardLayout;
  showLevel: boolean;
  showXp: boolean;
  showKarma: boolean;
  showStreak: boolean;
  showBadges: boolean;
  maxBadges: number;
  showTitle: boolean;
  showBio: boolean;
  showStats: boolean;
  showRecentActivity: boolean;
  showMutualFriends: boolean;
  showForumsInCommon: boolean;
  showAchievements: boolean;
  showSocialLinks: boolean;
}

// ==================== THEME PRESETS ====================

export const PROFILE_THEME_PRESETS: Record<ProfileThemePreset, Omit<ProfileTheme, 'id' | 'createdAt' | 'updatedAt'>> = {
  'minimalist-dark': {
    name: 'Minimalist Dark',
    preset: 'minimalist-dark',
    colors: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      accent: '#3b82f6',
      background: '#0a0a0a',
      surface: '#171717',
      text: '#ffffff',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#0a0a0a' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'minimalist-light': {
    name: 'Minimalist Light',
    preset: 'minimalist-light',
    colors: {
      primary: '#000000',
      secondary: '#525252',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#171717',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#ffffff' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'gradient-aurora': {
    name: 'Gradient Aurora',
    preset: 'gradient-aurora',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#a855f7',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: {
      type: 'animated',
      value: 'aurora',
      overlay: true,
      overlayOpacity: 0.3,
    },
    cardLayout: 'detailed',
    hoverEffect: 'glow',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'stars',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'cyberpunk-neon': {
    name: 'Cyberpunk Neon',
    preset: 'cyberpunk-neon',
    colors: {
      primary: '#00f0ff',
      secondary: '#ff00ff',
      accent: '#fcee0a',
      background: '#0a0a0f',
      surface: '#15151f',
      text: '#ffffff',
      textMuted: '#666680',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a0a0f, #15151f, #0a0a0f)',
      overlay: true,
      overlayOpacity: 0.1,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Rajdhani", sans-serif',
    glassmorphism: true,
    borderRadius: 'none',
    showParticles: true,
    particleType: 'glitch',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'fantasy-castle': {
    name: 'Fantasy Castle',
    preset: 'fantasy-castle',
    colors: {
      primary: '#daa520',
      secondary: '#8b4513',
      accent: '#228b22',
      background: '#2d1b0e',
      surface: '#3d2815',
      text: '#f5f5dc',
      textMuted: '#8b7355',
    },
    background: {
      type: 'image',
      value: '/backgrounds/fantasy-castle.jpg',
      overlay: true,
      overlayOpacity: 0.6,
      parallax: true,
    },
    cardLayout: 'detailed',
    hoverEffect: 'tilt',
    fontFamily: '"Cinzel", serif',
    glassmorphism: false,
    borderRadius: 'sm',
    showParticles: true,
    particleType: 'sparkle',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'space-explorer': {
    name: 'Space Explorer',
    preset: 'space-explorer',
    colors: {
      primary: '#a855f7',
      secondary: '#6366f1',
      accent: '#22d3ee',
      background: '#030014',
      surface: '#0f0a1e',
      text: '#ffffff',
      textMuted: '#a78bfa',
    },
    background: {
      type: 'animated',
      value: 'stars',
      overlay: false,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Orbitron", sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'stars',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'ocean-deep': {
    name: 'Ocean Deep',
    preset: 'ocean-deep',
    colors: {
      primary: '#00b4d8',
      secondary: '#0077b6',
      accent: '#90e0ef',
      background: '#03045e',
      surface: '#023e8a',
      text: '#caf0f8',
      textMuted: '#48cae4',
    },
    background: {
      type: 'animated',
      value: 'waves',
      overlay: true,
      overlayOpacity: 0.2,
    },
    cardLayout: 'detailed',
    hoverEffect: 'tilt',
    fontFamily: '"Nunito", sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'bubble',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'forest-mystic': {
    name: 'Forest Mystic',
    preset: 'forest-mystic',
    colors: {
      primary: '#22c55e',
      secondary: '#15803d',
      accent: '#a3e635',
      background: '#0c1a0c',
      surface: '#132513',
      text: '#d9f99d',
      textMuted: '#4ade80',
    },
    background: {
      type: 'image',
      value: '/backgrounds/forest-mystic.jpg',
      overlay: true,
      overlayOpacity: 0.5,
      parallax: true,
    },
    cardLayout: 'detailed',
    hoverEffect: 'particles',
    fontFamily: '"Lora", serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'leaf',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'desert-oasis': {
    name: 'Desert Oasis',
    preset: 'desert-oasis',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#22d3ee',
      background: '#451a03',
      surface: '#78350f',
      text: '#fef3c7',
      textMuted: '#fbbf24',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #451a03, #78350f, #92400e)',
      overlay: false,
    },
    cardLayout: 'compact',
    hoverEffect: 'scale',
    fontFamily: '"Quicksand", sans-serif',
    glassmorphism: false,
    borderRadius: 'md',
    showParticles: false,
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'arctic-tundra': {
    name: 'Arctic Tundra',
    preset: 'arctic-tundra',
    colors: {
      primary: '#38bdf8',
      secondary: '#0ea5e9',
      accent: '#f0f9ff',
      background: '#0c4a6e',
      surface: '#075985',
      text: '#f0f9ff',
      textMuted: '#7dd3fc',
    },
    background: {
      type: 'animated',
      value: 'snow',
      overlay: false,
    },
    cardLayout: 'detailed',
    hoverEffect: 'glow',
    fontFamily: '"Montserrat", sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'snowflake',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'volcanic-fury': {
    name: 'Volcanic Fury',
    preset: 'volcanic-fury',
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#fbbf24',
      background: '#1c0a0a',
      surface: '#2d1010',
      text: '#fef2f2',
      textMuted: '#f87171',
    },
    background: {
      type: 'animated',
      value: 'embers',
      overlay: true,
      overlayOpacity: 0.2,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Cinzel Decorative", serif',
    glassmorphism: false,
    borderRadius: 'sm',
    showParticles: true,
    particleType: 'flame',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  steampunk: {
    name: 'Steampunk',
    preset: 'steampunk',
    colors: {
      primary: '#d4a574',
      secondary: '#8b7355',
      accent: '#cd7f32',
      background: '#1a1208',
      surface: '#2d2010',
      text: '#f5e6d3',
      textMuted: '#a08060',
    },
    background: {
      type: 'image',
      value: '/backgrounds/steampunk.jpg',
      overlay: true,
      overlayOpacity: 0.5,
    },
    cardLayout: 'detailed',
    hoverEffect: 'tilt',
    fontFamily: '"IM Fell English", serif',
    glassmorphism: false,
    borderRadius: 'sm',
    showParticles: true,
    particleType: 'gear',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  synthwave: {
    name: 'Synthwave',
    preset: 'synthwave',
    colors: {
      primary: '#ff6ec7',
      secondary: '#7b68ee',
      accent: '#00ffff',
      background: '#0d0221',
      surface: '#1a0533',
      text: '#ffffff',
      textMuted: '#ff6ec7',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #0d0221, #1a0533, #2d0a4e)',
      overlay: false,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Audiowide", cursive',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'grid',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  vaporwave: {
    name: 'Vaporwave',
    preset: 'vaporwave',
    colors: {
      primary: '#ff71ce',
      secondary: '#01cdfe',
      accent: '#05ffa1',
      background: '#2d1b69',
      surface: '#3d2080',
      text: '#fffb96',
      textMuted: '#b967ff',
    },
    background: {
      type: 'animated',
      value: 'vaporwave-grid',
      overlay: false,
    },
    cardLayout: 'detailed',
    hoverEffect: 'tilt',
    fontFamily: '"VT323", monospace',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'star',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  gothic: {
    name: 'Gothic',
    preset: 'gothic',
    colors: {
      primary: '#8b0000',
      secondary: '#4a0000',
      accent: '#daa520',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#e8e8e8',
      textMuted: '#808080',
    },
    background: {
      type: 'image',
      value: '/backgrounds/gothic.jpg',
      overlay: true,
      overlayOpacity: 0.7,
    },
    cardLayout: 'detailed',
    hoverEffect: 'glow',
    fontFamily: '"UnifrakturMaguntia", cursive',
    glassmorphism: false,
    borderRadius: 'sm',
    showParticles: true,
    particleType: 'void',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  kawaii: {
    name: 'Kawaii',
    preset: 'kawaii',
    colors: {
      primary: '#ff69b4',
      secondary: '#ffb6c1',
      accent: '#87ceeb',
      background: '#fff0f5',
      surface: '#ffe4e1',
      text: '#ff1493',
      textMuted: '#db7093',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #fff0f5, #ffe4e1, #e6e6fa)',
      overlay: false,
    },
    cardLayout: 'compact',
    hoverEffect: 'scale',
    fontFamily: '"Fredoka One", cursive',
    glassmorphism: false,
    borderRadius: 'full',
    showParticles: true,
    particleType: 'heart',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  industrial: {
    name: 'Industrial',
    preset: 'industrial',
    colors: {
      primary: '#737373',
      secondary: '#525252',
      accent: '#f59e0b',
      background: '#171717',
      surface: '#262626',
      text: '#e5e5e5',
      textMuted: '#a3a3a3',
    },
    background: {
      type: 'image',
      value: '/backgrounds/industrial.jpg',
      overlay: true,
      overlayOpacity: 0.6,
    },
    cardLayout: 'detailed',
    hoverEffect: 'scale',
    fontFamily: '"Roboto Condensed", sans-serif',
    glassmorphism: false,
    borderRadius: 'none',
    showParticles: false,
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'nature-zen': {
    name: 'Nature Zen',
    preset: 'nature-zen',
    colors: {
      primary: '#65a30d',
      secondary: '#84cc16',
      accent: '#22c55e',
      background: '#f7fee7',
      surface: '#ecfccb',
      text: '#365314',
      textMuted: '#65a30d',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #f7fee7, #ecfccb)',
      overlay: false,
    },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: '"Noto Sans JP", sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'leaf',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'abstract-art': {
    name: 'Abstract Art',
    preset: 'abstract-art',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    background: {
      type: 'animated',
      value: 'abstract-shapes',
      overlay: true,
      overlayOpacity: 0.3,
    },
    cardLayout: 'detailed',
    hoverEffect: 'tilt',
    fontFamily: '"Poppins", sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'geometric',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  'gaming-rgb': {
    name: 'Gaming RGB',
    preset: 'gaming-rgb',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: {
      type: 'animated',
      value: 'rgb-gradient',
      overlay: false,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Orbitron", sans-serif',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'spark',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  holographic: {
    name: 'Holographic',
    preset: 'holographic',
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      accent: '#22d3ee',
      background: '#030303',
      surface: '#0a0a0a',
      text: '#ffffff',
      textMuted: '#a78bfa',
    },
    background: {
      type: 'animated',
      value: 'holographic',
      overlay: false,
    },
    cardLayout: 'detailed',
    hoverEffect: 'glow',
    fontFamily: '"Exo 2", sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'star',
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: true,
  },

  custom: {
    name: 'Custom Theme',
    preset: 'custom',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#4ade80',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: { type: 'color', value: '#0f0f0f' },
    cardLayout: 'detailed',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: false,
    musicEnabled: false,
    musicAutoplay: false,
    musicVolume: 50,
    isPublic: false,
  },
};

// ==================== CARD LAYOUT PRESETS ====================

export const PROFILE_CARD_CONFIGS: Record<ProfileCardLayout, ProfileCardConfig> = {
  minimal: {
    layout: 'minimal',
    showLevel: false,
    showXp: false,
    showKarma: false,
    showStreak: false,
    showBadges: false,
    maxBadges: 0,
    showTitle: true,
    showBio: false,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  compact: {
    layout: 'compact',
    showLevel: true,
    showXp: false,
    showKarma: false,
    showStreak: false,
    showBadges: true,
    maxBadges: 3,
    showTitle: true,
    showBio: false,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  detailed: {
    layout: 'detailed',
    showLevel: true,
    showXp: true,
    showKarma: true,
    showStreak: true,
    showBadges: true,
    maxBadges: 5,
    showTitle: true,
    showBio: true,
    showStats: true,
    showRecentActivity: true,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: true,
    showSocialLinks: true,
  },
  gaming: {
    layout: 'gaming',
    showLevel: true,
    showXp: true,
    showKarma: false,
    showStreak: true,
    showBadges: true,
    maxBadges: 5,
    showTitle: true,
    showBio: false,
    showStats: true,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: true,
    showSocialLinks: false,
  },
  social: {
    layout: 'social',
    showLevel: false,
    showXp: false,
    showKarma: true,
    showStreak: false,
    showBadges: true,
    maxBadges: 3,
    showTitle: true,
    showBio: true,
    showStats: false,
    showRecentActivity: true,
    showMutualFriends: true,
    showForumsInCommon: true,
    showAchievements: false,
    showSocialLinks: true,
  },
  creator: {
    layout: 'creator',
    showLevel: true,
    showXp: false,
    showKarma: true,
    showStreak: false,
    showBadges: true,
    maxBadges: 5,
    showTitle: true,
    showBio: true,
    showStats: true,
    showRecentActivity: true,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: true,
    showSocialLinks: true,
  },
  custom: {
    layout: 'custom',
    showLevel: true,
    showXp: true,
    showKarma: true,
    showStreak: true,
    showBadges: true,
    maxBadges: 5,
    showTitle: true,
    showBio: true,
    showStats: true,
    showRecentActivity: true,
    showMutualFriends: true,
    showForumsInCommon: true,
    showAchievements: true,
    showSocialLinks: true,
  },
};

// ==================== STORE STATE ====================

export interface ProfileThemeState {
  // Current user's profile theme
  theme: ProfileTheme | null;
  cardConfig: ProfileCardConfig;
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  // Preview
  previewTheme: ProfileTheme | null;
  isPreviewMode: boolean;

  // Actions
  loadTheme: () => Promise<void>;
  saveTheme: (updates: Partial<ProfileTheme>) => Promise<void>;
  applyPreset: (preset: ProfileThemePreset) => void;
  setCardLayout: (layout: ProfileCardLayout) => void;
  updateCardConfig: (config: Partial<ProfileCardConfig>) => void;
  updateColors: (colors: Partial<ProfileThemeColors>) => void;
  updateBackground: (background: Partial<ProfileBackground>) => void;
  setPreviewTheme: (theme: ProfileTheme | null) => void;
  togglePreviewMode: () => void;
  clearError: () => void;
}

// ==================== STORE IMPLEMENTATION ====================

export const useProfileThemeStore = create<ProfileThemeState>()(
  persist(
    (set, get) => ({
      theme: null,
      cardConfig: PROFILE_CARD_CONFIGS.detailed,
      isLoading: false,
      isSaving: false,
      error: null,
      previewTheme: null,
      isPreviewMode: false,

      loadTheme: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/v1/users/me/profile-theme');
          const theme = response.data;
          const cardConfig = PROFILE_CARD_CONFIGS[theme.cardLayout] || PROFILE_CARD_CONFIGS.detailed;
          set({ theme, cardConfig, isLoading: false });
        } catch (error) {
          // Use default theme
          const defaultTheme: ProfileTheme = {
            id: 'default',
            ...PROFILE_THEME_PRESETS['minimalist-dark'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ theme: defaultTheme, isLoading: false });
        }
      },

      saveTheme: async (updates: Partial<ProfileTheme>) => {
        const { theme } = get();
        if (!theme) return;

        set({ isSaving: true, error: null });
        try {
          const updatedTheme = {
            ...theme,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          await api.put('/api/v1/users/me/profile-theme', updatedTheme);
          set({ theme: updatedTheme, isSaving: false });
        } catch (error) {
          // Apply optimistically
          set((state) => ({
            theme: state.theme ? { ...state.theme, ...updates } : null,
            isSaving: false,
          }));
        }
      },

      applyPreset: (preset: ProfileThemePreset) => {
        const { theme } = get();
        const presetTheme = PROFILE_THEME_PRESETS[preset];
        const cardConfig = PROFILE_CARD_CONFIGS[presetTheme.cardLayout];

        set({
          theme: theme
            ? {
                ...theme,
                ...presetTheme,
                preset,
                id: theme.id,
                createdAt: theme.createdAt,
                updatedAt: new Date().toISOString(),
              }
            : {
                id: 'new',
                ...presetTheme,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
          cardConfig,
        });
      },

      setCardLayout: (layout: ProfileCardLayout) => {
        const cardConfig = PROFILE_CARD_CONFIGS[layout];
        set((state) => ({
          theme: state.theme ? { ...state.theme, cardLayout: layout } : null,
          cardConfig,
        }));
      },

      updateCardConfig: (config: Partial<ProfileCardConfig>) => {
        set((state) => ({
          cardConfig: { ...state.cardConfig, ...config },
          theme: state.theme ? { ...state.theme, cardLayout: 'custom' } : null,
        }));
      },

      updateColors: (colors: Partial<ProfileThemeColors>) => {
        set((state) => ({
          theme: state.theme
            ? {
                ...state.theme,
                colors: { ...state.theme.colors, ...colors },
                preset: 'custom',
              }
            : null,
        }));
      },

      updateBackground: (background: Partial<ProfileBackground>) => {
        set((state) => ({
          theme: state.theme
            ? {
                ...state.theme,
                background: { ...state.theme.background, ...background },
              }
            : null,
        }));
      },

      setPreviewTheme: (previewTheme: ProfileTheme | null) => {
        set({ previewTheme, isPreviewMode: previewTheme !== null });
      },

      togglePreviewMode: () => {
        set((state) => ({ isPreviewMode: !state.isPreviewMode }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cgraph-profile-theme',
      partialize: (state) => ({
        theme: state.theme,
        cardConfig: state.cardConfig,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const useActiveProfileTheme = () =>
  useProfileThemeStore((state) => (state.isPreviewMode ? state.previewTheme : state.theme));

export const useProfileCardConfig = () => useProfileThemeStore((state) => state.cardConfig);

export default useProfileThemeStore;
