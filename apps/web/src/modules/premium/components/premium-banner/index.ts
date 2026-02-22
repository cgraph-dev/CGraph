/**
 * Premium Banner Module
 *
 * Upsell banner for promoting premium features to free-tier users.
 * Supports multiple display variants: hero, bar, card, floating, and minimal.
 *
 * @module modules/premium/components/premium-banner
 */

// Main component
export { PremiumBanner, default } from './premium-banner';

// Variant sub-components
export { HeroBanner } from './hero-banner';
export { CardBanner } from './card-banner';
export { BarBanner } from './bar-banner';
export { FloatingBanner } from './floating-banner';
export { MinimalBanner } from './minimal-banner';

// Types
export type { PremiumBannerProps, BannerVariantProps } from './types';

// Constants
export {
  ANIMATED_FEATURES,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_FEATURES,
} from './constants';
