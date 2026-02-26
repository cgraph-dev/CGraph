/**
 * Types and constants for color picker component.
 * @module components/inputs/color-picker/types
 */
import { type StyleProp, type ViewStyle, Dimensions } from 'react-native';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  swatches?: string[];
  showSwatches?: boolean;
  showRecentColors?: boolean;
  recentColorsCount?: number;
  showInput?: boolean;
  inputMode?: 'hex' | 'rgb' | 'hsl';
  showPreview?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DEFAULT_SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ffffff', '#9ca3af', '#000000',
];

export const SIZE_CONFIG = {
  sm: { sliderHeight: 24, swatchSize: 28, previewSize: 40 },
  md: { sliderHeight: 32, swatchSize: 36, previewSize: 56 },
  lg: { sliderHeight: 40, swatchSize: 44, previewSize: 72 },
};

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  width: number;
  height: number;
  hapticFeedback?: boolean;
}
