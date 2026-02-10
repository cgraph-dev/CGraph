import { StarIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

export const tierHierarchy = {
  free: 0,
  premium: 1,
  elite: 2,
} as const;

export const tierConfig = {
  free: {
    label: 'Free',
    color: 'text-gray-400',
    bgColor: 'bg-gray-700',
    borderColor: 'border-gray-600',
    icon: null,
  },
  premium: {
    label: 'Premium',
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-r from-amber-600 to-amber-500',
    borderColor: 'border-amber-500',
    icon: StarIcon,
  },
  elite: {
    label: 'Elite',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-600 to-pink-500',
    borderColor: 'border-purple-500',
    icon: SparklesIcon,
  },
} as const;

export type PremiumTier = 'free' | 'premium' | 'elite';
