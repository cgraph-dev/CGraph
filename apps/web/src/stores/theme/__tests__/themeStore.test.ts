// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useThemeStore } from '../themeStore';
import {
  COLORS,
  PROFILE_CARD_CONFIGS,
  THEME_PRESETS,
  CHAT_BUBBLE_PRESETS,
  DEFAULT_CHAT_BUBBLE,
  DEFAULT_THEME_STATE,
  getColorsForPreset,
  getPresetCategory,
  getThemePreset,
  getProfileCardConfigForLayout,
} from '../presets';
import {
  useColorPreset,
  useProfileThemeId,
  useProfileCardLayout,
  useEffectPresetValue,
  useAnimationSpeedValue,
  useParticlesEnabledValue,
  useGlowEnabledValue,
  useAnimatedBackgroundValue,
  useColorTheme,
  useProfileTheme,
  useChatBubbleTheme,
  useThemeEffects,
  THEME_COLORS,
} from '../selectors';

// Reset store before each test
beforeEach(() => {
  useThemeStore.setState(useThemeStore.getInitialState());
});

// =============================================================================
// INITIAL STATE
// =============================================================================

describe('themeStore initial state', () => {
  it('has correct default color preset', () => {
    expect(useThemeStore.getState().colorPreset).toBe('emerald');
  });

  it('has correct default profile theme and layout', () => {
    const state = useThemeStore.getState();
    expect(state.profileThemeId).toBe('minimalist-dark');
    expect(state.profileCardLayout).toBe('detailed');
  });

  it('has correct default effects', () => {
    const state = useThemeStore.getState();
    expect(state.effectPreset).toBe('glassmorphism');
    expect(state.animationSpeed).toBe('normal');
    expect(state.particlesEnabled).toBe(true);
    expect(state.glowEnabled).toBe(true);
    expect(state.animatedBackground).toBe(false);
  });

  it('has correct default sync state', () => {
    const state = useThemeStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isSaving).toBe(false);
    expect(state.lastSyncedAt).toBeNull();
    expect(state.error).toBeNull();
  });

  it('has default chat bubble config', () => {
    expect(useThemeStore.getState().chatBubble).toEqual(DEFAULT_CHAT_BUBBLE);
  });
});

// =============================================================================
// COLORS & PRESET HELPERS
// =============================================================================

describe('COLORS constant', () => {
  it('defines all 12 color presets', () => {
    const presets = Object.keys(COLORS);
    expect(presets).toHaveLength(12);
    expect(presets).toContain('emerald');
    expect(presets).toContain('midnight');
    expect(presets).toContain('ocean');
  });

  it('each color has required fields', () => {
    for (const color of Object.values(COLORS)) {
      expect(color).toHaveProperty('primary');
      expect(color).toHaveProperty('secondary');
      expect(color).toHaveProperty('glow');
      expect(color).toHaveProperty('name');
      expect(color).toHaveProperty('gradient');
    }
  });
});

describe('THEME_COLORS alias', () => {
  it('is the same reference as COLORS', () => {
    expect(THEME_COLORS).toBe(COLORS);
  });
});

describe('getColorsForPreset', () => {
  it('returns colors for a valid preset', () => {
    const colors = getColorsForPreset('purple');
    expect(colors.primary).toBe('#8b5cf6');
    expect(colors.name).toBe('Purple');
  });

  it('returns correct colors for every preset', () => {
    for (const [key, expected] of Object.entries(COLORS)) {
      expect(getColorsForPreset(key as any)).toEqual(expected);
    }
  });
});

describe('getPresetCategory', () => {
  it('classifies dark presets', () => {
    expect(getPresetCategory('minimalist-dark')).toBe('Dark');
  });

  it('classifies light presets', () => {
    expect(getPresetCategory('minimalist-light')).toBe('Light');
  });

  it('classifies futuristic presets', () => {
    expect(getPresetCategory('cyberpunk-neon')).toBe('Futuristic');
  });

  it('classifies gaming presets', () => {
    expect(getPresetCategory('gaming-rgb')).toBe('Gaming');
  });

  it('returns General for unknown presets', () => {
    expect(getPresetCategory('gradient-aurora')).toBe('General');
  });
});

// =============================================================================
// THEME PRESETS
// =============================================================================

describe('THEME_PRESETS & getThemePreset', () => {
  it('contains expected preset keys', () => {
    expect(THEME_PRESETS).toHaveProperty('minimalist-dark');
    expect(THEME_PRESETS).toHaveProperty('cyberpunk-neon');
    expect(THEME_PRESETS).toHaveProperty('gradient-aurora');
    expect(THEME_PRESETS).toHaveProperty('gaming-rgb');
  });

  it('getThemePreset returns config for a valid id', () => {
    const preset = getThemePreset('cyberpunk-neon');
    expect(preset).toBeDefined();
    expect(preset!.name).toBe('Cyberpunk Neon');
    expect(preset!.glassmorphism).toBe(true);
    expect(preset!.showParticles).toBe(true);
  });

  it('getThemePreset returns undefined for invalid id', () => {
    expect(getThemePreset('nonexistent')).toBeUndefined();
  });

  it('each preset has required structure', () => {
    for (const preset of Object.values(THEME_PRESETS)) {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('colors');
      expect(preset).toHaveProperty('background');
      expect(preset).toHaveProperty('cardLayout');
      expect(preset.colors).toHaveProperty('primary');
    }
  });
});

// =============================================================================
// PROFILE CARD CONFIGS
// =============================================================================

describe('PROFILE_CARD_CONFIGS & getProfileCardConfigForLayout', () => {
  it('has minimal, compact, detailed, gaming, social, creator, custom layouts', () => {
    for (const key of ['minimal', 'compact', 'detailed', 'gaming', 'social', 'creator', 'custom']) {
      expect(PROFILE_CARD_CONFIGS).toHaveProperty(key);
    }
  });

  it('minimal layout hides most sections', () => {
    const minimal = PROFILE_CARD_CONFIGS.minimal!;
    expect(minimal.showLevel).toBe(false);
    expect(minimal.showStats).toBe(false);
    expect(minimal.maxBadges).toBe(0);
  });

  it('getProfileCardConfigForLayout falls back to minimal for unknown layout', () => {
    const config = getProfileCardConfigForLayout('nonexistent' as any);
    expect(config).toEqual(PROFILE_CARD_CONFIGS.minimal);
  });
});

// =============================================================================
// CHAT BUBBLE PRESETS
// =============================================================================

describe('CHAT_BUBBLE_PRESETS', () => {
  it('contains default, minimal, modern, glass presets', () => {
    expect(CHAT_BUBBLE_PRESETS).toHaveProperty('default');
    expect(CHAT_BUBBLE_PRESETS).toHaveProperty('minimal');
    expect(CHAT_BUBBLE_PRESETS).toHaveProperty('modern');
    expect(CHAT_BUBBLE_PRESETS).toHaveProperty('glass');
  });

  it('default preset is an empty override', () => {
    expect(CHAT_BUBBLE_PRESETS.default).toEqual({});
  });

  it('minimal preset disables visual effects', () => {
    const minimal = CHAT_BUBBLE_PRESETS.minimal!;
    expect(minimal.glassEffect).toBe(false);
    expect(minimal.hoverEffect).toBe(false);
    expect(minimal.shadowIntensity).toBe(0);
  });
});

// =============================================================================
// STORE ACTIONS
// =============================================================================

describe('store actions', () => {
  it('setColorPreset updates the preset', () => {
    act(() => useThemeStore.getState().setColorPreset('purple'));
    expect(useThemeStore.getState().colorPreset).toBe('purple');
  });

  it('getColors returns colors for current preset', () => {
    act(() => useThemeStore.getState().setColorPreset('cyan'));
    expect(useThemeStore.getState().getColors()).toEqual(COLORS.cyan);
  });

  it('setAnimationSpeed updates speed', () => {
    act(() => useThemeStore.getState().setAnimationSpeed('fast'));
    expect(useThemeStore.getState().animationSpeed).toBe('fast');
  });

  it('setEffectPreset updates effect', () => {
    act(() => useThemeStore.getState().setEffectPreset('neon'));
    expect(useThemeStore.getState().effectPreset).toBe('neon');
  });

  it('toggleParticles flips value', () => {
    expect(useThemeStore.getState().particlesEnabled).toBe(true);
    act(() => useThemeStore.getState().toggleParticles());
    expect(useThemeStore.getState().particlesEnabled).toBe(false);
    act(() => useThemeStore.getState().toggleParticles());
    expect(useThemeStore.getState().particlesEnabled).toBe(true);
  });

  it('toggleGlow flips value', () => {
    act(() => useThemeStore.getState().toggleGlow());
    expect(useThemeStore.getState().glowEnabled).toBe(false);
  });

  it('toggleAnimatedBackground flips value', () => {
    act(() => useThemeStore.getState().toggleAnimatedBackground());
    expect(useThemeStore.getState().animatedBackground).toBe(true);
  });

  it('toggleBlur flips chatBubble glassEffect', () => {
    expect(useThemeStore.getState().chatBubble.glassEffect).toBe(false);
    act(() => useThemeStore.getState().toggleBlur());
    expect(useThemeStore.getState().chatBubble.glassEffect).toBe(true);
  });

  it('updateChatBubble merges partial updates', () => {
    act(() => useThemeStore.getState().updateChatBubble({ borderRadius: 24, showTail: false }));
    const bubble = useThemeStore.getState().chatBubble;
    expect(bubble.borderRadius).toBe(24);
    expect(bubble.showTail).toBe(false);
    expect(bubble.ownMessageBg).toBe(DEFAULT_CHAT_BUBBLE.ownMessageBg); // unchanged
  });

  it('applyChatBubblePreset applies preset config', () => {
    act(() => useThemeStore.getState().applyChatBubblePreset('minimal'));
    const bubble = useThemeStore.getState().chatBubble;
    expect(bubble.bubbleShape).toBe('sharp');
    expect(bubble.shadowIntensity).toBe(0);
  });

  it('applyChatBubblePreset ignores invalid preset', () => {
    act(() => useThemeStore.getState().applyChatBubblePreset('nonexistent'));
    expect(useThemeStore.getState().chatBubble).toEqual(DEFAULT_CHAT_BUBBLE);
  });

  it('resetChatBubble restores defaults', () => {
    act(() => useThemeStore.getState().updateChatBubble({ borderRadius: 99 }));
    act(() => useThemeStore.getState().resetChatBubble());
    expect(useThemeStore.getState().chatBubble).toEqual(DEFAULT_CHAT_BUBBLE);
  });

  it('setProfileTheme and setProfileCardLayout update state', () => {
    act(() => useThemeStore.getState().setProfileTheme('cyberpunk-neon'));
    act(() => useThemeStore.getState().setProfileCardLayout('gaming'));
    expect(useThemeStore.getState().profileThemeId).toBe('cyberpunk-neon');
    expect(useThemeStore.getState().profileCardLayout).toBe('gaming');
  });

  it('resetTheme restores all defaults', () => {
    act(() => {
      useThemeStore.getState().setColorPreset('pink');
      useThemeStore.getState().setEffectPreset('cyberpunk');
      useThemeStore.getState().toggleGlow();
    });
    act(() => useThemeStore.getState().resetTheme());
    const state = useThemeStore.getState();
    expect(state.colorPreset).toBe(DEFAULT_THEME_STATE.colorPreset);
    expect(state.effectPreset).toBe(DEFAULT_THEME_STATE.effectPreset);
    expect(state.glowEnabled).toBe(DEFAULT_THEME_STATE.glowEnabled);
  });

  it('applyPreset sets profileThemeId for valid preset', () => {
    act(() => useThemeStore.getState().applyPreset('gaming-rgb'));
    expect(useThemeStore.getState().profileThemeId).toBe('gaming-rgb');
  });

  it('applyPreset does nothing for invalid preset', () => {
    act(() => useThemeStore.getState().applyPreset('nonexistent'));
    expect(useThemeStore.getState().profileThemeId).toBe('minimalist-dark');
  });
});

// =============================================================================
// EXPORT / IMPORT
// =============================================================================

describe('export and import', () => {
  it('exportTheme returns valid JSON with key fields', () => {
    const json = useThemeStore.getState().exportTheme();
    const parsed = JSON.parse(json);
    expect(parsed.colorPreset).toBe('emerald');
    expect(parsed.chatBubble).toBeDefined();
  });

  it('importTheme applies imported settings', () => {
    const custom = JSON.stringify({ colorPreset: 'gold', animationSpeed: 'slow' });
    const result = useThemeStore.getState().importTheme(custom);
    expect(result).toBe(true);
    expect(useThemeStore.getState().colorPreset).toBe('gold');
    expect(useThemeStore.getState().animationSpeed).toBe('slow');
  });

  it('importTheme returns false for invalid JSON', () => {
    const result = useThemeStore.getState().importTheme('not-json');
    expect(result).toBe(false);
  });
});

// =============================================================================
// SELECTORS (hook-based)
// =============================================================================

describe('selector hooks', () => {
  it('useColorPreset returns current preset', () => {
    const { result } = renderHook(() => useColorPreset());
    expect(result.current).toBe('emerald');
  });

  it('useProfileThemeId returns current theme id', () => {
    const { result } = renderHook(() => useProfileThemeId());
    expect(result.current).toBe('minimalist-dark');
  });

  it('useProfileCardLayout returns current layout', () => {
    const { result } = renderHook(() => useProfileCardLayout());
    expect(result.current).toBe('detailed');
  });

  it('useEffectPresetValue returns effect preset', () => {
    const { result } = renderHook(() => useEffectPresetValue());
    expect(result.current).toBe('glassmorphism');
  });

  it('useAnimationSpeedValue returns animation speed', () => {
    const { result } = renderHook(() => useAnimationSpeedValue());
    expect(result.current).toBe('normal');
  });

  it('useParticlesEnabledValue returns particles state', () => {
    const { result } = renderHook(() => useParticlesEnabledValue());
    expect(result.current).toBe(true);
  });

  it('useGlowEnabledValue returns glow state', () => {
    const { result } = renderHook(() => useGlowEnabledValue());
    expect(result.current).toBe(true);
  });

  it('useAnimatedBackgroundValue returns animated bg state', () => {
    const { result } = renderHook(() => useAnimatedBackgroundValue());
    expect(result.current).toBe(false);
  });

  it('useColorTheme returns preset and matching colors', () => {
    const { result } = renderHook(() => useColorTheme());
    expect(result.current.preset).toBe('emerald');
    expect(result.current.colors).toEqual(COLORS.emerald);
  });

  it('useProfileTheme returns theme config', () => {
    const { result } = renderHook(() => useProfileTheme());
    expect(result.current.themeId).toBe('minimalist-dark');
    expect(result.current.preset).toBe(THEME_PRESETS['minimalist-dark']);
    expect(result.current.cardConfig).toBeDefined();
  });

  it('useChatBubbleTheme returns chat bubble config', () => {
    const { result } = renderHook(() => useChatBubbleTheme());
    expect(result.current).toEqual(DEFAULT_CHAT_BUBBLE);
  });

  it('useThemeEffects returns all effect values', () => {
    const { result } = renderHook(() => useThemeEffects());
    expect(result.current.effectPreset).toBe('glassmorphism');
    expect(result.current.animationSpeed).toBe('normal');
    expect(result.current.particlesEnabled).toBe(true);
  });
});

// =============================================================================
// LEGACY ALIASES
// =============================================================================

describe('legacy compatibility', () => {
  it('theme getter returns legacy shape', () => {
    const legacy = useThemeStore.getState().theme;
    expect(legacy.colorPreset).toBe('emerald');
    expect(legacy.avatarBorder).toBe('glow');
    expect(legacy.effectPreset).toBe('glassmorphism');
    expect(legacy.isPremium).toBe(false);
  });

  it('updateTheme applies legacy partial updates', () => {
    act(() => useThemeStore.getState().updateTheme({ colorPreset: 'crimson', glowEnabled: false }));
    const state = useThemeStore.getState();
    expect(state.colorPreset).toBe('crimson');
    expect(state.glowEnabled).toBe(false);
  });

  it('setAvatarBorder updates avatar border', () => {
    act(() => useThemeStore.getState().setAvatarBorder('fire'));
    expect(useThemeStore.getState().avatarBorder).toBe('fire');
  });

  it('setChatBubbleStyle updates bubble style', () => {
    act(() => useThemeStore.getState().setChatBubbleStyle('glassmorphism'));
    expect(useThemeStore.getState().chatBubbleStyle).toBe('glassmorphism');
  });

  it('setEffect updates effectPreset', () => {
    act(() => useThemeStore.getState().setEffect('aurora'));
    expect(useThemeStore.getState().effectPreset).toBe('aurora');
  });
});
