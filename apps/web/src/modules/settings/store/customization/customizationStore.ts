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
import { createToggle, type ZustandSet } from '@/lib/storeHelpers';
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

// NOTE: Selectors are NOT re-exported here to avoid circular dependency.
// Import selectors from './customizationStore.selectors' directly, or via the barrel './index'.

import type { CustomizationStore } from './customizationStore.types';
import {
  THEME_COLORS,
  AVATAR_BORDERS,
  RARITY_COLORS,
  DEFAULT_STATE,
} from './customizationStore.types';
import { apiSchemaMapper, debouncedSave, PERSIST_PARTIALIZE } from './customizationStore.schema';

const logger = createLogger('customizationStore');

// =============================================================================
// STORE CREATION
// =============================================================================

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => {
      const _set = set as unknown as ZustandSet<CustomizationStore>; // type assertion: zustand set function type widening
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
      partialize: PERSIST_PARTIALIZE,
    }
  )
);

// =============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// =============================================================================

export const useCustomizationStoreV2 = useCustomizationStore;
export const themeColors = THEME_COLORS;
export const avatarBorders = AVATAR_BORDERS;
export const rarityColors = RARITY_COLORS;

// Re-export all mappings for centralized access
export * from './mappings';

export default useCustomizationStore;
