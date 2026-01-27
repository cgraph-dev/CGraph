import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import type { BorderTheme } from '@/types/avatar-borders';

/**
 * Global Theme Store
 *
 * Manages user's global theme preferences across the entire application.
 * Themes apply to:
 * - Avatar borders
 * - Chat bubbles (DMs, groups, forums)
 * - Profile cards
 * - Authentication pages
 * - Forum posts and comments
 *
 * Each user's theme is their personal identity - visible to others but not changeable by them.
 */

// Theme color presets
export type ThemeColorPreset =
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

// Avatar border types
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

// Chat bubble styles
export type ChatBubbleStylePreset =
  | 'default'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'bubble'
  | 'glassmorphism';

// Effect presets
export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

// Animation speed
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

// Profile theme configuration
export interface ProfileTheme {
  id: string;
  name: string;
  icon: string;
  tier: 'free' | 'premium' | 'elite';
  background: {
    type: 'gradient' | 'animated' | 'static';
    colors: string[];
  };
  effects: {
    particles?: {
      count: number;
      type: 'pixel' | 'petal' | 'stars' | 'energy' | 'smoke' | 'neon';
      behavior: 'float' | 'cascade' | 'rain' | 'burst';
    };
    overlay?: 'scanlines' | 'holographic' | 'none';
    glow: string;
  };
  previewDescription: string;
}

// Complete user theme configuration
export interface UserTheme {
  // Color theme
  colorPreset: ThemeColorPreset;
  customPrimaryColor?: string;
  customSecondaryColor?: string;
  customGlowColor?: string;

  // Avatar customization
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ThemeColorPreset;
  avatarSize: 'small' | 'medium' | 'large';
  selectedBorderTheme?: BorderTheme;
  selectedBorderId?: string; // Specific themed border ID

  // Chat bubble customization
  chatBubbleStyle: ChatBubbleStylePreset;
  chatBubbleColor: ThemeColorPreset;
  bubbleBorderRadius: number; // 0-50px
  bubbleShadowIntensity: number; // 0-100%
  bubbleEntranceAnimation: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  bubbleGlassEffect: boolean;
  bubbleShowTail: boolean;
  bubbleHoverEffect: boolean;

  // Profile theme
  selectedProfileThemeId?: string;
  profileCardStyle: 'minimal' | 'detailed' | 'compact' | 'expanded' | 'gaming';
  showBadges: boolean;
  showStatus: boolean;

  // Global effects
  effect: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
  animatedBackground: boolean;

  // Advanced customization
  customCSS?: string;

  // Metadata
  isPremium: boolean;
  lastUpdated: string;
}

// Default theme
const defaultTheme: UserTheme = {
  colorPreset: 'emerald',
  avatarBorder: 'glow',
  avatarBorderColor: 'emerald',
  avatarSize: 'medium',
  chatBubbleStyle: 'default',
  chatBubbleColor: 'emerald',
  bubbleBorderRadius: 16,
  bubbleShadowIntensity: 20,
  bubbleEntranceAnimation: 'slide',
  bubbleGlassEffect: false,
  bubbleShowTail: true,
  bubbleHoverEffect: true,
  profileCardStyle: 'detailed',
  showBadges: true,
  showStatus: true,
  effect: 'glassmorphism',
  animationSpeed: 'normal',
  particlesEnabled: true,
  glowEnabled: true,
  blurEnabled: true,
  animatedBackground: false,
  isPremium: false,
  lastUpdated: new Date().toISOString(),
};

// Theme color definitions
export const THEME_COLORS: Record<
  ThemeColorPreset,
  {
    primary: string;
    secondary: string;
    glow: string;
    name: string;
    gradient: string;
  }
> = {
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

interface ThemeStore {
  // Current theme
  theme: UserTheme;

  // Actions
  updateTheme: (updates: Partial<UserTheme>) => void;
  setColorPreset: (preset: ThemeColorPreset) => void;
  setAvatarBorder: (border: AvatarBorderType, color?: ThemeColorPreset) => void;
  setChatBubbleStyle: (style: ChatBubbleStylePreset, color?: ThemeColorPreset) => void;
  setEffect: (effect: EffectPreset) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleBlur: () => void;
  toggleAnimatedBackground: () => void;

  // Theme management
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (json: string) => boolean;
  applyPreset: (preset: 'minimal' | 'modern' | 'vibrant' | 'elegant' | 'gaming') => void;

  // Sync with backend
  syncWithServer: (userId: string) => Promise<void>;
  saveToServer: (userId: string) => Promise<void>;

  // Helper methods
  getThemeColors: () => (typeof THEME_COLORS)[ThemeColorPreset];
  getChatBubbleCSS: () => Record<string, string>;
  getAvatarBorderCSS: () => Record<string, string>;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,

      updateTheme: (updates) => {
        set((state) => ({
          theme: {
            ...state.theme,
            ...updates,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      setColorPreset: (preset) => {
        set((state) => ({
          theme: {
            ...state.theme,
            colorPreset: preset,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      setAvatarBorder: (border, color) => {
        set((state) => ({
          theme: {
            ...state.theme,
            avatarBorder: border,
            ...(color && { avatarBorderColor: color }),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      setChatBubbleStyle: (style, color) => {
        set((state) => ({
          theme: {
            ...state.theme,
            chatBubbleStyle: style,
            ...(color && { chatBubbleColor: color }),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      setEffect: (effect) => {
        set((state) => ({
          theme: {
            ...state.theme,
            effect,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      setAnimationSpeed: (speed) => {
        set((state) => ({
          theme: {
            ...state.theme,
            animationSpeed: speed,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      toggleParticles: () => {
        set((state) => ({
          theme: {
            ...state.theme,
            particlesEnabled: !state.theme.particlesEnabled,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      toggleGlow: () => {
        set((state) => ({
          theme: {
            ...state.theme,
            glowEnabled: !state.theme.glowEnabled,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      toggleBlur: () => {
        set((state) => ({
          theme: {
            ...state.theme,
            blurEnabled: !state.theme.blurEnabled,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      toggleAnimatedBackground: () => {
        set((state) => ({
          theme: {
            ...state.theme,
            animatedBackground: !state.theme.animatedBackground,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      resetTheme: () => {
        set({ theme: { ...defaultTheme, lastUpdated: new Date().toISOString() } });
      },

      exportTheme: () => {
        return JSON.stringify(get().theme, null, 2);
      },

      importTheme: (json) => {
        try {
          const imported = JSON.parse(json);
          set({
            theme: {
              ...defaultTheme,
              ...imported,
              lastUpdated: new Date().toISOString(),
            },
          });
          return true;
        } catch (error) {
          console.error('Failed to import theme:', error);
          return false;
        }
      },

      applyPreset: (preset) => {
        const presets: Record<string, Partial<UserTheme>> = {
          minimal: {
            colorPreset: 'arctic',
            avatarBorder: 'static',
            chatBubbleStyle: 'sharp',
            effect: 'minimal',
            particlesEnabled: false,
            glowEnabled: false,
            blurEnabled: false,
            animatedBackground: false,
            bubbleGlassEffect: false,
            bubbleShowTail: false,
          },
          modern: {
            colorPreset: 'purple',
            avatarBorder: 'pulse',
            chatBubbleStyle: 'modern',
            effect: 'glassmorphism',
            particlesEnabled: true,
            glowEnabled: true,
            blurEnabled: true,
            animatedBackground: false,
            bubbleGlassEffect: true,
            bubbleShowTail: false,
          },
          vibrant: {
            colorPreset: 'pink',
            avatarBorder: 'electric',
            chatBubbleStyle: 'bubble',
            effect: 'neon',
            particlesEnabled: true,
            glowEnabled: true,
            blurEnabled: false,
            animatedBackground: true,
            bubbleGlassEffect: false,
            bubbleShowTail: true,
          },
          elegant: {
            colorPreset: 'gold',
            avatarBorder: 'legendary',
            chatBubbleStyle: 'rounded',
            effect: 'aurora',
            particlesEnabled: true,
            glowEnabled: true,
            blurEnabled: true,
            animatedBackground: true,
            bubbleGlassEffect: true,
            bubbleShowTail: false,
          },
          gaming: {
            colorPreset: 'crimson',
            avatarBorder: 'mythic',
            chatBubbleStyle: 'sharp',
            effect: 'cyberpunk',
            particlesEnabled: true,
            glowEnabled: true,
            blurEnabled: false,
            animatedBackground: true,
            bubbleGlassEffect: false,
            bubbleShowTail: true,
            profileCardStyle: 'gaming',
          },
        };

        const presetTheme = presets[preset];
        if (presetTheme) {
          set((state) => ({
            theme: {
              ...state.theme,
              ...presetTheme,
              lastUpdated: new Date().toISOString(),
            },
          }));
        }
      },

      syncWithServer: async (userId) => {
        try {
          // TODO: Implement API call to fetch user theme from server
          console.debug('Syncing theme with server for user:', userId);
          // const response = await api.get(`/api/v1/users/${userId}/theme`);
          // if (response.data) {
          //   set({ theme: { ...defaultTheme, ...response.data } });
          // }
        } catch (error) {
          console.error('Failed to sync theme with server:', error);
        }
      },

      saveToServer: async (userId) => {
        try {
          // TODO: Implement API call to save user theme to server
          console.debug('Saving theme to server for user:', userId);
          // await api.put(`/api/v1/users/${userId}/theme`, get().theme);
        } catch (error) {
          console.error('Failed to save theme to server:', error);
        }
      },

      getThemeColors: () => {
        const { theme } = get();
        return THEME_COLORS[theme.colorPreset];
      },

      getChatBubbleCSS: () => {
        const { theme } = get();
        const colors = THEME_COLORS[theme.chatBubbleColor];

        return {
          backgroundColor: colors.primary,
          borderRadius: `${theme.bubbleBorderRadius}px`,
          boxShadow:
            theme.bubbleShadowIntensity > 0
              ? `0 2px ${theme.bubbleShadowIntensity}px ${colors.glow}`
              : 'none',
          backdropFilter: theme.bubbleGlassEffect ? 'blur(10px)' : 'none',
        };
      },

      getAvatarBorderCSS: () => {
        const { theme } = get();
        const colors = THEME_COLORS[theme.avatarBorderColor];

        return {
          borderColor: colors.primary,
          boxShadow: theme.glowEnabled ? `0 0 20px ${colors.glow}` : 'none',
        };
      },
    }),
    {
      name: 'cgraph-user-theme',
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
