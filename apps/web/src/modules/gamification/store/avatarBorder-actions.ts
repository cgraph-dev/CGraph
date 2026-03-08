/**
 * Avatar border store action creators.
 * @module
 */
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { BorderUnlockType } from '@/types/avatar-borders';
import type { AvatarBorderState, BorderPreference } from './avatarBorder-types';
import { DEFAULT_PREFERENCES } from './avatarBorder-types';

const logger = createLogger('AvatarBorderStore');

/**
 * Avatar Border Store — Action Factories
 *
 * Each function receives `set` and `get` (Zustand) and returns the action implementation.
 */

type SetState = (
  partial: Partial<AvatarBorderState> | ((state: AvatarBorderState) => Partial<AvatarBorderState>)
) => void;
type GetState = () => AvatarBorderState;

// ==================== initialize ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new initialize.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createInitialize(set: SetState, _get: GetState) {
  return async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/v1/avatar-borders/unlocked');
      const data = response.data || {};

      // Fetch user preferences from customizations (stored in custom_config)
      let preferences = DEFAULT_PREFERENCES;
      try {
        const customizationRes = await api.get('/api/v1/me/customizations');
        const customConfig = customizationRes.data?.data?.custom_config || {};
        const storedPrefs = customConfig.avatar_border_preferences;
        if (storedPrefs && typeof storedPrefs === 'object') {
          preferences = { ...DEFAULT_PREFERENCES, ...storedPrefs };
        }
      } catch (prefError) {
        logger.warn('Failed to fetch avatar border preferences:', prefError);
      }

      const unlocked = data.unlocked || [];
      const equippedId = data.equipped_id || preferences.equippedBorderId;

      set({
        unlockedBorders: [
          // Always include FREE + COMMON borders
          { borderId: 'border_8bit_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_kawaii_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_elemental_water_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_gothic_free_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_anime_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_cyberpunk_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_japanese_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_elemental_fire_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_elemental_earth_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_elemental_air_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_cosmic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'border_gothic_common_01', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          ...unlocked,
        ],
        preferences: {
          ...preferences,
          equippedBorderId: equippedId,
        },
        isLoading: false,
      });
    } catch (error) {
      // If API fails, use defaults (offline mode)
      logger.warn('Failed to fetch avatar borders from API, using defaults:', error);
      set({ isLoading: false });
    }
  };
}

// ==================== equipBorder ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new equip border.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createEquipBorder(set: SetState, get: GetState) {
  return async (borderId: string) => {
    const { isBorderUnlocked, allBorders } = get();
    const border = allBorders.find((b) => b.id === borderId);

    if (!border) {
      set({ error: 'Border not found' });
      return;
    }

    if (!isBorderUnlocked(borderId)) {
      set({ error: 'Border is locked' });
      return;
    }

    set({ isSaving: true, error: null });
    try {
      await api.post(`/api/v1/avatar-borders/${borderId}/equip`);
      set((state) => ({
        preferences: { ...state.preferences, equippedBorderId: borderId },
        previewBorderId: null,
        isSaving: false,
      }));
    } catch (error) {
      logger.error('Failed to equip border:', error);
      // Optimistic update - equip locally even if API fails
      set((state) => ({
        preferences: { ...state.preferences, equippedBorderId: borderId },
        previewBorderId: null,
        isSaving: false,
      }));
    }
  };
}

// ==================== purchaseBorder ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new purchase border.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createPurchaseBorder(set: SetState, get: GetState) {
  return async (borderId: string): Promise<boolean> => {
    const { allBorders, unlockedBorders, isBorderUnlocked } = get();
    const border = allBorders.find((b) => b.id === borderId);

    if (!border) {
      set({ error: 'Border not found' });
      return false;
    }

    if (isBorderUnlocked(borderId)) {
      set({ error: 'Border already unlocked' });
      return false;
    }

    if (border.unlockRequirement?.type !== 'coins') {
      set({ error: 'Border cannot be purchased with coins' });
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      try {
        await api.post(`/api/v1/avatar-borders/${borderId}/purchase`);
      } catch (_purchaseError) {
        // Fallback to legacy unlock endpoint
        await api.post(`/api/v1/avatar-borders/${borderId}/unlock`);
      }
      set({
        unlockedBorders: [
          ...unlockedBorders,
          {
            borderId,
            unlockedAt: new Date().toISOString(),
            unlockSource: 'purchase',
          },
        ],
        isSaving: false,
      });
      return true;
    } catch (error) {
      logger.error('Failed to purchase border:', error);
      set({ error: 'Failed to purchase border', isSaving: false });
      return false;
    }
  };
}

// ==================== updatePreferences ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new update preferences.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createUpdatePreferences(set: SetState, get: GetState) {
  return async (updates: Partial<BorderPreference>) => {
    set({ isSaving: true, error: null });
    try {
      const mergedPreferences = { ...get().preferences, ...updates };
      // Persist preferences via custom_config to avoid losing other customization keys
      await api.patch('/api/v1/me/customizations', {
        custom_config: {
          avatar_border_preferences: mergedPreferences,
        },
      });
      set({
        preferences: mergedPreferences,
        isSaving: false,
      });
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      // Apply optimistically
      set((prevState) => ({
        preferences: { ...prevState.preferences, ...updates },
        isSaving: false,
      }));
    }
  };
}

// ==================== handleAchievementUnlock ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new handle achievement unlock.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createHandleAchievementUnlock(set: SetState, get: GetState) {
  return (achievementId: string) => {
    const { allBorders, unlockedBorders, isBorderUnlocked } = get();

    // Find borders unlocked by this achievement
    const bordersToUnlock = allBorders.filter(
      (b) =>
        b.unlockType === 'achievement' &&
        b.unlockRequirement?.type === 'achievement' &&
        b.unlockRequirement?.value === achievementId &&
        !isBorderUnlocked(b.id)
    );

    if (bordersToUnlock.length > 0) {
      set({
        unlockedBorders: [
          ...unlockedBorders,
          ...bordersToUnlock.map((b) => ({
            borderId: b.id,
            unlockedAt: new Date().toISOString(),
            unlockSource: 'achievement' satisfies BorderUnlockType,
            achievementId,
          })),
        ],
      });
    }
  };
}

// ==================== handleEventReward ====================

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new handle event reward.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createHandleEventReward(set: SetState, get: GetState) {
  return (eventId: string, borderId: string) => {
    const { allBorders, unlockedBorders, isBorderUnlocked } = get();
    const border = allBorders.find((b) => b.id === borderId);

    if (border && !isBorderUnlocked(borderId)) {
      set({
        unlockedBorders: [
          ...unlockedBorders,
          {
            borderId,
            unlockedAt: new Date().toISOString(),
            unlockSource: 'event',
            eventId,
          },
        ],
      });
    }
  };
}

// ==================== fetchLottieBorders ====================

/**
 * Fetches Lottie borders from the API and merges them into the border catalog.
 * Lottie borders are not hardcoded — they come from GET /api/v1/cosmetics/borders?animation_type=lottie
 */
export function createFetchLottieBorders(set: SetState, get: GetState) {
  return async () => {
    const { lottieBordersFetched, allBorders } = get();
    if (lottieBordersFetched) return; // Already fetched

    try {
      const response = await api.get('/api/v1/cosmetics/borders', {
        params: { animation_type: 'lottie' },
      });
      const lottieBordersData = response.data?.data || [];

      // Map API response to AvatarBorderConfig
      const lottieBorders = lottieBordersData.map(
        (b: {
          id: string;
          name: string;
          rarity: string;
          theme: string;
          lottie_url: string;
          lottie_asset_id: string;
          lottie_config: { loop?: boolean; speed?: number; segment?: [number, number] };
          unlock_condition: string;
          price_coins: number;
        }) => ({
          id: b.id,
          type: b.id,
          name: b.name,
          description: `${b.name} Lottie border`,
          theme: b.theme,
          rarity: b.rarity,
          unlockType: b.unlock_condition?.startsWith('level_') ? 'level' : 'purchase',
          primaryColor: '#ffffff',
          isPremium: true,
          coinCost: b.price_coins,
          tags: ['lottie', b.theme],
          lottieUrl: b.lottie_url,
          lottieAssetId: b.lottie_asset_id,
          lottieConfig: b.lottie_config,
        })
      );

      const existingIds = new Set(allBorders.map((b) => b.id));
      const newBorders = lottieBorders.filter((b: { id: string }) => !existingIds.has(b.id));

      set({
        lottieBorders,
        lottieBordersFetched: true,
        allBorders: [...allBorders, ...newBorders],
      });
    } catch (error) {
      logger.warn('Failed to fetch Lottie borders:', error);
      set({ lottieBordersFetched: true }); // Don't retry on failure
    }
  };
}
