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
            ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any;
            cache.set(
              prop,
              function MotionMock({
                children,
                className,
              }: React.PropsWithChildren<Record<string, unknown>>) {
                return <Tag className={className as string}>{children}</Tag>;
              }
            );
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

vi.mock('@/modules/premium/components/subscription-card.constants', () => ({
  TIER_ICONS: { free: '🆓', premium: '⭐', enterprise: '👑' },
  TIER_GRADIENTS: {
    free: 'from-gray-500',
    premium: 'from-blue-500',
    enterprise: 'from-purple-500',
  },
}));

const freePlan = {
  tier: 'free' as const,
  name: 'Free',
  description: 'Basic features',
  priceMonthly: 0,
  priceYearly: 0,
  features: [] as string[],
  limits: {
    maxGroups: 1,
    maxForums: 1,
    maxFileSize: 5,
    maxStorageGB: 1,
    customEmojis: 0,
    customThemes: false,
    prioritySupport: false,
    noAds: false,
  },
};

const proPlan = {
  tier: 'premium' as const,
  name: 'Premium',
  description: 'Advanced features',
  priceMonthly: 9.99,
  priceYearly: 99.99,
  features: [] as string[],
  limits: {
    maxGroups: 10,
    maxForums: 10,
    maxFileSize: 50,
    maxStorageGB: 50,
    customEmojis: 100,
    customThemes: true,
    prioritySupport: true,
    noAds: true,
  },
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
    const card = screen.getByText('Premium').closest('[class]');
    if (card) fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('premium');
  });
});
