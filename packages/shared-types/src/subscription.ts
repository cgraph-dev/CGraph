/**
 * Shared Subscription Types
 *
 * Canonical type definitions for subscription-related data shared
 * across web, mobile, and backend API contracts.
 *
 * @module shared-types/subscription
 */

/** Subscription tier levels */
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

/** Subscription status from backend */
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  features: TierFeatures;
}

/** Feature capabilities for a subscription tier */
export interface TierFeatures {
  xpMultiplier: number;
  coinBonus: number;
  customThemes: boolean;
  exclusiveBadges: boolean;
  exclusiveEffects: boolean;
  prioritySupport: boolean;
  dailyLimits: boolean;
  maxFileSizeMb: number;
  maxGroupsOwned: number;
  customBanner: boolean;
}

/** Stripe invoice record */
export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  pdfUrl: string | null;
}

/** Stripe Checkout session response */
export interface CheckoutSession {
  success: boolean;
  checkoutUrl: string;
}

/** Stripe Billing Portal session response */
export interface PortalSession {
  success: boolean;
  portalUrl: string;
}
