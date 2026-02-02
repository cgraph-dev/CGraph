import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  BellIcon,
  BellSlashIcon,
  ShareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  StarIcon,
  PhotoIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// Reserved for future features
const _reservedForumHeader = { React, useRef, DocumentTextIcon, ChatBubbleLeftIcon, StarIcon };
void _reservedForumHeader;
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import type { Forum } from '@/stores/forumStore';

/**
 * ForumHeader Component
 *
 * Forum header with banner and key information:
 * - Customizable banner image
 * - Forum icon with upload option
 * - Forum name and description
 * - Subscribe/join button
 * - Vote buttons (for forum competition)
 * - Member count and stats
 * - Admin/settings access
 * - Share functionality
 * - Custom CSS support
 */

interface ForumHeaderProps {
  forum: Forum;
  onVote?: (value: 1 | -1 | null) => Promise<void>;
  onSubscribe?: () => Promise<void>;
  onJoin?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onShare?: () => void;
  onSettings?: () => void;
  onEditBanner?: () => void;
  onEditIcon?: () => void;
  onCreatePost?: () => void;
  isSubscribed?: boolean;
  isMember?: boolean;
  canManage?: boolean;
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

export function ForumHeader({
  forum,
  onVote,
  onSubscribe,
  onJoin,
  onLeave,
  onShare,
  onSettings,
  onEditBanner,
  onEditIcon,
  onCreatePost,
  isSubscribed = false,
  isMember = false,
  canManage = false,
  variant = 'default',
  className = '',
}: ForumHeaderProps) {
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!onVote || isVoting) return;
    setIsVoting(true);
    HapticFeedback.medium();
    try {
      const newValue = forum.userVote === value ? null : value;
      await onVote(newValue);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubscribe = async () => {
    if (!onSubscribe || isSubscribing) return;
    setIsSubscribing(true);
    HapticFeedback.success();
    try {
      await onSubscribe();
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    HapticFeedback.success();
    try {
      if (isMember && onLeave) {
        await onLeave();
      } else if (onJoin) {
        await onJoin();
      }
    } finally {
      setIsJoining(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    HapticFeedback.success();
    onShare?.();
    setShowMoreMenu(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderVoteButtons = () => (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          forum.userVote === 1
            ? 'bg-green-500/20 text-green-500'
            : 'text-gray-400 hover:bg-dark-600'
        }`}
      >
        {forum.userVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <span
        className={`text-lg font-bold ${
          forum.score > 0 ? 'text-green-500' : forum.score < 0 ? 'text-red-500' : 'text-gray-400'
        }`}
      >
        {formatNumber(forum.score)}
      </span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          forum.userVote === -1 ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:bg-dark-600'
        }`}
      >
        {forum.userVote === -1 ? (
          <ArrowDownIconSolid className="h-6 w-6" />
        ) : (
          <ArrowDownIcon className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );

  const renderStats = () => (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-gray-400">
        <UserGroupIcon className="h-5 w-5" />
        <span>
          <span className="font-medium text-white">{formatNumber(forum.memberCount)}</span> members
        </span>
      </div>
      {forum.featured && (
        <div className="flex items-center gap-1.5 text-amber-500">
          <StarIconSolid className="h-5 w-5" />
          <span className="font-medium">Featured</span>
        </div>
      )}
    </div>
  );

  const renderActions = () => (
    <div className="flex items-center gap-3">
      {onCreatePost && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreatePost}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="h-5 w-5" />
          Create Post
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleJoin}
        disabled={isJoining}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          isMember ? 'bg-dark-600 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : ''
        }`}
        style={!isMember ? { backgroundColor: primaryColor } : {}}
      >
        <UserGroupIcon className="h-5 w-5" />
        {isMember ? 'Leave' : 'Join'}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubscribe}
        disabled={isSubscribing}
        className={`rounded-lg p-2 transition-colors ${
          isSubscribed
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-dark-600 text-gray-400 hover:text-white'
        }`}
        title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      >
        {isSubscribed ? <BellSlashIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
      </motion.button>

      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="rounded-lg bg-dark-600 p-2 text-gray-400 hover:text-white"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
            >
              <button
                onClick={copyLink}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
              {canManage && (
                <button
                  onClick={() => {
                    onSettings?.();
                    setShowMoreMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Settings
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Compact variant for sidebar/list views
  if (variant === 'compact') {
    return (
      <GlassCard variant="frosted" className={`p-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="group relative">
            {forum.iconUrl ? (
              <img
                src={forum.iconUrl}
                alt={forum.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
              >
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{forum.name}</h2>
            <p className="text-sm text-gray-400">{formatNumber(forum.memberCount)} members</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={isJoining}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              isMember ? 'bg-dark-600 text-gray-300' : ''
            }`}
            style={!isMember ? { backgroundColor: primaryColor } : {}}
          >
            {isMember ? 'Joined' : 'Join'}
          </motion.button>
        </div>
      </GlassCard>
    );
  }

  // Hero variant with large banner
  if (variant === 'hero') {
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
            <div className="group relative">
              {forum.iconUrl ? (
                <img
                  src={forum.iconUrl}
                  alt={forum.name}
                  className="h-32 w-32 rounded-2xl border-4 border-dark-900 object-cover shadow-xl"
                />
              ) : (
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-dark-900 text-4xl font-bold shadow-xl"
                  style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                >
                  {forum.name.charAt(0).toUpperCase()}
                </div>
              )}

              {canManage && onEditIcon && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onEditIcon}
                  className="absolute -bottom-2 -right-2 rounded-full border border-dark-600 bg-dark-700 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <PencilIcon className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 pt-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex-1">
                  <h1 className="mb-2 text-3xl font-bold">{forum.name}</h1>
                  {forum.description && (
                    <p className="max-w-2xl text-gray-400">{forum.description}</p>
                  )}
                  <div className="mt-3">{renderStats()}</div>
                </div>

                <div className="flex items-center gap-4">
                  {onVote && renderVoteButtons()}
                  {renderActions()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <GlassCard variant="frosted" className={`overflow-hidden ${className}`}>
      {/* Banner */}
      {forum.bannerUrl && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={forum.bannerUrl}
            alt={`${forum.name} banner`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Vote Buttons */}
          {onVote && renderVoteButtons()}

          {/* Forum Icon */}
          <div className="group relative flex-shrink-0">
            {forum.iconUrl ? (
              <img
                src={forum.iconUrl}
                alt={forum.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
              >
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 text-2xl font-bold">{forum.name}</h1>
            {forum.description && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-400">{forum.description}</p>
            )}
            {renderStats()}
          </div>

          {/* Actions */}
          {renderActions()}
        </div>
      </div>
    </GlassCard>
  );
}

export default ForumHeader;
