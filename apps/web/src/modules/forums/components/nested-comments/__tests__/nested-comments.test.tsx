/** @module NestedComments tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), success: vi.fn() },
}));

const iconProxy = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop !== '__esModule') {
      return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
    }
    return undefined;
  },
});
vi.mock('@heroicons/react/24/outline', () => iconProxy);
vi.mock('@heroicons/react/24/solid', () => iconProxy);

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

const makeComment = (id: string, content: string, replies: ReturnType<typeof makeComment>[] = []) => ({
  id,
  content,
  score: 0,
  userVote: null,
  isBestAnswer: false,
  createdAt: '2025-01-01',
  authorId: `author-${id}`,
  replies,
  author: {
    username: `user-${id}`,
    displayName: `User ${id}`,
    avatarUrl: null,
    avatarBorderId: null,
  },
});

const defaultProps = {
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
    expect(screen.getByTestId('nested-comment-c1')).toHaveTextContent('Hello world');
  });

  it('renders multiple comments', () => {
    const comments = [
      makeComment('c1', 'First comment'),
      makeComment('c2', 'Second comment'),
    ];
    render(<NestedComments {...defaultProps} comments={comments} />);
    expect(screen.getByTestId('nested-comment-c1')).toBeInTheDocument();
    expect(screen.getByTestId('nested-comment-c2')).toBeInTheDocument();
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
