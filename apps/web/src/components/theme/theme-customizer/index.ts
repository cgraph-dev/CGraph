/**
 * Theme Customizer Module
 *
 * Comprehensive theme customization panel with live preview.
 *
 * @module theme-customizer
 */

// Main component
export { ThemeCustomizer, default } from './theme-customizer';

// Tab components
export { ColorTab } from './color-tab';
export { AvatarTab } from './avatar-tab';
export { BubblesTab } from './bubbles-tab';
export { EffectsTab } from './effects-tab';
export { LivePreview } from './live-preview';

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
