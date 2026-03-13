/** @module message-reactions tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageReactions from '../message-reactions';

vi.mock('motion/react', () => ({
  motion: new Proxy({} as Record<string, unknown>, {
    get:
      (_t: unknown, prop: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ children, ...rest }: any) => {
        const {
          _initial,
          _animate,
          _exit,
          _transition,
          _variants,
          _whileHover,
          _whileTap,
          _layout,
          _layoutId,
          ...safe
        } = rest;
        return (
          <div data-motion={prop} {...safe}>
            {children}
          </div>
        );
      },
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FaceSmileIcon: () => <span data-testid="smile-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/lib/chat/reactionUtils', () => ({
  getReactionAnimation: vi.fn(() => null),
}));

vi.mock('@/lib/lottie', () => ({
  LottieRenderer: ({ emoji }: { emoji: string }) => <span>{emoji}</span>,
  AnimatedEmoji: ({ emoji }: { emoji: string }) => <span>{emoji}</span>,
}));

vi.mock('@cgraph/animation-constants', () => ({
  durations: { loop: { ms: 2000 } },
}));

const baseProps = {
  messageId: 'msg-1',
  currentUserId: 'user-1',
  onAddReaction: vi.fn(),
  onRemoveReaction: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageReactions', () => {
  it('renders existing reactions with emoji and count', () => {
    const reactions = [
      {
        emoji: '👍',
        count: 3,
        users: [
          { id: 'u1', username: 'a' },
          { id: 'u2', username: 'b' },
          { id: 'u3', username: 'c' },
        ],
        hasReacted: false,
      },
    ];
    render(<MessageReactions {...baseProps} reactions={reactions} />);
    expect(screen.getByText('👍')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('does not show count when only 1 vote', () => {
    const reactions = [
      { emoji: '❤️', count: 1, users: [{ id: 'u1', username: 'a' }], hasReacted: false },
    ];
    render(<MessageReactions {...baseProps} reactions={reactions} />);
    expect(screen.getByText('❤️')).toBeTruthy();
    expect(screen.queryByText('1')).toBeNull();
  });

  it('calls onAddReaction when clicking an unreacted emoji', () => {
    const reactions = [
      {
        emoji: '😂',
        count: 2,
        users: [
          { id: 'u2', username: 'b' },
          { id: 'u3', username: 'c' },
        ],
        hasReacted: false,
      },
    ];
    render(<MessageReactions {...baseProps} reactions={reactions} />);
    fireEvent.click(screen.getByText('😂'));
    expect(baseProps.onAddReaction).toHaveBeenCalledWith('msg-1', '😂');
  });

  it('calls onRemoveReaction when clicking an already-reacted emoji', () => {
    const reactions = [
      { emoji: '🔥', count: 1, users: [{ id: 'user-1', username: 'me' }], hasReacted: true },
    ];
    render(<MessageReactions {...baseProps} reactions={reactions} />);
    fireEvent.click(screen.getByText('🔥'));
    expect(baseProps.onRemoveReaction).toHaveBeenCalledWith('msg-1', '🔥');
  });

  it('renders the add-reaction button', () => {
    render(<MessageReactions {...baseProps} reactions={[]} />);
    expect(screen.getByLabelText('Add reaction')).toBeTruthy();
  });

  it('shows quick reactions picker on button click', () => {
    render(<MessageReactions {...baseProps} reactions={[]} />);
    fireEvent.click(screen.getByLabelText('Add reaction'));
    expect(screen.getByText('Quick Reactions')).toBeTruthy();
  });

  it('renders multiple reaction badges', () => {
    const reactions = [
      {
        emoji: '👍',
        count: 2,
        users: [
          { id: 'u1', username: 'a' },
          { id: 'u2', username: 'b' },
        ],
        hasReacted: false,
      },
      { emoji: '❤️', count: 1, users: [{ id: 'u3', username: 'c' }], hasReacted: false },
    ];
    render(<MessageReactions {...baseProps} reactions={reactions} />);
    expect(screen.getByText('👍')).toBeTruthy();
    expect(screen.getByText('❤️')).toBeTruthy();
  });
});
