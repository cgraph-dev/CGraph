/**
 * UI Customization Settings Module
 *
 * @module modules/settings/components/ui-customization
 */

// Types
export type { UIPreferences, SettingsTabProps } from './types';
export { defaultPreferences } from './types';

// Store
export { useUIPreferences, applyPreferencesToDOM } from './store';

// Controls
export { ColorPicker, SliderControl, Select, Toggle } from './controls';

// Tab components
export {
  ThemeSettings,
  EffectsSettings,
  AnimationsSettings,
  TypographySettings,
  AdvancedSettings,
} from './settings-tabs';

// Modal
export { ExportImportModal } from './ExportImportModal';

// Main component
export { default } from './UICustomizationSettings';
