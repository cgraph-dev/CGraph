/** @module NestedComments tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('./comment-card', () => ({
  CommentCard: ({ comment }: { comment: { id: string; content: string } }) => (
    <div data-testid={`nested-comment-${comment.id}`}>{comment.content}</div>
  ),
}));

vi.mock('./utils', () => ({
  sortComments: (comments: unknown[]) => comments,
  getTopLevelComments: (comments: unknown[]) => comments,
}));

import NestedComments from '../nested-comments';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeComment: any = (
  id: string,
  content: string,
  replies: ReturnType<typeof makeComment>[] = []
) => ({
  id,
  postId: 'p1',
  content,
  score: 0,
  userVote: null,
  isBestAnswer: false,
  isEdited: false,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  parentId: null,
  depth: 0,
  authorId: `author-${id}`,
  replies,
  author: {
    id: `author-${id}`,
    username: `user-${id}`,
    displayName: `User ${id}`,
    avatarUrl: null,
    avatarBorderId: null,
    pulse: 0,
    isVerified: false,
  },
});

const defaultProps = {
  postId: 'p1',
  comments: [] as ReturnType<typeof makeComment>[],
  isAuthorOfPost: false,
  canMarkBestAnswer: false,
  sortBy: 'best' as const,
  onVote: vi.fn(),
  onReply: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onMarkBestAnswer: vi.fn(),
};

describe('NestedComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no comments', () => {
    render(<NestedComments {...defaultProps} comments={[]} />);
    expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
  });

  it('renders chat bubble icon in empty state', () => {
    render(<NestedComments {...defaultProps} comments={[]} />);
    expect(screen.getByTestId('icon-ChatBubbleLeftIcon')).toBeInTheDocument();
  });

  it('renders a single comment', () => {
    const comments = [makeComment('c1', 'Hello world')];
    render(<NestedComments {...defaultProps} comments={comments} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders multiple comments', () => {
    const comments = [makeComment('c1', 'First comment'), makeComment('c2', 'Second comment')];
    render(<NestedComments {...defaultProps} comments={comments} />);
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  it('does not show empty state when comments exist', () => {
    const comments = [makeComment('c1', 'Hello')];
    render(<NestedComments {...defaultProps} comments={comments} />);
    expect(screen.queryByText('No comments yet. Be the first to comment!')).not.toBeInTheDocument();
  });

  it('accepts custom maxDepth prop', () => {
    const comments = [makeComment('c1', 'Hello')];
    const { container } = render(
      <NestedComments {...defaultProps} comments={comments} maxDepth={3} />
    );
    expect(container).toBeTruthy();
  });
});
