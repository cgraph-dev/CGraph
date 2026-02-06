/**
 * Animation and style constants for StickerPicker
 */

import type { TargetAndTransition } from 'framer-motion';
import { SparklesIcon, StarIcon } from '@heroicons/react/24/outline';
import type { StickerRarity } from '@/data/stickers';

/**
 * Maps sticker animation types to Framer Motion configurations
 */
export const ANIMATION_CONFIGS: Record<string, TargetAndTransition> = {
  bounce: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.5 } },
  pulse: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } },
  shake: { x: [-5, 5, -5, 5, 0], transition: { repeat: Infinity, duration: 0.5 } },
  wiggle: { rotate: [-3, 3, -3], transition: { repeat: Infinity, duration: 0.5 } },
  float: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' } },
  pop: { scale: [0, 1.2, 1], transition: { duration: 0.3 } },
  wave: { rotate: [0, 20, -20, 0], transition: { repeat: Infinity, duration: 1 } },
  zoom: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } },
  flip: { rotateY: [0, 360], transition: { repeat: Infinity, duration: 1 } },
  swing: { rotate: [0, 15, -10, 5, -5, 0], transition: { duration: 1 } },
  jello: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], transition: { duration: 1 } },
  heartbeat: { scale: [1, 1.3, 1, 1.3, 1], transition: { repeat: Infinity, duration: 1.5 } },
  flash: { opacity: [1, 0.5, 1, 0.5, 1], transition: { repeat: Infinity, duration: 1 } },
  rubberband: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], transition: { duration: 1 } },
  spin: { rotate: [0, 360], transition: { repeat: Infinity, duration: 1, ease: 'linear' } },
  none: {},
};

/**
 * Rarity icons mapping
 */
export const RARITY_ICONS: Record<StickerRarity, React.ReactNode> = {
  common: null,
  uncommon: <SparklesIcon className="h-3 w-3" />,
  rare: <StarIcon className="h-3 w-3" />,
  epic: <SparklesIcon className="h-3 w-3" />,
  legendary: <StarIcon className="h-3 w-3" />,
};

/**
 * Size classes for sticker messages
 */
export const STICKER_SIZE_CLASSES = {
  sm: 'text-4xl p-2',
  md: 'text-6xl p-3',
  lg: 'text-8xl p-4',
};
