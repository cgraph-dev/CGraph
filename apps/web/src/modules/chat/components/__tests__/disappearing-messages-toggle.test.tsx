/** @module disappearing-messages-toggle tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => <span data-testid="clock-icon" />,
}));

import { DisappearingMessagesToggle } from '../disappearing-messages-toggle';

describe('DisappearingMessagesToggle', () => {
  const defaultProps = {
    conversationId: 'conv-1',
    currentTTL: null as number | null,
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders clock icon', () => {
    render(<DisappearingMessagesToggle {...defaultProps} />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('shows Off label when TTL is null', () => {
    render(<DisappearingMessagesToggle {...defaultProps} currentTTL={null} />);
    expect(screen.getByText(/Off/)).toBeInTheDocument();
  });

  it('shows 24 hours when TTL is 86400', () => {
    render(<DisappearingMessagesToggle {...defaultProps} currentTTL={86400} />);
    expect(screen.getByText(/24 hours/)).toBeInTheDocument();
  });

  it('shows 7 days when TTL is 604800', () => {
    render(<DisappearingMessagesToggle {...defaultProps} currentTTL={604800} />);
    expect(screen.getByText(/7 days/)).toBeInTheDocument();
  });

  it('shows 30 days when TTL is 2592000', () => {
    render(<DisappearingMessagesToggle {...defaultProps} currentTTL={2592000} />);
    expect(screen.getByText(/30 days/)).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<DisappearingMessagesToggle {...defaultProps} />);
    const btn = screen.getByText(/Off/).closest('button');
    if (btn) fireEvent.click(btn);
    expect(screen.getByText('Message timer')).toBeInTheDocument();
  });

  it('shows all TTL options in dropdown', () => {
    render(<DisappearingMessagesToggle {...defaultProps} />);
    const btn = screen.getByText(/Off/).closest('button');
    if (btn) fireEvent.click(btn);
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('24 hours')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
  });

  it('calls onUpdate when an option is selected', () => {
    render(<DisappearingMessagesToggle {...defaultProps} />);
    const btn = screen.getByText(/Off/).closest('button');
    if (btn) fireEvent.click(btn);
    fireEvent.click(screen.getByText('7 days'));
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(604800);
  });

  it('shows checkmark next to current selection', () => {
    render(<DisappearingMessagesToggle {...defaultProps} currentTTL={86400} />);
    const btn = screen.getByText(/24 hours/).closest('button');
    if (btn) fireEvent.click(btn);
    // The active option should have a checkmark
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
