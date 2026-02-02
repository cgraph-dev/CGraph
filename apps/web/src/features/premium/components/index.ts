/**
 * Premium Components
 *
 * Re-exports premium components from the module structure.
 * This file maintains backward compatibility for existing imports.
 *
 * @deprecated Import from '@/modules/premium/components' instead
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';

// Re-export from modules location
export {
  SubscriptionCard,
  PaymentModal,
  CoinShopWidget,
  PremiumBanner,
  FeatureComparison,
} from '@/modules/premium/components';

// Re-export types
export type {
  SubscriptionCardProps,
  PaymentModalProps,
  PaymentItem,
  CoinShopWidgetProps,
  PremiumBannerProps,
  FeatureComparisonProps,
  FeatureCategory,
  FeatureItem,
} from '@/modules/premium/components';

/**
 * Premium badge displayed next to username
 */
export const PremiumBadge: React.FC<{ className?: string }> = ({ className }) => {
  const { user } = useAuthStore();
  if (!user?.isPremium) return null;

  return React.createElement(
    'span',
    {
      className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white ${className || ''}`,
    },
    '⭐ Premium'
  );
};

/**
 * Display user's coin balance
 */
export const CoinBalance: React.FC<{ className?: string }> = ({ className }) => {
  const { user } = useAuthStore();
  const coins = user?.coins ?? 0;

  return React.createElement(
    'span',
    { className: `inline-flex items-center gap-1 ${className || ''}` },
    React.createElement('span', null, '🪙'),
    React.createElement('span', { className: 'font-medium' }, coins.toLocaleString())
  );
};
