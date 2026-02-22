import type { ChatBubbleStyle, BubbleAnimation } from '@/modules/settings/store/customization';

export const bubbleStyles: { id: ChatBubbleStyle; name: string; icon: string }[] = [
  { id: 'default', name: 'Default', icon: '💬' },
  { id: 'rounded', name: 'Rounded', icon: '🔵' },
  { id: 'sharp', name: 'Sharp', icon: '🔷' },
  { id: 'cloud', name: 'Cloud', icon: '☁️' },
  { id: 'modern', name: 'Modern', icon: '📱' },
  { id: 'retro', name: 'Retro', icon: '👾' },
];

export const bubbleAnimations: { id: BubbleAnimation; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '⏹️' },
  { id: 'slide', name: 'Slide', icon: '➡️' },
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'scale', name: 'Scale', icon: '🔍' },
  { id: 'bounce', name: 'Bounce', icon: '🏀' },
  { id: 'flip', name: 'Flip', icon: '🔄' },
];
