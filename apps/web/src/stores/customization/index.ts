/**
 * Unified Customization Store
 *
 * Consolidates: customizationStore, customizationStoreV2, unifiedCustomizationStore
 *
 * Features:
 * - Single source of truth for all customizations
 * - Optimistic updates with rollback on error
 * - Debounced saves to reduce API calls
 * - Type-safe schema mapping (camelCase <-> snake_case)
 * - Efficient toggle/setter factories
 *
 * @version 2.0.0
 * @since v0.9.7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { safeLocalStorage } from '@/lib/safeStorage';
import { createToggle, createSchemaMapper, createDebouncedSave } from '@/stores/utils/storeHelpers';

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

interface CustomizationActions {
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

const DEFAULT_STATE: CustomizationState = {
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

// =============================================================================
// API SCHEMA MAPPING
// =============================================================================

const apiSchemaMapper = createSchemaMapper<CustomizationState>({
  // Theme
  themePreset: 'theme_preset',
  effectPreset: 'effect_preset',
  animationSpeed: 'animation_speed',
  particlesEnabled: 'particles_enabled',
  glowEnabled: 'glow_enabled',
  blurEnabled: 'blur_enabled',
  animatedBackground: 'animated_background',

  // Avatar
  avatarBorderType: 'avatar_border_type',
  avatarBorderColor: 'avatar_border_color',
  avatarSize: 'avatar_size',
  selectedBorderTheme: 'selected_border_theme',
  selectedBorderId: 'selected_border_id',

  // Chat
  chatBubbleStyle: 'chat_bubble_style',
  chatBubbleColor: 'chat_bubble_color',
  bubbleBorderRadius: 'bubble_border_radius',
  bubbleShadowIntensity: 'bubble_shadow_intensity',
  bubbleEntranceAnimation: 'bubble_entrance_animation',
  bubbleGlassEffect: 'bubble_glass_effect',
  bubbleShowTail: 'bubble_show_tail',
  bubbleHoverEffect: 'bubble_hover_effect',
  groupMessages: 'group_messages',
  showTimestamps: 'show_timestamps',
  compactMode: 'compact_mode',

  // Profile
  profileCardStyle: 'profile_card_style',
  selectedProfileThemeId: 'selected_profile_theme_id',
  showBadges: 'show_badges',
  showBio: 'show_bio',
  showStatus: 'show_status',
  glowEffects: 'glow_effects',
  particleEffects: 'particle_effects',

  // Identity
  equippedTitle: 'equipped_title',
  equippedBadges: 'equipped_badges',
});

// =============================================================================
// DEBOUNCED SAVE
// =============================================================================

const debouncedSave = createDebouncedSave(
  async (state, _set) => {
    const payload = apiSchemaMapper.toApi(state);
    await api.put('/api/v1/me/customizations', payload);
  },
  { delay: 1000 }
);

// =============================================================================
// STORE CREATION
// =============================================================================

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      // === Batch Update ===
      updateSettings: (updates) => set({ ...updates, isDirty: true }),

      // === Theme Actions ===
      setTheme: (preset) => set({ themePreset: preset, isDirty: true }),
      setEffect: (preset) => set({ effectPreset: preset, isDirty: true }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed, isDirty: true }),
      toggleParticles: createToggle(set, 'particlesEnabled'),
      toggleGlow: createToggle(set, 'glowEnabled'),
      toggleBlur: createToggle(set, 'blurEnabled'),
      toggleAnimatedBackground: createToggle(set, 'animatedBackground'),

      // === Avatar Actions ===
      setAvatarBorder: (type) => set({ avatarBorderType: type, avatarBorder: type, isDirty: true }),
      setAvatarBorderColor: (color) => set({ avatarBorderColor: color, isDirty: true }),
      setAvatarSize: (size) => set({ avatarSize: size, isDirty: true }),
      selectBorderTheme: (theme) => set({ selectedBorderTheme: theme, isDirty: true }),
      selectBorderId: (id) => set({ selectedBorderId: id, isDirty: true }),

      // === Chat Actions ===
      setChatBubbleStyle: (style) =>
        set({ chatBubbleStyle: style, bubbleStyle: style, isDirty: true }),
      setChatBubbleColor: (color) =>
        set({ chatBubbleColor: color, chatTheme: color, isDirty: true }),
      setBubbleBorderRadius: (radius) => set({ bubbleBorderRadius: radius, isDirty: true }),
      setBubbleShadowIntensity: (intensity) =>
        set({ bubbleShadowIntensity: intensity, isDirty: true }),
      setBubbleAnimation: (animation) =>
        set({ bubbleEntranceAnimation: animation, messageEffect: animation, isDirty: true }),
      toggleBubbleGlass: createToggle(set, 'bubbleGlassEffect'),
      toggleBubbleTail: createToggle(set, 'bubbleShowTail'),
      toggleBubbleHover: createToggle(set, 'bubbleHoverEffect'),
      toggleGroupMessages: createToggle(set, 'groupMessages'),
      toggleTimestamps: createToggle(set, 'showTimestamps'),
      toggleCompactMode: createToggle(set, 'compactMode'),

      // === Profile Actions ===
      setProfileCardStyle: (style) =>
        set({ profileCardStyle: style, profileLayout: style, isDirty: true }),
      setProfileTheme: (themeId) =>
        set({ selectedProfileThemeId: themeId, profileTheme: themeId, isDirty: true }),
      toggleBadges: createToggle(set, 'showBadges'),
      toggleBio: createToggle(set, 'showBio'),
      toggleStatus: createToggle(set, 'showStatus'),
      toggleGlowEffects: createToggle(set, 'glowEffects'),
      toggleParticleEffects: createToggle(set, 'particleEffects'),
      setEquippedTitle: (titleId) => set({ equippedTitle: titleId, title: titleId, isDirty: true }),
      setEquippedBadges: (badgeIds) => set({ equippedBadges: badgeIds, isDirty: true }),

      // === Legacy Batch Update Methods ===
      updateChatStyle: (key, value) => set({ [key]: value, isDirty: true }),
      updateEffects: (key, value) => set({ [key]: value, isDirty: true }),
      updateIdentity: (key, value) => set({ [key]: value, isDirty: true }),
      updateTheme: (key, value) => set({ [key]: value, isDirty: true }),

      // === Sync Actions ===
      fetchCustomizations: async (_userId?: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get('/api/v1/me/customizations');
          const data = response.data.data;
          const parsed = apiSchemaMapper.fromApi(data, DEFAULT_STATE);

          set({
            ...parsed,
            isLoading: false,
            lastSyncedAt: Date.now(),
            isDirty: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load';
          console.error('Failed to fetch customizations:', error);
          set({ isLoading: false, error: message });
        }
      },

      saveCustomizations: async (_userId?: string) => {
        const state = get();
        debouncedSave(state, set);
      },

      resetToDefaults: () => set({ ...DEFAULT_STATE, isDirty: true }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cgraph-customization',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        themePreset: state.themePreset,
        effectPreset: state.effectPreset,
        animationSpeed: state.animationSpeed,
        particlesEnabled: state.particlesEnabled,
        glowEnabled: state.glowEnabled,
        blurEnabled: state.blurEnabled,
        animatedBackground: state.animatedBackground,
        avatarBorderType: state.avatarBorderType,
        avatarBorderColor: state.avatarBorderColor,
        avatarSize: state.avatarSize,
        selectedBorderTheme: state.selectedBorderTheme,
        selectedBorderId: state.selectedBorderId,
        chatBubbleStyle: state.chatBubbleStyle,
        chatBubbleColor: state.chatBubbleColor,
        bubbleBorderRadius: state.bubbleBorderRadius,
        bubbleShadowIntensity: state.bubbleShadowIntensity,
        bubbleEntranceAnimation: state.bubbleEntranceAnimation,
        bubbleGlassEffect: state.bubbleGlassEffect,
        bubbleShowTail: state.bubbleShowTail,
        bubbleHoverEffect: state.bubbleHoverEffect,
        groupMessages: state.groupMessages,
        showTimestamps: state.showTimestamps,
        compactMode: state.compactMode,
        profileCardStyle: state.profileCardStyle,
        selectedProfileThemeId: state.selectedProfileThemeId,
        showBadges: state.showBadges,
        showBio: state.showBio,
        showStatus: state.showStatus,
        glowEffects: state.glowEffects,
        particleEffects: state.particleEffects,
        equippedTitle: state.equippedTitle,
        equippedBadges: state.equippedBadges,
      }),
    }
  )
);

// =============================================================================
// INDIVIDUAL SELECTORS
// =============================================================================
// IMPORTANT: Always use individual primitive selectors to avoid infinite render loops.
// Object-returning selectors create new references on every render, breaking React.
// Pattern: useCustomizationStore(s => s.fieldName)

// Theme selectors
export const useThemePreset = () => useCustomizationStore((s) => s.themePreset);
export const useEffectPreset = () => useCustomizationStore((s) => s.effectPreset);
export const useAnimationSpeed = () => useCustomizationStore((s) => s.animationSpeed);
export const useParticlesEnabled = () => useCustomizationStore((s) => s.particlesEnabled);
export const useGlowEnabled = () => useCustomizationStore((s) => s.glowEnabled);
export const useBlurEnabled = () => useCustomizationStore((s) => s.blurEnabled);
export const useAnimatedBackground = () => useCustomizationStore((s) => s.animatedBackground);

// Avatar selectors
export const useAvatarBorderType = () => useCustomizationStore((s) => s.avatarBorderType);
export const useAvatarBorderColor = () => useCustomizationStore((s) => s.avatarBorderColor);
export const useAvatarSize = () => useCustomizationStore((s) => s.avatarSize);

// Chat selectors
export const useChatBubbleStyle = () => useCustomizationStore((s) => s.chatBubbleStyle);
export const useChatBubbleColor = () => useCustomizationStore((s) => s.chatBubbleColor);
export const useBubbleBorderRadius = () => useCustomizationStore((s) => s.bubbleBorderRadius);
export const useBubbleGlassEffect = () => useCustomizationStore((s) => s.bubbleGlassEffect);
export const useBubbleShowTail = () => useCustomizationStore((s) => s.bubbleShowTail);
export const useGroupMessages = () => useCustomizationStore((s) => s.groupMessages);
export const useShowTimestamps = () => useCustomizationStore((s) => s.showTimestamps);
export const useCompactMode = () => useCustomizationStore((s) => s.compactMode);

// Profile selectors
export const useProfileCardStyle = () => useCustomizationStore((s) => s.profileCardStyle);
export const useShowBadges = () => useCustomizationStore((s) => s.showBadges);
export const useShowBio = () => useCustomizationStore((s) => s.showBio);
export const useShowStatus = () => useCustomizationStore((s) => s.showStatus);
export const useEquippedTitle = () => useCustomizationStore((s) => s.equippedTitle);
export const useEquippedBadges = () => useCustomizationStore((s) => s.equippedBadges);

// Sync state selectors
export const useIsLoading = () => useCustomizationStore((s) => s.isLoading);
export const useIsSaving = () => useCustomizationStore((s) => s.isSaving);
export const useIsDirty = () => useCustomizationStore((s) => s.isDirty);
export const useSyncError = () => useCustomizationStore((s) => s.error);

// Helper to get theme colors for a preset
export function getThemeColors(preset: ThemePreset): typeof THEME_COLORS.emerald {
  return THEME_COLORS[preset];
}

// Convenience hooks that combine a selector with getThemeColors
// Usage: const colors = useChatThemeColors();
export function useChatThemeColors(): typeof THEME_COLORS.emerald {
  const color = useChatBubbleColor();
  return THEME_COLORS[color];
}

export function useAvatarThemeColors(): typeof THEME_COLORS.emerald {
  const color = useAvatarBorderColor();
  return THEME_COLORS[color];
}

/**
 * @deprecated Use individual selectors instead. Object selectors cause infinite render loops.
 * Example: useCustomizationStore(s => s.chatBubbleStyle) instead of useChatSettings()
 */
export const useChatSettings = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[useChatSettings] Deprecated: Use individual selectors like useChatBubbleStyle() instead. ' +
        'Object selectors cause infinite render loops.'
    );
  }
  return useCustomizationStore.getState();
};

/**
 * @deprecated Use individual selectors instead. Object selectors cause infinite render loops.
 */
export const useThemeSettings = useChatSettings;
export const useAvatarSettings = useChatSettings;
export const useProfileSettings = useChatSettings;
export const useSyncState = useChatSettings;

// =============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// =============================================================================

// Re-export with old names for gradual migration
export const useCustomizationStoreV2 = useCustomizationStore;
export const themeColors = THEME_COLORS;
export const avatarBorders = AVATAR_BORDERS;
export const rarityColors = RARITY_COLORS;

export default useCustomizationStore;
