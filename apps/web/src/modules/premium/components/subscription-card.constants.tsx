/**
 * Subscription Card Constants
 *
 * Tier-level visual configuration: icons, colors, and gradients
 * used by SubscriptionCard and its sub-components.
 */

import React from 'react';
import { StarIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import type { SubscriptionTier } from '@/modules/premium/store/types';

export const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <StarIcon className="h-6 w-6" />,
  premium: <SparklesIcon className="h-6 w-6" />,
  enterprise: <RocketLaunchIcon className="h-6 w-6" />,
};

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'gray',
  premium: 'purple',
  enterprise: 'rose',
};

export const TIER_GRADIENTS: Record<SubscriptionTier, string> = {
  free: 'from-gray-500 to-gray-600',
  premium: 'from-purple-500 to-pink-500',
  enterprise: 'from-rose-500 to-red-600',
};

export function Crown({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 0v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
    </svg>
  );
}
