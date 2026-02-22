import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'ChatBubbles'>;
};

export interface ChatBubbleStyle {
  // Colors
  ownMessageBg: string;
  ownMessageText: string;
  otherMessageBg: string;
  otherMessageText: string;

  // Shape
  borderRadius: number;
  tailStyle: 'none' | 'arrow' | 'bubble' | 'subtle';
  borderWidth: number;

  // Effects
  useGradient: boolean;
  glassEffect: boolean;
  shadowIntensity: number;

  // Layout
  showAvatar: boolean;
  avatarSize: 'small' | 'medium' | 'large';
  showTimestamp: boolean;
  timestampPosition: 'inside' | 'outside';
  alignSent: 'left' | 'right';
  alignReceived: 'left' | 'right';
  maxWidth: number;
  spacing: 'compact' | 'normal' | 'spacious';
}

export interface PresetStyle {
  id: string;
  label: string;
  colors: string[];
  style: ChatBubbleStyle;
}

export interface ColorOption {
  name: string;
  color: string;
}

export type TabId = 'presets' | 'colors' | 'shape' | 'layout';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEY = 'cgraph-chat-bubble-style';

export const defaultStyle: ChatBubbleStyle = {
  ownMessageBg: '#10b981',
  ownMessageText: '#ffffff',
  otherMessageBg: '#374151',
  otherMessageText: '#ffffff',
  borderRadius: 16,
  tailStyle: 'subtle',
  borderWidth: 0,
  useGradient: false,
  glassEffect: false,
  shadowIntensity: 20,
  showAvatar: true,
  avatarSize: 'medium',
  showTimestamp: true,
  timestampPosition: 'inside',
  alignSent: 'right',
  alignReceived: 'left',
  maxWidth: 80,
  spacing: 'normal',
};

export const presets: PresetStyle[] = [
  {
    id: 'default',
    label: 'Default',
    colors: ['#10b981', '#059669'],
    style: defaultStyle,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    colors: ['#6b7280', '#4b5563'],
    style: {
      ...defaultStyle,
      ownMessageBg: '#6b7280',
      borderRadius: 8,
      useGradient: false,
      shadowIntensity: 0,
    },
  },
  {
    id: 'modern',
    label: 'Modern',
    colors: ['#3b82f6', '#8b5cf6'],
    style: {
      ...defaultStyle,
      ownMessageBg: '#3b82f6',
      useGradient: true,
      glassEffect: true,
      borderRadius: 20,
    },
  },
  {
    id: 'retro',
    label: 'Retro',
    colors: ['#f59e0b', '#d97706'],
    style: {
      ...defaultStyle,
      ownMessageBg: '#f59e0b',
      borderRadius: 4,
      tailStyle: 'arrow',
      borderWidth: 2,
    },
  },
  {
    id: 'bubble',
    label: 'Bubble',
    colors: ['#ec4899', '#d946ef'],
    style: {
      ...defaultStyle,
      ownMessageBg: '#ec4899',
      borderRadius: 28,
      useGradient: true,
      tailStyle: 'bubble',
    },
  },
  {
    id: 'glass',
    label: 'Glass',
    colors: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'],
    style: {
      ...defaultStyle,
      ownMessageBg: 'rgba(16, 185, 129, 0.5)',
      glassEffect: true,
      borderRadius: 16,
      shadowIntensity: 40,
    },
  },
];

export const colorOptions: ColorOption[] = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Indigo', color: '#6366f1' },
];

export const tabs: Tab[] = [
  { id: 'presets', label: 'Presets', icon: 'sparkles' },
  { id: 'colors', label: 'Colors', icon: 'color-palette' },
  { id: 'shape', label: 'Shape', icon: 'shapes' },
  { id: 'layout', label: 'Layout', icon: 'grid' },
];
