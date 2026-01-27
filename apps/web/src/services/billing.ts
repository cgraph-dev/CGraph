/**
 * Billing Service
 *
 * Handles all billing-related API calls to the backend.
 *
 * @module services/billing
 */

import api from './api';
import type { PlanId } from '../lib/stripe';

/**
 * Billing status response
 */
export interface BillingStatus {
  tier: PlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Plan information from backend
 */
export interface PlanInfo {
  id: PlanId;
  name: string;
  price: number;
  priceYearly: number;
  stripePriceId: string | null;
  stripePriceIdYearly: string | null;
}

/**
 * Checkout session response
 */
export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Portal session response
 */
export interface PortalSession {
  url: string;
}

/**
 * Billing API service
 */
export const billingService = {
  /**
   * Get current billing status
   */
  async getStatus(): Promise<BillingStatus> {
    const response = await api.get<{ data: BillingStatus }>('/billing/status');
    return response.data.data;
  },

  /**
   * Get available plans
   */
  async getPlans(): Promise<PlanInfo[]> {
    const response = await api.get<{ data: PlanInfo[] }>('/billing/plans');
    return response.data.data;
  },

  /**
   * Create a checkout session
   *
   * @param planId - The plan to subscribe to
   * @param yearly - Whether to use yearly billing
   * @returns Checkout session with redirect URL
   */
  async createCheckout(planId: PlanId, yearly = false): Promise<CheckoutSession> {
    const response = await api.post<{ data: CheckoutSession }>('/billing/checkout', {
      plan_id: planId,
      yearly,
    });
    return response.data.data;
  },

  /**
   * Create a customer portal session
   *
   * The customer portal allows users to:
   * - Update payment method
   * - View billing history
   * - Cancel subscription
   * - Download invoices
   *
   * @returns Portal session with redirect URL
   */
  async createPortal(): Promise<PortalSession> {
    const response = await api.post<{ data: PortalSession }>('/billing/portal');
    return response.data.data;
  },

  /**
   * Redirect to Stripe Checkout
   *
   * @param planId - The plan to subscribe to
   * @param yearly - Whether to use yearly billing
   */
  async redirectToCheckout(planId: PlanId, yearly = false): Promise<void> {
    const session = await this.createCheckout(planId, yearly);
    window.location.href = session.url;
  },

  /**
   * Redirect to Stripe Customer Portal
   */
  async redirectToPortal(): Promise<void> {
    const session = await this.createPortal();
    window.location.href = session.url;
  },
};

export default billingService;
