/**
 * Appearance Settings Module
 *
 * Enhanced theme customization panel with visual theme picker,
 * font scaling, message density, and accessibility settings.
 *
 * @module appearance-settings
 */

// Main component
export { AppearanceSettingsEnhanced, default } from './AppearanceSettingsEnhanced';

// Section components
export { ThemeSelection } from './ThemeSelection';
export { DisplayOptions } from './DisplayOptions';
export { BackgroundEffects } from './BackgroundEffects';
export { Accessibility } from './Accessibility';
export { LivePreview } from './LivePreview';

// UI components
export { ThemeCard } from './ThemeCard';
export { Slider } from './Slider';
export { Toggle } from './Toggle';
export { SectionHeader } from './SectionHeader';

// Types
export type {
  ThemeCardProps,
  SliderProps,
  ToggleProps,
  SectionHeaderProps,
  ThemeGroups,
} from './types';
