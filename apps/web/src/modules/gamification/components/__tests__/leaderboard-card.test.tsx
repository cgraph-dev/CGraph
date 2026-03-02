/** @module LeaderboardWidget tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
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

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-3' },
  }),
}));

vi.mock('../leaderboard-widget/constants', () => ({
  LEADERBOARD_TYPES: [
    {
      value: 'xp',
      label: 'XP',
      icon: ({ className }: { className?: string }) => <span className={className} />,
    },
    {
      value: 'karma',
      label: 'Karma',
      icon: ({ className }: { className?: string }) => <span className={className} />,
    },
  ],
  TIME_PERIODS: [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'allTime', label: 'All Time' },
  ],
}));

vi.mock('../leaderboard-widget/podium', () => ({
  Podium: ({ entries: _entries }: { entries: unknown[] }) => <div data-testid="podium">Podium</div>,
}));

vi.mock('../leaderboard-widget/leaderboard-entry-row', () => ({
  LeaderboardEntryRow: ({ entry }: { entry: { username: string } }) => (
    <div data-testid="leaderboard-entry">{entry.username}</div>
  ),
}));

vi.mock('../leaderboard-widget/sidebar-variant', () => ({
  SidebarVariant: () => <div data-testid="sidebar-variant">Sidebar</div>,
}));

import { LeaderboardWidget } from '../leaderboard-widget/leaderboard-widget';

function makeEntry(rank: number, username: string, score: number, userId = `user-${rank}`) {
  return {
    rank,
    userId,
    username,
    displayName: username,
    avatarUrl: undefined as string | undefined,
    level: rank * 5,
    score,
  };
}

describe('LeaderboardWidget', () => {
  let onTypeChange: ReturnType<typeof vi.fn>;
  let onTimePeriodChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onTypeChange = vi.fn();
    onTimePeriodChange = vi.fn();
  });

  it('renders GlassCard wrapper', () => {
    render(<LeaderboardWidget entries={[]} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders type filter buttons when showFilters is true', () => {
    render(<LeaderboardWidget entries={[]} showFilters={true} />);
    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('Karma')).toBeInTheDocument();
  });

  it('renders time period buttons', () => {
    render(<LeaderboardWidget entries={[]} showFilters={true} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('calls onTypeChange when type button is clicked', () => {
    render(<LeaderboardWidget entries={[]} onTypeChange={onTypeChange} showFilters={true} />);
    fireEvent.click(screen.getByText('Karma'));
    expect(onTypeChange).toHaveBeenCalledWith('karma');
  });

  it('calls onTimePeriodChange when period button is clicked', () => {
    render(
      <LeaderboardWidget entries={[]} onTimePeriodChange={onTimePeriodChange} showFilters={true} />
    );
    fireEvent.click(screen.getByText('Monthly'));
    expect(onTimePeriodChange).toHaveBeenCalledWith('monthly');
  });

  it('renders the podium by default', () => {
    const entries = [
      makeEntry(1, 'alice', 1000),
      makeEntry(2, 'bob', 800),
      makeEntry(3, 'carol', 600),
    ];
    render(<LeaderboardWidget entries={entries} showPodium={true} />);
    expect(screen.getByTestId('podium')).toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<LeaderboardWidget entries={[]} showFilters={false} />);
    expect(screen.queryByText('XP')).not.toBeInTheDocument();
  });

  it('renders sidebar variant when variant is sidebar', () => {
    render(<LeaderboardWidget entries={[makeEntry(1, 'alice', 100)]} variant="sidebar" />);
    expect(screen.getByTestId('sidebar-variant')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LeaderboardWidget entries={[]} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
