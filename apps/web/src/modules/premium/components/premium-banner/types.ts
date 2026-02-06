export interface PremiumBannerProps {
  variant?: 'hero' | 'bar' | 'card' | 'floating' | 'minimal';
  title?: string;
  description?: string;
  features?: string[];
  ctaText?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  showPrice?: boolean;
  price?: number;
  originalPrice?: number;
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
