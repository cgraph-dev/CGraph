/** @module calendar-header tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  ChevronLeftIcon: () => <span data-testid="chevron-left" />,
  ChevronRightIcon: () => <span data-testid="chevron-right" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  CalendarIcon: () => <span data-testid="calendar-icon" />,
}));

import { CalendarHeader } from '../calendar-header';

describe('CalendarHeader', () => {
  const defaultProps = {
    monthName: 'January 2024',
    viewMode: 'month' as const,
    setViewMode: vi.fn(),
    goToPreviousMonth: vi.fn(),
    goToNextMonth: vi.fn(),
    goToToday: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders month name', () => {
    render(<CalendarHeader {...defaultProps} />);
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('renders navigation arrows', () => {
    render(<CalendarHeader {...defaultProps} />);
    expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('calls goToPreviousMonth on left arrow click', () => {
    render(<CalendarHeader {...defaultProps} />);
    const leftBtn = screen.getByTestId('chevron-left').closest('button');
    if (leftBtn) fireEvent.click(leftBtn);
    expect(defaultProps.goToPreviousMonth).toHaveBeenCalledOnce();
  });

  it('calls goToNextMonth on right arrow click', () => {
    render(<CalendarHeader {...defaultProps} />);
    const rightBtn = screen.getByTestId('chevron-right').closest('button');
    if (rightBtn) fireEvent.click(rightBtn);
    expect(defaultProps.goToNextMonth).toHaveBeenCalledOnce();
  });

  it('renders Today button', () => {
    render(<CalendarHeader {...defaultProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('calls goToToday when Today button clicked', () => {
    render(<CalendarHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Today'));
    expect(defaultProps.goToToday).toHaveBeenCalledOnce();
  });

  it('renders create event button when handler provided', () => {
    const onCreate = vi.fn();
    render(<CalendarHeader {...defaultProps} onCreateEvent={onCreate} />);
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });
});
