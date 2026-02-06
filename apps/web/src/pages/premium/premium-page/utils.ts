/**
 * Premium Page Utilities
 *
 * Helper functions for premium page calculations and pricing.
 */

import type { PremiumTier, BillingInterval } from './types';

/**
 * Calculate yearly price with 20% discount
 */
export function getPrice(tier: PremiumTier, billingInterval: BillingInterval): string {
  if (tier.price === 0) return '0';
  if (billingInterval === 'year') {
    return (tier.price * 12 * 0.8).toFixed(2);
  }
  return tier.price.toFixed(2);
}

/**
 * Get yearly total price (no discount shown)
 */
export function getYearlyTotal(tier: PremiumTier): string {
  return (tier.price * 12).toFixed(2);
}
