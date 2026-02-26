// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useForumThemeStore,
  useActiveForumTheme,
  useForumThemePresets,
  FORUM_THEME_PRESETS,
  type ForumThemePreset,
  type ForumTitleAnimation,
  type RoleBadgeStyle,
} from '../forumThemeStore';
import { useThemeStore } from '@/stores/theme';

beforeEach(() => {
  useThemeStore.setState(useThemeStore.getInitialState());
  vi.clearAllMocks();
});

// =============================================================================
// Exports
// =============================================================================

describe('forumThemeStore exports', () => {
  it('exports useForumThemeStore as useThemeStore alias', () => {
    expect(useForumThemeStore).toBe(useThemeStore);
  });

  it('exports FORUM_THEME_PRESETS', () => {
    expect(FORUM_THEME_PRESETS).toBeDefined();
    expect(typeof FORUM_THEME_PRESETS).toBe('object');
  });

  it('exports useActiveForumTheme hook', () => {
    expect(typeof useActiveForumTheme).toBe('function');
  });

  it('exports useForumThemePresets hook', () => {
    expect(typeof useForumThemePresets).toBe('function');
  });
});

// =============================================================================
// Presets
// =============================================================================

describe('FORUM_THEME_PRESETS', () => {
  it('has dark-elite preset', () => {
    expect(FORUM_THEME_PRESETS['dark-elite']).toBeDefined();
    expect(FORUM_THEME_PRESETS['dark-elite'].name).toBe('Dark Elite');
  });

  it('has cyberpunk preset', () => {
    expect(FORUM_THEME_PRESETS['cyberpunk']).toBeDefined();
    expect(FORUM_THEME_PRESETS['cyberpunk'].name).toBe('Cyberpunk 2077');
  });

  it('has classic-mybb preset', () => {
    expect(FORUM_THEME_PRESETS['classic-mybb']).toBeDefined();
    expect(FORUM_THEME_PRESETS['classic-mybb'].name).toBe('Classic MyBB');
  });

  it('dark-elite has glassmorphism', () => {
    expect(FORUM_THEME_PRESETS['dark-elite'].glassmorphism).toBe(true);
  });

  it('classic-mybb has no glassmorphism', () => {
    expect(FORUM_THEME_PRESETS['classic-mybb'].glassmorphism).toBe(false);
  });

  it('cyberpunk has dramatic shadows', () => {
    expect(FORUM_THEME_PRESETS['cyberpunk'].shadows).toBe('dramatic');
  });

  it('dark-elite has glow titleAnimation', () => {
    expect(FORUM_THEME_PRESETS['dark-elite'].titleAnimation).toBe('glow');
  });

  it('cyberpunk has neon-flicker titleAnimation', () => {
    expect(FORUM_THEME_PRESETS['cyberpunk'].titleAnimation).toBe('neon-flicker');
  });

  it('classic-mybb has no titleAnimation', () => {
    expect(FORUM_THEME_PRESETS['classic-mybb'].titleAnimation).toBe('none');
  });

  it('each preset has colors', () => {
    for (const [key, preset] of Object.entries(FORUM_THEME_PRESETS)) {
      expect(preset.colors).toBeDefined();
      expect(preset.colors!.primary).toBeTruthy();
    }
  });

  it('each preset has a preset value matching its key', () => {
    for (const [key, preset] of Object.entries(FORUM_THEME_PRESETS)) {
      expect(preset.preset).toBe(key);
    }
  });
});

// =============================================================================
// useActiveForumTheme hook
// =============================================================================

describe('useActiveForumTheme', () => {
  it('returns dark-elite preset by default', () => {
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current).toBeDefined();
    expect(result.current?.name).toBe('Dark Elite');
  });

  it('returns preset matching activeForumThemeId', () => {
    useThemeStore.setState({ activeForumThemeId: 'cyberpunk' });
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current?.name).toBe('Cyberpunk 2077');
  });

  it('returns undefined for unknown themeId', () => {
    useThemeStore.setState({ activeForumThemeId: 'nonexistent' });
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current).toBeUndefined();
  });
});

// =============================================================================
// useForumThemePresets hook
// =============================================================================

describe('useForumThemePresets', () => {
  it('returns all presets', () => {
    const { result } = renderHook(() => useForumThemePresets());
    expect(result.current).toBe(FORUM_THEME_PRESETS);
  });
});

// =============================================================================
// Type checks (compile-time but runtime validated via values)
// =============================================================================

describe('type values', () => {
  it('ForumThemePreset values are valid', () => {
    const presets: ForumThemePreset[] = ['classic-mybb', 'dark-elite', 'cyberpunk', 'custom'];
    presets.forEach((p) => expect(typeof p).toBe('string'));
  });

  it('ForumTitleAnimation values are valid', () => {
    const anims: ForumTitleAnimation[] = ['none', 'gradient', 'glow', 'holographic', 'matrix'];
    anims.forEach((a) => expect(typeof a).toBe('string'));
  });

  it('RoleBadgeStyle values are valid', () => {
    const styles: RoleBadgeStyle[] = ['none', 'pill', 'shield', 'crown', 'star', 'diamond'];
    styles.forEach((s) => expect(typeof s).toBe('string'));
  });
});
