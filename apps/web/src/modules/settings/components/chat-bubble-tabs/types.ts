/**
 * Chat Bubble Tab — Shared Types
 */

import type { ChatBubbleConfig } from '@/stores/theme';
import type { BackgroundCategory, ChatBackground } from '@/data/chatBackgrounds';

export interface TabProps {
  style: ChatBubbleConfig;
  updateStyle: <K extends keyof ChatBubbleConfig>(key: K, value: ChatBubbleConfig[K]) => void;
}

export interface BackgroundsTabProps {
  backgrounds: ChatBackground[];
  selectedBackground: string;
  setSelectedBackground: (id: string) => void;
  backgroundCategory: BackgroundCategory | 'all';
  setBackgroundCategory: (cat: BackgroundCategory | 'all') => void;
}

export const CATEGORY_COLORS: Record<
  BackgroundCategory,
  { bg: string; text: string; border: string }
> = {
  free: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  premium: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  seasonal: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};
