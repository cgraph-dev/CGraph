import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockCustomizationState } = vi.hoisted(() => ({
  mockCustomizationState: {
    profileTheme: null as string | null,
    selectedProfileThemeId: 'classic-purple',
    chatTheme: 'default',
    particleEffect: 'none',
    backgroundEffect: 'solid',
    animationSpeed: 'normal',
  },
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn((selector: (s: typeof mockCustomizationState) => unknown) => {
    return selector(mockCustomizationState);
  }),
}));

vi.mock('@/shared/hooks', () => ({
  useDebounce: vi.fn((value: string) => value),
}));

import {
  useCustomizationApplication,
  getAvatarBorderStyle,
  getMessageBubbleClass,
  getMessageEffectClass,
  getReactionStyleClass,
} from '../useCustomizationApplication';
import { useUsernameChange } from '../useUsernameChange';

// ─── useCustomizationApplication ─────────────────────────────────────────────

describe('useCustomizationApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM state
    document.documentElement.style.cssText = '';
    document.body.className = '';
    // Reset customization state
    mockCustomizationState.profileTheme = null;
    mockCustomizationState.selectedProfileThemeId = 'classic-purple';
    mockCustomizationState.chatTheme = 'default';
    mockCustomizationState.particleEffect = 'none';
    mockCustomizationState.backgroundEffect = 'solid';
    mockCustomizationState.animationSpeed = 'normal';
  });

  it('applies profile theme CSS variables for classic-purple', () => {
    renderHook(() => useCustomizationApplication());

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe('#9333ea');
    expect(root.style.getPropertyValue('--profile-secondary')).toBe('#a855f7');
  });

  it('applies neon-blue theme CSS variables', () => {
    mockCustomizationState.selectedProfileThemeId = 'neon-blue';

    renderHook(() => useCustomizationApplication());

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe('#0ea5e9');
  });

  it('applies animation speed CSS variable for normal speed', () => {
    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('applies fast animation speed', () => {
    mockCustomizationState.animationSpeed = 'fast';

    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('0.5');
  });

  it('adds particle effect body class when not "none"', () => {
    mockCustomizationState.particleEffect = 'sparkles';

    renderHook(() => useCustomizationApplication());

    expect(document.body.classList.contains('particle-effect-sparkles')).toBe(true);
  });

  it('does not add particle effect body class when "none"', () => {
    mockCustomizationState.particleEffect = 'none';

    renderHook(() => useCustomizationApplication());

    const hasParticleClass = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticleClass).toBe(false);
  });

  it('prefers profileTheme over selectedProfileThemeId', () => {
    mockCustomizationState.profileTheme = 'cyberpunk';
    mockCustomizationState.selectedProfileThemeId = 'neon-blue';

    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('#ec4899');
  });
});

// ─── Utility functions ──────────────────────────────────────────────────────

describe('getAvatarBorderStyle', () => {
  it('returns empty className for null borderId', () => {
    expect(getAvatarBorderStyle(null)).toEqual({ className: '' });
  });

  it('returns empty className for "none" borderId', () => {
    expect(getAvatarBorderStyle('none')).toEqual({ className: '' });
  });

  it('returns the correct class for "simple-glow"', () => {
    expect(getAvatarBorderStyle('simple-glow')).toEqual({ className: 'avatar-border-glow' });
  });

  it('returns the correct class for "rainbow-spin"', () => {
    expect(getAvatarBorderStyle('rainbow-spin')).toEqual({ className: 'avatar-border-rainbow' });
  });

  it('returns empty className for unknown borderId', () => {
    expect(getAvatarBorderStyle('unknown-border')).toEqual({ className: '' });
  });
});

describe('getMessageBubbleClass', () => {
  it('returns "bubble-default" for default style', () => {
    expect(getMessageBubbleClass('default')).toBe('bubble-default');
  });

  it('returns "bubble-glass" for glass style', () => {
    expect(getMessageBubbleClass('glass')).toBe('bubble-glass');
  });

  it('returns "bubble-default" for unknown style', () => {
    expect(getMessageBubbleClass('unknown')).toBe('bubble-default');
  });
});

describe('getMessageEffectClass', () => {
  it('returns empty string for "none"', () => {
    expect(getMessageEffectClass('none')).toBe('');
  });

  it('returns empty string for falsy value', () => {
    expect(getMessageEffectClass('')).toBe('');
  });

  it('returns correct class for "bounce"', () => {
    expect(getMessageEffectClass('bounce')).toBe('message-effect-bounce');
  });

  it('returns empty string for unknown effect', () => {
    expect(getMessageEffectClass('unknown')).toBe('');
  });
});

describe('getReactionStyleClass', () => {
  it('returns "reaction-bounce" as default for unknown style', () => {
    expect(getReactionStyleClass('unknown')).toBe('reaction-bounce');
  });

  it('returns correct class for "pop"', () => {
    expect(getReactionStyleClass('pop')).toBe('reaction-pop');
  });

  it('returns correct class for "spin"', () => {
    expect(getReactionStyleClass('spin')).toBe('reaction-spin');
  });
});

// ─── useUsernameChange ──────────────────────────────────────────────────────

describe('useUsernameChange', () => {
  const baseOptions = {
    currentUsername: 'olduser',
    lastChangeDate: null as Date | null,
    isPremium: false,
    onSuccess: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ available: true, message: 'Username is available!' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.newUsername).toBe('');
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.checkResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.showHistory).toBe(false);
    expect(result.current.canChange).toBe(true);
  });

  it('canChange is true when lastChangeDate is null', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.canChange).toBe(true);
    expect(result.current.remainingDays).toBe(0);
  });

  it('canChange is false when within cooldown period (standard user)', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
      })
    );

    expect(result.current.canChange).toBe(false);
    expect(result.current.remainingDays).toBe(25); // 30 - 5
  });

  it('premium users have shorter cooldown', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
        isPremium: true,
      })
    );

    expect(result.current.remainingDays).toBe(2); // 7 - 5
    expect(result.current.cooldownDays).toBe(7);
  });

  it('setNewUsername updates the username value', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('newuser');
    });

    expect(result.current.newUsername).toBe('newuser');
  });

  it('toggleHistory toggles showHistory state', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.showHistory).toBe(false);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(false);
  });

  it('reports invalid format for short usernames', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('ab');
    });

    // useDebounce is mocked to pass through immediately
    await waitFor(() => {
      expect(result.current.checkResult).toEqual({
        available: false,
        message: expect.stringContaining('3-32 characters'),
      });
    });
  });

  it('reports invalid format for usernames with special characters', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('user@name!');
    });

    await waitFor(() => {
      expect(result.current.checkResult?.available).toBe(false);
    });
  });

  it('clears checkResult when username matches current', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('olduser');
    });

    await waitFor(() => {
      expect(result.current.checkResult).toBeNull();
    });
  });

  it('handleSubmit does nothing when canChange is false', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // 1 day ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/users/me/change-username',
      expect.any(Object)
    );
  });
});
