/**
 * Feature comparison constants — tier metadata and default feature categories.
 *
 * @module modules/premium/components/feature-comparison-constants
 */

import React from 'react';
import { StarIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import type { SubscriptionTier } from '@/modules/premium/store/types';

// Types defined here (not in FeatureComparison.tsx) to avoid circular dependency
export interface FeatureItem {
  name: string;
  description?: string;
  values: Record<SubscriptionTier, boolean | string | number>;
}

export interface FeatureCategory {
  name: string;
  features: FeatureItem[];
}

export const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <StarIcon className="h-5 w-5" />,
  premium: <SparklesIcon className="h-5 w-5" />,
  enterprise: <RocketLaunchIcon className="h-5 w-5" />,
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

export const DEFAULT_CATEGORIES: FeatureCategory[] = [
  {
    name: 'Core Features',
    features: [
      {
        name: 'Groups',
        description: 'Maximum number of groups you can join or create',
        values: { free: 5, premium: 100, enterprise: 'Unlimited' },
      },
      {
        name: 'Forums',
        description: 'Number of forums you can participate in',
        values: { free: 3, premium: 50, enterprise: 'Unlimited' },
      },
      {
        name: 'File Upload Size',
        description: 'Maximum file size per upload',
        values: { free: '10MB', premium: '50MB', enterprise: '100MB' },
      },
      {
        name: 'Cloud Storage',
        description: 'Personal cloud storage for files and media',
        values: { free: '1GB', premium: '50GB', enterprise: '200GB' },
      },
    ],
  },
  {
    name: 'Customization',
    features: [
      {
        name: 'Custom Themes',
        description: 'Create and use custom color themes',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'Custom Emojis',
        description: 'Number of custom emojis you can upload',
        values: { free: 0, premium: 100, enterprise: 500 },
      },
      {
        name: 'Animated Profile',
        description: 'Use animated avatars and profile banners',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'Custom Badges',
        description: 'Access to exclusive profile badges',
        values: { free: false, premium: true, enterprise: true },
      },
    ],
  },
  {
    name: 'Communication',
    features: [
      {
        name: 'Message History',
        description: 'How far back you can view message history',
        values: {
          free: '30 days',
          premium: 'Unlimited',
          enterprise: 'Unlimited',
        },
      },
      {
        name: 'Voice Effects',
        description: 'Real-time voice modulation effects',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'HD Video Calls',
        description: 'High definition video call quality',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'AI Suggestions',
        description: 'AI-powered message suggestions and summaries',
        values: { free: false, premium: true, enterprise: true },
      },
    ],
  },
  {
    name: 'Support & Extras',
    features: [
      {
        name: 'Ad-Free Experience',
        description: 'Browse without any advertisements',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'Priority Support',
        description: 'Get faster support response times',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'Early Access',
        description: 'Access new features before public release',
        values: { free: false, premium: true, enterprise: true },
      },
      {
        name: 'Personal Manager',
        description: 'Dedicated account manager',
        values: { free: false, premium: false, enterprise: true },
      },
    ],
  },
];
