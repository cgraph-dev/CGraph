/** @module nested-comments CommentCard tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: { duration: 0.3 } },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'current-user' } }) },
}));

vi.mock('./comment-header', () => ({
  CommentHeader: ({ comment }: { comment: { author: { displayName: string } } }) => (
    <div data-testid="comment-header">{comment.author.displayName}</div>
  ),
}));

vi.mock('./comment-vote-buttons', () => ({
  CommentVoteButtons: () => <div data-testid="vote-buttons" />,
}));

vi.mock('./comment-forms', () => ({
  ReplyForm: ({ authorUsername }: { authorUsername: string }) => (
    <div data-testid="reply-form">Reply to {authorUsername}</div>
  ),
  EditForm: () => <div data-testid="edit-form" />,
}));

vi.mock('./best-answer-badge', () => ({
  BestAnswerBadge: () => <div data-testid="best-answer-badge" />,
}));

vi.mock('@heroicons/react/24/outline', () => {
  const iconProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string' && prop !== '__esModule') {
        return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
      }
      return undefined;
    },
  });
  return iconProxy;
});
vi.mock('@heroicons/react/24/solid', () => {
  const iconProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string' && prop !== '__esModule') {
        return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
      }
      return undefined;
    },
  });
  return iconProxy;
});

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
