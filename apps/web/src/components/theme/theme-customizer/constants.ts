/**
 * Theme Customizer Constants
 *
 * Configuration options for theme customization.
 */

import { SwatchIcon, SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import type {
  TabDefinition,
  AvatarBorderOption,
  BubbleStyleOption,
  EffectOption,
  QuickPresetOption,
} from './types';

// =============================================================================
// TAB DEFINITIONS
// =============================================================================

export const TABS: TabDefinition[] = [
  { id: 'colors', label: 'Colors', icon: SwatchIcon },
  { id: 'avatar', label: 'Avatar', icon: SparklesIcon },
  { id: 'bubbles', label: 'Bubbles', icon: SparklesIcon },
  { id: 'effects', label: 'Effects', icon: AdjustmentsHorizontalIcon },
];

// =============================================================================
// AVATAR BORDER OPTIONS
// =============================================================================

export const AVATAR_BORDER_OPTIONS: AvatarBorderOption[] = [
  { value: 'none', label: 'None', tier: 'free' },
  { value: 'static', label: 'Static', tier: 'free' },
  { value: 'glow', label: 'Glow', tier: 'free' },
  { value: 'pulse', label: 'Pulse', tier: 'premium' },
  { value: 'rotate', label: 'Rotate', tier: 'premium' },
  { value: 'fire', label: 'Fire', tier: 'premium' },
  { value: 'ice', label: 'Ice', tier: 'premium' },
  { value: 'electric', label: 'Electric', tier: 'premium' },
  { value: 'legendary', label: 'Legendary', tier: 'enterprise' },
  { value: 'mythic', label: 'Mythic', tier: 'enterprise' },
];

// =============================================================================
// BUBBLE STYLE OPTIONS
// =============================================================================

export const BUBBLE_STYLE_OPTIONS: BubbleStyleOption[] = [
  { value: 'default', label: 'Default', tier: 'free' },
  { value: 'rounded', label: 'Rounded', tier: 'free' },
  { value: 'sharp', label: 'Sharp', tier: 'free' },
  { value: 'cloud', label: 'Cloud', tier: 'premium' },
  { value: 'modern', label: 'Modern', tier: 'premium' },
  { value: 'retro', label: 'Retro', tier: 'premium' },
  { value: 'bubble', label: 'Bubble', tier: 'premium' },
  { value: 'glassmorphism', label: 'Glass', tier: 'enterprise' },
];

// =============================================================================
// EFFECT OPTIONS
// =============================================================================

export const EFFECT_OPTIONS: EffectOption[] = [
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple', tier: 'free' },
  {
    value: 'glassmorphism',
    label: 'Glassmorphism',
    description: 'Frosted glass effect',
    tier: 'free',
  },
  { value: 'neon', label: 'Neon', description: 'Vibrant glow effects', tier: 'premium' },
  { value: 'aurora', label: 'Aurora', description: 'Flowing color waves', tier: 'premium' },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Futuristic tech aesthetic',
    tier: 'enterprise',
  },
  {
    value: 'holographic',
    label: 'Holographic',
    description: 'Rainbow light effects',
    tier: 'enterprise',
  },
];

// =============================================================================
// QUICK PRESETS
// =============================================================================

export const QUICK_PRESETS: QuickPresetOption[] = [
  { name: 'Minimal', value: 'minimal' },
  { name: 'Modern', value: 'modern' },
  { name: 'Vibrant', value: 'vibrant' },
  { name: 'Elegant', value: 'elegant' },
  { name: 'Gaming', value: 'gaming' },
];
