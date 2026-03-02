/** @module compact-view tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
    button: ({
      children,
      className,
      onClick,
      disabled,
    }: React.PropsWithChildren<{ className?: string; onClick?: () => void; disabled?: boolean }>) => (
      <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
    ),
  },
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { verySlow: {} },
  loop: () => ({}),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => <span data-testid="clock-icon" />,
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  GiftIcon: () => <span data-testid="gift-solid" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

import { CompactView } from '../compact-view';

describe('CompactView', () => {
  const defaultProps = {
    canClaim: true,
    todayReward: {
      day: 3,
      xp: 75,
      coins: 15,
    },
    timeUntilClaim: '12:30:00',
    isClaiming: false,
    primaryColor: '#6366f1',
    onClaim: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders XP amount', () => {
    render(<CompactView {...defaultProps} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('renders gift icon when can claim', () => {
    render(<CompactView {...defaultProps} />);
    expect(screen.getByTestId('gift-solid')).toBeInTheDocument();
  });

  it('renders clock icon when cannot claim', () => {
    render(<CompactView {...defaultProps} canClaim={false} />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('fires onClaim when claim button clicked', () => {
    render(<CompactView {...defaultProps} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(defaultProps.onClaim).toHaveBeenCalledOnce();
  });

  it('shows time until claim', () => {
    render(<CompactView {...defaultProps} canClaim={false} />);
    expect(screen.getByText(/12:30/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CompactView {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('glass-card').className).toContain('custom-class');
  });
});
