/** @module StatusBadge tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

import { StatusBadge } from '../shared/status-badge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('applies green colors for active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('active');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('applies red colors for banned status', () => {
    render(<StatusBadge status="banned" />);
    const badge = screen.getByText('banned');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('applies gray colors for deleted status', () => {
    render(<StatusBadge status="deleted" />);
    const badge = screen.getByText('deleted');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('applies yellow colors for pending status', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('pending');
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-700');
  });

  it('applies green colors for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    const badge = screen.getByText('resolved');
    expect(badge.className).toContain('bg-green-100');
  });

  it('applies gray colors for dismissed status', () => {
    render(<StatusBadge status="dismissed" />);
    const badge = screen.getByText('dismissed');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('falls back to active colors for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    const badge = screen.getByText('unknown');
    expect(badge.className).toContain('bg-green-100');
  });

  it('renders with capitalize class', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').className).toContain('capitalize');
  });

  it('renders as a span element', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').tagName).toBe('SPAN');
  });
});
