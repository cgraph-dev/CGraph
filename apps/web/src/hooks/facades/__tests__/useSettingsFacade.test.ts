/**
 * useSettingsFacade Unit Tests
 *
 * Tests for the settings composition facade hook.
 * Validates aggregation of settings, customization, and theme stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettingsFacade } from '../useSettingsFacade';

// Mock stores
const mockSettingsState: Record<string, unknown> = {
  settings: {
    appearance: {
      compactMode: true,
      fontSize: 'large',
      reduceMotion: true,
      highContrast: false,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      notifyMessages: true,
      notifyMentions: true,
      notifyFriendRequests: false,
    },
    privacy: {
      showOnlineStatus: false,
      showReadReceipts: true,
      showTypingIndicators: false,
      profileVisibility: 'friends',
      allowFriendRequests: true,
    },
  },
  isLoading: false,
  fetchSettings: vi.fn(),
  updateNotificationSettings: vi.fn(),
  updatePrivacySettings: vi.fn(),
  updateAppearanceSettings: vi.fn(),
};

const mockCustomizationState: Record<string, unknown> = {
  themePreset: 'cyberpunk',
  effectPreset: 'matrix',
  animationSpeed: 'fast',
  particlesEnabled: true,
  glowEnabled: true,
  isSaving: false,
  updateSettings: vi.fn(),
};

const mockThemeState: Record<string, unknown> = {
  colorPreset: 'emerald',
};

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn((selector: (s: typeof mockSettingsState) => unknown) =>
    selector(mockSettingsState)
  ),
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn((selector: (s: typeof mockCustomizationState) => unknown) =>
    selector(mockCustomizationState)
  ),
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((selector: (s: typeof mockThemeState) => unknown) =>
    selector(mockThemeState)
  ),
}));

describe('useSettingsFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('appearance settings', () => {
    it('derives theme from theme store', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.theme).toBe('emerald');
    });

    it('derives compactMode from settings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.compactMode).toBe(true);
    });

    it('derives fontSize from settings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.fontSize).toBe('large');
    });

    it('derives reduceMotion from settings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.reduceMotion).toBe(true);
    });

    it('derives highContrast from settings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.highContrast).toBe(false);
    });
  });

  describe('notification settings', () => {
    it('derives emailNotifications', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.emailNotifications).toBe(true);
    });

    it('derives pushNotifications', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.pushNotifications).toBe(false);
    });

    it('derives notifyMessages', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.notifyMessages).toBe(true);
    });

    it('derives notifyMentions', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.notifyMentions).toBe(true);
    });

    it('derives notifyFriendRequests', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.notifyFriendRequests).toBe(false);
    });
  });

  describe('privacy settings', () => {
    it('derives showOnlineStatus', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.showOnlineStatus).toBe(false);
    });

    it('derives showReadReceipts', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.showReadReceipts).toBe(true);
    });

    it('derives showTypingIndicators', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.showTypingIndicators).toBe(false);
    });

    it('derives profileVisibility', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.profileVisibility).toBe('friends');
    });

    it('derives allowFriendRequests', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.allowFriendRequests).toBe(true);
    });
  });

  describe('customization settings (cross-store)', () => {
    it('exposes themePreset from customization store', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.themePreset).toBe('cyberpunk');
    });

    it('exposes effectPreset', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.effectPreset).toBe('matrix');
    });

    it('exposes animationSpeed', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.animationSpeed).toBe('fast');
    });

    it('exposes particlesEnabled', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.particlesEnabled).toBe(true);
    });

    it('exposes glowEnabled', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.glowEnabled).toBe(true);
    });
  });

  describe('defaults when settings null', () => {
    it('provides sensible defaults when settings is null', () => {
      mockSettingsState.settings = null;
      const { result } = renderHook(() => useSettingsFacade());

      expect(result.current.compactMode).toBe(false);
      expect(result.current.fontSize).toBe('medium');
      expect(result.current.reduceMotion).toBe(false);
      expect(result.current.highContrast).toBe(false);
      expect(result.current.emailNotifications).toBe(true);
      expect(result.current.pushNotifications).toBe(true);
      expect(result.current.showOnlineStatus).toBe(true);
      expect(result.current.profileVisibility).toBe('public');

      // Restore
      mockSettingsState.settings = {
        appearance: {
          compactMode: true,
          fontSize: 'large',
          reduceMotion: true,
          highContrast: false,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: false,
          notifyMessages: true,
          notifyMentions: true,
          notifyFriendRequests: false,
        },
        privacy: {
          showOnlineStatus: false,
          showReadReceipts: true,
          showTypingIndicators: false,
          profileVisibility: 'friends',
          allowFriendRequests: true,
        },
      };
    });
  });

  describe('loading states', () => {
    it('exposes isLoading', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.isLoading).toBe(false);
    });

    it('exposes isSaving from customization store', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('actions', () => {
    it('exposes fetchSettings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(typeof result.current.fetchSettings).toBe('function');
    });

    it('exposes updateSettings mapped to customization', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(typeof result.current.updateSettings).toBe('function');
    });

    it('exposes updateNotificationSettings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(typeof result.current.updateNotificationSettings).toBe('function');
    });

    it('exposes updatePrivacySettings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(typeof result.current.updatePrivacySettings).toBe('function');
    });

    it('exposes updateAppearanceSettings', () => {
      const { result } = renderHook(() => useSettingsFacade());
      expect(typeof result.current.updateAppearanceSettings).toBe('function');
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      const { result } = renderHook(() => useSettingsFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
        'theme',
        'compactMode',
        'fontSize',
        'reduceMotion',
        'highContrast',
        'emailNotifications',
        'pushNotifications',
        'notifyMessages',
        'notifyMentions',
        'notifyFriendRequests',
        'showOnlineStatus',
        'showReadReceipts',
        'showTypingIndicators',
        'profileVisibility',
        'allowFriendRequests',
        'themePreset',
        'effectPreset',
        'animationSpeed',
        'particlesEnabled',
        'glowEnabled',
        'isLoading',
        'isSaving',
        'fetchSettings',
        'updateSettings',
        'updateNotificationSettings',
        'updatePrivacySettings',
        'updateAppearanceSettings',
      ];

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});
