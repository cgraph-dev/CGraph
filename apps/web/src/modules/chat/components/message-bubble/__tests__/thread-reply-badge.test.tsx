/** @module ThreadReplyBadge tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadReplyBadge } from '../thread-reply-badge';
import type { Message } from '@/modules/chat/store';

const mockOpenThread = vi.fn();
let mockReplyCounts: Record<string, number> = {};

vi.mock('@/modules/chat/store/threadStore', () => ({
  useThreadStore: (selector: (s: { replyCounts: Record<string, number>; openThread: () => void }) => unknown) =>
    selector({ replyCounts: mockReplyCounts, openThread: mockOpenThread }),
}));

describe('ThreadReplyBadge', () => {
  const mockMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Hello',
  } as Message;

  const defaultProps = {
    messageId: 'msg-1',
    conversationId: 'conv-1',
    message: mockMessage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReplyCounts = {};
  });

  it('renders nothing when there are no replies', () => {
    const { container } = render(<ThreadReplyBadge {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when reply count is 0', () => {
    mockReplyCounts = { 'msg-1': 0 };
    const { container } = render(<ThreadReplyBadge {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "1 reply" for a single reply', () => {
    mockReplyCounts = { 'msg-1': 1 };
    render(<ThreadReplyBadge {...defaultProps} />);
    expect(screen.getByText('1 reply')).toBeInTheDocument();
  });

  it('renders "3 replies" for multiple replies', () => {
    mockReplyCounts = { 'msg-1': 3 };
    render(<ThreadReplyBadge {...defaultProps} />);
    expect(screen.getByText('3 replies')).toBeInTheDocument();
  });

  it('calls openThread with correct args on click', () => {
    mockReplyCounts = { 'msg-1': 5 };
    render(<ThreadReplyBadge {...defaultProps} />);
    fireEvent.click(screen.getByTitle('View thread'));
    expect(mockOpenThread).toHaveBeenCalledWith('conv-1', mockMessage);
  });

  it('has correct title attribute', () => {
    mockReplyCounts = { 'msg-1': 2 };
    render(<ThreadReplyBadge {...defaultProps} />);
    expect(screen.getByTitle('View thread')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    mockReplyCounts = { 'msg-1': 1 };
    render(<ThreadReplyBadge {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
