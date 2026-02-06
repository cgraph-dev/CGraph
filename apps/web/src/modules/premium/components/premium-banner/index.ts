/**
 * Premium Banner Module
 *
 * Upsell banner for promoting premium features to free-tier users.
 * Supports multiple display variants: hero, bar, card, floating, and minimal.
 *
 * @module modules/premium/components/premium-banner
 */

// Main component
export { PremiumBanner, default } from './PremiumBanner';

// Variant sub-components
export { HeroBanner } from './HeroBanner';
export { CardBanner } from './CardBanner';
export { BarBanner } from './BarBanner';
export { FloatingBanner } from './FloatingBanner';
export { MinimalBanner } from './MinimalBanner';

// Types
export type { PremiumBannerProps, BannerVariantProps } from './types';

// Constants
export {
  ANIMATED_FEATURES,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_FEATURES,
} from './constants';
