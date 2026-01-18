/**
 * Premium Components
 *
 * Comprehensive set of premium/subscription UI components.
 * Includes subscription cards, payment flows, coin shop, and upsell banners.
 */

// Subscription components
export { SubscriptionCard } from './SubscriptionCard';
export type { SubscriptionCardProps } from './SubscriptionCard';

// Payment flow
export { PaymentModal } from './PaymentModal';
export type { PaymentModalProps, PaymentItem } from './PaymentModal';

// Coin shop
export { CoinShopWidget } from './CoinShopWidget';
export type { CoinShopWidgetProps } from './CoinShopWidget';

// Upsell banners
export { PremiumBanner } from './PremiumBanner';
export type { PremiumBannerProps } from './PremiumBanner';

// Feature comparison
export { FeatureComparison } from './FeatureComparison';
export type { FeatureComparisonProps, FeatureCategory, FeatureItem } from './FeatureComparison';

// Default export for convenience
export { SubscriptionCard as default } from './SubscriptionCard';
