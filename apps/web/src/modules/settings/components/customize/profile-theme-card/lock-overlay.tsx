/**
 * Locked theme card overlay component.
 * @module
 */
import { motion } from 'motion/react';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface LockOverlayProps {
  theme: ProfileThemeConfig;
}

/**
 * Lock Overlay component.
 */
export default function LockOverlay({ theme }: LockOverlayProps) {
  if (theme.unlocked) return null;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <LockClosedIcon className="mb-2 h-8 w-8 text-white/70" />
      <span className="text-xs font-medium text-white/80">
        {theme.unlockLevel ? `Level ${theme.unlockLevel}` : 'Locked'}
      </span>
      {theme.unlockRequirement && (
        <span className="mt-1 px-4 text-center text-[10px] text-white/60">
          {theme.unlockRequirement}
        </span>
      )}
    </motion.div>
  );
}
