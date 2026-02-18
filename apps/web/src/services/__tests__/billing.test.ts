/**
 * Billing Service Tests
 *
 * Tests for all billing-related API calls.
 * Financial operations are the highest-risk area — every edge case matters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingService } from '../billing';
import type { BillingStatus, PlanInfo, CheckoutSession, PortalSession } from '../billing';

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock safeRedirect to prevent actual navigation
vi.mock('../../lib/security', () => ({
  safeRedirect: vi.fn(),
}));

import { api } from '../../lib/api';
import { safeRedirect } from '../../lib/security';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return billing status for active subscription', async () => {
      const mockStatus: BillingStatus = {
        tier: 'premium',
        status: 'active',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        stripeCustomerId: 'cus_abc123',
        stripeSubscriptionId: 'sub_xyz789',
      };

      mockApi.get.mockResolvedValue({ data: { data: mockStatus } });

      const result = await billingService.getStatus();

      expect(mockApi.get).toHaveBeenCalledWith('/billing/status');
      expect(result).toEqual(mockStatus);
      expect(result.tier).toBe('premium');
      expect(result.status).toBe('active');
    });

    it('should return billing status for free tier (no subscription)', async () => {
      const mockStatus: BillingStatus = {
        tier: 'free',
        status: 'none',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      mockApi.get.mockResolvedValue({ data: { data: mockStatus } });

      const result = await billingService.getStatus();

      expect(result.tier).toBe('free');
      expect(result.status).toBe('none');
      expect(result.stripeCustomerId).toBeNull();
    });

    it('should handle past_due subscription status', async () => {
      const mockStatus: BillingStatus = {
        tier: 'premium',
        status: 'past_due',
        currentPeriodEnd: '2025-01-15T00:00:00Z',
        cancelAtPeriodEnd: false,
        stripeCustomerId: 'cus_abc123',
        stripeSubscriptionId: 'sub_xyz789',
      };

      mockApi.get.mockResolvedValue({ data: { data: mockStatus } });

      const result = await billingService.getStatus();

      expect(result.status).toBe('past_due');
    });

    it('should handle canceled subscription with cancelAtPeriodEnd', async () => {
      const mockStatus: BillingStatus = {
        tier: 'premium',
        status: 'active',
        currentPeriodEnd: '2025-03-01T00:00:00Z',
        cancelAtPeriodEnd: true,
        stripeCustomerId: 'cus_abc123',
        stripeSubscriptionId: 'sub_xyz789',
      };

      mockApi.get.mockResolvedValue({ data: { data: mockStatus } });

      const result = await billingService.getStatus();

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).toBe('active');
    });

    it('should propagate API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      await expect(billingService.getStatus()).rejects.toThrow('Network error');
    });
  });

  describe('getPlans', () => {
    it('should return available plans', async () => {
      const mockPlans: PlanInfo[] = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          priceYearly: 0,
          stripePriceId: null,
          stripePriceIdYearly: null,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 999,
          priceYearly: 9990,
          stripePriceId: 'price_premium_monthly',
          stripePriceIdYearly: 'price_premium_yearly',
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 2999,
          priceYearly: 29990,
          stripePriceId: 'price_enterprise_monthly',
          stripePriceIdYearly: 'price_enterprise_yearly',
        },
      ];

      mockApi.get.mockResolvedValue({ data: { data: mockPlans } });

      const result = await billingService.getPlans();

      expect(mockApi.get).toHaveBeenCalledWith('/billing/plans');
      expect(result).toHaveLength(3);
      expect(result[0]!.id).toBe('free');
      expect(result[1]!.price).toBe(999);
      expect(result[2]!.id).toBe('enterprise');
    });

    it('should propagate API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));

      await expect(billingService.getPlans()).rejects.toThrow('Server error');
    });
  });

  describe('createCheckout', () => {
    it('should create a monthly checkout session', async () => {
      const mockSession: CheckoutSession = {
        sessionId: 'cs_test_abc123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_abc123',
      };

      mockApi.post.mockResolvedValue({ data: { data: mockSession } });

      const result = await billingService.createCheckout('premium');

      expect(mockApi.post).toHaveBeenCalledWith('/billing/checkout', {
        plan_id: 'premium',
        yearly: false,
      });
      expect(result.sessionId).toBe('cs_test_abc123');
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('should create a yearly checkout session', async () => {
      const mockSession: CheckoutSession = {
        sessionId: 'cs_test_yearly',
        url: 'https://checkout.stripe.com/c/pay/cs_test_yearly',
      };

      mockApi.post.mockResolvedValue({ data: { data: mockSession } });

      const result = await billingService.createCheckout('enterprise', true);

      expect(mockApi.post).toHaveBeenCalledWith('/billing/checkout', {
        plan_id: 'enterprise',
        yearly: true,
      });
      expect(result.sessionId).toBe('cs_test_yearly');
    });

    it('should default to monthly billing', async () => {
      mockApi.post.mockResolvedValue({
        data: { data: { sessionId: 'cs_test', url: 'https://stripe.com' } },
      });

      await billingService.createCheckout('premium');

      expect(mockApi.post).toHaveBeenCalledWith('/billing/checkout', {
        plan_id: 'premium',
        yearly: false,
      });
    });

    it('should propagate API errors for checkout', async () => {
      mockApi.post.mockRejectedValue(new Error('Payment processing error'));

      await expect(billingService.createCheckout('premium')).rejects.toThrow(
        'Payment processing error'
      );
    });
  });

  describe('createPortal', () => {
    it('should create a customer portal session', async () => {
      const mockPortal: PortalSession = {
        url: 'https://billing.stripe.com/p/session/test_portal',
      };

      mockApi.post.mockResolvedValue({ data: { data: mockPortal } });

      const result = await billingService.createPortal();

      expect(mockApi.post).toHaveBeenCalledWith('/billing/portal');
      expect(result.url).toContain('billing.stripe.com');
    });

    it('should propagate API errors for portal', async () => {
      mockApi.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(billingService.createPortal()).rejects.toThrow('Unauthorized');
    });
  });

  describe('redirectToCheckout', () => {
    it('should create checkout and redirect', async () => {
      const mockSession: CheckoutSession = {
        sessionId: 'cs_test_redirect',
        url: 'https://checkout.stripe.com/c/pay/cs_test_redirect',
      };

      mockApi.post.mockResolvedValue({ data: { data: mockSession } });

      await billingService.redirectToCheckout('premium');

      expect(mockApi.post).toHaveBeenCalledWith('/billing/checkout', {
        plan_id: 'premium',
        yearly: false,
      });
      expect(safeRedirect).toHaveBeenCalledWith(
        'https://checkout.stripe.com/c/pay/cs_test_redirect'
      );
    });

    it('should pass yearly flag through to checkout', async () => {
      mockApi.post.mockResolvedValue({
        data: { data: { sessionId: 'cs_yearly', url: 'https://stripe.com/yearly' } },
      });

      await billingService.redirectToCheckout('enterprise', true);

      expect(mockApi.post).toHaveBeenCalledWith('/billing/checkout', {
        plan_id: 'enterprise',
        yearly: true,
      });
      expect(safeRedirect).toHaveBeenCalledWith('https://stripe.com/yearly');
    });

    it('should not redirect if checkout creation fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Checkout failed'));

      await expect(billingService.redirectToCheckout('premium')).rejects.toThrow('Checkout failed');
      expect(safeRedirect).not.toHaveBeenCalled();
    });
  });

  describe('redirectToPortal', () => {
    it('should create portal session and redirect', async () => {
      const mockPortal: PortalSession = {
        url: 'https://billing.stripe.com/p/session/portal_123',
      };

      mockApi.post.mockResolvedValue({ data: { data: mockPortal } });

      await billingService.redirectToPortal();

      expect(mockApi.post).toHaveBeenCalledWith('/billing/portal');
      expect(safeRedirect).toHaveBeenCalledWith(
        'https://billing.stripe.com/p/session/portal_123'
      );
    });

    it('should not redirect if portal creation fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Portal error'));

      await expect(billingService.redirectToPortal()).rejects.toThrow('Portal error');
      expect(safeRedirect).not.toHaveBeenCalled();
    });
  });
});
