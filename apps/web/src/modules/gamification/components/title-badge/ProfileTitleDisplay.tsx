/**
 * ProfileTitleDisplay Component
 *
 * Displays a user's title on their profile with optional edit capability.
 */

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { TitleBadge } from './TitleBadge';
import type { ProfileTitleDisplayProps } from './types';

export function ProfileTitleDisplay({
  titleId,
  onChangeTitle,
  isEditable = false,
  className,
}: ProfileTitleDisplayProps) {
  if (!titleId) {
    if (isEditable) {
      return (
        <motion.button
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5',
            'border border-dashed border-gray-600 text-xs text-gray-500',
            'transition-colors hover:border-primary-500/50 hover:text-primary-400',
            className
          )}
          onClick={onChangeTitle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SparklesIcon className="h-3 w-3" />
          <span>Set Title</span>
        </motion.button>
      );
    }
    return null;
  }

  return (
    <TitleBadge
      title={titleId}
      size="sm"
      onClick={isEditable ? onChangeTitle : undefined}
      className={className}
    />
  );
}
