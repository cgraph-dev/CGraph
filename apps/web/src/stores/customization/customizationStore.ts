/**
 * Unified Customization Store
 *
 * Consolidates: customizationStore, customizationStoreV2, unifiedCustomizationStore
 *
 * Features:
 * - Single source of truth for all customizations
 * - Optimistic updates with rollback on error
 * - Debounced saves to reduce API calls
 * - Type-safe schema mapping (camelCase <-> snake_case)
 * - Efficient toggle/setter factories
 *
 * @version 2.0.0
 * @since v0.9.7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { safeLocalStorage } from '@/lib/safeStorage';
import {
  createToggle,
  createSchemaMapper,
  createDebouncedSave,
  type ZustandSet,
} from '@/stores/utils/storeHelpers';
import { createLogger } from '@/lib/logger';

// Re-export types and constants from the types module
export type {
  ThemePreset,
  EffectPreset,
  AnimationSpeed,
  AvatarBorderType,
  ChatBubbleStyle,
  ProfileCardStyle,
  BubbleAnimation,
  ThemeColors,
  CustomizationState,
  CustomizationStore,
} from './customizationStore.types';
export {
  THEME_COLORS,
  AVATAR_BORDERS,
  RARITY_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';

// Re-export selectors from the selectors module
export {
  useThemePreset,
  useEffectPreset,
  useAnimationSpeed,
  useParticlesEnabled,
  useGlowEnabled,
  useBlurEnabled,
  useAnimatedBackground,
  useAvatarBorderType,
  useAvatarBorderColor,
  useAvatarSize,
  useChatBubbleStyle,
  useChatBubbleColor,
  useBubbleBorderRadius,
  useBubbleGlassEffect,
  useBubbleShowTail,
  useGroupMessages,
  useShowTimestamps,
  useCompactMode,
  useProfileCardStyle,
  useShowBadges,
  useShowBio,
  useShowStatus,
  useEquippedTitle,
  useEquippedBadges,
  useIsLoading,
  useIsSaving,
  useIsDirty,
  useSyncError,
  getThemeColors,
  useChatThemeColors,
  useAvatarThemeColors,
  useChatSettings,
  useThemeSettings,
  useAvatarSettings,
  useProfileSettings,
  useSyncState,
} from './customizationStore.selectors';

import type { CustomizationState, CustomizationStore } from './customizationStore.types';
import {
  THEME_COLORS,
  AVATAR_BORDERS,
  RARITY_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';

const logger = createLogger('customizationStore');

// =============================================================================
// API SCHEMA MAPPING
// =============================================================================

const apiSchemaMapper = createSchemaMapper<CustomizationState>({
  // Theme
  themePreset: 'theme_preset',
  effectPreset: 'effect_preset',
  animationSpeed: 'animation_speed',
  particlesEnabled: 'particles_enabled',
  glowEnabled: 'glow_enabled',
  blurEnabled: 'blur_enabled',
  animatedBackground: 'animated_background',

  // Avatar
  avatarBorderType: 'avatar_border_type',
  avatarBorderColor: 'avatar_border_color',
  avatarSize: 'avatar_size',
  selectedBorderTheme: 'selected_border_theme',
  selectedBorderId: 'selected_border_id',

  // Chat
  chatBubbleStyle: 'chat_bubble_style',
  chatBubbleColor: 'chat_bubble_color',
  bubbleBorderRadius: 'bubble_border_radius',
  bubbleShadowIntensity: 'bubble_shadow_intensity',
  bubbleEntranceAnimation: 'bubble_entrance_animation',
  bubbleGlassEffect: 'bubble_glass_effect',
  bubbleShowTail: 'bubble_show_tail',
  bubbleHoverEffect: 'bubble_hover_effect',
  groupMessages: 'group_messages',
  showTimestamps: 'show_timestamps',
  compactMode: 'compact_mode',

  // Profile
  profileCardStyle: 'profile_card_style',
  selectedProfileThemeId: 'selected_profile_theme_id',
  showBadges: 'show_badges',
  showBio: 'show_bio',
  showStatus: 'show_status',
  glowEffects: 'glow_effects',
  particleEffects: 'particle_effects',

  // Identity
  equippedTitle: 'equipped_title',
  equippedBadges: 'equipped_badges',
});

// =============================================================================
// DEBOUNCED SAVE
// =============================================================================

const debouncedSave = createDebouncedSave<CustomizationStore>(
  async (state, _set) => {
    const payload = apiSchemaMapper.toApi(state);
    await api.patch('/api/v1/me/customizations', payload);
  },
  { delay: 1000 }
);

// =============================================================================
// STORE CREATION
// =============================================================================

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => {
      // Cast set to our ZustandSet type for compatibility with helper functions
      const _set = set as unknown as ZustandSet<CustomizationStore>;
      return {
        ...DEFAULT_STATE,

        // === Batch Update ===
        updateSettings: (updates) => set({ ...updates, isDirty: true }),

        // === Theme Actions ===
        setTheme: (preset) => set({ themePreset: preset, isDirty: true }),
        setEffect: (preset) => set({ effectPreset: preset, isDirty: true }),
        setAnimationSpeed: (speed) => set({ animationSpeed: speed, isDirty: true }),
        toggleParticles: createToggle(_set, 'particlesEnabled'),
        toggleGlow: createToggle(_set, 'glowEnabled'),
        toggleBlur: createToggle(_set, 'blurEnabled'),
        toggleAnimatedBackground: createToggle(_set, 'animatedBackground'),

        // === Avatar Actions ===
        setAvatarBorder: (type) =>
          set({ avatarBorderType: type, avatarBorder: type, isDirty: true }),
        setAvatarBorderColor: (color) => set({ avatarBorderColor: color, isDirty: true }),
        setAvatarSize: (size) => set({ avatarSize: size, isDirty: true }),
        selectBorderTheme: (theme) => set({ selectedBorderTheme: theme, isDirty: true }),
        selectBorderId: (id) => set({ selectedBorderId: id, isDirty: true }),

        // === Chat Actions ===
        setChatBubbleStyle: (style) =>
          set({ chatBubbleStyle: style, bubbleStyle: style, isDirty: true }),
        setChatBubbleColor: (color) =>
          set({ chatBubbleColor: color, chatTheme: color, isDirty: true }),
        setBubbleBorderRadius: (radius) => set({ bubbleBorderRadius: radius, isDirty: true }),
        setBubbleShadowIntensity: (intensity) =>
          set({ bubbleShadowIntensity: intensity, isDirty: true }),
        setBubbleAnimation: (animation) =>
          set({ bubbleEntranceAnimation: animation, messageEffect: animation, isDirty: true }),
        toggleBubbleGlass: createToggle(_set, 'bubbleGlassEffect'),
        toggleBubbleTail: createToggle(_set, 'bubbleShowTail'),
        toggleBubbleHover: createToggle(_set, 'bubbleHoverEffect'),
        toggleGroupMessages: createToggle(_set, 'groupMessages'),
        toggleTimestamps: createToggle(_set, 'showTimestamps'),
        toggleCompactMode: createToggle(_set, 'compactMode'),

        // === Profile Actions ===
        setProfileCardStyle: (style) =>
          set({ profileCardStyle: style, profileLayout: style, isDirty: true }),
        setProfileTheme: (themeId) =>
          set({ selectedProfileThemeId: themeId, profileTheme: themeId, isDirty: true }),
        toggleBadges: createToggle(_set, 'showBadges'),
        toggleBio: createToggle(_set, 'showBio'),
        toggleStatus: createToggle(_set, 'showStatus'),
        toggleGlowEffects: createToggle(_set, 'glowEffects'),
        toggleParticleEffects: createToggle(_set, 'particleEffects'),
        setEquippedTitle: (titleId) =>
          set({ equippedTitle: titleId, title: titleId, isDirty: true }),
        setEquippedBadges: (badgeIds) => set({ equippedBadges: badgeIds, isDirty: true }),

        // === Legacy Batch Update Methods ===
        updateChatStyle: (key, value) => set({ [key]: value, isDirty: true }),
        updateEffects: (key, value) => set({ [key]: value, isDirty: true }),
        updateIdentity: (key, value) => set({ [key]: value, isDirty: true }),
        updateTheme: (key, value) => set({ [key]: value, isDirty: true }),

        // === Sync Actions ===
        fetchCustomizations: async (_userId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await api.get('/api/v1/me/customizations');
            const data = response.data.data;
            const parsed = apiSchemaMapper.fromApi(data, DEFAULT_STATE);

            set({
              ...parsed,
              isLoading: false,
              lastSyncedAt: Date.now(),
              isDirty: false,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load';
            logger.error('Failed to fetch customizations:', error);
            set({ isLoading: false, error: message });
          }
        },

        saveCustomizations: async (_userId?: string) => {
          const state = get();
          debouncedSave(state, _set);
        },

        resetToDefaults: () => set({ ...DEFAULT_STATE, isDirty: true }),

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'cgraph-customization',
      storage: createJSONStorage(() => safeLocalStorage),
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
// LEGACY EXPORTS (for backward compatibility during migration)
// =============================================================================

// Re-export with old names for gradual migration
export const useCustomizationStoreV2 = useCustomizationStore;
export const themeColors = THEME_COLORS;
export const avatarBorders = AVATAR_BORDERS;
export const rarityColors = RARITY_COLORS;

// Re-export all mappings for centralized access
export * from './mappings';

export default useCustomizationStore;
