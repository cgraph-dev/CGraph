/**
 * Premium Module Types
 *
 * Type definitions for premium/subscription functionality.
 *
 * @module modules/premium/types
 * @version 1.0.0
 */

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'business' | 'enterprise';

/**
 * Billing cycle
 */
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

/**
 * Subscription
 */
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plan features
 */
export interface PlanFeatures {
  maxFileUploadSize: number;
  maxStorageGB: number;
  maxGroupsOwned: number;
  maxForumsOwned: number;
  customThemes: boolean;
  animatedAvatars: boolean;
  customAvatarBorders: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
  noAds: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  analytics: boolean;
  xpBoost: number;
  coinBoost: number;
}

/**
 * Subscription plan
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  features: PlanFeatures;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  isPopular?: boolean;
}

/**
 * Purchase history
 */
export interface PurchaseHistory {
  id: string;
  type: 'subscription' | 'coins' | 'item';
  itemId?: string;
  itemName?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  stripePaymentId?: string;
  createdAt: string;
}

/**
 * Coin package
 */
export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  currency: string;
  stripePriceId?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

/**
 * Promo code
 */
export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed' | 'trial_extension' | 'free_coins';
  value: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  minimumPurchase?: number;
  applicableTiers?: SubscriptionTier[];
  isActive: boolean;
}

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  subscriptionId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  periodStart: string;
  periodEnd: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  createdAt: string;
  paidAt?: string;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_account';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Gift subscription
 */
export interface GiftSubscription {
  id: string;
  senderId: string;
  recipientId?: string;
  recipientEmail?: string;
  tier: SubscriptionTier;
  duration: number;
  message?: string;
  redeemCode: string;
  status: 'pending' | 'redeemed' | 'expired';
  createdAt: string;
  redeemedAt?: string;
  expiresAt: string;
}

/**
 * Subscription limits
 */
export interface SubscriptionLimits {
  tier: SubscriptionTier;
  fileUploadSize: number;
  storageUsed: number;
  storageLimit: number;
  groupsOwned: number;
  groupsLimit: number;
  forumsOwned: number;
  forumsLimit: number;
}
