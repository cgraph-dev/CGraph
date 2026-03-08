/**
 * Customization Store - API Schema Mapping & Persistence
 *
 * Contains the API schema mapper (camelCase <-> snake_case),
 * debounced save logic, and persistence configuration.
 *
 * @version 2.0.0
 * @since v0.9.7
 */

import { api } from '@/lib/api';
import { createSchemaMapper, createDebouncedSave } from '@/lib/storeHelpers';

import type { CustomizationState, CustomizationStore } from './customizationStore.types';

// Re-export CustomizationState for use by the schema mapper
export type { CustomizationState };

// =============================================================================
// API SCHEMA MAPPING
// =============================================================================

export const apiSchemaMapper = createSchemaMapper<CustomizationState>({
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

  // Display Name Style
  displayNameFont: 'display_name_font',
  displayNameEffect: 'display_name_effect',
  displayNameColor: 'display_name_color',
  displayNameSecondaryColor: 'display_name_secondary_color',

  // Nameplate & Profile Effect
  equippedNameplate: 'equipped_nameplate',
  equippedProfileEffect: 'equipped_profile_effect',

  // Profile Theme Preset
  profileThemePresetId: 'profile_theme_preset_id',
  profileThemePrimary: 'profile_theme_primary',
  profileThemeAccent: 'profile_theme_accent',
});

// =============================================================================
// DEBOUNCED SAVE
// =============================================================================

export const debouncedSave = createDebouncedSave<CustomizationStore>(
  async (state, _set) => {
    const payload = apiSchemaMapper.toApi(state);
    await api.patch('/api/v1/me/customizations', payload);
  },
  { delay: 1000 }
);

// =============================================================================
// PERSISTENCE CONFIG
// =============================================================================

export const PERSIST_PARTIALIZE = (state: CustomizationStore) => ({
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
  displayNameFont: state.displayNameFont,
  displayNameEffect: state.displayNameEffect,
  displayNameColor: state.displayNameColor,
  displayNameSecondaryColor: state.displayNameSecondaryColor,
  equippedNameplate: state.equippedNameplate,
  equippedProfileEffect: state.equippedProfileEffect,
  profileThemePresetId: state.profileThemePresetId,
  profileThemePrimary: state.profileThemePrimary,
  profileThemeAccent: state.profileThemeAccent,
});
