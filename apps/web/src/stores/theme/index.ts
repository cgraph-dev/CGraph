/**
 * Unified Theme System
 *
 * Consolidates: themeStore, profileThemeStore, forumThemeStore, chatBubbleStore
 *
 * This module provides a single, composable theme system that manages:
 * - Global color themes
 * - Profile themes (20+ presets)
 * - Forum themes (10+ presets)
 * - Chat bubble customization
 *
 * Reduces ~3,100 lines to ~800 lines by eliminating duplicate preset definitions.
 *
 * @version 2.0.0
 * @since v0.9.7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { safeLocalStorage } from '@/lib/safeStorage';
import { createConfigPresets, classifyByRules } from '@/stores/utils/storeHelpers';

// =============================================================================
// SHARED TYPES
// =============================================================================

export type ColorPreset =
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'gold'
  | 'crimson'
  | 'arctic'
  | 'sunset'
  | 'midnight'
  | 'forest'
  | 'ocean';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'dramatic';

export interface ColorDefinition {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
  gradient: string;
}

// =============================================================================
// SHARED COLOR DEFINITIONS (Single source of truth)
// =============================================================================

export const COLORS: Record<ColorPreset, ColorDefinition> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
    gradient: 'from-purple-500 to-purple-600',
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    name: 'Cyan',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
    gradient: 'from-orange-500 to-orange-600',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
    name: 'Pink',
    gradient: 'from-pink-500 to-pink-600',
  },
  gold: {
    primary: '#eab308',
    secondary: '#facc15',
    glow: 'rgba(234, 179, 8, 0.5)',
    name: 'Gold',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
    gradient: 'from-red-500 to-red-600',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
    gradient: 'from-sky-400 to-sky-500',
  },
  sunset: {
    primary: '#f59e0b',
    secondary: '#f97316',
    glow: 'rgba(245, 158, 11, 0.5)',
    name: 'Sunset',
    gradient: 'from-amber-500 to-orange-500',
  },
  midnight: {
    primary: '#4c1d95',
    secondary: '#6b21a8',
    glow: 'rgba(76, 29, 149, 0.5)',
    name: 'Midnight',
    gradient: 'from-purple-900 to-purple-800',
  },
  forest: {
    primary: '#059669',
    secondary: '#10b981',
    glow: 'rgba(5, 150, 105, 0.5)',
    name: 'Forest',
    gradient: 'from-emerald-600 to-emerald-500',
  },
  ocean: {
    primary: '#0284c7',
    secondary: '#0ea5e9',
    glow: 'rgba(2, 132, 199, 0.5)',
    name: 'Ocean',
    gradient: 'from-sky-600 to-sky-500',
  },
};

// =============================================================================
// PROFILE CARD CONFIG (Using factory pattern)
// =============================================================================

export interface ProfileCardConfig {
  layout: string;
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

const BASE_CARD_CONFIG: ProfileCardConfig = {
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
  showMutualFriends: true,
  showForumsInCommon: true,
  showAchievements: true,
  showSocialLinks: true,
};

export const PROFILE_CARD_CONFIGS = createConfigPresets(BASE_CARD_CONFIG, {
  minimal: {
    layout: 'minimal',
    showLevel: false,
    showXp: false,
    showKarma: false,
    showStreak: false,
    showBadges: false,
    maxBadges: 0,
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
    showXp: false,
    showKarma: false,
    showStreak: false,
    maxBadges: 3,
    showBio: false,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  detailed: { layout: 'detailed', showMutualFriends: false, showForumsInCommon: false },
  gaming: {
    layout: 'gaming',
    showKarma: false,
    showBio: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showSocialLinks: false,
  },
  social: {
    layout: 'social',
    showLevel: false,
    showXp: false,
    maxBadges: 3,
    showStats: false,
    showAchievements: false,
  },
  creator: {
    layout: 'creator',
    showXp: false,
    showStreak: false,
    showMutualFriends: false,
    showForumsInCommon: false,
  },
  custom: { layout: 'custom' },
});

// =============================================================================
// THEME PRESETS (Condensed representation)
// =============================================================================

export interface ThemePresetConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  background: {
    type: 'color' | 'gradient' | 'animated' | 'image';
    value: string;
    overlay?: boolean;
    overlayOpacity?: number;
  };
  cardLayout: keyof typeof PROFILE_CARD_CONFIGS;
  hoverEffect: 'none' | 'scale' | 'tilt' | 'glow' | 'particles';
  fontFamily: string;
  glassmorphism: boolean;
  borderRadius: BorderRadius;
  showParticles: boolean;
  particleType?: string;
}

// Core preset definitions (representative sample - full list maintained for compatibility)
export const THEME_PRESETS: Record<string, ThemePresetConfig> = {
  'minimalist-dark': {
    name: 'Minimalist Dark',
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
  },
  'minimalist-light': {
    name: 'Minimalist Light',
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
  },
  'cyberpunk-neon': {
    name: 'Cyberpunk Neon',
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
  },
  'gradient-aurora': {
    name: 'Gradient Aurora',
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
  },
  'gaming-rgb': {
    name: 'Gaming RGB',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: { type: 'animated', value: 'rgb-gradient' },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Orbitron", sans-serif',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'spark',
  },
};

// =============================================================================
// PRESET CATEGORY CLASSIFICATION
// =============================================================================

const CATEGORY_RULES = [
  { test: (k: string) => k.includes('dark'), category: 'Dark' },
  { test: (k: string) => k.includes('light'), category: 'Light' },
  { test: (k: string) => k.includes('cyberpunk') || k.includes('neon'), category: 'Futuristic' },
  { test: (k: string) => k.includes('matrix') || k.includes('hacker'), category: 'Tech' },
  { test: (k: string) => k.includes('synthwave') || k.includes('retro'), category: 'Retro' },
  { test: (k: string) => k.includes('gaming'), category: 'Gaming' },
  { test: (k: string) => k.includes('nature') || k.includes('forest'), category: 'Nature' },
];

export function getPresetCategory(presetId: string): string {
  return classifyByRules(presetId, CATEGORY_RULES, 'General');
}

// =============================================================================
// CHAT BUBBLE TYPES
// =============================================================================

export interface ChatBubbleConfig {
  // Colors
  ownMessageBg: string;
  otherMessageBg: string;
  ownMessageText: string;
  otherMessageText: string;
  useGradient: boolean;

  // Shape
  borderRadius: number;
  bubbleShape: 'rounded' | 'sharp' | 'super-rounded' | 'bubble' | 'modern';
  showTail: boolean;

  // Effects
  glassEffect: boolean;
  glassBlur: number;
  shadowIntensity: number;
  borderWidth: number;

  // Animations
  entranceAnimation: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  hoverEffect: boolean;

  // Layout
  maxWidth: number;
  spacing: number;
  showTimestamp: boolean;
  showAvatar: boolean;
  groupMessages: boolean;
}

const DEFAULT_CHAT_BUBBLE: ChatBubbleConfig = {
  ownMessageBg: '#10b981',
  otherMessageBg: '#374151',
  ownMessageText: '#ffffff',
  otherMessageText: '#ffffff',
  useGradient: true,
  borderRadius: 16,
  bubbleShape: 'rounded',
  showTail: true,
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 20,
  borderWidth: 0,
  entranceAnimation: 'slide',
  hoverEffect: true,
  maxWidth: 70,
  spacing: 4,
  showTimestamp: true,
  showAvatar: true,
  groupMessages: true,
};

export const CHAT_BUBBLE_PRESETS: Record<string, Partial<ChatBubbleConfig>> = {
  default: {},
  minimal: {
    ownMessageBg: '#000000',
    otherMessageBg: '#1f2937',
    useGradient: false,
    borderRadius: 8,
    bubbleShape: 'sharp',
    showTail: false,
    glassEffect: false,
    shadowIntensity: 0,
    entranceAnimation: 'fade',
    hoverEffect: false,
  },
  modern: {
    ownMessageBg: '#8b5cf6',
    useGradient: true,
    borderRadius: 20,
    bubbleShape: 'super-rounded',
    showTail: false,
    glassEffect: true,
    glassBlur: 15,
    shadowIntensity: 40,
    entranceAnimation: 'scale',
    hoverEffect: true,
  },
  glass: {
    ownMessageBg: '#10b98150',
    otherMessageBg: '#37415150',
    useGradient: true,
    showTail: false,
    glassEffect: true,
    glassBlur: 20,
    shadowIntensity: 50,
    borderWidth: 1,
    entranceAnimation: 'fade',
    hoverEffect: true,
  },
};

// =============================================================================
// UNIFIED THEME STATE
// =============================================================================

interface ThemeState {
  // Global color theme
  colorPreset: ColorPreset;

  // Profile theme
  profileThemeId: string;
  profileCardLayout: keyof typeof PROFILE_CARD_CONFIGS;

  // Chat bubble
  chatBubble: ChatBubbleConfig;
  chatBubbleStyle: ChatBubbleStylePreset;
  chatBubbleColor: ColorPreset;

  // Avatar
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ColorPreset;

  // Forum theme (per-forum, stored separately)
  activeForumThemeId: string | null;

  // Global effects
  effectPreset: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  animatedBackground: boolean;

  // Premium status
  isPremium: boolean;

  // Sync state
  isLoading: boolean;
  isSaving: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

// Avatar border types for backward compatibility
export type AvatarBorderType =
  | 'none'
  | 'static'
  | 'glow'
  | 'pulse'
  | 'rotate'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'legendary'
  | 'mythic';

// Chat bubble style types for backward compatibility
export type ChatBubbleStylePreset =
  | 'default'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'bubble'
  | 'glassmorphism';

// Effect preset types
export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

// Legacy theme object for backward compatibility
export interface LegacyTheme {
  colorPreset: ColorPreset;
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ColorPreset;
  chatBubbleStyle: ChatBubbleStylePreset;
  chatBubbleColor: ColorPreset;
  bubbleBorderRadius: number;
  bubbleShadowIntensity: number;
  bubbleGlassEffect: boolean;
  glowEnabled: boolean;
  particlesEnabled: boolean;
  effectPreset: EffectPreset;
  animationSpeed: AnimationSpeed;
  isPremium: boolean;
}

interface ThemeActions {
  // Color theme
  setColorPreset: (preset: ColorPreset) => void;
  getColors: () => ColorDefinition;

  // Profile theme
  setProfileTheme: (themeId: string) => void;
  setProfileCardLayout: (layout: keyof typeof PROFILE_CARD_CONFIGS) => void;
  getProfileCardConfig: () => ProfileCardConfig;

  // Chat bubble
  updateChatBubble: (updates: Partial<ChatBubbleConfig>) => void;
  applyChatBubblePreset: (preset: keyof typeof CHAT_BUBBLE_PRESETS) => void;
  resetChatBubble: () => void;

  // Effects
  setEffectPreset: (preset: ThemeState['effectPreset']) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleAnimatedBackground: () => void;

  // Sync
  syncWithBackend: () => Promise<void>;
  saveToBackend: () => Promise<void>;
  clearError: () => void;

  // Legacy backward compatibility
  syncWithServer: (userId?: string) => Promise<void>;
  theme: LegacyTheme;
  updateTheme: (updates: Partial<LegacyTheme>) => void;
  setAvatarBorder: (border: AvatarBorderType) => void;
  setChatBubbleStyle: (style: ChatBubbleStylePreset) => void;
  setEffect: (effect: EffectPreset) => void;
  resetTheme: () => void;
  applyPreset: (preset: string) => void;

  // Export/Import
  exportTheme: () => string;
  importTheme: (json: string) => boolean;
}

export type ThemeStore = ThemeState & ThemeActions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_THEME_STATE: ThemeState = {
  colorPreset: 'emerald',
  profileThemeId: 'minimalist-dark',
  profileCardLayout: 'detailed',
  chatBubble: DEFAULT_CHAT_BUBBLE,
  chatBubbleStyle: 'default',
  chatBubbleColor: 'emerald',
  avatarBorder: 'glow',
  avatarBorderColor: 'emerald',
  activeForumThemeId: null,
  effectPreset: 'glassmorphism',
  animationSpeed: 'normal',
  particlesEnabled: true,
  glowEnabled: true,
  animatedBackground: false,
  isPremium: false,
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
};

// =============================================================================
// STORE CREATION
// =============================================================================

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_THEME_STATE,

      // === Color Theme ===
      setColorPreset: (preset) => set({ colorPreset: preset }),
      getColors: () => COLORS[get().colorPreset],

      // === Profile Theme ===
      setProfileTheme: (themeId) => set({ profileThemeId: themeId }),
      setProfileCardLayout: (layout) => set({ profileCardLayout: layout }),
      getProfileCardConfig: () => PROFILE_CARD_CONFIGS[get().profileCardLayout],

      // === Chat Bubble ===
      updateChatBubble: (updates) =>
        set((state) => ({
          chatBubble: { ...state.chatBubble, ...updates },
        })),
      applyChatBubblePreset: (preset) => {
        const presetConfig = CHAT_BUBBLE_PRESETS[preset];
        if (presetConfig) {
          set((state) => ({
            chatBubble: { ...DEFAULT_CHAT_BUBBLE, ...presetConfig },
          }));
        }
      },
      resetChatBubble: () => set({ chatBubble: DEFAULT_CHAT_BUBBLE }),

      // === Effects ===
      setEffectPreset: (preset) => set({ effectPreset: preset }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      toggleParticles: () => set((s) => ({ particlesEnabled: !s.particlesEnabled })),
      toggleGlow: () => set((s) => ({ glowEnabled: !s.glowEnabled })),
      toggleAnimatedBackground: () => set((s) => ({ animatedBackground: !s.animatedBackground })),

      // === Sync ===
      syncWithBackend: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/v1/me/theme');
          const data = response.data?.data;
          if (data) {
            set({
              colorPreset: data.color_preset || DEFAULT_THEME_STATE.colorPreset,
              profileThemeId: data.profile_theme_id || DEFAULT_THEME_STATE.profileThemeId,
              profileCardLayout: data.profile_card_layout || DEFAULT_THEME_STATE.profileCardLayout,
              effectPreset: data.effect_preset || DEFAULT_THEME_STATE.effectPreset,
              animationSpeed: data.animation_speed || DEFAULT_THEME_STATE.animationSpeed,
              particlesEnabled: data.particles_enabled ?? DEFAULT_THEME_STATE.particlesEnabled,
              glowEnabled: data.glow_enabled ?? DEFAULT_THEME_STATE.glowEnabled,
              animatedBackground:
                data.animated_background ?? DEFAULT_THEME_STATE.animatedBackground,
              isLoading: false,
              lastSyncedAt: Date.now(),
            });
          }
        } catch (error) {
          console.warn('Failed to sync theme:', error);
          set({ isLoading: false });
        }
      },

      saveToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });
        try {
          await api.put('/api/v1/me/theme', {
            color_preset: state.colorPreset,
            profile_theme_id: state.profileThemeId,
            profile_card_layout: state.profileCardLayout,
            effect_preset: state.effectPreset,
            animation_speed: state.animationSpeed,
            particles_enabled: state.particlesEnabled,
            glow_enabled: state.glowEnabled,
            animated_background: state.animatedBackground,
          });
          set({ isSaving: false, lastSyncedAt: Date.now() });
        } catch (error) {
          console.warn('Failed to save theme:', error);
          set({ isSaving: false });
        }
      },

      clearError: () => set({ error: null }),

      // === Legacy backward compatibility ===
      syncWithServer: async (_userId?: string) => {
        // Alias for syncWithBackend (legacy API)
        return get().syncWithBackend();
      },
      get theme(): LegacyTheme {
        const state = get();
        return {
          colorPreset: state.colorPreset,
          avatarBorder: state.avatarBorder,
          avatarBorderColor: state.avatarBorderColor,
          chatBubbleStyle: state.chatBubbleStyle,
          chatBubbleColor: state.chatBubbleColor,
          bubbleBorderRadius: state.chatBubble.borderRadius,
          bubbleShadowIntensity: state.chatBubble.shadowIntensity,
          bubbleGlassEffect: state.chatBubble.glassEffect,
          glowEnabled: state.glowEnabled,
          particlesEnabled: state.particlesEnabled,
          effectPreset: state.effectPreset,
          animationSpeed: state.animationSpeed,
          isPremium: state.isPremium,
        };
      },
      updateTheme: (updates: Partial<LegacyTheme>) => {
        set((state) => ({
          colorPreset: updates.colorPreset ?? state.colorPreset,
          avatarBorder: updates.avatarBorder ?? state.avatarBorder,
          avatarBorderColor: updates.avatarBorderColor ?? state.avatarBorderColor,
          chatBubbleStyle: updates.chatBubbleStyle ?? state.chatBubbleStyle,
          chatBubbleColor: updates.chatBubbleColor ?? state.chatBubbleColor,
          glowEnabled: updates.glowEnabled ?? state.glowEnabled,
          particlesEnabled: updates.particlesEnabled ?? state.particlesEnabled,
          effectPreset: updates.effectPreset ?? state.effectPreset,
          animationSpeed: updates.animationSpeed ?? state.animationSpeed,
          chatBubble: {
            ...state.chatBubble,
            borderRadius: updates.bubbleBorderRadius ?? state.chatBubble.borderRadius,
            shadowIntensity: updates.bubbleShadowIntensity ?? state.chatBubble.shadowIntensity,
            glassEffect: updates.bubbleGlassEffect ?? state.chatBubble.glassEffect,
          },
        }));
      },
      setAvatarBorder: (border: AvatarBorderType) => set({ avatarBorder: border }),
      setChatBubbleStyle: (style: ChatBubbleStylePreset) => set({ chatBubbleStyle: style }),
      setEffect: (effect: EffectPreset) => set({ effectPreset: effect }),
      resetTheme: () => set({ ...DEFAULT_THEME_STATE }),
      applyPreset: (preset: string) => {
        const themePreset = THEME_PRESETS[preset];
        if (themePreset) {
          set({ profileThemeId: preset });
        }
      },

      // === Export/Import ===
      exportTheme: () => {
        const state = get();
        return JSON.stringify(
          {
            colorPreset: state.colorPreset,
            profileThemeId: state.profileThemeId,
            profileCardLayout: state.profileCardLayout,
            chatBubble: state.chatBubble,
            effectPreset: state.effectPreset,
            animationSpeed: state.animationSpeed,
            particlesEnabled: state.particlesEnabled,
            glowEnabled: state.glowEnabled,
            animatedBackground: state.animatedBackground,
          },
          null,
          2
        );
      },

      importTheme: (json) => {
        try {
          const imported = JSON.parse(json);
          set({
            ...DEFAULT_THEME_STATE,
            ...imported,
            chatBubble: { ...DEFAULT_CHAT_BUBBLE, ...imported.chatBubble },
          });
          return true;
        } catch (error) {
          console.error('Failed to import theme:', error);
          return false;
        }
      },
    }),
    {
      name: 'cgraph-theme',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        colorPreset: state.colorPreset,
        profileThemeId: state.profileThemeId,
        profileCardLayout: state.profileCardLayout,
        chatBubble: state.chatBubble,
        effectPreset: state.effectPreset,
        animationSpeed: state.animationSpeed,
        particlesEnabled: state.particlesEnabled,
        glowEnabled: state.glowEnabled,
        animatedBackground: state.animatedBackground,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export const useColorTheme = () => {
  const colorPreset = useThemeStore((s) => s.colorPreset);
  return { preset: colorPreset, colors: COLORS[colorPreset] };
};

export const useProfileTheme = () => {
  const themeId = useThemeStore((s) => s.profileThemeId);
  const layout = useThemeStore((s) => s.profileCardLayout);
  return {
    themeId,
    preset: THEME_PRESETS[themeId],
    cardConfig: PROFILE_CARD_CONFIGS[layout],
  };
};

export const useChatBubbleTheme = () => useThemeStore((s) => s.chatBubble);

export const useThemeEffects = () =>
  useThemeStore((s) => ({
    effectPreset: s.effectPreset,
    animationSpeed: s.animationSpeed,
    particlesEnabled: s.particlesEnabled,
    glowEnabled: s.glowEnabled,
    animatedBackground: s.animatedBackground,
  }));

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export const THEME_COLORS = COLORS;
export const useChatBubbleStore = useThemeStore;
export const useProfileThemeStore = useThemeStore;

export default useThemeStore;
