/**
 * Theme Customization Module
 *
 * Comprehensive theme customization page with 4 categories:
 * 1. Profile Themes — 20+ profile color schemes
 * 2. Chat Themes — 15+ chat bubble/background themes
 * 3. Forum Themes — 12+ forum layout themes
 * 4. App Themes — 8+ global app color schemes
 *
 * @module pages/customize/theme-customization
 */

// Main component
export { default } from './page';

// Sub-components
export { ThemeCard } from './theme-card';
export { SearchBar } from './search-bar';
export { CategoryTabs } from './category-tabs';
export { SaveButton } from './save-button';
export { ThemeDescription } from './theme-description';
export { ProfileThemePicker } from './profile-theme-picker';

// Hooks
export { useThemeCustomization } from './hooks';

// Types
export type { ThemeCategory, Theme, ThemeCardProps, CategoryTab } from './types';

// Constants (MOCK_THEMES removed — now fetched from API)
