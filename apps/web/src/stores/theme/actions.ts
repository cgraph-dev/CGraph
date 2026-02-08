/**
 * Theme Store - Action Implementations
 *
 * Contains all action logic for the unified theme store:
 * - Color / profile / chat-bubble actions
 * - Effects toggles
 * - Backend sync (save & load)
 * - Legacy backward-compatibility helpers
 * - Export / Import
 *
 * @version 2.1.0
 * @since v0.9.7
 */

import type { StateCreator } from 'zustand';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

import type {
  LegacyTheme,
  ThemeStore,
  AvatarBorderType,
  ChatBubbleStylePreset,
  EffectPreset,
} from './types';
import {
  COLORS,
  PROFILE_CARD_CONFIGS,
  THEME_PRESETS,
  CHAT_BUBBLE_PRESETS,
  DEFAULT_CHAT_BUBBLE,
  DEFAULT_THEME_STATE,
} from './presets';

const logger = createLogger('ThemeStore');

// =============================================================================
// ACTION CREATOR
// =============================================================================

/**
 * Returns all store actions.
 *
 * Designed to be spread inside the Zustand `create()` callback so the store
 * file stays small.
 */
export const createThemeActions: StateCreator<ThemeStore, [], [], ThemeStore> = (set, get) => ({
  ...DEFAULT_THEME_STATE,

  // === Color Theme ===
  setColorPreset: (preset) => set({ colorPreset: preset }),
  getColors: () => COLORS[get().colorPreset],

  // === Profile Theme ===
  setProfileTheme: (themeId) => set({ profileThemeId: themeId }),
  setProfileCardLayout: (layout) => set({ profileCardLayout: layout }),
  getProfileCardConfig: () => {
    const config = PROFILE_CARD_CONFIGS[get().profileCardLayout];
    return config ?? PROFILE_CARD_CONFIGS.minimal!;
  },

  // === Chat Bubble ===
  updateChatBubble: (updates) =>
    set((state) => ({
      chatBubble: { ...state.chatBubble, ...updates },
    })),
  applyChatBubblePreset: (preset) => {
    const presetConfig = CHAT_BUBBLE_PRESETS[preset];
    if (presetConfig) {
      set({
        chatBubble: { ...DEFAULT_CHAT_BUBBLE, ...presetConfig },
      });
    }
  },
  resetChatBubble: () => set({ chatBubble: DEFAULT_CHAT_BUBBLE }),

  // === Effects ===
  setEffectPreset: (preset) => set({ effectPreset: preset }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  toggleParticles: () => set((s) => ({ particlesEnabled: !s.particlesEnabled })),
  toggleGlow: () => set((s) => ({ glowEnabled: !s.glowEnabled })),
  toggleBlur: () =>
    set((s) => ({
      chatBubble: { ...s.chatBubble, glassEffect: !s.chatBubble.glassEffect },
    })),
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
          animatedBackground: data.animated_background ?? DEFAULT_THEME_STATE.animatedBackground,
          isLoading: false,
          lastSyncedAt: Date.now(),
        });
      }
    } catch (error) {
      logger.warn('Failed to sync theme:', error);
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
      logger.warn('Failed to save theme:', error);
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),

  // === Legacy backward compatibility ===
  syncWithServer: async (_userId?: string) => {
    return get().syncWithBackend();
  },
  get theme(): LegacyTheme {
    const state = get();
    return {
      colorPreset: state.colorPreset,
      avatarBorder: state.avatarBorder,
      avatarBorderColor: state.avatarBorderColor,
      avatarSize: state.chatBubble.avatarSize,
      chatBubbleStyle: state.chatBubbleStyle,
      chatBubbleColor: state.chatBubbleColor,
      bubbleBorderRadius: state.chatBubble.borderRadius,
      bubbleShadowIntensity: state.chatBubble.shadowIntensity,
      bubbleGlassEffect: state.chatBubble.glassEffect,
      bubbleShowTail: state.chatBubble.showTail,
      bubbleHoverEffect: state.chatBubble.hoverEffect,
      bubbleEntranceAnimation: state.chatBubble.entranceAnimation,
      glowEnabled: state.glowEnabled,
      blurEnabled: state.chatBubble.glassEffect,
      particlesEnabled: state.particlesEnabled,
      animatedBackground: state.animatedBackground,
      effectPreset: state.effectPreset,
      effect: state.effectPreset,
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
      effectPreset: updates.effectPreset ?? updates.effect ?? state.effectPreset,
      animationSpeed: updates.animationSpeed ?? state.animationSpeed,
      animatedBackground: updates.animatedBackground ?? state.animatedBackground,
      chatBubble: {
        ...state.chatBubble,
        borderRadius: updates.bubbleBorderRadius ?? state.chatBubble.borderRadius,
        shadowIntensity: updates.bubbleShadowIntensity ?? state.chatBubble.shadowIntensity,
        glassEffect:
          updates.bubbleGlassEffect ?? updates.blurEnabled ?? state.chatBubble.glassEffect,
        showTail: updates.bubbleShowTail ?? state.chatBubble.showTail,
        hoverEffect: updates.bubbleHoverEffect ?? state.chatBubble.hoverEffect,
        entranceAnimation: updates.bubbleEntranceAnimation ?? state.chatBubble.entranceAnimation,
        avatarSize: updates.avatarSize ?? state.chatBubble.avatarSize,
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
      logger.error('Failed to import theme:', error);
      return false;
    }
  },
});
