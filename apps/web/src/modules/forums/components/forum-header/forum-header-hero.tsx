/**
 * Forum Header Hero Variant
 *
 * Large banner-style header for forum pages
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { ForumIcon } from './forum-icon';
import { ForumStats } from './forum-stats';
import { VoteButtons } from './vote-buttons';
import { ForumActions } from './forum-actions';
import type { Forum, ForumActionsProps, VoteButtonsProps } from './types';

interface ForumHeaderHeroProps {
  forum: Forum;
  primaryColor: string;
  canManage: boolean;
  onEditBanner?: () => void;
  onEditIcon?: () => void;
  onVote?: (value: 1 | -1) => void;
  voteProps?: VoteButtonsProps;
  actionsProps: ForumActionsProps;
  className?: string;
}

export const ForumHeaderHero = memo(function ForumHeaderHero({
  forum,
  primaryColor,
  canManage,
  onEditBanner,
  onEditIcon,
  onVote,
  voteProps,
  actionsProps,
  className = '',
}: ForumHeaderHeroProps) {
  const { theme } = useThemeStore();

  return (
    <div className={`relative ${className}`}>
      {/* Banner */}
      <div className="relative h-64 overflow-hidden rounded-b-3xl md:h-80">
        {forum.bannerUrl ? (
          <img
            src={forum.bannerUrl}
            alt={`${forum.name} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${THEME_COLORS[theme.colorPreset]?.secondary || '#059669'}40 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />

        {/* Edit Banner Button */}
        {canManage && onEditBanner && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEditBanner}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-dark-800/80 px-4 py-2 text-sm backdrop-blur-sm hover:bg-dark-700"
          >
            <PhotoIcon className="h-4 w-4" />
            Edit Banner
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="relative -mt-24 px-6">
        <div className="flex flex-col items-start gap-6 md:flex-row">
          {/* Forum Icon */}
          <ForumIcon
            iconUrl={forum.iconUrl}
            name={forum.name}
            primaryColor={primaryColor}
            size="lg"
            canManage={canManage}
            onEditIcon={onEditIcon}
          />

          {/* Info */}
          <div className="min-w-0 flex-1 pt-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold">{forum.name}</h1>
                {forum.description && (
                  <p className="max-w-2xl text-gray-400">{forum.description}</p>
                )}
                <div className="mt-3">
                  <ForumStats memberCount={forum.memberCount} featured={forum.featured} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {onVote && voteProps && <VoteButtons {...voteProps} />}
                <ForumActions {...actionsProps} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
