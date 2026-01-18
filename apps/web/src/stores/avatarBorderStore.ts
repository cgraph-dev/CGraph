import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type {
  AvatarBorderConfig,
  BorderTheme,
  BorderRarity,
  BorderUnlockType,
} from '@/types/avatar-borders';
import { AVATAR_BORDERS } from '@/data/avatar-borders';

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

// ==================== TYPE DEFINITIONS ====================

export interface UnlockedBorder {
  borderId: string;
  unlockedAt: string;
  unlockSource: BorderUnlockType;
  /** For event borders, the event that granted it */
  eventId?: string;
  /** For achievement borders, the achievement ID */
  achievementId?: string;
}

export interface BorderPreference {
  /** Currently equipped border ID */
  equippedBorderId: string;
  /** Custom color overrides (if border allows) */
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  /** Animation speed multiplier (0.5 - 2.0) */
  animationSpeed: number;
  /** Particle density (0 - 100) */
  particleDensity: number;
  /** Whether to show particles */
  showParticles: boolean;
  /** Reduced motion for accessibility */
  reducedMotion: boolean;
}

export interface AvatarBorderState {
  // ==================== STATE ====================
  /** All borders in the catalog */
  allBorders: AvatarBorderConfig[];
  /** User's unlocked borders */
  unlockedBorders: UnlockedBorder[];
  /** User's border preferences */
  preferences: BorderPreference;
  /** Currently previewing border (not saved) */
  previewBorderId: string | null;
  /** Loading states */
  isLoading: boolean;
  isSaving: boolean;
  /** Error state */
  error: string | null;
  /** Filter state for UI */
  filters: {
    theme: BorderTheme | 'all';
    rarity: BorderRarity | 'all';
    showLocked: boolean;
    searchQuery: string;
  };

  // ==================== COMPUTED GETTERS ====================
  /** Get the currently equipped border config */
  getEquippedBorder: () => AvatarBorderConfig | undefined;
  /** Get the preview border config (or equipped if no preview) */
  getDisplayBorder: () => AvatarBorderConfig | undefined;
  /** Check if a border is unlocked */
  isBorderUnlocked: (borderId: string) => boolean;
  /** Get borders filtered by current filter state */
  getFilteredBorders: () => AvatarBorderConfig[];
  /** Get borders by theme */
  getBordersByTheme: (theme: BorderTheme) => AvatarBorderConfig[];
  /** Get free borders */
  getFreeBorders: () => AvatarBorderConfig[];
  /** Get count of unlocked borders per theme */
  getThemeUnlockCounts: () => Record<BorderTheme, { unlocked: number; total: number }>;

  // ==================== ACTIONS ====================
  /** Initialize the store with user data from API */
  initialize: () => Promise<void>;
  /** Equip a border (must be unlocked) */
  equipBorder: (borderId: string) => Promise<void>;
  /** Set preview border (temporary, not saved) */
  setPreviewBorder: (borderId: string | null) => void;
  /** Unlock a border via purchase */
  purchaseBorder: (borderId: string) => Promise<boolean>;
  /** Update preferences */
  updatePreferences: (updates: Partial<BorderPreference>) => Promise<void>;
  /** Update filters */
  setFilters: (updates: Partial<AvatarBorderState['filters']>) => void;
  /** Clear error */
  clearError: () => void;
  /** Sync with server */
  syncWithServer: () => Promise<void>;
  /** Handle achievement unlock (called from gamification store) */
  handleAchievementUnlock: (achievementId: string) => void;
  /** Handle event reward (called from event system) */
  handleEventReward: (eventId: string, borderId: string) => void;
}

// ==================== DEFAULT VALUES ====================

const DEFAULT_PREFERENCES: BorderPreference = {
  equippedBorderId: 'none',
  animationSpeed: 1.0,
  particleDensity: 50,
  showParticles: true,
  reducedMotion: false,
};

const DEFAULT_FILTERS: AvatarBorderState['filters'] = {
  theme: 'all',
  rarity: 'all',
  showLocked: true,
  searchQuery: '',
};

// ==================== STORE IMPLEMENTATION ====================

export const useAvatarBorderStore = create<AvatarBorderState>()(
  persist(
    (set, get) => ({
      // ==================== INITIAL STATE ====================
      allBorders: AVATAR_BORDERS,
      unlockedBorders: [
        // Everyone starts with the free tier borders
        { borderId: 'none', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'static', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'simple-glow', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
        { borderId: 'gentle-pulse', unlockedAt: new Date().toISOString(), unlockSource: 'default' },
      ],
      preferences: DEFAULT_PREFERENCES,
      previewBorderId: null,
      isLoading: false,
      isSaving: false,
      error: null,
      filters: DEFAULT_FILTERS,

      // ==================== COMPUTED GETTERS ====================
      getEquippedBorder: () => {
        const { allBorders, preferences } = get();
        return allBorders.find((b) => b.id === preferences.equippedBorderId);
      },

      getDisplayBorder: () => {
        const { allBorders, previewBorderId, preferences } = get();
        const displayId = previewBorderId ?? preferences.equippedBorderId;
        return allBorders.find((b) => b.id === displayId);
      },

      isBorderUnlocked: (borderId: string) => {
        const { unlockedBorders, allBorders } = get();
        const border = allBorders.find((b) => b.id === borderId);
        if (!border) return false;
        // Default borders are always unlocked (free tier)
        if (border.unlockType === 'default' || border.rarity === 'free') return true;
        return unlockedBorders.some((u) => u.borderId === borderId);
      },

      getFilteredBorders: () => {
        const { allBorders, filters, isBorderUnlocked } = get();
        return allBorders.filter((border) => {
          // Theme filter
          if (filters.theme !== 'all' && border.theme !== filters.theme) return false;
          // Rarity filter
          if (filters.rarity !== 'all' && border.rarity !== filters.rarity) return false;
          // Locked filter
          if (!filters.showLocked && !isBorderUnlocked(border.id)) return false;
          // Search query
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
              border.name.toLowerCase().includes(query) ||
              border.description.toLowerCase().includes(query) ||
              border.theme.toLowerCase().includes(query)
            );
          }
          return true;
        });
      },

      getBordersByTheme: (theme: BorderTheme) => {
        const { allBorders } = get();
        return allBorders.filter((b) => b.theme === theme);
      },

      getFreeBorders: () => {
        const { allBorders } = get();
        return allBorders.filter((b) => b.unlockType === 'default' || b.rarity === 'free');
      },

      getThemeUnlockCounts: () => {
        const { allBorders, isBorderUnlocked } = get();
        const counts: Record<string, { unlocked: number; total: number }> = {};

        allBorders.forEach((border) => {
          if (!counts[border.theme]) {
            counts[border.theme] = { unlocked: 0, total: 0 };
          }
          const themeCount = counts[border.theme];
          if (themeCount) {
            themeCount.total++;
            if (isBorderUnlocked(border.id)) {
              themeCount.unlocked++;
            }
          }
        });

        return counts as Record<BorderTheme, { unlocked: number; total: number }>;
      },

      // ==================== ACTIONS ====================
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/v1/users/me/avatar-borders');
          const data = response.data;

          set({
            unlockedBorders: [
              // Always include free borders
              { borderId: 'none', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
              { borderId: 'static', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
              { borderId: 'simple-glow', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
              { borderId: 'gentle-pulse', unlockedAt: new Date().toISOString(), unlockSource: 'free' },
              ...(data.unlocked || []),
            ],
            preferences: {
              ...DEFAULT_PREFERENCES,
              ...data.preferences,
            },
            isLoading: false,
          });
        } catch (error) {
          // If API fails, use defaults (offline mode)
          console.warn('Failed to fetch avatar borders from API, using defaults:', error);
          set({ isLoading: false });
        }
      },

      equipBorder: async (borderId: string) => {
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
          await api.post('/api/v1/users/me/avatar-border/equip', { borderId });
          set((state) => ({
            preferences: { ...state.preferences, equippedBorderId: borderId },
            previewBorderId: null,
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to equip border:', error);
          // Optimistic update - equip locally even if API fails
          set((state) => ({
            preferences: { ...state.preferences, equippedBorderId: borderId },
            previewBorderId: null,
            isSaving: false,
          }));
        }
      },

      setPreviewBorder: (borderId: string | null) => {
        set({ previewBorderId: borderId });
      },

      purchaseBorder: async (borderId: string) => {
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
          await api.post(`/api/v1/avatar-borders/${borderId}/unlock`);
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
          console.error('Failed to purchase border:', error);
          set({ error: 'Failed to purchase border', isSaving: false });
          return false;
        }
      },

      updatePreferences: async (updates: Partial<BorderPreference>) => {
        set({ isSaving: true, error: null });
        try {
          await api.put('/api/v1/users/me/avatar-border/preferences', updates);
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to update preferences:', error);
          // Apply optimistically
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
            isSaving: false,
          }));
        }
      },

      setFilters: (updates: Partial<AvatarBorderState['filters']>) => {
        set((state) => ({
          filters: { ...state.filters, ...updates },
        }));
      },

      clearError: () => set({ error: null }),

      syncWithServer: async () => {
        const { initialize } = get();
        await initialize();
      },

      handleAchievementUnlock: (achievementId: string) => {
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
      },

      handleEventReward: (eventId: string, borderId: string) => {
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
      },
    }),
    {
      name: 'cgraph-avatar-borders',
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
