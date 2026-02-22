/**
 * Cosmetics Settings Module
 *
 * Comprehensive UI for managing avatar borders, profile themes,
 * and chat effects.
 *
 * @module cosmetics-settings
 */

// Main component
export { CosmeticsSettingsPanel, default } from './cosmetics-settings-panel';

// Section components
export { AvatarBordersSection } from './avatar-borders-section';
export { ProfileThemesSection } from './profile-themes-section';
export { ChatEffectsSection } from './chat-effects-section';

// Helper components
export { TypingPreview } from './typing-preview';
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
