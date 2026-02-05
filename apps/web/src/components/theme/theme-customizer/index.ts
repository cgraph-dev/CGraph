/**
 * Theme Customizer Module
 *
 * Comprehensive theme customization panel with live preview.
 *
 * @module theme-customizer
 */

// Main component
export { ThemeCustomizer, default } from './ThemeCustomizer';

// Tab components
export { ColorTab } from './ColorTab';
export { AvatarTab } from './AvatarTab';
export { BubblesTab } from './BubblesTab';
export { EffectsTab } from './EffectsTab';
export { LivePreview } from './LivePreview';

// Constants
export {
  TABS,
  AVATAR_BORDER_OPTIONS,
  BUBBLE_STYLE_OPTIONS,
  EFFECT_OPTIONS,
  QUICK_PRESETS,
} from './constants';

// Types
export type {
  ThemeCustomizerProps,
  TabId,
  TabDefinition,
  AvatarBorderOption,
  BubbleStyleOption,
  EffectOption,
  QuickPresetOption,
  ColorTabProps,
  AvatarTabProps,
  BubblesTabProps,
  EffectsTabProps,
  BubbleSettings,
} from './types';
