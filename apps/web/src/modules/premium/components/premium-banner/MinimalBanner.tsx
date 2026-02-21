import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { BannerVariantProps } from './types';

type MinimalBannerProps = Pick<BannerVariantProps, 'className' | 'onUpgrade'>;

export function MinimalBanner({ className, onUpgrade }: MinimalBannerProps): React.ReactElement {
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
      onClick={onUpgrade}
      className="text-sm font-medium text-purple-400 hover:text-purple-300"
    >
      Upgrade →
    </button>
  </motion.div>
);
}
