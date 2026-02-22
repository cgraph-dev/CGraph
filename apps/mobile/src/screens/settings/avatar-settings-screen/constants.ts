/**
 * AvatarSettingsScreen Constants
 */

import { AvatarStyle, ColorOption } from './types';

export const defaultStyle: AvatarStyle = {
  borderStyle: 'gradient',
  borderWidth: 3,
  borderColor: '#10b981',
  glowIntensity: 50,
  animationSpeed: 'normal',
  shape: 'circle',
  statusIndicator: 'dot',
  statusColor: '#22c55e',
  showBadge: true,
  badgePosition: 'bottom-right',
};

export const STORAGE_KEY = 'cgraph-avatar-style';

export const borderStyles: AvatarStyle['borderStyle'][] = [
  'none',
  'solid',
  'gradient',
  'rainbow',
  'pulse',
  'spin',
  'glow',
  'neon',
  'fire',
  'electric',
];

export const shapes: AvatarStyle['shape'][] = [
  'circle',
  'rounded-square',
  'hexagon',
  'octagon',
  'shield',
  'diamond',
];

export const animationSpeeds: AvatarStyle['animationSpeed'][] = ['none', 'slow', 'normal', 'fast'];

export const colorOptions: ColorOption[] = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Yellow', color: '#eab308' },
];

export const statusColors: ColorOption[] = [
  { name: 'Online', color: '#22c55e' },
  { name: 'Away', color: '#f59e0b' },
  { name: 'Busy', color: '#ef4444' },
  { name: 'Purple', color: '#8b5cf6' },
];
