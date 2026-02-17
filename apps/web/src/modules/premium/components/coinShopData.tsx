/**
 * CoinShopWidget data & shared sub-components
 */

import React from 'react';
import type { CoinPackage } from '@/modules/premium/store/types';

/** Default coin packages shown when none are provided */
export const DEFAULT_PACKAGES: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 100,
    bonusCoins: 0,
    price: 0.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    coins: 500,
    bonusCoins: 50,
    price: 4.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    coins: 1200,
    bonusCoins: 200,
    price: 9.99,
    currency: 'USD',
    isPopular: true,
  },
  {
    id: 'value',
    name: 'Great Value',
    coins: 2500,
    bonusCoins: 500,
    price: 19.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    coins: 5500,
    bonusCoins: 1500,
    price: 39.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    coins: 12000,
    bonusCoins: 4000,
    price: 79.99,
    currency: 'USD',
    isPopular: false,
  },
];

/** Reusable coin SVG icon */
export const CoinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#coinGradient)" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
      $
    </text>
    <defs>
      <linearGradient id="coinGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);
