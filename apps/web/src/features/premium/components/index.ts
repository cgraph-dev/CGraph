/**
 * Premium Components
 *
 * Re-exports premium-related components.
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';

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

// These components would be extracted from pages for reuse
export { default as SubscriptionCard } from '@/pages/premium/PremiumPage';
export { default as ShopItemCard } from '@/pages/premium/CoinShop';
