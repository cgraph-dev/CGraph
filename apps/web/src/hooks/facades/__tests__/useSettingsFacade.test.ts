/**
 * useSettingsFacade Unit Tests
 *
 * Tests for the settings composition facade hook.
 * Validates aggregation of settings, customization, and theme stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettingsFacade } from '../useSettingsFacade';

// ── Mock stores ────────────────────────────────────────────────────

const fullSettings = {
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

const mockSettingsState: Record<string, unknown> = {
  settings: { ...fullSettings },
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
  useSettingsStore: vi.fn((sel: (s: typeof mockSettingsState) => unknown) =>
    sel(mockSettingsState)
  ),
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn((sel: (s: typeof mockCustomizationState) => unknown) =>
    sel(mockCustomizationState)
  ),
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((sel: (s: typeof mockThemeState) => unknown) => sel(mockThemeState)),
}));

function resetState() {
  mockSettingsState.settings = JSON.parse(JSON.stringify(fullSettings));
  mockSettingsState.isLoading = false;
  mockCustomizationState.themePreset = 'cyberpunk';
  mockCustomizationState.effectPreset = 'matrix';
  mockCustomizationState.animationSpeed = 'fast';
  mockCustomizationState.particlesEnabled = true;
  mockCustomizationState.glowEnabled = true;
  mockCustomizationState.isSaving = false;
  mockThemeState.colorPreset = 'emerald';
}

describe('useSettingsFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  // ── Appearance derivation ────────────────────────────────────────

  it('derives theme from theme store colorPreset', () => {
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

  // ── Notification derivation ──────────────────────────────────────

  it('derives all notification settings', () => {
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.emailNotifications).toBe(true);
    expect(result.current.pushNotifications).toBe(false);
    expect(result.current.notifyMessages).toBe(true);
    expect(result.current.notifyMentions).toBe(true);
    expect(result.current.notifyFriendRequests).toBe(false);
  });

  // ── Privacy derivation ───────────────────────────────────────────

  it('derives all privacy settings', () => {
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.showOnlineStatus).toBe(false);
    expect(result.current.showReadReceipts).toBe(true);
    expect(result.current.showTypingIndicators).toBe(false);
    expect(result.current.profileVisibility).toBe('friends');
    expect(result.current.allowFriendRequests).toBe(true);
  });

  // ── Customization (cross-store) ──────────────────────────────────

  it('exposes customization state from customization store', () => {
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.themePreset).toBe('cyberpunk');
    expect(result.current.effectPreset).toBe('matrix');
    expect(result.current.animationSpeed).toBe('fast');
    expect(result.current.particlesEnabled).toBe(true);
    expect(result.current.glowEnabled).toBe(true);
  });

  // ── Defaults when settings null ──────────────────────────────────

  it('provides sensible defaults when settings is null', () => {
    mockSettingsState.settings = null;
    const { result } = renderHook(() => useSettingsFacade());

    // Appearance defaults
    expect(result.current.compactMode).toBe(false);
    expect(result.current.fontSize).toBe('medium');
    expect(result.current.reduceMotion).toBe(false);
    expect(result.current.highContrast).toBe(false);

    // Notification defaults
    expect(result.current.emailNotifications).toBe(true);
    expect(result.current.pushNotifications).toBe(true);
    expect(result.current.notifyMessages).toBe(true);
    expect(result.current.notifyMentions).toBe(true);
    expect(result.current.notifyFriendRequests).toBe(true);

    // Privacy defaults
    expect(result.current.showOnlineStatus).toBe(true);
    expect(result.current.showReadReceipts).toBe(true);
    expect(result.current.showTypingIndicators).toBe(true);
    expect(result.current.profileVisibility).toBe('public');
    expect(result.current.allowFriendRequests).toBe(true);
  });

  it('provides defaults when individual sections are missing', () => {
    mockSettingsState.settings = { appearance: null, notifications: null, privacy: null };
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.compactMode).toBe(false);
    expect(result.current.emailNotifications).toBe(true);
    expect(result.current.showOnlineStatus).toBe(true);
  });

  // ── Loading states ───────────────────────────────────────────────

  it('exposes isLoading from settings store', () => {
    mockSettingsState.isLoading = true;
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes isSaving from customization store', () => {
    mockCustomizationState.isSaving = true;
    const { result } = renderHook(() => useSettingsFacade());
    expect(result.current.isSaving).toBe(true);
  });

  // ── Action delegation ────────────────────────────────────────────

  it('fetchSettings delegates to settings store', () => {
    const { result } = renderHook(() => useSettingsFacade());
    result.current.fetchSettings();
    expect(mockSettingsState.fetchSettings).toHaveBeenCalledOnce();
  });

  it('updateSettings delegates to customization updateSettings', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const payload = { themePreset: 'neon' };
    result.current.updateSettings(payload);
    expect(mockCustomizationState.updateSettings).toHaveBeenCalledWith(payload);
  });

  it('updateNotificationSettings delegates with args', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const payload = { pushNotifications: true };
    result.current.updateNotificationSettings(payload);
    expect(mockSettingsState.updateNotificationSettings).toHaveBeenCalledWith(payload);
  });

  it('updatePrivacySettings delegates with args', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const payload = { showOnlineStatus: true };
    result.current.updatePrivacySettings(payload);
    expect(mockSettingsState.updatePrivacySettings).toHaveBeenCalledWith(payload);
  });

  it('updateAppearanceSettings delegates with args', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const payload = { fontSize: 'small' };
    result.current.updateAppearanceSettings(payload);
    expect(mockSettingsState.updateAppearanceSettings).toHaveBeenCalledWith(payload);
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 27 expected keys', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const keys = Object.keys(result.current);

    const expected = [
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
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useSettingsFacade());
    const actions = [
      'fetchSettings',
      'updateSettings',
      'updateNotificationSettings',
      'updatePrivacySettings',
      'updateAppearanceSettings',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});
