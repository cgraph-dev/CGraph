/**
 * Appearance Settings Module
 *
 * Enhanced theme customization panel with visual theme picker,
 * font scaling, message density, and accessibility settings.
 *
 * @module appearance-settings
 */

// Main component
export { AppearanceSettingsEnhanced, default } from './appearance-settings-enhanced';

// Section components
export { ThemeSelection } from './theme-selection';
export { DisplayOptions } from './display-options';
export { BackgroundEffects } from './background-effects';
export { Accessibility } from './accessibility';
export { LivePreview } from './live-preview';

// UI components
export { ThemeCard } from './theme-card';
export { Slider } from './slider';
export { Toggle } from './toggle';
export { SectionHeader } from './section-header';

// Types
export type {
  ThemeCardProps,
  SliderProps,
  ToggleProps,
  SectionHeaderProps,
  ThemeGroups,
} from './types';
