/**
 * Theme Store - Preset Data
 *
 * All color definitions, theme presets, profile card configs, chat bubble presets,
 * and category classification. Pure data — no store logic.
 *
 * @module stores/theme/presets
 * @version 2.0.0
 * @since v0.9.7
 */

import { createConfigPresets, classifyByRules } from '@/lib/storeHelpers';
import type {
  ColorPreset,
  ColorDefinition,
  ProfileCardConfig,
  ThemePresetConfig,
  ChatBubbleConfig,
} from './types';

// =============================================================================
// SHARED COLOR DEFINITIONS (Single source of truth)
// =============================================================================

export const COLORS: Record<ColorPreset, ColorDefinition> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
    gradient: 'from-purple-500 to-purple-600',
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    name: 'Cyan',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
    gradient: 'from-orange-500 to-orange-600',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
    name: 'Pink',
    gradient: 'from-pink-500 to-pink-600',
  },
  gold: {
    primary: '#eab308',
    secondary: '#facc15',
    glow: 'rgba(234, 179, 8, 0.5)',
    name: 'Gold',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
    gradient: 'from-red-500 to-red-600',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
    gradient: 'from-sky-400 to-sky-500',
  },
  sunset: {
    primary: '#f59e0b',
    secondary: '#f97316',
    glow: 'rgba(245, 158, 11, 0.5)',
    name: 'Sunset',
    gradient: 'from-amber-500 to-orange-500',
  },
  midnight: {
    primary: '#4c1d95',
    secondary: '#6b21a8',
    glow: 'rgba(76, 29, 149, 0.5)',
    name: 'Midnight',
    gradient: 'from-purple-900 to-purple-800',
  },
  forest: {
    primary: '#059669',
    secondary: '#10b981',
    glow: 'rgba(5, 150, 105, 0.5)',
    name: 'Forest',
    gradient: 'from-emerald-600 to-emerald-500',
  },
  ocean: {
    primary: '#0284c7',
    secondary: '#0ea5e9',
    glow: 'rgba(2, 132, 199, 0.5)',
    name: 'Ocean',
    gradient: 'from-sky-600 to-sky-500',
  },
};

// =============================================================================
// PROFILE CARD CONFIGS (Using factory pattern)
// =============================================================================

const BASE_CARD_CONFIG: ProfileCardConfig = {
  layout: 'detailed',
  showLevel: true,
  showXp: true,
  showKarma: true,
  showStreak: true,
  showBadges: true,
  maxBadges: 5,
  showTitle: true,
  showBio: true,
  showStats: true,
  showRecentActivity: true,
  showMutualFriends: true,
  showForumsInCommon: true,
  showAchievements: true,
  showSocialLinks: true,
};

export const PROFILE_CARD_CONFIGS = createConfigPresets(BASE_CARD_CONFIG, {
  minimal: {
    layout: 'minimal',
    showLevel: false,
    showXp: false,
    showKarma: false,
    showStreak: false,
    showBadges: false,
    maxBadges: 0,
    showBio: false,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  compact: {
    layout: 'compact',
    showXp: false,
    showKarma: false,
    showStreak: false,
    maxBadges: 3,
    showBio: false,
    showStats: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showAchievements: false,
    showSocialLinks: false,
  },
  detailed: { layout: 'detailed', showMutualFriends: false, showForumsInCommon: false },
  gaming: {
    layout: 'gaming',
    showKarma: false,
    showBio: false,
    showRecentActivity: false,
    showMutualFriends: false,
    showForumsInCommon: false,
    showSocialLinks: false,
  },
  social: {
    layout: 'social',
    showLevel: false,
    showXp: false,
    maxBadges: 3,
    showStats: false,
    showAchievements: false,
  },
  creator: {
    layout: 'creator',
    showXp: false,
    showStreak: false,
    showMutualFriends: false,
    showForumsInCommon: false,
  },
  custom: { layout: 'custom' },
});

// =============================================================================
// THEME PRESETS
// =============================================================================

export const THEME_PRESETS: Record<string, ThemePresetConfig> = {
  'minimalist-dark': {
    name: 'Minimalist Dark',
    colors: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      accent: '#3b82f6',
      background: '#0a0a0a',
      surface: '#171717',
      text: '#ffffff',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#0a0a0a' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
  },
  'minimalist-light': {
    name: 'Minimalist Light',
    colors: {
      primary: '#000000',
      secondary: '#525252',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#171717',
      textMuted: '#737373',
    },
    background: { type: 'color', value: '#ffffff' },
    cardLayout: 'minimal',
    hoverEffect: 'scale',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: false,
    borderRadius: 'lg',
    showParticles: false,
  },
  'cyberpunk-neon': {
    name: 'Cyberpunk Neon',
    colors: {
      primary: '#00f0ff',
      secondary: '#ff00ff',
      accent: '#fcee0a',
      background: '#0a0a0f',
      surface: '#15151f',
      text: '#ffffff',
      textMuted: '#666680',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a0a0f, #15151f, #0a0a0f)',
      overlay: true,
      overlayOpacity: 0.1,
    },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Rajdhani", sans-serif',
    glassmorphism: true,
    borderRadius: 'none',
    showParticles: true,
    particleType: 'glitch',
  },
  'gradient-aurora': {
    name: 'Gradient Aurora',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#a855f7',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: {
      type: 'animated',
      value: 'aurora',
      overlay: true,
      overlayOpacity: 0.3,
    },
    cardLayout: 'detailed',
    hoverEffect: 'glow',
    fontFamily: 'Inter, sans-serif',
    glassmorphism: true,
    borderRadius: 'lg',
    showParticles: true,
    particleType: 'stars',
  },
  'gaming-rgb': {
    name: 'Gaming RGB',
    colors: {
      primary: '#22c55e',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
    },
    background: { type: 'animated', value: 'rgb-gradient' },
    cardLayout: 'gaming',
    hoverEffect: 'glow',
    fontFamily: '"Orbitron", sans-serif',
    glassmorphism: true,
    borderRadius: 'md',
    showParticles: true,
    particleType: 'spark',
  },
};

// =============================================================================
// PRESET CATEGORY CLASSIFICATION
// =============================================================================

const CATEGORY_RULES = [
  { test: (k: string) => k.includes('dark'), category: 'Dark' },
  { test: (k: string) => k.includes('light'), category: 'Light' },
  { test: (k: string) => k.includes('cyberpunk') || k.includes('neon'), category: 'Futuristic' },
  { test: (k: string) => k.includes('matrix') || k.includes('hacker'), category: 'Tech' },
  { test: (k: string) => k.includes('synthwave') || k.includes('retro'), category: 'Retro' },
  { test: (k: string) => k.includes('gaming'), category: 'Gaming' },
  { test: (k: string) => k.includes('nature') || k.includes('forest'), category: 'Nature' },
];

export function getPresetCategory(presetId: string): string {
  return classifyByRules(presetId, CATEGORY_RULES, 'General');
}

// =============================================================================
// CHAT BUBBLE PRESETS
// =============================================================================

export const DEFAULT_CHAT_BUBBLE: ChatBubbleConfig = {
  ownMessageBg: '#10b981',
  otherMessageBg: '#374151',
  ownMessageText: '#ffffff',
  otherMessageText: '#ffffff',
  useGradient: true,
  gradientDirection: 'diagonal',
  borderRadius: 16,
  bubbleShape: 'rounded',
  showTail: true,
  borderStyle: 'none',
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 20,
  borderWidth: 0,
  entranceAnimation: 'slide',
  hoverEffect: true,
  maxWidth: 70,
  spacing: 4,
  showTimestamp: true,
  timestampPosition: 'inside',
  showAvatar: true,
  avatarSize: 'md',
  alignSent: 'right',
  alignReceived: 'left',
  groupMessages: true,
};

export const CHAT_BUBBLE_PRESETS: Record<string, Partial<ChatBubbleConfig>> = {
  default: {},
  minimal: {
    ownMessageBg: '#000000',
    otherMessageBg: '#1f2937',
    useGradient: false,
    borderRadius: 8,
    bubbleShape: 'sharp',
    showTail: false,
    glassEffect: false,
    shadowIntensity: 0,
    entranceAnimation: 'fade',
    hoverEffect: false,
  },
  modern: {
    ownMessageBg: '#8b5cf6',
    useGradient: true,
    borderRadius: 20,
    bubbleShape: 'super-rounded',
    showTail: false,
    glassEffect: true,
    glassBlur: 15,
    shadowIntensity: 40,
    entranceAnimation: 'scale',
    hoverEffect: true,
  },
  glass: {
    ownMessageBg: '#10b98150',
    otherMessageBg: '#37415150',
    useGradient: true,
    showTail: false,
    glassEffect: true,
    glassBlur: 20,
    shadowIntensity: 50,
    borderWidth: 1,
    entranceAnimation: 'fade',
    hoverEffect: true,
  },
};

// =============================================================================
// DEFAULT STATE
// =============================================================================

export { type ThemeState } from './types';

export const DEFAULT_THEME_STATE = {
  colorPreset: 'emerald' as const,
  profileThemeId: 'minimalist-dark',
  profileCardLayout: 'detailed',
  chatBubble: DEFAULT_CHAT_BUBBLE,
  chatBubbleStyle: 'default' as const,
  chatBubbleColor: 'emerald' as const,
  avatarBorder: 'glow' as const,
  avatarBorderColor: 'emerald' as const,
  activeForumThemeId: null,
  effectPreset: 'glassmorphism' as const,
  animationSpeed: 'normal' as const,
  particlesEnabled: true,
  glowEnabled: true,
  animatedBackground: false,
  isPremium: false,
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getColorsForPreset(preset: ColorPreset): ColorDefinition {
  return COLORS[preset];
}

export function getProfileCardConfigForLayout(
  layout: keyof typeof PROFILE_CARD_CONFIGS
): ProfileCardConfig {
  const config = PROFILE_CARD_CONFIGS[layout];
  return config ?? PROFILE_CARD_CONFIGS.minimal!;
}

export function getThemePreset(themeId: string): ThemePresetConfig | undefined {
  return THEME_PRESETS[themeId];
}
