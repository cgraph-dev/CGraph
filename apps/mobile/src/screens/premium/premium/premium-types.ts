/**
 * Premium screen shared types and constants.
 * @module screens/premium/premium/premium-types
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PremiumTier {
  id: 'free' | 'premium';
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
  gradient: readonly [string, string, ...string[]];
  features: {
    text: string;
    included: boolean;
  }[];
}

export type BillingCycle = 'monthly' | 'yearly';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    gradient: ['#6b7280', '#4b5563'],
    features: [
      { text: '50 Direct messages/day', included: true },
      { text: '5 Group memberships', included: true },
      { text: 'Basic encryption', included: true },
      { text: '5 MB file uploads', included: true },
      { text: 'Standard avatar frames', included: true },
      { text: 'Premium features', included: false },
      { text: 'Custom themes', included: false },
      { text: 'Priority support', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 9.99,
      yearly: 95.9, // 20% discount
    },
    popular: true,
    gradient: ['#8b5cf6', '#7c3aed'],
    features: [
      { text: 'Unlimited messages', included: true },
      { text: 'Unlimited groups', included: true },
      { text: 'Enhanced E2EE', included: true },
      { text: '100 MB file uploads', included: true },
      { text: '30+ premium avatar frames', included: true },
      { text: '10+ animated effects', included: true },
      { text: '50 custom themes', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Full API access', included: true },
    ],
  },
];
