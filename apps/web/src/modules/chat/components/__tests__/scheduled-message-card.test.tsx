/** @module scheduled-message-card tests */
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

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  loop: () => ({}),
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

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), warning: vi.fn() },
}));

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
    const cancelBtn = screen.getByTestId('icon-TrashIcon').closest('button');
    expect(cancelBtn).toBeDisabled();
  });
});
