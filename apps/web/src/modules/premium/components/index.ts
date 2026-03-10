/**
 * Premium Components
 *
 * Comprehensive set of premium/subscription UI components.
 * Includes subscription cards, payment flows, coin shop, and upsell banners.
 */

// Subscription components
export { SubscriptionCard } from './subscription-card';
export type { SubscriptionCardProps } from './subscription-card';

// Payment flow
export { PaymentModal } from './payment-modal';
export type { PaymentModalProps, PaymentItem } from './payment-modal';

// Upsell banners
export { PremiumBanner } from './premium-banner';
export type { PremiumBannerProps } from './premium-banner';

// Feature comparison
export { FeatureComparison } from './feature-comparison';
export type { FeatureComparisonProps, FeatureCategory, FeatureItem } from './feature-comparison';

// Default export for convenience
export { SubscriptionCard as default } from './subscription-card';
