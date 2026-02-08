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
          // Always include free borders
          { borderId: 'none', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          { borderId: 'static', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
          {
            borderId: 'simple-glow',
            unlockedAt: new Date().toISOString(),
            unlockSource: 'free',
          },
          {
            borderId: 'gentle-pulse',
            unlockedAt: new Date().toISOString(),
            unlockSource: 'free',
          },
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
            unlockSource: 'achievement' as BorderUnlockType,
            achievementId,
          })),
        ],
      });
    }
  };
}

// ==================== handleEventReward ====================

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
