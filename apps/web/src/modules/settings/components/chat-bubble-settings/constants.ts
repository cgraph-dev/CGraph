/** @module Constants for the ChatBubbleSettings page. */

import {
  ChatBubbleLeftIcon,
  SparklesIcon,
  SwatchIcon,
  Cog6ToothIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

import type { TabConfig, PresetConfig } from './types';

/** Tab definitions for the settings page navigation. */
export const CHAT_BUBBLE_TABS: TabConfig[] = [
  { id: 'colors', label: 'Colors', icon: SwatchIcon },
  { id: 'shape', label: 'Shape', icon: ChatBubbleLeftIcon },
  { id: 'effects', label: 'Effects', icon: SparklesIcon },
  { id: 'animations', label: 'Animations', icon: Cog6ToothIcon },
  { id: 'layout', label: 'Layout', icon: Cog6ToothIcon },
  { id: 'backgrounds', label: 'Backgrounds', icon: PhotoIcon },
];

/** Preset theme configurations for quick-apply. */
export const CHAT_BUBBLE_PRESETS_UI: PresetConfig[] = [
  { id: 'default', label: 'Default', preview: 'bg-gradient-to-r from-primary-600 to-purple-600' },
  { id: 'minimal', label: 'Minimal', preview: 'bg-dark-900 border border-dark-600' },
  { id: 'modern', label: 'Modern', preview: 'bg-gradient-to-br from-purple-600 to-pink-600' },
  { id: 'retro', label: 'Retro', preview: 'bg-primary-600 border-2 border-primary-400' },
  { id: 'bubble', label: 'Bubble', preview: 'bg-blue-500' },
  {
    id: 'glass',
    label: 'Glass',
    preview: 'bg-primary-500/30 backdrop-blur-md border border-primary-400/50',
  },
];
