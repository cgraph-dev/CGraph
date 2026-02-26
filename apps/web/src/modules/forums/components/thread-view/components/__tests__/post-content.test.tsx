/** @module PostContent tests */
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

vi.mock('dompurify', () => ({
  __esModule: true,
  default: { sanitize: (html: string) => html },
}));

vi.mock('@/lib/utils', () => ({
  formatTimeAgo: (date: string) => `${date} ago`,
}));

vi.mock('@/modules/gamification/components/user-stars', () => ({
  UserStars: () => <div data-testid="user-stars" />,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

vi.mock('./prefix-badge', () => ({
  PrefixBadge: ({ prefix }: { prefix: string }) => <span data-testid="prefix-badge">{prefix}</span>,
}));

vi.mock('./rating-stars', () => ({
  RatingStars: () => <div data-testid="rating-stars" />,
}));

vi.mock('./share-menu', () => ({
  ShareMenu: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="share-menu" /> : null,
}));

vi.mock('./more-menu', () => ({
  MoreMenu: () => <div data-testid="more-menu" />,
}));

vi.mock('./comment-form', () => ({
  CommentForm: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="comment-form" /> : null,
}));

import { PostContent } from '../post-content';

const makePost = (overrides = {}) => ({
  id: 'p1',
  title: 'Test Post Title',
  content: '<p>Post body content</p>',
  isPinned: false,
  isLocked: false,
  prefix: null,
  viewCount: 100,
  replyCount: 5,
  rating: 4.5,
  createdAt: '2025-01-01',
  author: {
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: 'https://example.com/a.png',
    reputation: 50,
    avatarBorderId: null,
    avatar_border_id: null,
  },
  ...overrides,
});

const defaultProps = {
  post: makePost(),
  primaryColor: '#3b82f6',
  isBookmarked: false,
  canModerate: false,
  canEdit: false,
  variant: 'default',
  hoveredRating: 0,
  setHoveredRating: vi.fn(),
  onRate: vi.fn(),
  showCommentForm: false,
  setShowCommentForm: vi.fn(),
  commentContent: '',
  setCommentContent: vi.fn(),
  isSubmitting: false,
  onSubmitComment: vi.fn(),
};

describe('PostContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders post title', () => {
    render(<PostContent {...defaultProps} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('renders author display name', () => {
    render(<PostContent {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar with correct alt text', () => {
    render(<PostContent {...defaultProps} />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('Alice');
  });

  it('shows pinned badge when post is pinned', () => {
    render(<PostContent {...defaultProps} post={makePost({ isPinned: true })} />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('shows locked badge when post is locked', () => {
    render(<PostContent {...defaultProps} post={makePost({ isLocked: true })} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows prefix badge when prefix is present', () => {
    render(<PostContent {...defaultProps} post={makePost({ prefix: 'Discussion' })} />);
    expect(screen.getByTestId('prefix-badge')).toHaveTextContent('Discussion');
  });

  it('does not show prefix badge when prefix is null', () => {
    render(<PostContent {...defaultProps} />);
    expect(screen.queryByTestId('prefix-badge')).not.toBeInTheDocument();
  });

  it('renders user stars component', () => {
    render(<PostContent {...defaultProps} />);
    expect(screen.getByTestId('user-stars')).toBeInTheDocument();
  });
});
