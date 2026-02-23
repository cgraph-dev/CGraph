/**
 * Chat bubble settings constant definitions.
 * @module
 */
import {
  ChatBubbleLeftIcon,
  SparklesIcon,
  SwatchIcon,
  Cog6ToothIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export const CHAT_BUBBLE_TABS = [
  { id: 'colors' as const, label: 'Colors', icon: SwatchIcon },
  { id: 'shape' as const, label: 'Shape', icon: ChatBubbleLeftIcon },
  { id: 'effects' as const, label: 'Effects', icon: SparklesIcon },
  { id: 'animations' as const, label: 'Animations', icon: Cog6ToothIcon },
  { id: 'layout' as const, label: 'Layout', icon: Cog6ToothIcon },
  { id: 'backgrounds' as const, label: 'Backgrounds', icon: PhotoIcon },
] as const;

export const CHAT_BUBBLE_PRESETS_UI = [
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
