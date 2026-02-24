/** @module layout-tab tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, animate }: React.PropsWithChildren<{ className?: string; animate?: Record<string, unknown> }>) => (
      <div className={className} data-animate={JSON.stringify(animate)}>{children}</div>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

import { LayoutTab } from '../layout-tab';

describe('LayoutTab', () => {
  const defaultStyle = {
    maxWidth: 70,
    showAvatar: true,
    showTimestamp: true,
    compact: false,
    fontSize: 14,
    borderRadius: 16,
    padding: 12,
    background: '#1a1a2e',
    sentColor: '#6366f1',
    receivedColor: '#1e1e3f',
  };

  const defaultProps = {
    style: defaultStyle,
    updateStyle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders max width label', () => {
    render(<LayoutTab {...defaultProps} />);
    expect(screen.getByText('Max Width')).toBeInTheDocument();
  });

  it('displays current max width value', () => {
    render(<LayoutTab {...defaultProps} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('renders show avatar toggle label', () => {
    render(<LayoutTab {...defaultProps} />);
    expect(screen.getByText('Show Avatar')).toBeInTheDocument();
  });

  it('calls updateStyle when max width slider changes', () => {
    render(<LayoutTab {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(defaultProps.updateStyle).toHaveBeenCalledWith('maxWidth', 80);
  });

  it('toggles show avatar on click', () => {
    render(<LayoutTab {...defaultProps} />);
    const toggleBtn = screen.getAllByRole('button')[0];
    if (toggleBtn) fireEvent.click(toggleBtn);
    expect(defaultProps.updateStyle).toHaveBeenCalledWith('showAvatar', false);
  });
});
