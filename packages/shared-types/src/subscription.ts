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

// ---------------------------------------------------------------------------
// IAP Types (cross-platform sync)
// ---------------------------------------------------------------------------

/** IAP platform identifier */
export type IAPPlatform = 'apple' | 'google';

/** IAP receipt validation status */
export type IAPValidationStatus = 'valid' | 'expired' | 'refunded' | 'pending';

/** IAP receipt record from backend */
export interface IAPReceipt {
  platform: IAPPlatform;
  productId: string;
  validationStatus: IAPValidationStatus;
  expiresAt: string | null;
}

/** Response from POST /api/v1/iap/validate */
export interface IAPValidateResponse {
  success: boolean;
  data?: {
    platform: IAPPlatform;
    product_id: string;
    validation_status: IAPValidationStatus;
    expires_at: string | null;
  };
  error?: string;
}

/** Response from POST /api/v1/iap/restore */
export interface IAPRestoreResponse {
  success: boolean;
  data?: {
    restored_count: number;
    receipts: IAPReceipt[];
  };
  error?: string;
}

/** Extended subscription status including IAP provider info */
export interface SubscriptionStatusWithIAP extends SubscriptionStatus {
  iapProvider: IAPPlatform | null;
  iapTransactionId: string | null;
}
