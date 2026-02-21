/**
 * Premium Page Types
 *
 * Type definitions for premium subscription tiers and features.
 */

import type { ReactNode } from 'react';
import type { SubscriptionTier } from '@/modules/premium/store/types';

/**
 * Individual feature within a premium tier
 */
export interface PremiumFeature {
  name: string;
  included: boolean;
  detail?: string;
}

/**
 * Premium subscription tier configuration
 *
 * The `id` field must match a valid SubscriptionTier:
 * free | premium | enterprise
 *
 * Note: UI badges may display "PRO" as a short branding label for the premium tier.
 */
export interface PremiumTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  popular?: boolean;
  features: PremiumFeature[];
  icon: ReactNode;
  color: string;
  gradient: string;
}

/**
 * FAQ item for the premium page
 */
export interface FAQItem {
  q: string;
  a: string;
}

/**
 * Billing interval options
 */
export type BillingInterval = 'month' | 'year';
