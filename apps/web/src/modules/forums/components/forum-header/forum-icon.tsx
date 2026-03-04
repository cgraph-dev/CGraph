/**
 * Forum Icon Component
 *
 * Forum avatar/icon with edit capability
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { PencilIcon } from '@heroicons/react/24/outline';
import type { ForumIconProps } from './types';

const SIZE_CLASSES = {
  sm: 'h-12 w-12 rounded-xl text-lg',
  md: 'h-16 w-16 rounded-xl text-2xl',
  lg: 'h-32 w-32 rounded-2xl text-4xl border-4 border-dark-900 shadow-xl',
} as const;

const IMG_SIZE_CLASSES = {
  sm: 'h-12 w-12 rounded-xl',
  md: 'h-16 w-16 rounded-xl',
  lg: 'h-32 w-32 rounded-2xl border-4 border-dark-900 shadow-xl',
} as const;

export const ForumIcon = memo(function ForumIcon({
  iconUrl,
  name,
  primaryColor,
  size = 'md',
  canManage = false,
  onEditIcon,
}: ForumIconProps) {
  return (
    <div className="group relative flex-shrink-0">
      {iconUrl ? (
        <img src={iconUrl} alt={name} className={`object-cover ${IMG_SIZE_CLASSES[size]}`} />
      ) : (
        <div
          className={`flex items-center justify-center font-bold ${SIZE_CLASSES[size]}`}
          style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {canManage && onEditIcon && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEditIcon}
          className="absolute -bottom-2 -right-2 rounded-full border border-white/[0.08] bg-white/[0.06] p-2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <PencilIcon className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
});
