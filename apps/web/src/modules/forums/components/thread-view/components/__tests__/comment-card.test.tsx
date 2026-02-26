/** @module thread-view CommentCard tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string; variant?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('@/lib/utils', () => ({
  formatTimeAgo: (date: string) => `${date} ago`,
}));

import { CommentCard } from '../comment-card';

const makeComment = (overrides = {}) => ({
  id: 'c1',
  content: 'This is a comment',
  score: 5,
  userVote: null as 1 | -1 | null,
  isBestAnswer: false,
  createdAt: '2025-01-01T00:00:00Z',
  author: {
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: 'https://example.com/alice.png',
    avatarBorderId: null,
    avatar_border_id: null,
  },
  ...overrides,
});

describe('CommentCard (thread-view)', () => {
  const onVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comment content', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    expect(screen.getByText('This is a comment')).toBeInTheDocument();
  });

  it('renders author display name', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders score', () => {
    render(<CommentCard comment={makeComment({ score: 10 })} index={0} onVote={onVote} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders "Best Answer" badge when isBestAnswer is true', () => {
    render(<CommentCard comment={makeComment({ isBestAnswer: true })} index={0} onVote={onVote} />);
    expect(screen.getByText('Best Answer')).toBeInTheDocument();
  });

  it('does not render "Best Answer" badge when isBestAnswer is false', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    expect(screen.queryByText('Best Answer')).not.toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    expect(screen.getByText('2025-01-01T00:00:00Z ago')).toBeInTheDocument();
  });

  it('renders avatar with alt text', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('Alice');
  });

  it('calls onVote with upvote when upvote button is clicked', () => {
    render(<CommentCard comment={makeComment()} index={0} onVote={onVote} />);
    const upvoteButtons = screen.getAllByRole('button');
    // First button is upvote
    fireEvent.click(upvoteButtons[0]);
    expect(onVote).toHaveBeenCalledWith('c1', 1, null);
  });

  it('highlights upvote button when userVote is 1', () => {
    render(<CommentCard comment={makeComment({ userVote: 1 })} index={0} onVote={onVote} />);
    const upvoteButtons = screen.getAllByRole('button');
    expect(upvoteButtons[0]).toHaveClass('text-green-500');
  });
});
