/**
 * GifItem Component
 *
 * Individual GIF item with hover effects and favorite toggle.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import type { GifItemProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Gif Item component.
 */
export function GifItem({ gif, onSelect, isFavorite, onToggleFavorite }: GifItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer overflow-hidden rounded-lg bg-white/[0.06]"
      style={{ aspectRatio: gif.width / gif.height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(gif)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Skeleton loader */}
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-white/[0.08]" />}

      {/* GIF Image */}
      <img
        src={isHovered ? gif.url : gif.previewUrl}
        alt={gif.title}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Hover overlay with favorite button */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(gif);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 transition-colors hover:bg-black/70"
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-white" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
