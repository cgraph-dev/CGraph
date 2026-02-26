/** @module scheduled-message-card tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('date-fns', () => ({
  format: (_d: Date, fmt: string) => (fmt === 'h:mm a' ? '3:00 PM' : 'Feb 24, 2026'),
  formatDistanceToNow: () => 'in 2 hours',
}));

import { ScheduledMessageCard } from '../scheduled-message-card';

const scheduledMsg = {
  id: 'msg-1',
  content: 'Hello scheduled!',
  type: 'text' as const,
  senderId: 'user-1',
  createdAt: '2026-02-24T12:00:00Z',
  conversationId: 'conv-1',
  scheduledAt: '2026-02-24T15:00:00Z',
};

describe('ScheduledMessageCard', () => {
  const defaultProps = {
    message: scheduledMsg,
    onCancel: vi.fn(),
    onReschedule: vi.fn(),
    isCanceling: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message content', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('Hello scheduled!')).toBeInTheDocument();
  });

  it('renders scheduled time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('renders relative time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText(/in 2 hours/)).toBeInTheDocument();
  });

  it('calls onReschedule when reschedule button clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const rescheduleBtn = screen.getByTestId('icon-PencilIcon').closest('button');
    if (rescheduleBtn) fireEvent.click(rescheduleBtn);
    expect(defaultProps.onReschedule).toHaveBeenCalled();
  });

  it('calls onCancel with messageId when cancel button clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const cancelBtn = screen.getByTestId('icon-TrashIcon').closest('button');
    if (cancelBtn) fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledWith('msg-1');
  });

  it('disables cancel button when canceling', () => {
    render(<ScheduledMessageCard {...defaultProps} isCanceling={true} />);
    // When canceling, button shows spinner instead of TrashIcon — find by title
    const cancelBtn = screen.getByTitle('Cancel');
    expect(cancelBtn).toBeDisabled();
  });
});
