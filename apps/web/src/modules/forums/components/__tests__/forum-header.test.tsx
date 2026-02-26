/**
 * @file forum-header.test.tsx
 * @description Tests for ForumHeader component — forum banner, icon, stats,
 *   vote buttons, and action buttons.
 * @module forums/components/__tests__/ForumHeader
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../forum-header/vote-buttons', () => ({
  VoteButtons: ({ score }: { score: number }) => (
    <div data-testid="vote-buttons">Score: {score}</div>
  ),
}));

vi.mock('../forum-header/forum-stats', () => ({
  ForumStats: ({ memberCount }: { memberCount: number }) => (
    <div data-testid="forum-stats">{memberCount} members</div>
  ),
}));

vi.mock('../forum-header/forum-actions', () => ({
  ForumActions: () => <div data-testid="forum-actions">Actions</div>,
}));

vi.mock('../forum-header/forum-icon', () => ({
  ForumIcon: ({ name }: { name: string }) => <div data-testid="forum-icon">{name}</div>,
}));

vi.mock('../forum-header/forum-header-compact', () => ({
  ForumHeaderCompact: ({ forum }: { forum: { name: string } }) => (
    <div data-testid="compact-header">{forum.name}</div>
  ),
}));

vi.mock('../forum-header/forum-header-hero', () => ({
  ForumHeaderHero: ({ forum }: { forum: { name: string } }) => (
    <div data-testid="hero-header">{forum.name}</div>
  ),
}));

vi.mock('../forum-header/utils', () => ({ copyCurrentUrl: vi.fn() }));

// ── Helpers ────────────────────────────────────────────────────────────
const makeForum = (overrides?: Record<string, unknown>) => ({
  id: 'f-1',
  name: 'Test Forum',
  description: 'A test forum',
  iconUrl: null,
  bannerUrl: null,
  memberCount: 500,
  score: 42,
  userVote: 0,
  featured: false,
  ...overrides,
});

import { ForumHeader } from '../forum-header/forum-header';

// ── Tests ──────────────────────────────────────────────────────────────
describe('ForumHeader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders forum name in default variant', () => {
    render(<ForumHeader forum={makeForum()} />);
    const els = screen.getAllByText('Test Forum');
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it('renders vote buttons when onVote is provided', () => {
    render(<ForumHeader forum={makeForum()} onVote={vi.fn()} />);
    expect(screen.getByTestId('vote-buttons')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<ForumHeader forum={makeForum()} variant="compact" />);
    expect(screen.getByTestId('compact-header')).toBeInTheDocument();
  });

  it('renders hero variant', () => {
    render(<ForumHeader forum={makeForum()} variant="hero" onVote={vi.fn()} />);
    expect(screen.getByTestId('hero-header')).toBeInTheDocument();
  });

  it('renders forum icon sub-component', () => {
    render(<ForumHeader forum={makeForum()} />);
    expect(screen.getByTestId('forum-icon')).toBeInTheDocument();
  });

  it('renders forum stats sub-component', () => {
    render(<ForumHeader forum={makeForum({ memberCount: 300 })} />);
    expect(screen.getByTestId('forum-stats')).toBeInTheDocument();
  });

  it('passes isMember false by default', () => {
    render(<ForumHeader forum={makeForum()} />);
    expect(screen.getByTestId('forum-actions')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<ForumHeader forum={makeForum({ description: 'Welcome!' })} />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('renders banner image when bannerUrl provided', () => {
    const { container } = render(<ForumHeader forum={makeForum({ bannerUrl: '/banner.jpg' })} />);
    const img = container.querySelector('img[src="/banner.jpg"]');
    expect(img).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<ForumHeader forum={makeForum()} className="custom-cls" />);
    expect(container.innerHTML).toContain('custom-cls');
  });
});
