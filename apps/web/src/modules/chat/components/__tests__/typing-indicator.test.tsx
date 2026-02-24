/** @module typing-indicator tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, variant }: React.PropsWithChildren<{ variant?: string }>) => (
    <div data-testid="glass-card" data-variant={variant}>
      {children}
    </div>
  ),
}));

import { TypingIndicator } from '../typing-indicator';

describe('TypingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no users are typing', () => {
    const { container } = render(<TypingIndicator typing={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when one user is typing', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });

  it('renders when multiple users are typing', () => {
    render(<TypingIndicator typing={['Alice', 'Bob']} />);
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });

  it('renders 3 bouncing dots', () => {
    const { container } = render(<TypingIndicator typing={['Alice']} />);
    // The component renders 3 animated dot divs
    const dots = container.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it('renders with glass card wrapper', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
