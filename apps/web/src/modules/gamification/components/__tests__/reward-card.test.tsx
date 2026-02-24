/**
 * @file Tests for RewardCard component
 * @module gamification/components/daily-rewards/reward-card
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style }: Record<string, unknown>) => (
      <div
        className={className as string}
        style={style as React.CSSProperties}
        data-testid="motion-div"
      >
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  GiftIcon: ({ className }: { className?: string }) => (
    <span data-testid="gift-icon" className={className} />
  ),
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  StarIcon: ({ className }: { className?: string }) => (
    <span data-testid="star-icon" className={className} />
  ),
}));

import { RewardCard } from '../daily-rewards/reward-card';
import type { RewardCardProps } from '../daily-rewards/types';

function makeProps(overrides: Partial<RewardCardProps> = {}): RewardCardProps {
  return {
    reward: { day: 3, xp: 100, coins: 25 },
    index: 2,
    currentDay: 3,
    canClaim: true,
    isPremium: false,
    primaryColor: '#10b981',
    ...overrides,
  };
}

describe('RewardCard', () => {
  it('renders xp value', () => {
    render(<RewardCard {...makeProps()} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders coins when present', () => {
    render(<RewardCard {...makeProps()} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('does not render coins when absent', () => {
    render(<RewardCard {...makeProps({ reward: { day: 1, xp: 50 } })} />);
    expect(screen.queryByText('🪙')).not.toBeInTheDocument();
  });

  it('renders checkmark when claimed', () => {
    render(
      <RewardCard {...makeProps({ reward: { day: 1, xp: 50, claimed: true }, currentDay: 3 })} />
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders day number when not claimed', () => {
    render(<RewardCard {...makeProps({ reward: { day: 5, xp: 200 }, currentDay: 3 })} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders gift icon', () => {
    render(<RewardCard {...makeProps()} />);
    expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
  });

  it('renders sparkles icon for xp', () => {
    render(<RewardCard {...makeProps()} />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders special icon when provided', () => {
    render(
      <RewardCard
        {...makeProps({
          reward: { day: 7, xp: 500, special: { type: 'badge', name: 'Weekly', icon: '🏆' } },
        })}
      />
    );
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders VIP badge for premium rewards', () => {
    render(<RewardCard {...makeProps({ reward: { day: 4, xp: 150, isPremium: true } })} />);
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders premium lock overlay when reward is premium but user is not', () => {
    render(
      <RewardCard
        {...makeProps({
          reward: { day: 4, xp: 150, isPremium: true },
          isPremium: false,
        })}
      />
    );
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('does not render premium lock when user is premium', () => {
    render(
      <RewardCard
        {...makeProps({
          reward: { day: 4, xp: 150, isPremium: true },
          isPremium: true,
        })}
      />
    );
    // Star icon only appears in premium lock overlay, not when user is premium
    expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
  });
});
