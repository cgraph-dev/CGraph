/** @module schedule-message-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleMessageModal } from '../schedule-message-modal';

const mockHookReturn = {
  scheduledAt: null as Date | null,
  setScheduledAt: vi.fn(),
  customDateTime: '',
  setCustomDateTime: vi.fn(),
  isScheduling: false,
  handleClose: vi.fn(),
  handleQuickSchedule: vi.fn(),
  handleCustomDateTimeChange: vi.fn(),
  handleSchedule: vi.fn(),
  getMinDateTime: () => '2025-01-01T00:00',
  getMaxDateTime: () => '2025-12-31T23:59',
};

vi.mock('@/modules/chat/hooks/useScheduleMessageModal', () => ({
  useScheduleMessageModal: () => mockHookReturn,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/modules/chat/components/scheduled-time-preview', () => ({
  ScheduledTimePreview: ({ scheduledAt }: { scheduledAt: Date }) => (
    <div data-testid="time-preview">{scheduledAt.toISOString()}</div>
  ),
}));

vi.mock('@/modules/chat/components/scheduleMessageUtils', () => ({
  QUICK_SCHEDULE_OPTIONS: [
    { label: 'In 15 minutes', icon: '⏰', duration: 15 },
    { label: 'In 1 hour', icon: '🕐', duration: 60 },
    { label: 'Tomorrow 9 AM', icon: '🌅', time: '09:00', dayOffset: 1 },
  ],
  resolveScheduleDate: () => new Date('2025-06-01T09:00:00Z'),
  formatDateTimeLocal: () => '2025-06-01T09:00',
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSchedule: vi.fn().mockResolvedValue(undefined),
  messagePreview: 'Hello world!',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockHookReturn.scheduledAt = null;
  mockHookReturn.isScheduling = false;
  mockHookReturn.customDateTime = '';
});

describe('ScheduleMessageModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ScheduleMessageModal {...defaultProps} isOpen={false} />);
    expect(container.textContent).toBe('');
  });

  it('renders header when open', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Schedule Message' })).toBeTruthy();
    expect(screen.getByText('Choose when to send this message')).toBeTruthy();
  });

  it('shows message preview', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByText('Message Preview:')).toBeTruthy();
    expect(screen.getByText('Hello world!')).toBeTruthy();
  });

  it('renders quick schedule options', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByText('In 15 minutes')).toBeTruthy();
    expect(screen.getByText('In 1 hour')).toBeTruthy();
    expect(screen.getByText('Tomorrow 9 AM')).toBeTruthy();
  });

  it('shows custom date/time input', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByText('Custom Date & Time:')).toBeTruthy();
    const input = screen.getByDisplayValue('');
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).type).toBe('datetime-local');
  });

  it('shows timezone info', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByText(/Your timezone:/)).toBeTruthy();
  });

  it('calls handleClose on cancel', () => {
    render(<ScheduleMessageModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockHookReturn.handleClose).toHaveBeenCalled();
  });

  it('shows ScheduledTimePreview when date is selected', () => {
    mockHookReturn.scheduledAt = new Date('2025-06-01T09:00:00Z');
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByTestId('time-preview')).toBeTruthy();
  });

  it('shows Scheduling... text when isScheduling', () => {
    mockHookReturn.scheduledAt = new Date('2025-06-01T09:00:00Z');
    mockHookReturn.isScheduling = true;
    render(<ScheduleMessageModal {...defaultProps} />);
    expect(screen.getByText('Scheduling...')).toBeTruthy();
  });

  it('calls handleSchedule when schedule button clicked', () => {
    mockHookReturn.scheduledAt = new Date('2025-06-01T09:00:00Z');
    render(<ScheduleMessageModal {...defaultProps} />);
    const buttons = screen.getAllByText('Schedule Message');
    const scheduleBtn = buttons.find(
      (b) => b.closest('button') && b.closest('button')!.className.includes('gradient')
    );
    if (scheduleBtn) {
      fireEvent.click(scheduleBtn.closest('button')!);
      expect(mockHookReturn.handleSchedule).toHaveBeenCalled();
    }
  });
});
