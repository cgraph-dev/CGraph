/**
 * BBCode Editor Constants
 *
 * Color palette, font sizes, and smilies for the editor.
 */

import type { ColorOption, FontSizeOption, SmileyOption } from './types';

export const COLORS: ColorOption[] = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'White', value: '#FFFFFF' },
];

export const FONT_SIZES: FontSizeOption[] = [
  { name: 'Small', value: '12' },
  { name: 'Normal', value: '16' },
  { name: 'Large', value: '20' },
  { name: 'X-Large', value: '24' },
  { name: 'Huge', value: '32' },
];

export const SMILIES: SmileyOption[] = [
  { code: ':)', emoji: '😊' },
  { code: ':D', emoji: '😃' },
  { code: ';)', emoji: '😉' },
  { code: ':P', emoji: '😛' },
  { code: ':(', emoji: '😢' },
  { code: ':o', emoji: '😮' },
  { code: '<3', emoji: '❤️' },
  { code: ':thumbsup:', emoji: '👍' },
  { code: ':fire:', emoji: '🔥' },
  { code: ':100:', emoji: '💯' },
];
