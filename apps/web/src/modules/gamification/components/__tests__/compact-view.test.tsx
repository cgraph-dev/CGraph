/**
 * @file Tests for CompactView component
 * @module gamification/components/daily-rewards/compact-view
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: Record<string, unknown>) => (
      <div className={className as string} data-testid="motion-div">
        {children as React.ReactNode}
      </div>
    ),
    button: ({
      children,
      className,
      onClick,
      disabled,
      style,
      ...rest
    }: Record<string, unknown>) => (
      <button
        className={className as string}
        onClick={onClick as React.MouseEventHandler}
        disabled={disabled as boolean}
        style={style as React.CSSProperties}
      >
        {children as React.ReactNode}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: ({ className }: { className?: string }) => (
    <span data-testid="clock-icon" className={className} />
  ),
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  GiftIcon: ({ className }: { className?: string }) => (
    <span data-testid="gift-icon-solid" className={className} />
  ),
}));

// Mock GlassCard
vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

import { CompactView } from '../daily-rewards/compact-view';
import type { CompactViewProps, DailyReward } from '../daily-rewards/types';

const todayReward: DailyReward = { day: 3, xp: 100, coins: 25 };

function makeProps(overrides: Partial<CompactViewProps> = {}): CompactViewProps {
  return {
    canClaim: true,
    todayReward,
    timeUntilClaim: '4h 23m',
    isClaiming: false,
    primaryColor: '#10b981',
    onClaim: vi.fn(),
    ...overrides,
  };
}

describe('CompactView', () => {
  it('renders inside a GlassCard', () => {
    render(<CompactView {...makeProps()} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders "Daily Reward Ready!" when canClaim is true', () => {
    render(<CompactView {...makeProps({ canClaim: true })} />);
    expect(screen.getByText('Daily Reward Ready!')).toBeInTheDocument();
  });

  it('renders "Next Reward" when canClaim is false', () => {
    render(<CompactView {...makeProps({ canClaim: false })} />);
    expect(screen.getByText('Next Reward')).toBeInTheDocument();
  });

  it('shows xp and coins when canClaim is true', () => {
    render(<CompactView {...makeProps()} />);
    expect(screen.getByText(/\+100 XP/)).toBeInTheDocument();
    expect(screen.getByText(/\+25 coins/)).toBeInTheDocument();
  });

  it('shows time until claim when canClaim is false', () => {
    render(<CompactView {...makeProps({ canClaim: false })} />);
    expect(screen.getByText('4h 23m')).toBeInTheDocument();
  });

  it('renders Claim button when canClaim is true', () => {
    render(<CompactView {...makeProps()} />);
    expect(screen.getByText('Claim')).toBeInTheDocument();
  });

  it('does not render Claim button when canClaim is false', () => {
    render(<CompactView {...makeProps({ canClaim: false })} />);
    expect(screen.queryByText('Claim')).not.toBeInTheDocument();
  });

  it('calls onClaim when Claim button clicked', () => {
    const onClaim = vi.fn();
    render(<CompactView {...makeProps({ onClaim })} />);
    fireEvent.click(screen.getByText('Claim'));
    expect(onClaim).toHaveBeenCalledOnce();
  });

  it('shows "Claiming..." when isClaiming is true', () => {
    render(<CompactView {...makeProps({ isClaiming: true })} />);
    expect(screen.getByText('Claiming...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CompactView {...makeProps({ className: 'custom-class' })} />);
    expect(screen.getByTestId('glass-card').className).toContain('custom-class');
  });

  it('renders gift icon when claimable', () => {
    render(<CompactView {...makeProps({ canClaim: true })} />);
    expect(screen.getByTestId('gift-icon-solid')).toBeInTheDocument();
  });

  it('renders clock icon when not claimable', () => {
    render(<CompactView {...makeProps({ canClaim: false })} />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });
});
