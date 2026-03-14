/**
 * Theme Store - Type Definitions
 *
 * All types, interfaces, and union types for the unified theme system.
 *
 * @module stores/theme/types
 * @version 2.0.0
 * @since v0.9.7
 */

// =============================================================================
// SHARED TYPES
// =============================================================================

export type ColorPreset =
  | 'emerald'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'pink'
  | 'gold'
  | 'crimson'
  | 'arctic'
  | 'sunset'
  | 'midnight'
  | 'forest'
  | 'ocean';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'dramatic';

export interface ColorDefinition {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
  gradient: string;
}

// =============================================================================
// PROFILE CARD CONFIG
// =============================================================================

export interface ProfileCardConfig {
  layout: string;
  showLevel: boolean;
  showXp: boolean;
  showPulse: boolean;
  showStreak: boolean;
  showBadges: boolean;
  maxBadges: number;
  showTitle: boolean;
  showBio: boolean;
  showStats: boolean;
  showRecentActivity: boolean;
  showMutualFriends: boolean;
  showForumsInCommon: boolean;
  showAchievements: boolean;
  showSocialLinks: boolean;
}

// =============================================================================
// THEME PRESET CONFIG
// =============================================================================

export interface ThemePresetConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  background: {
    type: 'color' | 'gradient' | 'animated' | 'image';
    value: string;
    overlay?: boolean;
    overlayOpacity?: number;
  };
  cardLayout: string;
  hoverEffect: 'none' | 'scale' | 'tilt' | 'glow' | 'particles';
  fontFamily: string;
  glassmorphism: boolean;
  borderRadius: BorderRadius;
  showParticles: boolean;
  particleType?: string;
}

// =============================================================================
// CHAT BUBBLE TYPES
// =============================================================================

export interface ChatBubbleConfig {
  // Colors
  ownMessageBg: string;
  otherMessageBg: string;
  ownMessageText: string;
  otherMessageText: string;
  useGradient: boolean;
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';

  // Shape
  borderRadius: number;
  bubbleShape: 'rounded' | 'sharp' | 'super-rounded' | 'bubble' | 'modern';
  showTail: boolean;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'gradient';

  // Effects
  glassEffect: boolean;
  glassBlur: number;
  shadowIntensity: number;
  borderWidth: number;

  // Animations
  entranceAnimation: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  hoverEffect: boolean;

  // Layout
  maxWidth: number;
  spacing: number;
  showTimestamp: boolean;
  timestampPosition?: 'inside' | 'outside' | 'hover';
  showAvatar: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  alignSent?: 'left' | 'right';
  alignReceived?: 'left' | 'right';
  groupMessages: boolean;
}

// =============================================================================
// ADDITIONAL UNION TYPES
// =============================================================================

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

export type ChatBubbleStylePreset =
  | 'default'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'bubble'
  | 'glassmorphism';

export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

// =============================================================================
// LEGACY TYPES
// =============================================================================

export interface LegacyTheme {
  colorPreset: ColorPreset;
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ColorPreset;
  avatarSize?: 'sm' | 'md' | 'lg';
  chatBubbleStyle: ChatBubbleStylePreset;
  chatBubbleColor: ColorPreset;
  bubbleBorderRadius: number;
  bubbleShadowIntensity: number;
  bubbleGlassEffect: boolean;
  bubbleShowTail?: boolean;
  bubbleHoverEffect?: boolean;
  bubbleEntranceAnimation?: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  glowEnabled: boolean;
  blurEnabled?: boolean;
  particlesEnabled: boolean;
  animatedBackground?: boolean;
  effectPreset: EffectPreset;
  effect?: EffectPreset;
  animationSpeed: AnimationSpeed;
  isPremium: boolean;
}

// =============================================================================
// STORE STATE & ACTIONS
// =============================================================================

export interface ThemeState {
  // Global color theme
  colorPreset: ColorPreset;

  // Profile theme
  profileThemeId: string;
  profileCardLayout: string;

  // Chat bubble
  chatBubble: ChatBubbleConfig;
  chatBubbleStyle: ChatBubbleStylePreset;
  chatBubbleColor: ColorPreset;

  // Avatar
  avatarBorder: AvatarBorderType;
  avatarBorderColor: ColorPreset;

  // Forum theme (per-forum, stored separately)
  activeForumThemeId: string | null;

  // Global effects
  effectPreset: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  animatedBackground: boolean;

  // Premium status
  isPremium: boolean;

  // Sync state
  isLoading: boolean;
  isSaving: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

export interface ThemeActions {
  // Color theme
  setColorPreset: (preset: ColorPreset) => void;
  getColors: () => ColorDefinition;

  // Profile theme
  setProfileTheme: (themeId: string) => void;
  setProfileCardLayout: (layout: string) => void;
  getProfileCardConfig: () => ProfileCardConfig;

  // Chat bubble
  updateChatBubble: (updates: Partial<ChatBubbleConfig>) => void;
  applyChatBubblePreset: (preset: string) => void;
  resetChatBubble: () => void;

  // Effects
  setEffectPreset: (preset: ThemeState['effectPreset']) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleBlur: () => void;
  toggleAnimatedBackground: () => void;

  // Sync
  syncWithBackend: () => Promise<void>;
  saveToBackend: () => Promise<void>;
  clearError: () => void;

  // Legacy backward compatibility
  syncWithServer: (userId?: string) => Promise<void>;
  theme: LegacyTheme;
  updateTheme: (updates: Partial<LegacyTheme>) => void;
  setAvatarBorder: (border: AvatarBorderType) => void;
  setChatBubbleStyle: (style: ChatBubbleStylePreset) => void;
  setEffect: (effect: EffectPreset) => void;
  resetTheme: () => void;
  /** Reset store to initial state (standard naming convention) */
  reset: () => void;
  applyPreset: (preset: string) => void;

  // Export/Import
  exportTheme: () => string;
  importTheme: (json: string) => boolean;
}

export type ThemeStore = ThemeState & ThemeActions;

// =============================================================================
// USER THEME (for passing theme settings to components)
// =============================================================================

export interface UserTheme {
  colorPreset?: ColorPreset;
  avatarBorder?: AvatarBorderType;
  avatarBorderColor?: ColorPreset;
  chatBubbleColor?: ColorPreset;
  chatBubbleStyle?: string;
  animationSpeed?: AnimationSpeed;
  particlesEnabled?: boolean;
  glowEnabled?: boolean;
}
