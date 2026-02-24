/** @module thread-view CommentCard tests */
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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string; variant?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
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
