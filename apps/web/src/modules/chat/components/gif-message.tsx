/**
 * GifMessage Component
 *
 * Displays GIF messages in conversations.
 * Handles GIF loading, aspect ratio, and click-to-expand functionality.
 *
 * @version 0.9.5
 * @since 2026-01-26
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import type { Message } from '@/modules/chat/store';
import { tweens, loop } from '@/lib/animation-presets';

export interface GifMessageProps {
  message: Message;
  isOwnMessage: boolean;
  className?: string;
}

/**
 * GifMessage Component
 *
 * Renders a GIF message with:
 * - Lazy loading
 * - Aspect ratio preservation
 * - Click to expand fullscreen
 * - Loading state
 * - Error fallback
 */
export function GifMessage({
  message,
  isOwnMessage: _isOwnMessage,
  className = '',
}: GifMessageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Extract GIF metadata

   
  const gifUrl = (message.metadata?.gifUrl as string) || message.metadata?.url || message.content; // type assertion: message metadata field

   
  const gifPreviewUrl = message.metadata?.gifPreviewUrl as string; // type assertion: message metadata field

   
  const gifTitle = (message.metadata?.gifTitle as string) || 'GIF'; // type assertion: message metadata field

   
  const gifWidth = message.metadata?.gifWidth as number; // type assertion: message metadata field

   
  const gifHeight = message.metadata?.gifHeight as number; // type assertion: message metadata field

  // Calculate aspect ratio for proper sizing
  const aspectRatio = gifWidth && gifHeight ? gifWidth / gifHeight : 1;
  const maxWidth = 400;
  const maxHeight = 300;

  // Calculate display dimensions while preserving aspect ratio
  let displayWidth = gifWidth || maxWidth;
  let displayHeight = gifHeight || maxHeight;

  if (displayWidth > maxWidth) {
    displayWidth = maxWidth;
    displayHeight = displayWidth / aspectRatio;
  }

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClick = () => {
    if (!hasError) {
      setShowFullscreen(true);
    }
  };

  if (!gifUrl) {
    return (
      <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
        <p>GIF data missing</p>
      </div>
    );
  }

  return (
    <>
      {/* GIF Display */}
      <div className={`relative ${className}`}>
        {/* Loading State */}
        {isLoading && !hasError && (
          <div
            className="flex items-center justify-center rounded-lg bg-white/[0.06]"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              minWidth: '200px',
              minHeight: '150px',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={loop(tweens.slow)}
              className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
            />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-400">Failed to load GIF</p>
            <p className="mt-1 text-xs text-gray-500">{gifTitle}</p>
          </div>
        )}

        {/* GIF Image */}
        {!hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isLoading ? 0 : 1, scale: 1 }}
            transition={tweens.standard}
            className="group relative cursor-pointer overflow-hidden rounded-lg"
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={gifPreviewUrl || gifUrl}
              alt={gifTitle}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="rounded-lg object-cover transition-opacity"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                maxWidth: '100%',
              }}
              loading="lazy"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                className="rounded-full bg-white/20 p-3 backdrop-blur-sm"
              >
                <ArrowsPointingOutIcon className="h-6 w-6 text-white" />
              </motion.div>
            </div>

            {/* GIF Badge */}
            <div className="absolute left-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              GIF
            </div>
          </motion.div>
        )}

        {/* GIF Title (optional, below image) */}
        {gifTitle && gifTitle !== 'GIF' && !isLoading && !hasError && (
          <p className="mt-1 text-xs text-gray-400">{gifTitle}</p>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setShowFullscreen(false)}
                className="absolute -right-4 -top-4 rounded-full bg-red-500 p-2 text-white shadow-lg transition-transform hover:scale-110"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>

              {/* Full Size GIF */}
              <img
                src={gifUrl}
                alt={gifTitle}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              />

              {/* GIF Info */}
              <div className="bg-white/[0.04]/90 mt-4 rounded-lg p-3 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-white">{gifTitle}</p>
                {gifWidth && gifHeight && (
                  <p className="mt-1 text-xs text-gray-400">
                    {gifWidth} × {gifHeight}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default GifMessage;
