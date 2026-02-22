// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn(() => ({ theme: 'dark', accentColor: 'blue' })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, animate, initial, exit, transition, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    button: ({ children, whileHover, whileTap, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className, ...rest }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => {
    if (fmt === 'h:mm a') return '3:00 PM';
    if (fmt === 'EEEE, MMMM d, yyyy') return 'Monday, March 15, 2027';
    return date.toISOString();
  }),
  formatDistanceToNow: vi.fn(() => 'in 2 hours'),
}));

import { ScheduledMessageCard } from '../scheduled-message-card';
import { TypingIndicator } from '../typing-indicator';

// ── Fixtures ───────────────────────────────────────────────────────────

const mockMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello scheduled message',
  encryptedContent: null,
  isEncrypted: false,
  messageType: 'text' as const,
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  sender: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
  },
  createdAt: '2027-03-15T12:00:00Z',
  updatedAt: '2027-03-15T12:00:00Z',
  scheduledAt: '2027-03-15T15:00:00Z',
  scheduleStatus: 'scheduled' as const,
};

// ── Tests ──────────────────────────────────────────────────────────────

describe('ScheduledMessageCard', () => {
  const defaultProps = {
    message: mockMessage as any,
    onCancel: vi.fn(),
    onReschedule: vi.fn(),
    isCanceling: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message content', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('Hello scheduled message')).toBeInTheDocument();
  });

  it('displays formatted scheduled time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('Monday, March 15, 2027')).toBeInTheDocument();
  });

  it('displays relative time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('in 2 hours')).toBeInTheDocument();
  });

  it('calls onReschedule when pencil button is clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const rescheduleBtn = screen.getByTitle('Reschedule');
    fireEvent.click(rescheduleBtn);
    expect(defaultProps.onReschedule).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel with message id when cancel button is clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const cancelBtn = screen.getByTitle('Cancel');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledWith('msg-1');
  });

  it('disables cancel button when isCanceling is true', () => {
    render(<ScheduledMessageCard {...defaultProps} isCanceling={true} />);
    const cancelBtn = screen.getByTitle('Cancel');
    expect(cancelBtn).toBeDisabled();
  });
});

describe('TypingIndicator', () => {
  it('returns null when no one is typing', () => {
    const { container } = render(<TypingIndicator typing={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows single user typing text', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByText('Alice is typing...')).toBeInTheDocument();
  });

  it('shows generic typing text for multiple users', () => {
    render(<TypingIndicator typing={['Alice', 'Bob']} />);
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('renders three bouncing dots', () => {
    const { container } = render(<TypingIndicator typing={['Alice']} />);
    // 3 dot divs inside flex container
    const dotContainer = container.querySelector('.flex.space-x-1\\.5');
    expect(dotContainer).toBeInTheDocument();
    expect(dotContainer?.children.length).toBe(3);
  });

  it('renders inside a GlassCard', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
