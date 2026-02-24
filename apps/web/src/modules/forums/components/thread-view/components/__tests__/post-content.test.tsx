/** @module PostContent tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
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
