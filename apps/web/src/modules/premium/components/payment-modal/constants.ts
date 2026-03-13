/**
 * PaymentModal constants
 * @module modules/premium/components/payment-modal
 */

import type { PaymentMethodOption } from './types';

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'card', name: 'Credit Card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️' },
  { id: 'apple', name: 'Apple Pay', icon: '🍎' },
  { id: 'google', name: 'Google Pay', icon: '🔵' },
];

export const PROMO_CODES: Record<string, number> = {
  save20: 0.2,
  vip50: 0.5,
};

export const SUBSCRIPTION_TIER_MAP: Record<string, 'free' | 'premium' | 'enterprise'> = {
  basic: 'premium',
  plus: 'premium',
  pro: 'premium',
  premium: 'premium',
  business: 'enterprise',
  enterprise: 'enterprise',
};
