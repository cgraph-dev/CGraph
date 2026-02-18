/**
 * Type definitions for CustomizationUI components
 * @module modules/settings/components/customize/ui
 */

import type { ThemePreset } from '@/modules/settings/store/customization';
import type { ReactNode } from 'react';

export interface AnimatedToggleProps {
  enabled: boolean;
  onToggle: () => void;
  colorPreset?: ThemePreset;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export interface ColorPickerGridProps {
  selected: ThemePreset;
  onSelect: (preset: ThemePreset) => void;
  size?: 'sm' | 'md' | 'lg';
}

export interface GradientSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  colorPreset?: ThemePreset;
  label?: string;
  showValue?: boolean;
  suffix?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  colorPreset?: ThemePreset;
  layoutId?: string;
}

export interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  premium?: boolean;
  rarity?: string;
  colorPreset?: ThemePreset;
}

export type SpeedOption = 'slow' | 'normal' | 'fast';

export interface SpeedSelectorProps {
  value: SpeedOption;
  onChange: (speed: SpeedOption) => void;
  colorPreset?: ThemePreset;
}

export type SizeOption = 'small' | 'medium' | 'large';

export interface SizeSelectorProps {
  value: SizeOption;
  onChange: (size: SizeOption) => void;
  colorPreset?: ThemePreset;
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  onToggle: () => void;
  colorPreset?: ThemePreset;
}

export interface PremiumBadgeProps {
  tier?: 'free' | 'premium' | 'enterprise';
  className?: string;
}
