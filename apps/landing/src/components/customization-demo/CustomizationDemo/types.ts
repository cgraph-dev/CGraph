/**
 * Types and interfaces for CustomizationDemo
 *
 * @module components/landing/CustomizationDemo/types
 */

// =============================================================================
// TYPES
// =============================================================================

export type ThemePreset =
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'gold'
  | 'crimson'
  | 'arctic';

export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type AvatarBorderType =
  | 'none'
  | 'static'
  | 'glow'
  | 'pulse'
  | 'rotate'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'legendary'
  | 'mythic';

export type ChatBubbleStyle = 'default' | 'rounded' | 'sharp' | 'cloud' | 'modern' | 'retro';
export type ProfileCardStyle = 'minimal' | 'detailed' | 'compact' | 'expanded' | 'gaming';
export type DemoPanel = 'theme' | 'avatar' | 'chat' | 'profile';

export interface DemoState {
  theme: ThemePreset;
  effect: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
  // Avatar customization
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ThemePreset;
  selectedBorderTheme?: 'free' | 'premium' | 'enterprise' | 'legendary' | 'mythic';
  selectedBorderId?: string;
  selectedProfileThemeId?: string;
  // Chat customization
  chatBubbleStyle: ChatBubbleStyle;
  chatBubbleColor: ThemePreset;
  bubbleBorderRadius?: number;
  bubbleShadowIntensity?: number;
  bubbleEntranceAnimation?: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  bubbleGlassEffect?: boolean;
  bubbleShowTail?: boolean;
  bubbleHoverEffect?: boolean;
  groupMessages?: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  // Profile customization
  profileCardStyle: ProfileCardStyle;
  showBadges: boolean;
  showStatus: boolean;
  animatedBackground: boolean;
}

export interface ThemeColorConfig {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

export interface AvatarBorderConfig {
  name: string;
  description: string;
  premium: boolean;
  rarity?: string;
}

export interface AnimatedAvatarProps {
  borderType: AvatarBorderType;
  borderColor: ThemePreset;
  speedMultiplier: number;
  size?: string;
}

export interface ProfileThemeShowcaseProps {
  theme: string;
  colors?: { primary: string; secondary: string; glow: string };
  selectedThemeId?: string;
  onThemeSelect: (themeId: string) => void;
}

export interface ProfileThemeConfig {
  id: string;
  name: string;
  icon: string;
  tier: 'free' | 'premium' | 'enterprise';
  background: {
    type: 'gradient' | 'animated' | 'particle' | 'geometric';
    colors: string[];
    animation?: string;
  };
  effects: {
    particles?: { count: number; type: string; behavior: string };
    overlay?: string;
    glow?: string;
    border?: string;
  };
  previewDescription?: string;
}
