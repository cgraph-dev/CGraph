/**
 * AvatarLightbox — Click-to-zoom fullscreen avatar viewer
 *
 * Animated overlay for viewing profile photos at full size.
 * Uses framer-motion layoutId for smooth zoom-from-thumbnail transition.
 *
 * @module shared/components/AvatarLightbox
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { tweens, springs } from '@/lib/animation-presets';

interface AvatarLightboxProps {
  /** Avatar image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Thumbnail size class (rendered inline) */
  thumbnailClassName?: string;
  /** Additional wrapper class */
  className?: string;
}

/**
 * Wraps an avatar image with click-to-zoom-fullscreen behavior.
 *
 * Usage:
 * ```tsx
 * <AvatarLightbox
 *   src={user.avatarUrl}
 *   alt={user.displayName}
 *   thumbnailClassName="h-24 w-24 rounded-full"
 * />
 * ```
 */
export function AvatarLightbox({
  src,
  alt,
  thumbnailClassName = 'h-16 w-16 rounded-full',
  className = '',
}: AvatarLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      {/* Thumbnail — clickable */}
      <motion.button
        className={`cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${thumbnailClassName} ${className}`}
        onClick={open}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        layoutId="avatar-lightbox-image"
        aria-label={`View ${alt}'s photo`}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
      </motion.button>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tweens.fast}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Close button */}
            <motion.button
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(30,32,40)]/[0.72] text-gray-300 backdrop-blur-[12px] transition-colors hover:bg-white/[0.12] hover:text-white"
              onClick={close}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={tweens.fast}
              aria-label="Close photo viewer"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>

            {/* Full-size image with layout animation */}
            <motion.div
              className="relative max-h-[80vh] max-w-[80vw] cursor-zoom-out overflow-hidden rounded-2xl shadow-2xl"
              layoutId="avatar-lightbox-image"
              onClick={close}
              transition={springs.stiff}
            >
              <img
                src={src}
                alt={alt}
                className="h-auto max-h-[80vh] w-auto max-w-[80vw] object-contain"
                draggable={false}
              />
            </motion.div>

            {/* Name label */}
            <motion.p
              className="absolute bottom-6 text-sm font-medium text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
            >
              {alt}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
