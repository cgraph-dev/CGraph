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
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
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
        className={`p-2 rounded-lg transition-colors ${
          forum.userVote === 1
            ? 'bg-green-500/20 text-green-500'
            : 'hover:bg-dark-600 text-gray-400'
        }`}
      >
        {forum.userVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <span
        className={`font-bold text-lg ${
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
        className={`p-2 rounded-lg transition-colors ${
          forum.userVote === -1
            ? 'bg-red-500/20 text-red-500'
            : 'hover:bg-dark-600 text-gray-400'
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isMember
            ? 'bg-dark-600 text-gray-300 hover:bg-red-500/20 hover:text-red-400'
            : ''
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
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-dark-600 text-gray-400 hover:text-white'
        }`}
        title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      >
        {isSubscribed ? (
          <BellSlashIcon className="h-5 w-5" />
        ) : (
          <BellIcon className="h-5 w-5" />
        )}
      </motion.button>

      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-2 rounded-lg bg-dark-600 text-gray-400 hover:text-white"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-1 w-48 bg-dark-700 rounded-lg shadow-xl border border-dark-600 py-1 z-50"
            >
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
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
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
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
          <div className="relative group">
            {forum.iconUrl ? (
              <img
                src={forum.iconUrl}
                alt={forum.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
              >
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{forum.name}</h2>
            <p className="text-sm text-gray-400">{formatNumber(forum.memberCount)} members</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={isJoining}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
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
        <div className="relative h-64 md:h-80 overflow-hidden rounded-b-3xl">
          {forum.bannerUrl ? (
            <img
              src={forum.bannerUrl}
              alt={`${forum.name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
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
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-dark-800/80 backdrop-blur-sm rounded-lg text-sm hover:bg-dark-700"
            >
              <PhotoIcon className="h-4 w-4" />
              Edit Banner
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="relative -mt-24 px-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Forum Icon */}
            <div className="relative group">
              {forum.iconUrl ? (
                <img
                  src={forum.iconUrl}
                  alt={forum.name}
                  className="h-32 w-32 rounded-2xl object-cover border-4 border-dark-900 shadow-xl"
                />
              ) : (
                <div
                  className="h-32 w-32 rounded-2xl flex items-center justify-center text-4xl font-bold border-4 border-dark-900 shadow-xl"
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
                  className="absolute -bottom-2 -right-2 p-2 bg-dark-700 rounded-full border border-dark-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <PencilIcon className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-4">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{forum.name}</h1>
                  {forum.description && (
                    <p className="text-gray-400 max-w-2xl">{forum.description}</p>
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
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Vote Buttons */}
          {onVote && renderVoteButtons()}

          {/* Forum Icon */}
          <div className="relative group flex-shrink-0">
            {forum.iconUrl ? (
              <img
                src={forum.iconUrl}
                alt={forum.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
              >
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">{forum.name}</h1>
            {forum.description && (
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{forum.description}</p>
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
