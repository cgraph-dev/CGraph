/**
 * Type definitions for chat bubble settings tab components.
 * @module modules/settings/components/chat-bubble-settings/types
 */
import type { ChatBubbleConfig } from '@/stores/theme';
import type { BackgroundCategory, ChatBackground } from '@/data/chatBackgrounds';

/**
 * Shared props for tab components
 */
export interface TabProps {
  style: ChatBubbleConfig;
  updateStyle: <K extends keyof ChatBubbleConfig>(key: K, value: ChatBubbleConfig[K]) => void;
}

/**
 * Props for the BackgroundsTab component
 */
export interface BackgroundsTabProps {
  backgrounds: ChatBackground[];
  selectedBackground: string;
  setSelectedBackground: (id: string) => void;
  backgroundCategory: BackgroundCategory | 'all';
  setBackgroundCategory: (category: BackgroundCategory | 'all') => void;
}

/**
 * Tab identifiers
 */
export type TabId = 'colors' | 'shape' | 'effects' | 'animations' | 'layout' | 'backgrounds';

/**
 * Tab configuration
 */
export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Preset configuration
 */
export interface PresetConfig {
  id: string;
  label: string;
  preview: string;
}

/**
 * Category colors for backgrounds
 */
export type CategoryColors = Record<
  BackgroundCategory,
  { bg: string; text: string; border: string }
>;
