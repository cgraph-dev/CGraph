/** @module date-time-fields tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./hooks', () => ({
  formatDateTimeLocal: (d: Date) => '2024-01-15T10:00',
  formatDateLocal: (d: Date) => '2024-01-15',
}));

import DateTimeFields from '../date-time-fields';

describe('DateTimeFields', () => {
  const defaultProps = {
    formData: {
      title: 'Meeting',
      description: '',
      location: '',
      allDay: false,
      startDate: new Date('2024-01-15T10:00:00'),
      endDate: new Date('2024-01-15T11:00:00'),
      category: 'work',
      isPublic: true,
      recurrence: '' as const,
    },
    errors: {},
    handleChange: vi.fn(),
    handleDateChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all-day toggle', () => {
    render(<DateTimeFields {...defaultProps} />);
    expect(screen.getByLabelText(/all-day/i)).toBeInTheDocument();
  });

  it('renders checkbox for all day', () => {
    render(<DateTimeFields {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls handleChange when all-day toggled', () => {
    render(<DateTimeFields {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(defaultProps.handleChange).toHaveBeenCalled();
  });

  it('shows start and end date fields', () => {
    render(<DateTimeFields {...defaultProps} />);
    const inputs =
      screen.getAllByRole('textbox').length + screen.getAllByDisplayValue(/2024/).length;
    expect(inputs).toBeGreaterThanOrEqual(1);
  });

  it('renders errors when present', () => {
    render(<DateTimeFields {...defaultProps} errors={{ startDate: 'Start date is required' }} />);
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
  });
});
