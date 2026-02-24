/** @module poll-message tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PollMessage } from '../poll-message';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {} as Record<
      string,
      (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
    >,
    {
      get:
        (_target, prop) =>
        ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Tag = (
            typeof prop === 'string' ? prop : 'div'
          ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any;
          return <Tag className={className as string}>{children}</Tag>;
        },
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: () => <span data-testid="chart-icon" />,
  CheckCircleIcon: () => <span data-testid="check-icon" />,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

const baseOptions = [
  { id: 'a', text: 'Option A', votes: [] as string[] },
  { id: 'b', text: 'Option B', votes: [] as string[] },
];

describe('PollMessage', () => {
  it('renders the poll question and creator name', () => {
    render(
      <PollMessage
        question="Best framework?"
        options={baseOptions}
        multipleChoice={false}
        anonymous={false}
        creatorName="Alice"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText('Best framework?')).toBeTruthy();
    expect(screen.getByText(/Poll by Alice/)).toBeTruthy();
  });

  it('renders all poll options', () => {
    render(
      <PollMessage
        question="Pick one"
        options={baseOptions}
        multipleChoice={false}
        anonymous={false}
        creatorName="Bob"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText('Option A')).toBeTruthy();
    expect(screen.getByText('Option B')).toBeTruthy();
  });

  it('shows total vote count', () => {
    const opts = [
      { id: 'a', text: 'A', votes: ['u1', 'u2'] },
      { id: 'b', text: 'B', votes: ['u3'] },
    ];
    render(
      <PollMessage
        question="Q"
        options={opts}
        multipleChoice={false}
        anonymous={false}
        creatorName="C"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText(/3 votes/)).toBeTruthy();
  });

  it('shows "1 vote" singular form', () => {
    const opts = [
      { id: 'a', text: 'A', votes: ['u1'] },
      { id: 'b', text: 'B', votes: [] as string[] },
    ];
    render(
      <PollMessage
        question="Q"
        options={opts}
        multipleChoice={false}
        anonymous={false}
        creatorName="D"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText(/1 vote(?!s)/)).toBeTruthy();
  });

  it('shows Multi-select badge for multiple choice', () => {
    render(
      <PollMessage
        question="Q"
        options={baseOptions}
        multipleChoice={true}
        anonymous={false}
        creatorName="E"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText('Multi-select')).toBeTruthy();
  });

  it('shows Anonymous label when anonymous', () => {
    render(
      <PollMessage
        question="Q"
        options={baseOptions}
        multipleChoice={false}
        anonymous={true}
        creatorName="F"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText(/Anonymous/)).toBeTruthy();
  });

  it('calls onVote when option is clicked', () => {
    const onVote = vi.fn();
    render(
      <PollMessage
        question="Q"
        options={baseOptions}
        multipleChoice={false}
        anonymous={false}
        creatorName="G"
        onVote={onVote}
      />
    );
    fireEvent.click(screen.getByText('Option A'));
    expect(onVote).toHaveBeenCalledWith('a');
  });

  it('disables options after single-choice vote', () => {
    const voted = [
      { id: 'a', text: 'A', votes: ['user-1'] },
      { id: 'b', text: 'B', votes: [] as string[] },
    ];
    render(
      <PollMessage
        question="Q"
        options={voted}
        multipleChoice={false}
        anonymous={false}
        creatorName="H"
        onVote={vi.fn()}
      />
    );
    // Option B should be disabled since user already voted single-choice
    const buttons = screen.getAllByRole('button');
    const optionB = buttons.find((b) => b.textContent?.includes('B'));
    expect(optionB).toBeTruthy();
    expect(optionB?.hasAttribute('disabled')).toBe(true);
  });

  it('shows percentage when user has voted', () => {
    const voted = [
      { id: 'a', text: 'A', votes: ['user-1', 'u2'] },
      { id: 'b', text: 'B', votes: ['u3'] },
    ];
    render(
      <PollMessage
        question="Q"
        options={voted}
        multipleChoice={false}
        anonymous={false}
        creatorName="I"
        onVote={vi.fn()}
      />
    );
    expect(screen.getByText(/67%/)).toBeTruthy();
    expect(screen.getByText(/33%/)).toBeTruthy();
  });
});
