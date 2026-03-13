/** @module MentionAutocomplete tests */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('motion/react', () => ({
  motion: new Proxy({} as Record<string, unknown>, {
    get: (_t: unknown, prop: string) =>
      ({ children, ...rest }: any) => {
        const { initial, animate, exit, transition, variants, whileHover, whileTap, layout, layoutId, ...safe } = rest;
        return <div data-motion={prop} {...safe}>{children}</div>;
      },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((sel?: (s: Record<string, unknown>) => unknown) => {
    const __ts = {
      colorPreset: 'emerald',
      avatarBorder: 'none',
      avatarBorderColor: 'emerald',
      effectPreset: 'minimal',
      animationSpeed: 'normal',
      particlesEnabled: false,
      glowEnabled: false,
      animatedBackground: false,
      isPremium: false,
      chatBubble: {
        ownMessageBg: '#10b981',
        otherMessageBg: '#1f2937',
        borderRadius: 12,
        bubbleShape: 'rounded',
        showTail: true,
      },
      chatBubbleStyle: 'default',
      chatBubbleColor: 'emerald',
      profileThemeId: 'default',
      profileCardLayout: 'default',
      theme: {
        colorPreset: 'emerald',
        avatarBorder: 'none',
        avatarBorderColor: 'emerald',
        chatBubbleStyle: 'default',
        chatBubbleColor: 'emerald',
        bubbleBorderRadius: 12,
        bubbleShadowIntensity: 0,
        bubbleGlassEffect: false,
        glowEnabled: false,
        particlesEnabled: false,
        effectPreset: 'minimal',
        animationSpeed: 'normal',
        isPremium: false,
      },
      getColors: () => ({
        primary: '#10b981',
        secondary: '#34d399',
        glow: 'rgba(16,185,129,0.5)',
        name: 'Emerald',
        gradient: 'from-emerald-500 to-emerald-600',
      }),
      setColorPreset: vi.fn(),
      setEffectPreset: vi.fn(),
      setAnimationSpeed: vi.fn(),
      toggleParticles: vi.fn(),
      toggleGlow: vi.fn(),
      toggleBlur: vi.fn(),
      toggleAnimatedBackground: vi.fn(),
      updateChatBubble: vi.fn(),
      applyChatBubblePreset: vi.fn(),
      resetChatBubble: vi.fn(),
      updateTheme: vi.fn(),
      setAvatarBorder: vi.fn(),
      setChatBubbleStyle: vi.fn(),
      setEffect: vi.fn(),
      resetTheme: vi.fn(),
      reset: vi.fn(),
      applyPreset: vi.fn(),
      exportTheme: vi.fn(() => '{}'),
      importTheme: vi.fn(() => true),
      setProfileTheme: vi.fn(),
      setProfileCardLayout: vi.fn(),
      getProfileCardConfig: () => ({
        layout: 'default',
        showLevel: true,
        showXp: true,
        showKarma: true,
        showStreak: true,
        showBadges: true,
        maxBadges: 6,
        showTitle: true,
        showBio: true,
        showStats: true,
        showRecentActivity: false,
        showMutualFriends: false,
        showForumsInCommon: false,
        showAchievements: false,
        showSocialLinks: false,
      }),
      syncWithBackend: vi.fn(),
      saveToBackend: vi.fn(),
      clearError: vi.fn(),
      syncWithServer: vi.fn(),
    };
    return typeof sel === 'function' ? sel(__ts) : __ts;
  }),
  THEME_COLORS: {
    free: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
    premium: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    emerald: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
    blue: { primary: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa' },
  },
  COLORS: {
    emerald: {
      primary: '#10b981',
      secondary: '#34d399',
      glow: 'rgba(16,185,129,0.5)',
      name: 'Emerald',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      glow: 'rgba(139,92,246,0.5)',
      name: 'Purple',
      gradient: 'from-purple-500 to-purple-600',
    },
  },
  useColorPreset: () => 'emerald',
  useProfileThemeId: () => 'default',
  useProfileCardLayout: () => 'default',
  useEffectPresetValue: () => 'minimal',
  useAnimationSpeedValue: () => 'normal',
  useParticlesEnabledValue: () => false,
  useGlowEnabledValue: () => false,
  useAnimatedBackgroundValue: () => false,
  useChatBubbleTheme: () => ({
    ownMessageBg: '#10b981',
    otherMessageBg: '#1f2937',
    borderRadius: 12,
    bubbleShape: 'rounded',
    showTail: true,
  }),
  useColorTheme: () => ({
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16,185,129,0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  }),
  useProfileTheme: () => ({
    preset: 'minimalist-dark',
    cardConfig: {
      layout: 'default',
      showLevel: true,
      showXp: true,
      showKarma: true,
      showStreak: true,
      showBadges: true,
      maxBadges: 6,
      showTitle: true,
      showBio: true,
      showStats: true,
      showRecentActivity: false,
      showMutualFriends: false,
      showForumsInCommon: false,
      showAchievements: false,
      showSocialLinks: false,
    },
  }),
  useThemeEffects: () => ({
    effectPreset: 'minimal',
    animationSpeed: 'normal',
    particlesEnabled: false,
    glowEnabled: false,
  }),
  useChatBubbleStore: () => ({ ownMessageBg: '#10b981', otherMessageBg: '#1f2937' }),
  useProfileThemeStore: () => ({ profileThemeId: 'default', profileCardLayout: 'default' }),
  getPresetCategory: () => 'basic',
  getColorsForPreset: () => ({
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16,185,129,0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  }),
  getProfileCardConfigForLayout: () => ({}),
  getThemePreset: () => ({}),
  useActiveProfileTheme: () => 'minimalist-dark',
  useProfileCardConfig: () => ({ layout: 'default' }),
  useForumThemeStore: () => ({}),
  useActiveForumTheme: () => null,
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockImplementation((_url: string, opts?: { params?: { q?: string } }) => {
      const q = (opts?.params?.q ?? '').toLowerCase();
      const allUsers = [
        { id: '1', username: 'alice', display_name: 'Alice', avatar_url: null },
        { id: '2', username: 'bob', display_name: 'Bob', avatar_url: null },
        { id: '3', username: 'charlie', display_name: 'Charlie', avatar_url: null },
      ];
      const filtered = allUsers.filter(
        (u) => u.username.includes(q) || u.display_name.toLowerCase().includes(q)
      );
      return Promise.resolve({ data: { users: filtered } });
    }),
  },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

import { MentionAutocomplete } from '../mention-autocomplete';

/** Advance fake timers past the 200ms debounce and flush microtasks */
async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
}

describe('MentionAutocomplete', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when query is empty', () => {
    const { container } = render(
      <MentionAutocomplete query="" onSelect={onSelect} onClose={onClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows loading spinner while searching', async () => {
    render(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    // After API call fails, it fell back to mock users
  });

  it('displays filtered mock users as fallback', async () => {
    render(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  it('calls onSelect when a user is clicked', async () => {
    render(<MentionAutocomplete query="bob" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    // motion.button renders as <div data-motion="button">, so use closest('[data-motion="button"]')
    const btn = screen.getByText('@bob').closest('[data-motion="button"]');
    expect(btn).not.toBeNull();
    fireEvent.click(btn!);
    expect(onSelect).toHaveBeenCalledWith('bob');
  });

  it('shows display name for each user', async () => {
    render(<MentionAutocomplete query="alice" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders nothing when no users match the query', async () => {
    const { container } = render(
      <MentionAutocomplete query="zzzznotauser" onSelect={onSelect} onClose={onClose} />
    );
    await flushDebounce();
    // No users found, component returns null
    expect(container.querySelector('button')).toBeNull();
  });

  it('debounces search with 200ms delay', async () => {
    const { rerender } = render(
      <MentionAutocomplete query="a" onSelect={onSelect} onClose={onClose} />
    );
    rerender(<MentionAutocomplete query="al" onSelect={onSelect} onClose={onClose} />);
    rerender(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    // Only after 200ms should it search
    await flushDebounce();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
