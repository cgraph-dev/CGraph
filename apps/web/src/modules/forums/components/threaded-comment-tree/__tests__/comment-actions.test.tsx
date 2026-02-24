/** @module comment-actions tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = Record<string, any>;

vi.mock('framer-motion', () => {
  const handler = {
    get: (_target: unknown, prop: string) => {
      if (typeof prop === 'string') {
        return ({ children, ...rest }: AnyProps) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...domProps } = rest;
          return <div data-motion={prop} {...domProps}>{children}</div>;
        };
      }
      return undefined;
    },
  };
  return {
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: AnyProps) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, fast: {} },
  springs: { snappy: {} },
}));

vi.mock('@heroicons/react/24/outline', () => {
  const handler = {
    get: (_t: unknown, name: string) => {
      if (name === '__esModule') return true;
      return () => <span data-testid={`icon-${name}`} />;
    },
  };
  return new Proxy({}, handler);
});

vi.mock('@heroicons/react/24/solid', () => {
  const handler = {
    get: (_t: unknown, name: string) => {
      if (name === '__esModule') return true;
      return () => <span data-testid={`solid-${name}`} />;
    },
  };
  return new Proxy({}, handler);
});

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
    const replyBtn = screen.getByTestId('icon-ChatBubbleLeftIcon').closest('[data-motion]');
    if (replyBtn) fireEvent.click(replyBtn);
    expect(defaultProps.onReply).toHaveBeenCalledOnce();
  });
});
