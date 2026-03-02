/**
 * @file profile-stats.test.tsx
 * @description Tests for ProfileStatsGrid and ProfileSidebar components —
 *   profile statistic displays including level, XP, streak, friends, and karma.
 * @module social/components/__tests__/ProfileStats
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  loopWithDelay: () => ({}),
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

vi.mock('@heroicons/react/24/outline', () => ({
  UserPlusIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="user-plus-icon" {...p} />,
  StarIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="star-icon" {...p} />,
  SparklesIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="sparkles-icon" {...p} />,
  BoltIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="bolt-icon" {...p} />,
  FireIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="fire-icon" {...p} />,
  ChartBarIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="chart-icon" {...p} />,
  ArrowTrendingUpIcon: (p: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="trending-icon" {...p} />
  ),
  CalendarDaysIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
  MapPinIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
  LinkIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

import { ProfileStatsGrid, ProfileSidebar } from '../profile-stats';

// ── Helpers ────────────────────────────────────────────────────────────
const makeProfile = (overrides?: Record<string, unknown>) => ({
  id: 'u-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  status: 'online' as const,
  statusMessage: null,
  isVerified: false,
  isPremium: false,
  level: 15,
  totalXP: 12500,
  loginStreak: 7,
  friendsCount: 42,
  karma: 1500,
  createdAt: '2024-06-15T00:00:00Z',
  ...overrides,
});

// ── Tests — ProfileStatsGrid ───────────────────────────────────────────
describe('ProfileStatsGrid', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Statistics heading', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('renders level value', () => {
    render(<ProfileStatsGrid profile={makeProfile({ level: 25 })} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders total XP', () => {
    render(<ProfileStatsGrid profile={makeProfile({ totalXP: 5000 })} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('renders login streak', () => {
    render(<ProfileStatsGrid profile={makeProfile({ loginStreak: 10 })} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders friends count', () => {
    render(<ProfileStatsGrid profile={makeProfile({ friendsCount: 100 })} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows "Level" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('shows "Total XP" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Total XP')).toBeInTheDocument();
  });

  it('shows "Day Streak" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  it('shows "Friends" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });
});

// ── Tests — ProfileSidebar ────────────────────────────────────────────
describe('ProfileSidebar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Karma value', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 2500 })} />);
    expect(screen.getByText('2,500')).toBeInTheDocument();
  });

  it('shows "Top contributor" for karma > 1000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 5000 })} />);
    expect(screen.getByText('Top contributor')).toBeInTheDocument();
  });

  it('shows "Legendary contributor" for karma > 10000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 15000 })} />);
    expect(screen.getByText('Legendary contributor')).toBeInTheDocument();
  });

  it('shows "Active contributor" for karma 101-1000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 500 })} />);
    expect(screen.getByText('Active contributor')).toBeInTheDocument();
  });

  it('renders Karma label', () => {
    render(<ProfileSidebar profile={makeProfile()} />);
    expect(screen.getByText('Karma')).toBeInTheDocument();
  });

  it('renders join date', () => {
    render(<ProfileSidebar profile={makeProfile({ createdAt: '2024-06-15T00:00:00Z' })} />);
    expect(screen.getByText(/June 2024/)).toBeInTheDocument();
  });
});
