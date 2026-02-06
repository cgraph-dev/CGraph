/**
 * CustomizationUI barrel export
 * @module modules/settings/components/customize/ui
 */

// Animation constants
export { springs } from './constants';

// Components
export { AnimatedToggle } from './AnimatedToggle';
export { ColorPickerGrid } from './ColorPickerGrid';
export { GradientSlider } from './GradientSlider';
export { AnimatedTabs } from './AnimatedTabs';
export { OptionButton } from './OptionButton';
export { SpeedSelector, SizeSelector } from './Selectors';
export { SectionHeader, ToggleRow, PremiumBadge } from './UtilityComponents';

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
