import type {
  AvatarBorderConfig,
  BorderTheme,
  BorderRarity,
  BorderUnlockType,
} from '@/types/avatar-borders';

/**
 * Avatar Border Store — Type Definitions & Defaults
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

export const DEFAULT_PREFERENCES: BorderPreference = {
  equippedBorderId: 'none',
  animationSpeed: 1.0,
  particleDensity: 50,
  showParticles: true,
  reducedMotion: false,
};

export const DEFAULT_FILTERS: AvatarBorderState['filters'] = {
  theme: 'all',
  rarity: 'all',
  showLocked: true,
  searchQuery: '',
};
