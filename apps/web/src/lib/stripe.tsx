/**
 * Stripe Configuration & Provider
 *
 * This module provides Stripe integration for CGraph's payment system.
 * It wraps the application with the Stripe Elements provider.
 *
 * @module stripe
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode, useMemo } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Stripe');

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance (singleton pattern)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise ?? Promise.resolve(null);
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PUBLISHABLE_KEY);
}

/**
 * Stripe Elements appearance configuration
 * Matches CGraph's design system
 */
const ELEMENTS_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#6366f1', // Indigo-500
    colorBackground: '#1f2937', // Gray-800
    colorText: '#f9fafb', // Gray-50
    colorDanger: '#ef4444', // Red-500
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#374151', // Gray-700
      border: '1px solid #4b5563', // Gray-600
    },
    '.Input:focus': {
      borderColor: '#6366f1', // Indigo-500
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
    },
    '.Label': {
      color: '#d1d5db', // Gray-300
    },
  },
};

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * Stripe Elements Provider
 *
 * Wrap your checkout components with this provider to enable Stripe Elements.
 *
 * @example
 * ```tsx
 * <StripeProvider>
 *   <CheckoutForm />
 * </StripeProvider>
 * ```
 */
export function StripeProvider({ children }: StripeProviderProps) {
  const stripePromise = useMemo(() => getStripe(), []);

  if (!isStripeConfigured()) {
    logger.warn('Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY.');
    return <>{children}</>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: ELEMENTS_APPEARANCE,
      }}
    >
      {children}
    </Elements>
  );
}

/**
 * Subscription plan types
 */
export type PlanId = 'free' | 'premium' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceYearly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Available subscription plans
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    description: 'Perfect for getting started',
    features: [
      'Up to 10 group chats',
      '5 direct messages per day',
      '100 messages per day',
      'Basic file sharing (10MB)',
      'Standard support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceYearly: 99,
    description: 'Unlock all essential features',
    features: [
      'Unlimited group chats',
      'Unlimited messages',
      'File sharing up to 500MB',
      'Voice & video calls',
      'Custom themes & emoji packs',
      'Screen sharing',
      'Advanced analytics',
      'Priority support',
    ],
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // Custom pricing
    priceYearly: -1,
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Premium',
      'Custom integrations',
      'SLA guarantees',
      'Dedicated infrastructure',
      'Custom branding',
      'On-boarding support',
      'Account manager',
    ],
  },
];

/**
 * Get a plan by ID
 */
export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export default StripeProvider;
