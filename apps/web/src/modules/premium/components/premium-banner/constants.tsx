/**
 * Premium banner constant definitions.
 * @module
 */
import { BoltIcon, SparklesIcon, RocketLaunchIcon, GiftIcon } from '@heroicons/react/24/outline';

export const ANIMATED_FEATURES = [
  { icon: <BoltIcon className="h-5 w-5" />, text: 'Unlimited Groups' },
  { icon: <SparklesIcon className="h-5 w-5" />, text: 'Custom Themes' },
  { icon: <GiftIcon className="h-5 w-5" />, text: 'Exclusive Badges' },
  { icon: <RocketLaunchIcon className="h-5 w-5" />, text: 'Priority Support' },
];

export const DEFAULT_TITLE = 'Upgrade to Premium';
export const DEFAULT_DESCRIPTION = 'Unlock all features and take your experience to the next level';
export const DEFAULT_FEATURES = [
  'Ad-free experience',
  'Custom themes',
  'Priority support',
  'Unlimited groups',
];
export const DEFAULT_CTA_TEXT = 'Upgrade Now';
export const DEFAULT_PRICE = 4.99;
export const FEATURE_CYCLE_INTERVAL_MS = 3000;
