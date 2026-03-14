/** @module ChatEffectsProvider tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

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
        showPulse: true,
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
      showPulse: true,
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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

const mockSettings = {
  effect: 'fade' as const,
  config: { effect: 'fade' as const, intensity: 'medium' as const, duration: 1000 },
  enabled: true,
};

vi.mock('@/modules/chat/store', () => ({
  useChatEffectSettings: () => mockSettings,
}));

import { ChatEffectsProvider, useChatEffects } from '../chat-effects-provider';

describe('ChatEffectsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <ChatEffectsProvider>
        <div data-testid="child">Hello</div>
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('provides effect value from store', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="effect">{ctx.effect}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('effect')).toHaveTextContent('fade');
  });

  it('provides enabled value from store', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="enabled">{String(ctx.enabled)}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
  });

  it('uses effectOverride when provided', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="effect">{ctx.effect}</div>;
    }
    render(
      <ChatEffectsProvider effectOverride={'bounce' as 'fade-in'}>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('effect')).toHaveTextContent('bounce');
  });

  it('uses configOverride when provided', () => {
    const override = { effect: 'slide' as const, intensity: 'high' as const, duration: 2000 };
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="duration">{ctx.config.duration}</div>;
    }
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <ChatEffectsProvider configOverride={override as any}>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('duration')).toHaveTextContent('2000');
  });

  it('throws error when useChatEffects is used outside provider', () => {
    expect(() => {
      renderHook(() => useChatEffects());
    }).toThrow('useChatEffects must be used within ChatEffectsProvider');
  });

  it('provides config from store by default', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="intensity">{ctx.config.intensity}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('intensity')).toHaveTextContent('medium');
  });

  it('renders multiple children', () => {
    render(
      <ChatEffectsProvider>
        <div data-testid="c1">A</div>
        <div data-testid="c2">B</div>
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('c1')).toBeInTheDocument();
    expect(screen.getByTestId('c2')).toBeInTheDocument();
  });
});
