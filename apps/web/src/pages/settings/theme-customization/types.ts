import type {
  ColorPreset,
  AvatarBorderType,
  ChatBubbleStylePreset,
  EffectPreset,
} from '@/stores/theme';

export type TabType = 'theme' | 'avatar' | 'chat' | 'effects';

// Re-export for compatibility
export type ThemeColorPreset = ColorPreset;

export interface TabDefinition {
  id: TabType;
  label: string;
  icon: string;
}

export interface PresetOption {
  id: string;
  name: string;
  description: string;
}

export interface BorderOption {
  type: AvatarBorderType;
  name: string;
  premium?: boolean;
}

export interface BubbleStyleOption {
  type: ChatBubbleStylePreset;
  name: string;
}

export interface EffectOption {
  type: EffectPreset;
  name: string;
}

export type AvatarSizeOption = 'sm' | 'md' | 'lg';
export type AnimationSpeedOption = 'slow' | 'normal' | 'fast';
