/**
 * Shared Billing Types
 *
 * Canonical type definitions for billing-related data shared
 * across web, mobile, and backend API contracts.
 *
 * @module shared-types/billing
 */

/** Purchasable coin bundle from the shop */
export interface CoinBundle {
  id: string;
  coins: number;
  price_cents: number;
  label: string;
  bonus: string | null;
}

/** Checkout session response for coin purchase */
export interface CoinCheckoutSession {
  checkout_url: string;
}

/** Coin purchase record */
export interface CoinPurchaseRecord {
  id: string;
  bundle_id: string;
  coins_awarded: number;
  price_cents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  fulfilled_at: string | null;
  created_at: string;
}

/** Stripe invoice record (from billing/invoices endpoint) */
export interface Invoice {
  id: string;
  amount_due: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: string;
  hosted_invoice_url: string;
  invoice_pdf: string;
  description: string | null;
}

/** Full billing status from backend */
export interface BillingStatus {
  tier: 'free' | 'premium' | 'enterprise';
  subscription_active: boolean;
  next_billing_date: string | null;
  auto_renewing: boolean;
  payment_method: { last4: string; brand: string } | null;
  provider: 'stripe' | 'apple' | 'google' | null;
}

/** Plan change request */
export interface PlanChangeRequest {
  plan_id: string;
  yearly?: boolean;
}

/** Plan change response */
export interface PlanChangeResponse {
  checkout_url: string;
}
