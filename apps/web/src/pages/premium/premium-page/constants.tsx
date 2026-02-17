/**
 * Premium Page Constants
 *
 * Premium tier definitions and FAQ content.
 */

import { StarIcon, BoltIcon, RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { PremiumTier, FAQItem } from './types';

/**
 * Premium subscription tier configurations
 *
 * Tier IDs must match `SubscriptionTier` in store/types.ts and `PlanId` in lib/stripe.tsx:
 * free | plus | pro | business | enterprise
 */
export const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with basic features',
    icon: <StarIcon className="h-6 w-6" />,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    features: [
      { name: 'Basic messaging', included: true },
      { name: 'Standard forums', included: true },
      { name: 'Up to 5 groups', included: true },
      { name: 'Basic themes', included: true },
      { name: 'Standard emojis', included: true },
      { name: '10MB file uploads', included: true },
      { name: '30-day message history', included: true },
      { name: 'Community support', included: true },
      { name: 'Custom themes', included: false },
      { name: 'Animated emojis', included: false },
      { name: 'Voice effects', included: false },
      { name: 'AI features', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 4.99,
    interval: 'month',
    description: 'Unlock all essential features',
    popular: true,
    icon: <BoltIcon className="h-6 w-6" />,
    color: 'primary',
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      { name: 'Up to 25 groups', included: true },
      { name: 'Custom themes', included: true },
      { name: 'Animated emojis', included: true },
      { name: 'Priority support', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Custom badges', included: true },
      { name: '25MB file uploads', included: true },
      { name: '1 year message history', included: true },
      { name: 'Voice effects', included: true },
      { name: 'Advanced read receipts', included: true },
      { name: 'AI message suggestions', included: false },
      { name: 'Real-time translation', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    description: 'Power features for power users',
    icon: <SparklesIcon className="h-6 w-6" />,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    features: [
      { name: 'Everything in Plus', included: true },
      { name: 'AI message suggestions', included: true },
      { name: 'Real-time translation', included: true, detail: '100+ languages' },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom server themes', included: true },
      { name: 'Animated profile', included: true },
      { name: 'Exclusive badges', included: true },
      { name: '50MB file uploads', included: true },
      { name: 'Cloud backup', included: true },
      { name: 'Early feature access', included: true },
      { name: 'Team management', included: false },
      { name: 'Custom integrations', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 19.99,
    interval: 'month',
    description: 'For teams and organizations',
    icon: <RocketLaunchIcon className="h-6 w-6" />,
    color: 'yellow',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Team management', included: true },
      { name: 'SSO integration', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom branding', included: true },
      { name: '75MB file uploads', included: true },
      { name: 'Unlimited message history', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Custom profile banner', included: true },
      { name: '2.5x XP boost', included: true },
      { name: 'On-premise option', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1,
    interval: 'month',
    description: 'Custom solutions for large organizations',
    icon: <RocketLaunchIcon className="h-6 w-6" />,
    color: 'rose',
    gradient: 'from-rose-500 to-red-600',
    features: [
      { name: 'Everything in Business', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'On-premise option', included: true },
      { name: '100MB file uploads', included: true },
      { name: '3x XP boost', included: true },
      { name: '50% coin bonus', included: true },
      { name: 'Unlimited everything', included: true },
      { name: 'White-label option', included: true },
      { name: 'Custom SLA', included: true },
      { name: 'Priority phone support', included: true },
    ],
  },
];

/**
 * FAQ content for the premium page
 */
export const FAQ_ITEMS: FAQItem[] = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment system.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Absolutely! You can change your plan at any time. The difference will be prorated on your next billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: "We offer a 7-day free trial for Premium. Cancel anytime during the trial and you won't be charged.",
  },
];
