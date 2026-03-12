/**
 * Pricing tier data for the landing page.
 *
 * Matches the actual backend TierFeatures module limits.
 *
 * @since v1.0.0
 */

export interface PricingTier {
  readonly name: string;
  readonly price: number;
  readonly annualPrice: number;
  readonly description: string;
  readonly cta: string;
  readonly ctaLink: string;
  readonly highlighted: boolean;
  readonly features: readonly string[];
}

export const pricingTiers: readonly PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    description: 'Everything you need to get started.',
    cta: 'Start Free',
    ctaLink: 'https://web.cgraph.org/register',
    highlighted: false,
    features: [
      'E2E encrypted messaging',
      'Up to 1 forum',
      '25 MB file uploads',
      'Voice & video calls',
      '70 achievements to unlock',
      'Standard themes (3)',
      'Community support',
    ],
  },
  {
    name: 'Premium',
    price: 9.99,
    annualPrice: 8.33,
    description: 'For power users and growing communities.',
    cta: 'Start Free Trial',
    ctaLink: 'https://web.cgraph.org/register?plan=premium',
    highlighted: true,
    features: [
      'Everything in Free',
      'Up to 5 forums',
      '500 MB file uploads',
      'Scheduled messages',
      'Advanced search & filters',
      'Full cosmetics collection',
      'Animated avatar borders',
      'Creator economy tools',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 0,
    annualPrice: 0,
    description: 'For organizations that need more.',
    cta: 'Contact Us',
    ctaLink: '/contact',
    highlighted: false,
    features: [
      'Everything in Premium',
      '2 GB file uploads',
      'API access',
      'Custom integrations',
      'SSO / SAML authentication',
      'Compliance & audit logging',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
] as const;
