/** @module PollWidget tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, emphatic: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: ({ className }: { className?: string }) => (
    <span data-testid="check-icon" className={className} />
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <span data-testid="clock-icon" className={className} />
  ),
  UserGroupIcon: ({ className }: { className?: string }) => (
    <span data-testid="users-icon" className={className} />
  ),
  LockClosedIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-icon" className={className} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('@/modules/forums/store', () => ({
  useForumStore: () => ({
    votePoll: vi.fn(),
    closePoll: vi.fn(),
  }),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

vi.mock('./poll-widget.utils', () => ({
  getVotePercentage: (votes: number, total: number) =>
    total > 0 ? Math.round((votes / total) * 100) : 0,
  formatPollTimeRemaining: () => '2 days left',
}));

import PollWidget from '../poll-widget';

function makePoll(overrides: Record<string, unknown> = {}) {
  return {
    id: 'poll-1',
    threadId: 'thread-1',
    question: 'What is your favorite color?',
    options: [
      { id: 'opt-1', text: 'Red', votes: 5, voters: [] },
      { id: 'opt-2', text: 'Blue', votes: 10, voters: [] },
      { id: 'opt-3', text: 'Green', votes: 3, voters: [] },
    ],
    allowMultiple: false,
    public: true,
    closed: false,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PollWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the poll question', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" />);
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('renders all poll options', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" />);
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  it('renders total vote count', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" />);
    expect(screen.getByText('18 votes')).toBeInTheDocument();
  });

  it('renders singular vote text for 1 vote', () => {
    const poll = makePoll({
      options: [
        { id: 'opt-1', text: 'Yes', votes: 1, voters: [] },
        { id: 'opt-2', text: 'No', votes: 0, voters: [] },
      ],
    });
    render(<PollWidget poll={poll} threadId="thread-1" />);
    expect(screen.getByText('1 vote')).toBeInTheDocument();
  });

  it('shows closed label when poll is closed', () => {
    render(<PollWidget poll={makePoll({ closed: true })} threadId="thread-1" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('shows close poll button for creator', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" isCreator={true} />);
    expect(screen.getByText('Close Poll')).toBeInTheDocument();
  });

  it('does not show close poll button when not creator', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" isCreator={false} />);
    expect(screen.queryByText('Close Poll')).not.toBeInTheDocument();
  });

  it('does not show close poll button when already closed', () => {
    render(<PollWidget poll={makePoll({ closed: true })} threadId="thread-1" isCreator={true} />);
    expect(screen.queryByText('Close Poll')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PollWidget poll={makePoll()} threadId="thread-1" className="my-custom-class" />
    );
    expect(container.innerHTML).toContain('my-custom-class');
  });

  it('renders GlassCard wrapper', () => {
    render(<PollWidget poll={makePoll()} threadId="thread-1" />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
