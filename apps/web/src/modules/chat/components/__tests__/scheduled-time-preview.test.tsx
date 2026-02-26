/** @module scheduled-time-preview tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduledTimePreview } from '../scheduled-time-preview';

vi.mock('date-fns', () => ({
  format: (date: Date, pattern: string) => {
    if (pattern === 'EEEE, MMMM d, yyyy') return 'Sunday, June 1, 2025';
    if (pattern === 'h:mm a') return '9:00 AM';
    return date.toISOString();
  },
}));

vi.mock('@/modules/chat/components/scheduleMessageUtils', () => ({
  formatTimeUntil: () => 'in 2 hours',
}));

describe('ScheduledTimePreview', () => {
  const date = new Date('2025-06-01T09:00:00Z');

  it('renders the formatted date', () => {
    render(<ScheduledTimePreview scheduledAt={date} />);
    expect(screen.getByText('Sunday, June 1, 2025')).toBeTruthy();
  });

  it('renders the formatted time', () => {
    render(<ScheduledTimePreview scheduledAt={date} />);
    expect(screen.getByText('at 9:00 AM')).toBeTruthy();
  });

  it('renders the header label', () => {
    render(<ScheduledTimePreview scheduledAt={date} />);
    expect(screen.getByText('Message will be sent:')).toBeTruthy();
  });

  it('renders formatTimeUntil result', () => {
    render(<ScheduledTimePreview scheduledAt={date} />);
    expect(screen.getByText('in 2 hours')).toBeTruthy();
  });
});
