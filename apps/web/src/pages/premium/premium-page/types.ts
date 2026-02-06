/**
 * Premium Page Types
 *
 * Type definitions for premium subscription tiers and features.
 */

import type { ReactNode } from 'react';

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
 */
export interface PremiumTier {
  id: string;
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
