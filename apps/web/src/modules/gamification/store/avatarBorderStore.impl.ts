/**
 * Avatar border store implementation.
 * @module
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import type { BorderTheme } from '@/types/avatar-borders';
import { AVATAR_BORDERS } from '@/data/avatar-borders';

// Re-export types so existing consumers still work via this module
export type { UnlockedBorder, BorderPreference, AvatarBorderState } from './avatarBorder-types';
export { DEFAULT_PREFERENCES, DEFAULT_FILTERS } from './avatarBorder-types';

import type { AvatarBorderState } from './avatarBorder-types';
import { DEFAULT_PREFERENCES, DEFAULT_FILTERS } from './avatarBorder-types';

// Getter factories
import {
  createGetEquippedBorder,
  createGetDisplayBorder,
  createIsBorderUnlocked,
  createGetFilteredBorders,
  createGetBordersByTheme,
  createGetFreeBorders,
  createGetThemeUnlockCounts,
} from './avatarBorder-getters';

// Action factories
import {
  createInitialize,
  createEquipBorder,
  createPurchaseBorder,
  createUpdatePreferences,
  createHandleAchievementUnlock,
  createHandleEventReward,
  createFetchLottieBorders,
} from './avatarBorder-actions';

/**
 * Avatar Border Store
 *
 * Manages the complete avatar border system including:
 * - 150+ themed borders across 20+ aesthetic themes
 * - Unlock tracking (subscription, achievement, purchase, event)
 * - Equipped border state with cross-forum persistence
 * - Border preview and selection
 * - Particle effect configurations
 */

// ==================== STORE IMPLEMENTATION ====================

export const useAvatarBorderStore = create<AvatarBorderState>()(
  persist(
    (set, get) => ({
      // ==================== INITIAL STATE ====================
      allBorders: AVATAR_BORDERS,
      unlockedBorders: [
        { borderId: 'border_8bit_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_kawaii_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_elemental_water_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_gothic_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_anime_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_cyberpunk_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_japanese_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_elemental_fire_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_elemental_earth_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_elemental_air_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_cosmic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'border_gothic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
      ],
      preferences: DEFAULT_PREFERENCES,
      previewBorderId: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lottieBorders: [],
      lottieBordersFetched: false,
      filters: DEFAULT_FILTERS,

      // ==================== COMPUTED GETTERS ====================
      getEquippedBorder: createGetEquippedBorder(get),
      getDisplayBorder: createGetDisplayBorder(get),
      isBorderUnlocked: createIsBorderUnlocked(get),
      getFilteredBorders: createGetFilteredBorders(get),
      getBordersByTheme: createGetBordersByTheme(get),
      getFreeBorders: createGetFreeBorders(get),
      getThemeUnlockCounts: createGetThemeUnlockCounts(get),

      // ==================== ACTIONS ====================
      initialize: createInitialize(set, get),
      equipBorder: createEquipBorder(set, get),
      setPreviewBorder: (borderId: string | null) => set({ previewBorderId: borderId }),
      purchaseBorder: createPurchaseBorder(set, get),
      updatePreferences: createUpdatePreferences(set, get),
      setFilters: (updates: Partial<AvatarBorderState['filters']>) =>
        set((state) => ({ filters: { ...state.filters, ...updates } })),
      clearError: () => set({ error: null }),
      syncWithServer: async () => {
        const { initialize } = get();
        await initialize();
      },
      handleAchievementUnlock: createHandleAchievementUnlock(set, get),
      handleEventReward: createHandleEventReward(set, get),
      fetchLottieBorders: createFetchLottieBorders(set, get),

      reset: () =>
        set({
          allBorders: AVATAR_BORDERS,
          unlockedBorders: [
            { borderId: 'border_8bit_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_kawaii_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_elemental_water_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_gothic_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_anime_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_cyberpunk_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_japanese_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_elemental_fire_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_elemental_earth_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_elemental_air_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_cosmic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
            { borderId: 'border_gothic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
          ],
          preferences: DEFAULT_PREFERENCES,
          previewBorderId: null,
          isLoading: false,
          isSaving: false,
          error: null,
          lottieBorders: [],
          lottieBordersFetched: false,
          filters: DEFAULT_FILTERS,
        }),
    }),
    {
      name: 'cgraph-avatar-borders',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        unlockedBorders: state.unlockedBorders,
        preferences: state.preferences,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

/** Get the equipped border with full config */
export const useEquippedBorder = () => useAvatarBorderStore((state) => state.getEquippedBorder());

/** Get the display border (preview or equipped) */
export const useDisplayBorder = () => useAvatarBorderStore((state) => state.getDisplayBorder());

/** Get filtered borders based on current filters */
export const useFilteredBorders = () => useAvatarBorderStore((state) => state.getFilteredBorders());

/** Get borders for a specific theme */
export const useBordersByTheme = (theme: BorderTheme) =>
  useAvatarBorderStore((state) => state.getBordersByTheme(theme));

export default useAvatarBorderStore;
