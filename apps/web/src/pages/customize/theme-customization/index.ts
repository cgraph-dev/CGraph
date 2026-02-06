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
export { ThemeCard } from './ThemeCard';
export { SearchBar } from './SearchBar';
export { CategoryTabs } from './CategoryTabs';
export { SaveButton } from './SaveButton';
export { ThemeDescription } from './ThemeDescription';
export { ProfileThemePicker } from './ProfileThemePicker';

// Hooks
export { useThemeCustomization } from './hooks';

// Types
export type { ThemeCategory, Theme, ThemeCardProps, CategoryTab } from './types';

// Constants
export { MOCK_THEMES } from './constants';
