/**
 * PremiumBanner Component
 *
 * Upsell banner for promoting premium features to free users.
 * Features:
 * - Multiple styles (hero, bar, card, floating, minimal)
 * - Animated elements
 * - Dismissible
 * - Custom CTAs
 * - Feature highlights
 */

import React, { useState } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { usePremiumStore } from '@/modules/premium/store';

import type { PremiumBannerProps } from './types';
import {
  ANIMATED_FEATURES,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_FEATURES,
  DEFAULT_CTA_TEXT,
  DEFAULT_PRICE,
  FEATURE_CYCLE_INTERVAL_MS,
} from './constants';
import { MinimalBanner } from './MinimalBanner';
import { BarBanner } from './BarBanner';
import { FloatingBanner } from './FloatingBanner';
import { HeroBanner } from './HeroBanner';
import { CardBanner } from './CardBanner';

export const PremiumBanner: React.FC<PremiumBannerProps> = ({
  variant = 'card',
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  features = DEFAULT_FEATURES,
  ctaText = DEFAULT_CTA_TEXT,
  onUpgrade,
  onDismiss,
  dismissible = true,
  showPrice = true,
  price = DEFAULT_PRICE,
  originalPrice,
  className = '',
}) => {
  const { isSubscribed } = usePremiumStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Cycle through features for hero / floating variants
  React.useEffect(() => {
    if (variant === 'hero' || variant === 'floating') {
      const interval = setInterval(() => {
        setActiveFeatureIndex((prev) => (prev + 1) % ANIMATED_FEATURES.length);
      }, FEATURE_CYCLE_INTERVAL_MS);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [variant]);

  // Don't show if already subscribed or dismissed
  if (isSubscribed || isDismissed) return null;

  const handleUpgrade = () => {
    HapticFeedback.medium();
    onUpgrade?.();
  };

  const handleDismiss = () => {
    HapticFeedback.light();
    setIsDismissed(true);
    onDismiss?.();
  };

  const shared = {
    title,
    description,
    features,
    ctaText,
    dismissible,
    showPrice,
    price,
    originalPrice,
    className,
    activeFeatureIndex,
    onUpgrade: handleUpgrade,
    onDismiss: handleDismiss,
  };

  switch (variant) {
    case 'minimal':
      return <MinimalBanner className={className} onUpgrade={handleUpgrade} />;
    case 'bar':
      return <BarBanner {...shared} />;
    case 'floating':
      return <FloatingBanner {...shared} />;
    case 'hero':
      return <HeroBanner {...shared} />;
    case 'card':
    default:
      return <CardBanner {...shared} />;
  }
};

export default PremiumBanner;
