/**
 * Customization Store - Type Definitions
 *
 * All type definitions, interfaces, and constant data
 * extracted from customizationStore.ts.
 *
 * @version 2.0.0
 * @since v0.9.7
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

export type ProfileCardStyle =
  | 'default'
  | 'minimal'
  | 'detailed'
  | 'compact'
  | 'expanded'
  | 'gaming'
  | 'card'
  | 'full'
  | 'premium';

export type BubbleAnimation = 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface CustomizationState {
  // === Theme Settings ===
  themePreset: ThemePreset;
  effectPreset: EffectPreset;
  animationSpeed: AnimationSpeed;
  particlesEnabled: boolean;
  glowEnabled: boolean;
  blurEnabled: boolean;
  animatedBackground: boolean;

  // === Avatar Settings ===
  avatarBorderType: AvatarBorderType;
  avatarBorderColor: ThemePreset;
  avatarSize: 'small' | 'medium' | 'large';
  selectedBorderTheme: string | null;
  selectedBorderId: string | null;

  // === Chat Settings ===
  chatBubbleStyle: ChatBubbleStyle;
  chatBubbleColor: ThemePreset;
  bubbleBorderRadius: number;
  bubbleShadowIntensity: number;
  bubbleEntranceAnimation: BubbleAnimation;
  bubbleGlassEffect: boolean;
  bubbleShowTail: boolean;
  bubbleHoverEffect: boolean;
  groupMessages: boolean;
  showTimestamps: boolean;
  compactMode: boolean;

  // === Profile Settings ===
  profileCardStyle: ProfileCardStyle;
  selectedProfileThemeId: string | null;
  showBadges: boolean;
  showBio: boolean;
  showStatus: boolean;
  glowEffects: boolean;
  particleEffects: boolean;

  // === Title & Badges ===
  equippedTitle: string | null;
  equippedBadges: string[];

  // === Display Name Style ===
  displayNameFont: string;
  displayNameEffect: string;
  displayNameColor: string;
  displayNameSecondaryColor: string | null;

  // === Nameplate & Profile Effect ===
  equippedNameplate: string | null;
  equippedProfileEffect: string | null;

  // === Profile Theme Preset ===
  profileThemePresetId: string | null;
  profileThemePrimary: string | null;
  profileThemeAccent: string | null;

  // === Legacy Aliases (for backward compatibility) ===
  chatTheme: ThemePreset; // alias for chatBubbleColor
  bubbleStyle: ChatBubbleStyle; // alias for chatBubbleStyle
  messageEffect: BubbleAnimation; // alias for bubbleEntranceAnimation
  avatarBorder: AvatarBorderType; // alias for avatarBorderType
  title: string | null; // alias for equippedTitle
  profileLayout: ProfileCardStyle; // alias for profileCardStyle
  profileTheme: string | null; // alias for selectedProfileThemeId
  particleEffect: string | null; // particle effect type
  backgroundEffect: string | null; // background effect type
  reactionStyle: string; // reaction animation style
  forumTheme: string | null; // forum theme identifier
  appTheme: ThemePreset; // app-wide theme (alias for themePreset)

  // === Sync State ===
  isLoading: boolean;
  isSaving: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  isDirty: boolean;
}

// =============================================================================
// ACTIONS INTERFACE
// =============================================================================

export interface CustomizationActions {
  // Batch update
  updateSettings: (updates: Partial<CustomizationState>) => void;

  // Theme actions
  setTheme: (preset: ThemePreset) => void;
  setEffect: (preset: EffectPreset) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleParticles: () => void;
  toggleGlow: () => void;
  toggleBlur: () => void;
  toggleAnimatedBackground: () => void;

  // Avatar actions
  setAvatarBorder: (type: AvatarBorderType) => void;
  setAvatarBorderColor: (color: ThemePreset) => void;
  setAvatarSize: (size: 'small' | 'medium' | 'large') => void;
  selectBorderTheme: (theme: string | null) => void;
  selectBorderId: (id: string | null) => void;

  // Chat actions
  setChatBubbleStyle: (style: ChatBubbleStyle) => void;
  setChatBubbleColor: (color: ThemePreset) => void;
  setBubbleBorderRadius: (radius: number) => void;
  setBubbleShadowIntensity: (intensity: number) => void;
  setBubbleAnimation: (animation: BubbleAnimation) => void;
  toggleBubbleGlass: () => void;
  toggleBubbleTail: () => void;
  toggleBubbleHover: () => void;
  toggleGroupMessages: () => void;
  toggleTimestamps: () => void;
  toggleCompactMode: () => void;

  // Profile actions
  setProfileCardStyle: (style: ProfileCardStyle) => void;
  setProfileTheme: (themeId: string | null) => void;
  toggleBadges: () => void;
  toggleBio: () => void;
  toggleStatus: () => void;
  toggleGlowEffects: () => void;
  toggleParticleEffects: () => void;
  setEquippedTitle: (titleId: string | null) => void;
  setEquippedBadges: (badgeIds: string[]) => void;

  // Display name style actions
  setDisplayNameFont: (font: string) => void;
  setDisplayNameEffect: (effect: string) => void;
  setDisplayNameColor: (color: string) => void;
  setDisplayNameSecondaryColor: (color: string | null) => void;

  // Nameplate & profile effect actions
  setEquippedNameplate: (nameplateId: string | null) => void;
  setEquippedProfileEffect: (effectId: string | null) => void;

  // Profile theme preset actions
  setProfileThemePreset: (
    presetId: string | null,
    primary: string | null,
    accent: string | null
  ) => void;

  // Legacy batch update methods
  updateChatStyle: (key: string, value: unknown) => void;
  updateEffects: (key: string, value: unknown) => void;
  updateIdentity: (key: string, value: unknown) => void;
  updateTheme: (key: string, value: unknown) => void;

  // Sync actions
  fetchCustomizations: (userId?: string) => Promise<void>;
  saveCustomizations: (userId?: string) => Promise<void>;
  resetToDefaults: () => void;
  clearError: () => void;
}

export type CustomizationStore = CustomizationState & CustomizationActions;

// =============================================================================
// THEME COLORS
// =============================================================================

export const THEME_COLORS: Record<ThemePreset, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    name: 'Cyan',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
    name: 'Pink',
  },
  gold: {
    primary: '#eab308',
    secondary: '#facc15',
    glow: 'rgba(234, 179, 8, 0.5)',
    name: 'Gold',
  },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
  },
};

// =============================================================================
// AVATAR BORDER DEFINITIONS
// =============================================================================

export const AVATAR_BORDERS: Record<
  AvatarBorderType,
  { name: string; description: string; premium: boolean; rarity?: string }
> = {
  none: { name: 'None', description: 'No border', premium: false },
  static: { name: 'Static', description: 'Simple colored border', premium: false },
  glow: { name: 'Glow', description: 'Soft glowing effect', premium: false },
  pulse: { name: 'Pulse', description: 'Rhythmic pulsing glow', premium: false },
  rotate: { name: 'Orbit', description: 'Rotating gradient ring', premium: true, rarity: 'Rare' },
  fire: { name: 'Inferno', description: 'Animated flame effect', premium: true, rarity: 'Epic' },
  ice: { name: 'Frost', description: 'Crystalline ice particles', premium: true, rarity: 'Epic' },
  electric: {
    name: 'Storm',
    description: 'Electric sparks and arcs',
    premium: true,
    rarity: 'Epic',
  },
  legendary: {
    name: 'Legendary',
    description: 'Multi-layered animated aura',
    premium: true,
    rarity: 'Legendary',
  },
  mythic: {
    name: 'Mythic',
    description: 'Reality-bending void effect',
    premium: true,
    rarity: 'Mythic',
  },
};

export const RARITY_COLORS: Record<string, string> = {
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};

// =============================================================================
// DEFAULT STATE
// =============================================================================

export const DEFAULT_STATE: CustomizationState = {
  // Theme
  themePreset: 'emerald',
  effectPreset: 'glassmorphism',
  animationSpeed: 'normal',
  particlesEnabled: true,
  glowEnabled: true,
  blurEnabled: true,
  animatedBackground: false,

  // Avatar
  avatarBorderType: 'glow',
  avatarBorderColor: 'emerald',
  avatarSize: 'medium',
  selectedBorderTheme: null,
  selectedBorderId: null,

  // Chat
  chatBubbleStyle: 'default',
  chatBubbleColor: 'emerald',
  bubbleBorderRadius: 16,
  bubbleShadowIntensity: 30,
  bubbleEntranceAnimation: 'fade',
  bubbleGlassEffect: true,
  bubbleShowTail: true,
  bubbleHoverEffect: true,
  groupMessages: true,
  showTimestamps: true,
  compactMode: false,

  // Profile
  profileCardStyle: 'default',
  selectedProfileThemeId: null,
  showBadges: true,
  showBio: true,
  showStatus: true,
  glowEffects: true,
  particleEffects: false,

  // Identity
  equippedTitle: null,
  equippedBadges: [],

  // Display Name Style
  displayNameFont: 'default',
  displayNameEffect: 'solid',
  displayNameColor: '#ffffff',
  displayNameSecondaryColor: null,

  // Nameplate & Profile Effect
  equippedNameplate: null,
  equippedProfileEffect: null,

  // Profile Theme Preset
  profileThemePresetId: null,
  profileThemePrimary: null,
  profileThemeAccent: null,

  // Legacy Aliases (computed at runtime, but need defaults for type safety)
  chatTheme: 'emerald',
  bubbleStyle: 'default',
  messageEffect: 'fade',
  avatarBorder: 'glow',
  title: null,
  profileLayout: 'default',
  profileTheme: null,
  particleEffect: null,
  backgroundEffect: null,
  reactionStyle: 'default',
  forumTheme: null,
  appTheme: 'emerald',

  // Sync
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
  error: null,
  isDirty: false,
};
