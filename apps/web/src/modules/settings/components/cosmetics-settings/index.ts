/**
 * Cosmetics Settings Module
 *
 * Comprehensive UI for managing avatar borders, profile themes,
 * and chat effects.
 *
 * @module cosmetics-settings
 */

// Main component
export { CosmeticsSettingsPanel, default } from './CosmeticsSettingsPanel';

// Section components
export { AvatarBordersSection } from './AvatarBordersSection';
export { ProfileThemesSection } from './ProfileThemesSection';
export { ChatEffectsSection } from './ChatEffectsSection';

// Helper components
export { TypingPreview } from './TypingPreview';
export { GridIcon, ListIcon } from './icons';

// Constants
export { THEME_PRESETS_ARRAY, RARITY_COLORS, DEFAULT_FILTERS } from './constants';

// Types
export type {
  SettingsTab,
  ViewMode,
  FilterState,
  SectionProps,
  ThemePresetWithId,
  ChatEffectSubTab,
} from './types';
