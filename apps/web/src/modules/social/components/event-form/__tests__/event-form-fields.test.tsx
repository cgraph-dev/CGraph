/** @module event-form-fields tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  MapPinIcon: () => <span data-testid="map-icon" />,
  DocumentTextIcon: () => <span data-testid="doc-icon" />,
  TagIcon: () => <span data-testid="tag-icon" />,
  GlobeAltIcon: () => <span data-testid="globe-icon" />,
  UsersIcon: () => <span data-testid="users-icon" />,
  ArrowPathIcon: () => <span data-testid="arrow-path-icon" />,
}));

import EventFormFields from '../event-form-fields';

describe('EventFormFields', () => {
  const defaultProps = {
    formData: {
      title: 'Team Meeting',
      description: 'Weekly sync',
      location: 'Room 101',
      allDay: false,
      startDate: new Date('2024-01-15T10:00:00'),
      endDate: new Date('2024-01-15T11:00:00'),
      category: 'work',
      isPublic: true,
      recurrence: '' as const,
    },
    handleChange: vi.fn(),
    handleRecurrenceChange: vi.fn(),
    categories: [
      { id: 'work', name: 'Work' },
      { id: 'social', name: 'Social' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location field', () => {
    render(<EventFormFields {...defaultProps} />);
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders location value', () => {
    render(<EventFormFields {...defaultProps} />);
    expect(screen.getByDisplayValue('Room 101')).toBeInTheDocument();
  });

  it('renders description field', () => {
    render(<EventFormFields {...defaultProps} />);
    expect(screen.getByDisplayValue('Weekly sync')).toBeInTheDocument();
  });

  it('renders category options', () => {
    render(<EventFormFields {...defaultProps} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
  });

  it('renders map pin icon', () => {
    render(<EventFormFields {...defaultProps} />);
    expect(screen.getByTestId('map-icon')).toBeInTheDocument();
  });

  it('calls handleChange when location changes', () => {
    render(<EventFormFields {...defaultProps} />);
    const locInput = screen.getByDisplayValue('Room 101');
    fireEvent.change(locInput, { target: { value: 'Room 202' } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
  });
});
