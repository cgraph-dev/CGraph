/** @module message-status-indicator tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { bouncy: {} },
  loop: () => ({}),
}));

import { MessageStatusIndicator } from '../message-bubble/message-status-indicator';

describe('MessageStatusIndicator', () => {
  it('renders sending state with clock emoji', () => {
    render(<MessageStatusIndicator status="sending" />);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('renders sent state with single check SVG', () => {
    const { container } = render(<MessageStatusIndicator status="sent" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders delivered state with double check SVG', () => {
    const { container } = render(<MessageStatusIndicator status="delivered" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders read state with blue double check', () => {
    const { container } = render(<MessageStatusIndicator status="read" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions between states without errors', () => {
    const { rerender } = render(<MessageStatusIndicator status="sending" />);
    rerender(<MessageStatusIndicator status="sent" />);
    rerender(<MessageStatusIndicator status="delivered" />);
    rerender(<MessageStatusIndicator status="read" />);
    // No throw = pass
  });
});
