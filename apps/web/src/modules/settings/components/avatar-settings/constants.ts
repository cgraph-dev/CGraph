/**
 * AvatarSettings constants
 * @module modules/settings/components/avatar-settings
 */

import type { BorderStyle, AvatarShape, AnimationSpeed } from './types';

export const BORDER_STYLES: BorderStyle[] = [
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

export const SHAPES: AvatarShape[] = [
  'circle',
  'rounded-square',
  'hexagon',
  'octagon',
  'shield',
  'diamond',
];

export const ANIMATION_SPEEDS: AnimationSpeed[] = ['none', 'slow', 'normal', 'fast'];

export const MAX_BIO_LENGTH = 500;
export const MAX_LOCATION_LENGTH = 100;
export const MAX_OCCUPATION_LENGTH = 100;
export const MAX_AVATAR_SIZE_MB = 2;
export const MAX_BANNER_SIZE_MB = 5;
export const RECOMMENDED_BANNER_SIZE = '1500x500px';
