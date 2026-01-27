/**
 * Customization Store V2 - Scalable for millions of users
 *
 * This store manages all user customization preferences with:
 * - Optimistic updates for instant feedback
 * - Debounced saves to reduce API calls
 * - Local caching with persistence
 * - Real-time sync capability
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

// Simple debounce utility (no lodash dependency)
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// =============================================================================
// TYPES
// =============================================================================

export type ThemePreset =
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'gold'
  | 'crimson'
  | 'arctic';
export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
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
export type ChatBubbleStyle = 'default' | 'rounded' | 'sharp' | 'cloud' | 'modern' | 'retro';
export type ProfileCardStyle =
  | 'default'
  | 'minimal'
  | 'detailed'
  | 'compact'
  | 'expanded'
  | 'gaming'
  | 'card'
  | 'full'
  | 'premium';
export type BubbleAnimation = 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

// Main customization state interface
export interface CustomizationStateV2 {
  // === Theme Settings ===
  themePreset: ThemePreset;
  effectPreset: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
  animatedBackground: boolean;

  // === Avatar Settings ===
  avatarBorderType: AvatarBorderType;
  avatarBorderColor: ThemePreset;
  avatarSize: 'small' | 'medium' | 'large';
  selectedBorderTheme: string | null;
  selectedBorderId: string | null;

  // === Chat Settings ===
  chatBubbleStyle: ChatBubbleStyle;
  chatBubbleColor: ThemePreset;
  bubbleBorderRadius: number;
  bubbleShadowIntensity: number;
  bubbleEntranceAnimation: BubbleAnimation;
  bubbleGlassEffect: boolean;
  bubbleShowTail: boolean;
  bubbleHoverEffect: boolean;
  groupMessages: boolean;
  showTimestamps: boolean;
  compactMode: boolean;

  // === Profile Settings ===
  profileCardStyle: ProfileCardStyle;
  selectedProfileThemeId: string | null;
  showBadges: boolean;
  showBio: boolean;
  showStatus: boolean;
  glowEffects: boolean;
  particleEffects: boolean;

  // === Title & Badges ===
  equippedTitle: string | null;
  equippedBadges: string[];

  // === Loading/Sync State ===
  isLoading: boolean;
  isSaving: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  isDirty: boolean;
}

interface CustomizationActions {
  updateSettings: (updates: Partial<CustomizationStateV2>) => void;

  // Theme actions
  setTheme: (preset: ThemePreset) => void;
  setEffect: (preset: EffectPreset) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleBlur: () => void;
  toggleAnimatedBackground: () => void;

  // Avatar actions
  setAvatarBorder: (type: AvatarBorderType) => void;
  setAvatarBorderColor: (color: ThemePreset) => void;
  setAvatarSize: (size: 'small' | 'medium' | 'large') => void;
  selectBorderTheme: (theme: string | null) => void;
  selectBorderId: (id: string | null) => void;

  // Chat actions
  setChatBubbleStyle: (style: ChatBubbleStyle) => void;
  setChatBubbleColor: (color: ThemePreset) => void;
  setBubbleBorderRadius: (radius: number) => void;
  setBubbleShadowIntensity: (intensity: number) => void;
  setBubbleAnimation: (animation: BubbleAnimation) => void;
  toggleBubbleGlass: () => void;
  toggleBubbleTail: () => void;
  toggleBubbleHover: () => void;
  toggleGroupMessages: () => void;
  toggleTimestamps: () => void;
  toggleCompactMode: () => void;

  // Profile actions
  setProfileCardStyle: (style: ProfileCardStyle) => void;
  setProfileTheme: (themeId: string | null) => void;
  toggleBadges: () => void;
  toggleBio: () => void;
  toggleStatus: () => void;
  toggleGlowEffects: () => void;
  toggleParticleEffects: () => void;
  setEquippedTitle: (titleId: string | null) => void;
  setEquippedBadges: (badgeIds: string[]) => void;
  resetToDefaults: () => void;

  // Sync actions
  fetchCustomizations: (userId: string) => Promise<void>;
  saveCustomizations: (userId: string) => Promise<void>;
  reset: () => void;
}

export type CustomizationStore = CustomizationStateV2 & CustomizationActions;

// =============================================================================
// THEME COLOR DEFINITIONS
// =============================================================================

export const themeColors: Record<ThemePreset, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
  },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.5)', name: 'Cyan' },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
  },
  pink: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236, 72, 153, 0.5)', name: 'Pink' },
  gold: { primary: '#eab308', secondary: '#facc15', glow: 'rgba(234, 179, 8, 0.5)', name: 'Gold' },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
  },
};

// =============================================================================
// AVATAR BORDER DEFINITIONS
// =============================================================================

export const avatarBorders: Record<
  AvatarBorderType,
  { name: string; description: string; premium: boolean; rarity?: string }
> = {
  none: { name: 'None', description: 'No border', premium: false },
  static: { name: 'Static', description: 'Simple colored border', premium: false },
  glow: { name: 'Glow', description: 'Soft glowing effect', premium: false },
  pulse: { name: 'Pulse', description: 'Rhythmic pulsing glow', premium: false },
  rotate: { name: 'Orbit', description: 'Rotating gradient ring', premium: true, rarity: 'Rare' },
  fire: { name: 'Inferno', description: 'Animated flame effect', premium: true, rarity: 'Epic' },
  ice: { name: 'Frost', description: 'Crystalline ice particles', premium: true, rarity: 'Epic' },
  electric: {
    name: 'Storm',
    description: 'Electric sparks and arcs',
    premium: true,
    rarity: 'Epic',
  },
  legendary: {
    name: 'Legendary',
    description: 'Multi-layered animated aura',
    premium: true,
    rarity: 'Legendary',
  },
  mythic: {
    name: 'Mythic',
    description: 'Reality-bending void effect',
    premium: true,
    rarity: 'Mythic',
  },
};

export const rarityColors: Record<string, string> = {
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};

// =============================================================================
// DEFAULT STATE
// =============================================================================

const defaultState: CustomizationStateV2 = {
  themePreset: 'emerald',
  effectPreset: 'glassmorphism',
  animationSpeed: 'normal',
  particlesEnabled: true,
  glowEnabled: true,
  blurEnabled: true,
  animatedBackground: false,

  avatarBorderType: 'glow',
  avatarBorderColor: 'emerald',
  avatarSize: 'medium',
  selectedBorderTheme: null,
  selectedBorderId: null,

  chatBubbleStyle: 'default',
  chatBubbleColor: 'emerald',
  bubbleBorderRadius: 16,
  bubbleShadowIntensity: 30,
  bubbleEntranceAnimation: 'fade',
  bubbleGlassEffect: true,
  bubbleShowTail: true,
  bubbleHoverEffect: true,
  groupMessages: true,
  showTimestamps: true,
  compactMode: false,

  profileCardStyle: 'default',
  selectedProfileThemeId: null,
  showBadges: true,
  showBio: true,
  showStatus: true,
  glowEffects: true,
  particleEffects: false,

  equippedTitle: null,
  equippedBadges: [],

  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
  isDirty: false,
};

// =============================================================================
// DEBOUNCED SAVE FUNCTION
// =============================================================================

let saveInProgress = false;

const debouncedSave = debounce(
  async (
    userId: string,
    state: CustomizationStateV2,
    set: (partial: Partial<CustomizationStore>) => void
  ) => {
    if (saveInProgress) return;
    saveInProgress = true;
    set({ isSaving: true, error: null });

    try {
      const payload = {
        theme_preset: state.themePreset,
        effect_preset: state.effectPreset,
        animation_speed: state.animationSpeed,
        particles_enabled: state.particlesEnabled,
        glow_enabled: state.glowEnabled,
        blur_enabled: state.blurEnabled,
        animated_background: state.animatedBackground,
        avatar_border_type: state.avatarBorderType,
        avatar_border_color: state.avatarBorderColor,
        avatar_size: state.avatarSize,
        selected_border_theme: state.selectedBorderTheme,
        selected_border_id: state.selectedBorderId,
        chat_bubble_style: state.chatBubbleStyle,
        chat_bubble_color: state.chatBubbleColor,
        bubble_border_radius: state.bubbleBorderRadius,
        bubble_shadow_intensity: state.bubbleShadowIntensity,
        bubble_entrance_animation: state.bubbleEntranceAnimation,
        bubble_glass_effect: state.bubbleGlassEffect,
        bubble_show_tail: state.bubbleShowTail,
        bubble_hover_effect: state.bubbleHoverEffect,
        group_messages: state.groupMessages,
        show_timestamps: state.showTimestamps,
        compact_mode: state.compactMode,
        profile_card_style: state.profileCardStyle,
        selected_profile_theme_id: state.selectedProfileThemeId,
        show_badges: state.showBadges,
        show_bio: state.showBio,
        show_status: state.showStatus,
        glow_effects: state.glowEffects,
        particle_effects: state.particleEffects,
        equipped_title: state.equippedTitle,
        equipped_badges: state.equippedBadges,
      };

      await api.put(`/api/v1/users/${userId}/customizations`, payload);
      set({ isSaving: false, isDirty: false, lastSyncedAt: Date.now() });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      console.error('Failed to save customizations:', error);
      set({ isSaving: false, error: message });
    } finally {
      saveInProgress = false;
    }
  },
  1000
);

// =============================================================================
// STORE CREATION
// =============================================================================

export const useCustomizationStoreV2 = create<CustomizationStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Batch update
      updateSettings: (updates) => set({ ...updates, isDirty: true }),

      // Theme actions
      setTheme: (preset) => set({ themePreset: preset, isDirty: true }),
      setEffect: (preset) => set({ effectPreset: preset, isDirty: true }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed, isDirty: true }),
      toggleParticles: () => set((s) => ({ particlesEnabled: !s.particlesEnabled, isDirty: true })),
      toggleGlow: () => set((s) => ({ glowEnabled: !s.glowEnabled, isDirty: true })),
      toggleBlur: () => set((s) => ({ blurEnabled: !s.blurEnabled, isDirty: true })),
      toggleAnimatedBackground: () =>
        set((s) => ({ animatedBackground: !s.animatedBackground, isDirty: true })),

      // Avatar actions
      setAvatarBorder: (type) => set({ avatarBorderType: type, isDirty: true }),
      setAvatarBorderColor: (color) => set({ avatarBorderColor: color, isDirty: true }),
      setAvatarSize: (size) => set({ avatarSize: size, isDirty: true }),
      selectBorderTheme: (theme) => set({ selectedBorderTheme: theme, isDirty: true }),
      selectBorderId: (id) => set({ selectedBorderId: id, isDirty: true }),

      // Chat actions
      setChatBubbleStyle: (style) => set({ chatBubbleStyle: style, isDirty: true }),
      setChatBubbleColor: (color) => set({ chatBubbleColor: color, isDirty: true }),
      setBubbleBorderRadius: (radius) => set({ bubbleBorderRadius: radius, isDirty: true }),
      setBubbleShadowIntensity: (intensity) =>
        set({ bubbleShadowIntensity: intensity, isDirty: true }),
      setBubbleAnimation: (animation) => set({ bubbleEntranceAnimation: animation, isDirty: true }),
      toggleBubbleGlass: () =>
        set((s) => ({ bubbleGlassEffect: !s.bubbleGlassEffect, isDirty: true })),
      toggleBubbleTail: () => set((s) => ({ bubbleShowTail: !s.bubbleShowTail, isDirty: true })),
      toggleBubbleHover: () =>
        set((s) => ({ bubbleHoverEffect: !s.bubbleHoverEffect, isDirty: true })),
      toggleGroupMessages: () => set((s) => ({ groupMessages: !s.groupMessages, isDirty: true })),
      toggleTimestamps: () => set((s) => ({ showTimestamps: !s.showTimestamps, isDirty: true })),
      toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode, isDirty: true })),

      // Profile actions
      setProfileCardStyle: (style) => set({ profileCardStyle: style, isDirty: true }),
      setProfileTheme: (themeId) => set({ selectedProfileThemeId: themeId, isDirty: true }),
      toggleBadges: () => set((s) => ({ showBadges: !s.showBadges, isDirty: true })),
      toggleBio: () => set((s) => ({ showBio: !s.showBio, isDirty: true })),
      toggleStatus: () => set((s) => ({ showStatus: !s.showStatus, isDirty: true })),
      toggleGlowEffects: () => set((s) => ({ glowEffects: !s.glowEffects, isDirty: true })),
      toggleParticleEffects: () =>
        set((s) => ({ particleEffects: !s.particleEffects, isDirty: true })),
      setEquippedTitle: (titleId) => set({ equippedTitle: titleId, isDirty: true }),
      setEquippedBadges: (badgeIds) => set({ equippedBadges: badgeIds, isDirty: true }),

      resetToDefaults: () => set({ ...defaultState, isDirty: true }),

      // Sync actions
      fetchCustomizations: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get(`/api/v1/users/${userId}/customizations`);
          const data = response.data.data;

          set({
            themePreset: data.theme_preset || defaultState.themePreset,
            effectPreset: data.effect_preset || defaultState.effectPreset,
            animationSpeed: data.animation_speed || defaultState.animationSpeed,
            particlesEnabled: data.particles_enabled ?? defaultState.particlesEnabled,
            glowEnabled: data.glow_enabled ?? defaultState.glowEnabled,
            blurEnabled: data.blur_enabled ?? defaultState.blurEnabled,
            animatedBackground: data.animated_background ?? defaultState.animatedBackground,
            avatarBorderType: data.avatar_border_type || defaultState.avatarBorderType,
            avatarBorderColor: data.avatar_border_color || defaultState.avatarBorderColor,
            avatarSize: data.avatar_size || defaultState.avatarSize,
            selectedBorderTheme: data.selected_border_theme || null,
            selectedBorderId: data.selected_border_id || null,
            chatBubbleStyle: data.chat_bubble_style || defaultState.chatBubbleStyle,
            chatBubbleColor: data.chat_bubble_color || defaultState.chatBubbleColor,
            bubbleBorderRadius: data.bubble_border_radius ?? defaultState.bubbleBorderRadius,
            bubbleShadowIntensity:
              data.bubble_shadow_intensity ?? defaultState.bubbleShadowIntensity,
            bubbleEntranceAnimation:
              data.bubble_entrance_animation || defaultState.bubbleEntranceAnimation,
            bubbleGlassEffect: data.bubble_glass_effect ?? defaultState.bubbleGlassEffect,
            bubbleShowTail: data.bubble_show_tail ?? defaultState.bubbleShowTail,
            bubbleHoverEffect: data.bubble_hover_effect ?? defaultState.bubbleHoverEffect,
            groupMessages: data.group_messages ?? defaultState.groupMessages,
            showTimestamps: data.show_timestamps ?? defaultState.showTimestamps,
            compactMode: data.compact_mode ?? defaultState.compactMode,
            profileCardStyle: data.profile_card_style || defaultState.profileCardStyle,
            selectedProfileThemeId: data.selected_profile_theme_id || null,
            showBadges: data.show_badges ?? defaultState.showBadges,
            showBio: data.show_bio ?? defaultState.showBio,
            showStatus: data.show_status ?? defaultState.showStatus,
            glowEffects: data.glow_effects ?? defaultState.glowEffects,
            particleEffects: data.particle_effects ?? defaultState.particleEffects,
            equippedTitle: data.equipped_title || null,
            equippedBadges: data.equipped_badges || [],
            isLoading: false,
            lastSyncedAt: Date.now(),
            isDirty: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to load';
          console.error('Failed to fetch customizations:', error);
          set({ isLoading: false, error: message });
        }
      },

      saveCustomizations: async (userId: string) => {
        const state = get();
        debouncedSave(userId, state, set);
      },

      reset: () => set(defaultState),
    }),
    {
      name: 'cgraph-customization-v2',
      storage: createJSONStorage(() => {
        // Safe localStorage wrapper
        return {
          getItem: (name: string): string | null => {
            try {
              return localStorage.getItem(name);
            } catch (error) {
              console.warn('[CustomizationV2] Failed to read from localStorage:', error);
              return null;
            }
          },
          setItem: (name: string, value: string): void => {
            try {
              localStorage.setItem(name, value);
            } catch (error) {
              console.warn('[CustomizationV2] Failed to write to localStorage:', error);
            }
          },
          removeItem: (name: string): void => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.warn('[CustomizationV2] Failed to remove from localStorage:', error);
            }
          },
        };
      }),
      partialize: (state) => ({
        themePreset: state.themePreset,
        effectPreset: state.effectPreset,
        animationSpeed: state.animationSpeed,
        particlesEnabled: state.particlesEnabled,
        glowEnabled: state.glowEnabled,
        blurEnabled: state.blurEnabled,
        animatedBackground: state.animatedBackground,
        avatarBorderType: state.avatarBorderType,
        avatarBorderColor: state.avatarBorderColor,
        avatarSize: state.avatarSize,
        selectedBorderTheme: state.selectedBorderTheme,
        selectedBorderId: state.selectedBorderId,
        chatBubbleStyle: state.chatBubbleStyle,
        chatBubbleColor: state.chatBubbleColor,
        bubbleBorderRadius: state.bubbleBorderRadius,
        bubbleShadowIntensity: state.bubbleShadowIntensity,
        bubbleEntranceAnimation: state.bubbleEntranceAnimation,
        bubbleGlassEffect: state.bubbleGlassEffect,
        bubbleShowTail: state.bubbleShowTail,
        bubbleHoverEffect: state.bubbleHoverEffect,
        groupMessages: state.groupMessages,
        showTimestamps: state.showTimestamps,
        compactMode: state.compactMode,
        profileCardStyle: state.profileCardStyle,
        selectedProfileThemeId: state.selectedProfileThemeId,
        showBadges: state.showBadges,
        showBio: state.showBio,
        showStatus: state.showStatus,
        glowEffects: state.glowEffects,
        particleEffects: state.particleEffects,
        equippedTitle: state.equippedTitle,
        equippedBadges: state.equippedBadges,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS (for performance optimization)
// =============================================================================

export const useThemeSettings = () =>
  useCustomizationStoreV2((state) => ({
    themePreset: state.themePreset,
    effectPreset: state.effectPreset,
    animationSpeed: state.animationSpeed,
    particlesEnabled: state.particlesEnabled,
    glowEnabled: state.glowEnabled,
    blurEnabled: state.blurEnabled,
    animatedBackground: state.animatedBackground,
    colors: themeColors[state.themePreset],
  }));

export const useAvatarSettings = () =>
  useCustomizationStoreV2((state) => ({
    avatarBorderType: state.avatarBorderType,
    avatarBorderColor: state.avatarBorderColor,
    avatarSize: state.avatarSize,
    selectedBorderTheme: state.selectedBorderTheme,
    selectedBorderId: state.selectedBorderId,
    colors: themeColors[state.avatarBorderColor],
  }));

export const useChatSettings = () =>
  useCustomizationStoreV2((state) => ({
    chatBubbleStyle: state.chatBubbleStyle,
    chatBubbleColor: state.chatBubbleColor,
    bubbleBorderRadius: state.bubbleBorderRadius,
    bubbleShadowIntensity: state.bubbleShadowIntensity,
    bubbleEntranceAnimation: state.bubbleEntranceAnimation,
    bubbleGlassEffect: state.bubbleGlassEffect,
    bubbleShowTail: state.bubbleShowTail,
    bubbleHoverEffect: state.bubbleHoverEffect,
    groupMessages: state.groupMessages,
    showTimestamps: state.showTimestamps,
    compactMode: state.compactMode,
    colors: themeColors[state.chatBubbleColor],
  }));

export const useProfileSettings = () =>
  useCustomizationStoreV2((state) => ({
    profileCardStyle: state.profileCardStyle,
    selectedProfileThemeId: state.selectedProfileThemeId,
    showBadges: state.showBadges,
    showBio: state.showBio,
    showStatus: state.showStatus,
    equippedTitle: state.equippedTitle,
    equippedBadges: state.equippedBadges,
  }));

export const useSyncState = () =>
  useCustomizationStoreV2((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isSyncing: state.isSaving,
    isDirty: state.isDirty,
    lastSyncedAt: state.lastSyncedAt ? new Date(state.lastSyncedAt) : null,
    error: state.error,
  }));
