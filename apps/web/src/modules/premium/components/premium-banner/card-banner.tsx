/**
 * Premium card-style banner component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import type { BannerVariantProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

type CardBannerProps = Pick<
  BannerVariantProps,
  | 'title'
  | 'description'
  | 'features'
  | 'ctaText'
  | 'dismissible'
  | 'showPrice'
  | 'price'
  | 'originalPrice'
  | 'className'
  | 'onUpgrade'
  | 'onDismiss'
>;

/**
 * unknown for the premium module.
 */
/**
 * Card Banner display component.
 */
export function CardBanner({
  title,
  description,
  features,
  ctaText,
  dismissible,
  showPrice,
  price,
  originalPrice,
  className,
  onUpgrade,
  onDismiss,
}: CardBannerProps): React.ReactElement {
  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={className}>
    <GlassCard variant="holographic" className="relative overflow-hidden p-6">
      {dismissible && (
        <button
          onClick={onDismiss}
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
          transition={loop(tweens.ambient)}
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
              onClick={onUpgrade}
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
}
