/**
 * Server Banner — Optional banner image below server header
 *
 * Gradient overlay at bottom for text readability.
 * Only rendered when server has a banner set.
 *
 * @module modules/groups/components/server-banner
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ServerBannerProps {
  imageUrl: string;
  /** Optional alt text */
  alt?: string;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function ServerBanner({ imageUrl, alt = 'Server banner', className }: ServerBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('relative h-[105px] w-full overflow-hidden', className)}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {/* Gradient overlay — fade to sidebar background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: 'linear-gradient(to bottom, transparent, #2b2d31)',
        }}
      />

      {/* Optional invite splash style gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(43, 45, 49, 0) 60%, rgba(43, 45, 49, 0.8) 100%)',
        }}
      />
    </motion.div>
  );
}

export default ServerBanner;
