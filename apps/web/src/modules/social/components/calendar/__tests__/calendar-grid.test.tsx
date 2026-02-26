/** @module calendar-grid tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../calendarUtils', () => ({
  formatTime: (d: Date) => d?.toISOString?.()?.slice(11, 16) ?? '00:00',
  getCategoryColor: () => '#6366f1',
  getEventTypeIcon: () => '📅',
  isToday: (d: Date) => d.toDateString() === new Date().toDateString(),
}));

import { CalendarGrid } from '../calendar-grid';

describe('CalendarGrid', () => {
  const today = new Date();
  const calendarDays = [
    null,
    null,
    new Date(2024, 0, 1),
    new Date(2024, 0, 2),
    new Date(2024, 0, 3),
  ];

  const defaultProps = {
    calendarDays,
    isLoading: false,
    categories: [],
    getEventsForDate: vi.fn().mockReturnValue([]),
    onEventClick: vi.fn(),
  };

  it('renders day-of-week headers', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('renders day numbers', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<CalendarGrid {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('calls getEventsForDate for each day', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(defaultProps.getEventsForDate).toHaveBeenCalled();
  });

  it('renders event pills when events exist', () => {
    const getEventsForDate = vi
      .fn()
      .mockReturnValue([
        {
          id: 'e1',
          title: 'Team meeting',
          startDate: new Date(2024, 0, 1, 10, 0),
          categoryId: 'work',
          type: 'meeting',
          allDay: false,
        },
      ]);
    render(<CalendarGrid {...defaultProps} getEventsForDate={getEventsForDate} />);
    expect(screen.getAllByText(/Team meeting/).length).toBeGreaterThanOrEqual(1);
  });
});
