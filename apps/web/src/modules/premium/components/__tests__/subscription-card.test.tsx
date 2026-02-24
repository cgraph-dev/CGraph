/**
 * @file subscription-card.test.tsx
 * @description Tests for SubscriptionCard component — premium subscription tier
 *   display with features, pricing, and CTA.
 * @module premium/components/__tests__/SubscriptionCard
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({ tweens: { standard: {} }, springs: { snappy: {}, bouncy: {} }, loop: () => ({}), loopWithDelay: () => ({}) }));
vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

vi.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="check-icon" {...p} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

vi.mock('@/components', () => ({
  Button: ({ children, onClick, disabled, className }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean; className?: string }>) => (
    <button data-testid="cta-button" onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn() },
}));

vi.mock('@/modules/premium/components/subscription-card.constants', () => ({
  TIER_ICONS: { free: <span>🆓</span>, basic: <span>⭐</span>, premium: <span>💎</span>, enterprise: <span>👑</span> },
  TIER_COLORS: { free: 'gray', basic: 'blue', premium: 'purple', enterprise: 'amber' },
  TIER_GRADIENTS: { free: 'from-gray-500 to-gray-600', basic: 'from-blue-500 to-cyan-500', premium: 'from-purple-500 to-pink-500', enterprise: 'from-amber-500 to-orange-600' },
  Crown: ({ className }: { className?: string }) => <span className={className}>👑</span>,
}));

vi.mock('@/modules/premium/components/compact-subscription-card', () => ({
  CompactSubscriptionCard: ({ plan }: { plan: { name: string } }) => (
    <div data-testid="compact-card">{plan.name}</div>
  ),
}));

import { SubscriptionCard } from '../subscription-card';

// ── Helpers ────────────────────────────────────────────────────────────
const makePlan = (overrides?: Record<string, unknown>) => ({
  tier: 'premium' as const,
  name: 'Premium',
  description: 'Best for power users',
  priceMonthly: 9.99,
  priceYearly: 99.99,
  features: ['Feature A', 'Feature B', 'Feature C'],
  limits: { maxGroups: 50, maxStorageGB: 100, maxFileSize: 50, customEmojis: 200 },
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────
describe('SubscriptionCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders plan name', () => {
    render(<SubscriptionCard plan={makePlan()} />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders plan description', () => {
    render(<SubscriptionCard plan={makePlan()} />);
    expect(screen.getByText('Best for power users')).toBeInTheDocument();
  });

  it('renders monthly price', () => {
    render(<SubscriptionCard plan={makePlan()} billingInterval="monthly" />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('renders yearly price per month', () => {
    render(<SubscriptionCard plan={makePlan()} billingInterval="yearly" />);
    expect(screen.getByText('$8.33')).toBeInTheDocument();
  });

  it('renders "Free" for free tier', () => {
    render(<SubscriptionCard plan={makePlan({ tier: 'free', priceMonthly: 0, priceYearly: 0 })} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders features list when showFeatures is true', () => {
    render(<SubscriptionCard plan={makePlan()} showFeatures />);
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Feature B')).toBeInTheDocument();
  });

  it('hides features when showFeatures is false', () => {
    render(<SubscriptionCard plan={makePlan()} showFeatures={false} />);
    expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
  });

  it('renders "Most Popular" badge for premium tier', () => {
    render(<SubscriptionCard plan={makePlan({ tier: 'premium' })} />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('renders "Subscribe Now" CTA', () => {
    render(<SubscriptionCard plan={makePlan()} />);
    expect(screen.getByText('Subscribe Now')).toBeInTheDocument();
  });

  it('renders "Current Plan" when isCurrentPlan is true', () => {
    render(<SubscriptionCard plan={makePlan()} isCurrentPlan />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<SubscriptionCard plan={makePlan()} variant="compact" />);
    expect(screen.getByTestId('compact-card')).toBeInTheDocument();
  });

  it('calls onSelect when CTA is clicked', () => {
    const onSelect = vi.fn();
    render(<SubscriptionCard plan={makePlan()} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Subscribe Now'));
    expect(onSelect).toHaveBeenCalledWith('premium');
  });

  it('renders compare link when onCompare is provided', () => {
    render(<SubscriptionCard plan={makePlan()} onCompare={vi.fn()} />);
    expect(screen.getByText(/Compare all features/)).toBeInTheDocument();
  });
});
