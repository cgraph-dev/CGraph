/** @module thread-reply-count tests */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadReplyCount } from '../thread-reply-count';

vi.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: () => <span data-testid="chat-icon" />,
}));

describe('ThreadReplyCount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for zero replies', () => {
    const { container } = render(<ThreadReplyCount replyCount={0} onClick={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for negative replies', () => {
    const { container } = render(<ThreadReplyCount replyCount={-1} onClick={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows singular "reply" for 1 reply', () => {
    render(<ThreadReplyCount replyCount={1} onClick={vi.fn()} />);
    expect(screen.getByText('1 reply')).toBeTruthy();
  });

  it('shows plural "replies" for multiple replies', () => {
    render(<ThreadReplyCount replyCount={5} onClick={vi.fn()} />);
    expect(screen.getByText('5 replies')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ThreadReplyCount replyCount={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows relative time for lastReplyAt', () => {
    const tenMinutesAgo = new Date('2025-06-15T11:50:00Z').toISOString();
    render(<ThreadReplyCount replyCount={2} onClick={vi.fn()} lastReplyAt={tenMinutesAgo} />);
    expect(screen.getByText(/10m ago/)).toBeTruthy();
  });

  it('shows "just now" for very recent replies', () => {
    const thirtySecondsAgo = new Date('2025-06-15T11:59:30Z').toISOString();
    render(<ThreadReplyCount replyCount={1} onClick={vi.fn()} lastReplyAt={thirtySecondsAgo} />);
    expect(screen.getByText(/just now/)).toBeTruthy();
  });

  it('does not show time when lastReplyAt is absent', () => {
    render(<ThreadReplyCount replyCount={2} onClick={vi.fn()} />);
    expect(screen.queryByText(/ago/)).toBeNull();
    expect(screen.queryByText(/just now/)).toBeNull();
  });
});
