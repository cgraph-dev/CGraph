/**
 * CustomizationUI barrel export
 * @module modules/settings/components/customize/ui
 */

// Animation constants
export { uiSprings as springs } from './constants';

// Components
export { AnimatedToggle } from './animated-toggle';
export { ColorPickerGrid } from './color-picker-grid';
export { GradientSlider } from './gradient-slider';
export { AnimatedTabs } from './animated-tabs';
export { OptionButton } from './option-button';
export { SpeedSelector, SizeSelector } from './selectors';
export { SectionHeader, ToggleRow, PremiumBadge } from './utility-components';

// Types
export type {
  AnimatedToggleProps,
  ColorPickerGridProps,
  GradientSliderProps,
  TabItem,
  AnimatedTabsProps,
  OptionButtonProps,
  SpeedOption,
  SpeedSelectorProps,
  SizeOption,
  SizeSelectorProps,
  SectionHeaderProps,
  ToggleRowProps,
  PremiumBadgeProps,
} from './types';
