/** @module compact-subscription-card tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompactSubscriptionCard } from '../compact-subscription-card';

vi.mock('framer-motion', () => {
  const cache = new Map<
    string | symbol,
    (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
  >();
  return {
    motion: new Proxy(
      {} as Record<
        string,
        (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
      >,
      {
        get: (_target, prop) => {
          if (!cache.has(prop)) {
            const Tag = (
              typeof prop === 'string' ? prop : 'div'
            ) as keyof React.JSX.IntrinsicElements;
            cache.set(prop, function MotionMock({ children, className, ..._rest }) {
              return <Tag className={className as string}>{children}</Tag>;
            });
          }
          return cache.get(prop);
        },
      }
    ),
  };
});

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    onClick,
  }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn() },
}));

vi.mock('@/modules/premium/components/subscriptionCard.constants', () => ({
  TIER_ICONS: { free: '🆓', pro: '⭐', ultimate: '👑' },
  TIER_GRADIENTS: { free: 'from-gray-500', pro: 'from-blue-500', ultimate: 'from-purple-500' },
}));

const freePlan = {
  tier: 'free' as const,
  name: 'Free',
  description: 'Basic features',
  priceMonthly: 0,
  priceYearly: 0,
  features: [],
};

const proPlan = {
  tier: 'pro' as const,
  name: 'Pro',
  description: 'Advanced features',
  priceMonthly: 9.99,
  priceYearly: 99.99,
  features: [],
};

describe('CompactSubscriptionCard', () => {
  it('renders plan name', () => {
    render(<CompactSubscriptionCard plan={freePlan} />);
    expect(screen.getByRole('heading', { name: 'Free' })).toBeTruthy();
  });

  it('renders plan description', () => {
    render(<CompactSubscriptionCard plan={freePlan} />);
    expect(screen.getByText('Basic features')).toBeTruthy();
  });

  it('shows "Free" label for zero-price plans', () => {
    render(<CompactSubscriptionCard plan={freePlan} />);
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1);
  });

  it('shows monthly price', () => {
    render(<CompactSubscriptionCard plan={proPlan} />);
    expect(screen.getByText('$9.99')).toBeTruthy();
    expect(screen.getByText('/mo')).toBeTruthy();
  });

  it('shows yearly price divided by 12', () => {
    render(<CompactSubscriptionCard plan={proPlan} billingInterval="yearly" />);
    expect(screen.getByText('$8.33')).toBeTruthy();
  });

  it('shows current plan indicator', () => {
    render(<CompactSubscriptionCard plan={freePlan} isCurrentPlan />);
    expect(screen.getByText('✓ Current Plan')).toBeTruthy();
  });

  it('hides current plan indicator when not current', () => {
    render(<CompactSubscriptionCard plan={freePlan} />);
    expect(screen.queryByText('✓ Current Plan')).toBeNull();
  });

  it('calls onSelect with tier on click', () => {
    const onSelect = vi.fn();
    render(<CompactSubscriptionCard plan={proPlan} onSelect={onSelect} />);
    // Click the GlassCard wrapper
    const card = screen.getByText('Pro').closest('[class]');
    if (card) fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('pro');
  });
});
