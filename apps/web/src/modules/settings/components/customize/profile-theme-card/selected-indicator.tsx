/**
 * Selected theme indicator component.
 * @module
 */
import { motion } from 'motion/react';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface SelectedIndicatorProps {
  theme: ProfileThemeConfig;
}

/**
 * Selected Indicator component.
 */
export default function SelectedIndicator({ theme }: SelectedIndicatorProps) {
  return (
    <>
      {/* Corner brackets */}
      <motion.div
        className="absolute left-1 top-1 h-4 w-4 rounded-tl-lg border-l-2 border-t-2"
        style={{ borderColor: theme.accentPrimary }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      />
      <motion.div
        className="absolute right-1 top-1 h-4 w-4 rounded-tr-lg border-r-2 border-t-2"
        style={{ borderColor: theme.accentPrimary }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      />
      <motion.div
        className="absolute bottom-1 left-1 h-4 w-4 rounded-bl-lg border-b-2 border-l-2"
        style={{ borderColor: theme.accentPrimary }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      />
      <motion.div
        className="absolute bottom-1 right-1 h-4 w-4 rounded-br-lg border-b-2 border-r-2"
        style={{ borderColor: theme.accentPrimary }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      />

      {/* Checkmark badge */}
      <motion.div
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
        style={{
          backgroundColor: theme.accentPrimary,
          boxShadow: `0 0 15px ${theme.accentPrimary}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <CheckIcon className="h-4 w-4 text-white" />
      </motion.div>
    </>
  );
}
