/**
 * Animation constants for CustomizationUI
 * @module modules/settings/components/customize/ui
 */

import type { ThemePreset } from '@/modules/settings/store/customization';
import { springs } from '@/lib/animation-presets/presets';

export const springs = {
  snappy: springs.snappy,
  smooth: springs.default,
  bouncy: springs.bouncy,
};

export const allThemes: ThemePreset[] = [
  'emerald',
  'purple',
  'cyan',
  'orange',
  'pink',
  'gold',
  'crimson',
  'arctic',
];

export const toggleSizeConfig = {
  sm: { track: 'h-4 w-7', dot: 'h-3 w-3', enabledOffset: '14px', disabledOffset: '2px' },
  md: { track: 'h-5 w-9', dot: 'h-4 w-4', enabledOffset: '18px', disabledOffset: '2px' },
  lg: { track: 'h-6 w-11', dot: 'h-5 w-5', enabledOffset: '22px', disabledOffset: '2px' },
};

export const colorPickerSizeConfig = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export const rarityColorMap: Record<string, string> = {
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};

export const speedOptions = [
  { id: 'slow' as const, label: 'Slow', icon: '🐢' },
  { id: 'normal' as const, label: 'Normal', icon: '⚡' },
  { id: 'fast' as const, label: 'Fast', icon: '🚀' },
];

export const sizeOptions = [
  { id: 'small' as const, label: 'S' },
  { id: 'medium' as const, label: 'M' },
  { id: 'large' as const, label: 'L' },
];

export const premiumConfig = {
  free: { label: 'FREE', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  pro: { label: 'PRO', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  elite: { label: 'ELITE', bg: 'bg-pink-500/20', text: 'text-pink-400' },
};
