import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components';
import type { BannerVariantProps } from './types';

type BarBannerProps = Pick<
  BannerVariantProps,
  | 'title'
  | 'description'
  | 'ctaText'
  | 'dismissible'
  | 'showPrice'
  | 'price'
  | 'originalPrice'
  | 'className'
  | 'onUpgrade'
  | 'onDismiss'
>;

export function BarBanner({
  title,
  description,
  ctaText,
  dismissible,
  showPrice,
  price,
  originalPrice,
  className,
  onUpgrade,
  onDismiss,
}: BarBannerProps): React.ReactElement {
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
            {originalPrice && <span className="text-white/60 line-through">${originalPrice}</span>}
            <span className="font-bold text-white">${price}/mo</span>
          </div>
        )}
        <Button
          onClick={onUpgrade}
          className="rounded-full bg-white px-4 py-1.5 font-semibold text-purple-600 hover:bg-white/90"
        >
          {ctaText}
        </Button>
        {dismissible && (
          <button onClick={onDismiss} className="rounded-full p-1 hover:bg-white/10">
            <XMarkIcon className="h-5 w-5 text-white/80" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);
}
