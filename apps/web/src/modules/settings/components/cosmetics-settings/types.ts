/**
 * Cosmetics Settings Types
 *
 * Type definitions for cosmetics settings components.
 */

import type { BorderRarity, BorderTheme } from '@/types/avatar-borders';
import type { ThemePresetConfig } from '@/stores/theme';

// =============================================================================
// TAB & VIEW TYPES
// =============================================================================

/**
 * Available settings tabs
 */
export type SettingsTab = 'borders' | 'themes' | 'chat-effects';

/**
 * View mode for item display
 */
export type ViewMode = 'grid' | 'list';

// =============================================================================
// FILTER TYPES
// =============================================================================

/**
 * Filter state for cosmetics items
 */
export interface FilterState {
  search: string;
  rarity: BorderRarity | 'all';
  theme: BorderTheme | 'all';
  showOwned: boolean;
  showLocked: boolean;
}

// =============================================================================
// SECTION PROPS
// =============================================================================

/**
 * Common props for section components
 */
export interface SectionProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// =============================================================================
// THEME PRESET TYPES
// =============================================================================

/**
 * Theme preset with id for array mapping
 */
export interface ThemePresetWithId extends ThemePresetConfig {
  id: string;
  description?: string;
  backgroundConfig?: ThemePresetConfig['background'];
}

// =============================================================================
// CHAT EFFECT TYPES
// =============================================================================

/**
 * Chat effect sub-tab types
 */
export type ChatEffectSubTab = 'message' | 'bubble' | 'typing';
