/**
 * PremiumBanner Component
 *
 * Upsell banner for promoting premium features to free users.
 * Features:
 * - Multiple styles (hero, bar, card, floating)
 * - Animated elements
 * - Dismissible
 * - Custom CTAs
 * - Feature highlights
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BoltIcon,
  GiftIcon,
  StarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { usePremiumStore } from '@/features/premium/stores';

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

const ANIMATED_FEATURES = [
  { icon: <BoltIcon className="h-5 w-5" />, text: 'Unlimited Groups' },
  { icon: <SparklesIcon className="h-5 w-5" />, text: 'Custom Themes' },
  { icon: <GiftIcon className="h-5 w-5" />, text: 'Exclusive Badges' },
  { icon: <RocketLaunchIcon className="h-5 w-5" />, text: 'Priority Support' },
];

export const PremiumBanner: React.FC<PremiumBannerProps> = ({
  variant = 'card',
  title = 'Upgrade to Premium',
  description = 'Unlock all features and take your experience to the next level',
  features = ['Ad-free experience', 'Custom themes', 'Priority support', 'Unlimited groups'],
  ctaText = 'Upgrade Now',
  onUpgrade,
  onDismiss,
  dismissible = true,
  showPrice = true,
  price = 4.99,
  originalPrice,
  className = '',
}) => {
  const { isSubscribed } = usePremiumStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Cycle through features
  React.useEffect(() => {
    if (variant === 'hero' || variant === 'floating') {
      const interval = setInterval(() => {
        setActiveFeatureIndex((prev) => (prev + 1) % ANIMATED_FEATURES.length);
      }, 3000);
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

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-between rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-2 ${className}`}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-white/80">Go Premium</span>
        </div>
        <button
          onClick={handleUpgrade}
          className="text-sm font-medium text-purple-400 hover:text-purple-300"
        >
          Upgrade →
        </button>
      </motion.div>
    );
  }

  if (variant === 'bar') {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <SparklesIcon className="h-6 w-6 text-white" />
            </motion.div>
            <span className="font-medium text-white">{title}</span>
            <span className="hidden text-white/80 sm:inline">— {description}</span>
          </div>

          <div className="flex items-center gap-3">
            {showPrice && (
              <div className="hidden items-center gap-2 sm:flex">
                {originalPrice && (
                  <span className="text-white/60 line-through">${originalPrice}</span>
                )}
                <span className="font-bold text-white">${price}/mo</span>
              </div>
            )}
            <Button
              onClick={handleUpgrade}
              className="rounded-full bg-white px-4 py-1.5 font-semibold text-purple-600 hover:bg-white/90"
            >
              {ctaText}
            </Button>
            {dismissible && (
              <button onClick={handleDismiss} className="rounded-full p-1 hover:bg-white/10">
                <XMarkIcon className="h-5 w-5 text-white/80" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`fixed bottom-4 right-4 z-40 ${className}`}
        >
          <GlassCard variant="holographic" className="max-w-sm p-4">
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="absolute right-2 top-2 rounded-full bg-white/10 p-1 hover:bg-white/20"
              >
                <XMarkIcon className="h-4 w-4 text-white/60" />
              </button>
            )}

            <div className="flex items-start gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3"
              >
                <SparklesIcon className="h-6 w-6 text-white" />
              </motion.div>

              <div className="flex-1">
                <h4 className="font-semibold text-white">{title}</h4>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeatureIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-1 flex items-center gap-2 text-sm text-purple-400"
                  >
                    {ANIMATED_FEATURES[activeFeatureIndex]?.icon}
                    <span>{ANIMATED_FEATURES[activeFeatureIndex]?.text}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2 font-semibold text-white"
            >
              {showPrice && <span>${price}/mo</span>}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${className}`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
              }}
              className="absolute h-2 w-2 rounded-full bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: -10,
              }}
            />
          ))}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 hover:bg-white/20"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        )}

        <div className="relative p-8 text-center md:p-12">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mb-6 inline-flex rounded-2xl bg-white/20 p-4"
          >
            <SparklesIcon className="h-10 w-10 text-white" />
          </motion.div>

          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">{title}</h2>
          <p className="mx-auto mb-6 max-w-xl text-lg text-white/80">{description}</p>

          {/* Features carousel */}
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {ANIMATED_FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                animate={{
                  scale: activeFeatureIndex === index ? 1.1 : 1,
                  opacity: activeFeatureIndex === index ? 1 : 0.6,
                }}
                className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white"
              >
                {feature.icon}
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Pricing */}
          {showPrice && (
            <div className="mb-6">
              <div className="flex items-baseline justify-center gap-2">
                {originalPrice && (
                  <span className="text-2xl text-white/50 line-through">${originalPrice}</span>
                )}
                <span className="text-5xl font-bold text-white">${price}</span>
                <span className="text-xl text-white/80">/month</span>
              </div>
              {originalPrice && (
                <p className="mt-2 text-sm text-green-300">
                  Save ${(originalPrice - price).toFixed(2)} per month!
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleUpgrade}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl hover:bg-white/90"
          >
            <StarIcon className="h-6 w-6" />
            {ctaText}
          </Button>

          <p className="mt-4 text-sm text-white/60">Cancel anytime. No questions asked.</p>
        </div>
      </motion.div>
    );
  }

  // Default card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <GlassCard variant="holographic" className="relative overflow-hidden p-6">
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full bg-white/10 p-1 hover:bg-white/20"
          >
            <XMarkIcon className="h-4 w-4 text-white/60" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3"
          >
            <SparklesIcon className="h-8 w-8 text-white" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/60">{description}</p>

            {features.length > 0 && (
              <ul className="mt-4 space-y-2">
                {features.slice(0, 4).map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-white/80"
                  >
                    <StarIcon className="h-4 w-4 flex-shrink-0 text-purple-400" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center gap-4">
              <Button
                onClick={handleUpgrade}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 font-semibold text-white hover:opacity-90"
              >
                {ctaText}
              </Button>
              {showPrice && (
                <div className="flex items-baseline gap-1">
                  {originalPrice && (
                    <span className="text-sm text-white/40 line-through">${originalPrice}</span>
                  )}
                  <span className="font-bold text-white">${price}</span>
                  <span className="text-sm text-white/60">/mo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PremiumBanner;
