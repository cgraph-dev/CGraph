/** @module nested-comments CommentCard tests */
import React from 'react';
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

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'current-user' } }) },
}));

vi.mock('../comment-header', () => ({
  CommentHeader: ({ comment }: { comment: { author: { displayName: string } } }) => (
    <div data-testid="comment-header">{comment.author.displayName}</div>
  ),
}));

vi.mock('../comment-vote-buttons', () => ({
  CommentVoteButtons: () => <div data-testid="vote-buttons" />,
}));

vi.mock('../comment-forms', () => ({
  ReplyForm: ({ authorUsername }: { authorUsername: string }) => (
    <div data-testid="reply-form">Reply to {authorUsername}</div>
  ),
  EditForm: () => <div data-testid="edit-form" />,
}));

vi.mock('../best-answer-badge', () => ({
  BestAnswerBadge: () => <div data-testid="best-answer-badge" />,
}));

import { CommentCard } from '../comment-card';

const makeComment = (overrides = {}) => ({
  id: 'c1',
  content: 'Test comment content',
  score: 3,
  userVote: null,
  isBestAnswer: false,
  createdAt: '2025-01-01',
  authorId: 'other-user',
  replies: [],
  author: {
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
    avatarBorderId: null,
  },
  ...overrides,
});

const defaultProps = {
  comment: makeComment(),
  depth: 0,
  maxDepth: 10,
  isAuthorOfPost: false,
  canMarkBestAnswer: false,
  isCollapsed: false,
  isReplying: false,
  isEditing: false,
  replyContent: '',
  editContent: '',
  onToggleCollapse: vi.fn(),
  onSetReplyingTo: vi.fn(),
  onSetEditingComment: vi.fn(),
  onSetReplyContent: vi.fn(),
  onSetEditContent: vi.fn(),
  onReply: vi.fn(),
  onEdit: vi.fn(),
  onVote: vi.fn(),
  onDelete: vi.fn(),
  onMarkBestAnswer: vi.fn(),
  sortedComments: (c: unknown[]) => c,
  renderComment: (c: { id: string }) => <div key={c.id} data-testid={`reply-${c.id}`} />,
};

describe('nested-comments CommentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comment content', () => {
    render(<CommentCard {...defaultProps} />);
    expect(screen.getByText('Test comment content')).toBeInTheDocument();
  });

  it('renders comment header with author name', () => {
    render(<CommentCard {...defaultProps} />);
    expect(screen.getByTestId('comment-header')).toHaveTextContent('Alice');
  });

  it('renders vote buttons', () => {
    render(<CommentCard {...defaultProps} />);
    expect(screen.getByTestId('vote-buttons')).toBeInTheDocument();
  });

  it('renders reply button', () => {
    render(<CommentCard {...defaultProps} />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('shows reply form when isReplying is true', () => {
    render(<CommentCard {...defaultProps} isReplying />);
    expect(screen.getByTestId('reply-form')).toHaveTextContent('Reply to alice');
  });

  it('hides reply form when isReplying is false', () => {
    render(<CommentCard {...defaultProps} />);
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();
  });

  it('shows best answer badge when isBestAnswer is true', () => {
    render(<CommentCard {...defaultProps} comment={makeComment({ isBestAnswer: true })} />);
    expect(screen.getByTestId('best-answer-badge')).toBeInTheDocument();
  });

  it('shows collapse button when comment has replies', () => {
    const comment = makeComment({ replies: [makeComment({ id: 'r1' })] });
    render(<CommentCard {...defaultProps} comment={comment} />);
    expect(screen.getByText(/1 replies/)).toBeInTheDocument();
  });

  it('renders nested replies when not collapsed', () => {
    const reply = makeComment({ id: 'r1', content: 'Reply content' });
    const comment = makeComment({ replies: [reply] });
    render(<CommentCard {...defaultProps} comment={comment} />);
    expect(screen.getByTestId('reply-r1')).toBeInTheDocument();
  });

  it('applies indentation styling at depth > 0', () => {
    const { container } = render(<CommentCard {...defaultProps} depth={1} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('ml-6');
  });
});
