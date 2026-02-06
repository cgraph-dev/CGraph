/**
 * Premium Banner Module Types
 *
 * Type definitions for the premium upsell banner components.
 *
 * @module modules/premium/components/premium-banner
 */

/** Props for the main PremiumBanner component */
export interface PremiumBannerProps {
  /** Display variant style */
  variant?: 'hero' | 'bar' | 'card' | 'floating' | 'minimal';
  /** Banner headline text */
  title?: string;
  /** Banner description text */
  description?: string;
  /** Feature bullet points */
  features?: string[];
  /** Call-to-action button text */
  ctaText?: string;
  /** Callback when upgrade button is clicked */
  onUpgrade?: () => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Whether to show pricing information */
  showPrice?: boolean;
  /** Current price in dollars */
  price?: number;
  /** Original price for strikethrough display */
  originalPrice?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Internal props passed to each variant sub-component after
 * defaults have been applied in the main PremiumBanner.
 */
export interface BannerVariantProps {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  dismissible: boolean;
  showPrice: boolean;
  price: number;
  originalPrice?: number;
  className: string;
  activeFeatureIndex: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}
