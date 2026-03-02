/** @module reward-details tests */
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

vi.mock('@heroicons/react/24/outline', () => ({
  GiftIcon: () => <span data-testid="gift-icon" />,
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
  CheckCircleIcon: () => <span data-testid="check-icon" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

import { RewardDetails } from '../reward-details';

describe('RewardDetails', () => {
  const defaultProps = {
    todayReward: {
      day: 1,
      xp: 50,
      coins: 10,
    },
    canClaim: true,
    isClaiming: false,
    primaryColor: '#6366f1',
    onClaim: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Today\'s Reward label', () => {
    render(<RewardDetails {...defaultProps} />);
    expect(screen.getByText("Today's Reward")).toBeInTheDocument();
  });

  it('renders XP amount', () => {
    render(<RewardDetails {...defaultProps} />);
    expect(screen.getByText('50 XP')).toBeInTheDocument();
  });

  it('renders coin amount', () => {
    render(<RewardDetails {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders claim button when canClaim is true', () => {
    render(<RewardDetails {...defaultProps} />);
    const claimBtn = screen.getByRole('button');
    expect(claimBtn).toBeInTheDocument();
  });

  it('calls onClaim when claim button clicked', () => {
    render(<RewardDetails {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onClaim).toHaveBeenCalledOnce();
  });

  it('disables claim when isClaiming is true', () => {
    render(<RewardDetails {...defaultProps} isClaiming={true} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
