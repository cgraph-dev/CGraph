/** @module comment-actions tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// framer-motion, @heroicons/react/* are handled by resolve.alias
// in vite.config.ts — no vi.mock needed here.

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, fast: {} },
  springs: { snappy: {}, bouncy: {} },
}));

import { CommentActions } from '../comment-actions';

describe('CommentActions', () => {
  const defaultProps = {
    score: 10,
    currentVote: null as 1 | -1 | null,
    canMarkBestAnswer: false,
    isVoting: false,
    onVote: vi.fn(),
    onReply: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the score', () => {
    render(<CommentActions {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders upvote icon', () => {
    render(<CommentActions {...defaultProps} />);
    expect(screen.getByTestId('icon-ArrowUpIcon')).toBeInTheDocument();
  });

  it('renders downvote icon', () => {
    render(<CommentActions {...defaultProps} />);
    expect(screen.getByTestId('icon-ArrowDownIcon')).toBeInTheDocument();
  });

  it('renders reply icon', () => {
    render(<CommentActions {...defaultProps} />);
    expect(screen.getByTestId('icon-ChatBubbleLeftIcon')).toBeInTheDocument();
  });

  it('calls onReply when reply button is clicked', () => {
    render(<CommentActions {...defaultProps} />);
    const replyBtn = screen.getByRole('button', { name: /reply/i });
    fireEvent.click(replyBtn);
    expect(defaultProps.onReply).toHaveBeenCalledOnce();
  });
});
