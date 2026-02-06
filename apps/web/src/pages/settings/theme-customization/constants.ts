import type {
  TabDefinition,
  PresetOption,
  BorderOption,
  BubbleStyleOption,
  EffectOption,
} from './types';

export const TABS: TabDefinition[] = [
  { id: 'theme', label: 'Theme', icon: '🎨' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'chat', label: 'Chat Bubbles', icon: '💬' },
  { id: 'effects', label: 'Effects', icon: '✨' },
];

export const THEME_PRESETS: PresetOption[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
  { id: 'modern', name: 'Modern', description: 'Sleek glassmorphism' },
  { id: 'vibrant', name: 'Vibrant', description: 'Bold and colorful' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated and refined' },
  { id: 'gaming', name: 'Gaming', description: 'High-energy cyberpunk' },
];

export const AVATAR_BORDERS: BorderOption[] = [
  { type: 'none', name: 'None' },
  { type: 'static', name: 'Static' },
  { type: 'glow', name: 'Glow' },
  { type: 'pulse', name: 'Pulse' },
  { type: 'rotate', name: 'Orbit', premium: true },
  { type: 'fire', name: 'Inferno', premium: true },
  { type: 'ice', name: 'Frost', premium: true },
  { type: 'electric', name: 'Storm', premium: true },
  { type: 'legendary', name: 'Legendary', premium: true },
  { type: 'mythic', name: 'Mythic', premium: true },
];

export const BUBBLE_STYLES: BubbleStyleOption[] = [
  { type: 'default', name: 'Default' },
  { type: 'rounded', name: 'Rounded' },
  { type: 'sharp', name: 'Sharp' },
  { type: 'cloud', name: 'Cloud' },
  { type: 'modern', name: 'Modern' },
  { type: 'retro', name: 'Retro' },
  { type: 'bubble', name: 'Bubble' },
  { type: 'glassmorphism', name: 'Glass' },
];

export const EFFECT_PRESETS: EffectOption[] = [
  { type: 'glassmorphism', name: 'Glassmorphism' },
  { type: 'neon', name: 'Neon' },
  { type: 'holographic', name: 'Holographic' },
  { type: 'minimal', name: 'Minimal' },
  { type: 'aurora', name: 'Aurora' },
  { type: 'cyberpunk', name: 'Cyberpunk' },
];

export const AVATAR_SIZE_LABELS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
};
