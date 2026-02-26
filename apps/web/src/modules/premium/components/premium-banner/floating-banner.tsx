/**
 * Floating premium upgrade banner.
 * @module
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import { ANIMATED_FEATURES } from './constants';
import type { BannerVariantProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

type FloatingBannerProps = Pick<
  BannerVariantProps,
  | 'title'
  | 'ctaText'
  | 'dismissible'
  | 'showPrice'
  | 'price'
  | 'className'
  | 'activeFeatureIndex'
  | 'onUpgrade'
  | 'onDismiss'
>;

/**
 * unknown for the premium module.
 */
/**
 * Floating Banner component.
 */
export function FloatingBanner({
  title,
  dismissible,
  showPrice,
  price,
  className,
  activeFeatureIndex,
  onUpgrade,
  onDismiss,
}: FloatingBannerProps): React.ReactElement {
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
            onClick={onDismiss}
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
            transition={loop(tweens.ambient)}
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
          onClick={onUpgrade}
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
