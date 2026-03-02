/** @module comment-header tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  MinusIcon: () => <span data-testid="minus-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
}));

vi.mock('@/modules/gamification/components/user-stars', () => ({
  UserStars: ({ tier }: { tier: string }) => <span data-testid="user-stars">{tier}</span>,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <img data-testid="avatar" alt={alt} />,
}));

vi.mock('@/lib/utils', () => ({
  formatTimeAgo: (date: string) => `${date} ago`,
}));

import { CommentHeader } from '../comment-header';

describe('CommentHeader', () => {
  const baseComment = {
    id: 'c1',
    postId: 'p1',
    authorId: 'u1',
    parentId: null,
    content: 'Test comment',
    upvotes: 3,
    downvotes: 0,
    score: 5,
    myVote: null,
    userVote: null,
    currentVote: null,
    isCollapsed: false,
    depth: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    children: [],
    author: {
      id: 'u1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: '/avatar.png',
      avatarBorderId: null,
      avatar_border_id: null,
    },
  };

  const defaultProps = {
    comment: baseComment,
    isOwnComment: false,
    hasChildren: true,
    descendantCount: 3,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
  };

  it('renders author display name', () => {
    render(<CommentHeader {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders avatar with correct alt text', () => {
    render(<CommentHeader {...defaultProps} />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('alt', 'Test User');
  });

  it('renders time ago', () => {
    render(<CommentHeader {...defaultProps} />);
    expect(screen.getByText(/2024-01-01 ago/)).toBeInTheDocument();
  });

  it('shows collapse button when has children', () => {
    render(<CommentHeader {...defaultProps} />);
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  it('shows plus icon when collapsed', () => {
    render(<CommentHeader {...defaultProps} isCollapsed={true} />);
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('shows descendant count when collapsed', () => {
    render(<CommentHeader {...defaultProps} isCollapsed={true} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button clicked', () => {
    const onToggle = vi.fn();
    render(<CommentHeader {...defaultProps} onToggleCollapse={onToggle} />);
    const btn = screen.getByTestId('minus-icon').closest('button');
    if (btn) fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
