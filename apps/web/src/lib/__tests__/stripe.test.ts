/**
 * Stripe Integration Tests
 *
 * Tests for Stripe configuration checks, plan data,
 * price formatting, and singleton pattern.
 * (Does NOT test React component rendering — pure logic only)
 */

import { describe, it, expect, vi } from 'vitest';

// ── Mock Stripe SDK ──────────────────────────────────────────────────────
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({ elements: vi.fn() }),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: vi.fn(({ children }: { children: unknown }) => children),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { isStripeConfigured, getPlan, PLANS } from '../stripe';
import type { PlanId } from '../stripe';

describe('Stripe Integration', () => {
  // ── isStripeConfigured ───────────────────────────────────────────────

  describe('isStripeConfigured', () => {
    it('should return a boolean', () => {
      const result = isStripeConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  // ── PLANS data ───────────────────────────────────────────────────────

  describe('PLANS', () => {
    it('should have 3 plans: free, premium, enterprise', () => {
      expect(PLANS).toHaveLength(3);
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(['free', 'premium', 'enterprise']);
    });

    it('free plan should have price 0', () => {
      const free = PLANS.find((p) => p.id === 'free')!;
      expect(free.price).toBe(0);
      expect(free.priceYearly).toBe(0);
    });

    it('premium plan should have positive price', () => {
      const premium = PLANS.find((p) => p.id === 'premium')!;
      expect(premium.price).toBeGreaterThan(0);
      expect(premium.priceYearly).toBeGreaterThan(0);
    });

    it('premium should be highlighted with Popular badge', () => {
      const premium = PLANS.find((p) => p.id === 'premium')!;
      expect(premium.highlighted).toBe(true);
      expect(premium.badge).toBe('Popular');
    });

    it('enterprise plan should have custom pricing (-1)', () => {
      const enterprise = PLANS.find((p) => p.id === 'enterprise')!;
      expect(enterprise.price).toBe(-1);
      expect(enterprise.priceYearly).toBe(-1);
    });

    it('all plans should have features arrays', () => {
      for (const plan of PLANS) {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it('all plans should have name and description', () => {
      for (const plan of PLANS) {
        expect(plan.name).toBeTruthy();
        expect(plan.description).toBeTruthy();
      }
    });
  });

  // ── getPlan ──────────────────────────────────────────────────────────

  describe('getPlan', () => {
    it('should return the free plan', () => {
      const plan = getPlan('free');
      expect(plan).toBeDefined();
      expect(plan!.id).toBe('free');
      expect(plan!.name).toBe('Free');
    });

    it('should return the premium plan', () => {
      const plan = getPlan('premium');
      expect(plan).toBeDefined();
      expect(plan!.id).toBe('premium');
    });

    it('should return the enterprise plan', () => {
      const plan = getPlan('enterprise');
      expect(plan).toBeDefined();
      expect(plan!.id).toBe('enterprise');
    });

    it('should return undefined for unknown plan', () => {
      const plan = getPlan('nonexistent' as PlanId);
      expect(plan).toBeUndefined();
    });
  });

  // ── Tier model consistency ──────────────────────────────────────────

  describe('tier model consistency', () => {
    it('plan IDs should match canonical free|premium|enterprise model', () => {
      const validIds: PlanId[] = ['free', 'premium', 'enterprise'];
      for (const plan of PLANS) {
        expect(validIds).toContain(plan.id);
      }
    });

    it('yearly premium should be cheaper than 12x monthly', () => {
      const premium = getPlan('premium')!;
      expect(premium.priceYearly).toBeLessThan(premium.price * 12);
    });
  });
});
