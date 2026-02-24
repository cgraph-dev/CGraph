/**
 * Search result components
 * @module pages/search/search/result-components
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type {
  ResultSectionProps,
  UserResultProps,
  GroupResultProps,
  ForumResultProps,
  PostResultProps,
  MessageResultProps,
} from './types';
import { tweens, springs } from '@/lib/animation-presets';

/**
 * Wrapper component for search result sections
 */
export function ResultSection({
  title,
  count,
  children,
  onViewAll,
  showViewAll,
}: ResultSectionProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
          {title} <span className="text-gray-500">({count})</span>
        </h3>
        {showViewAll && onViewAll && (
          <motion.button
            onClick={() => {
              onViewAll();
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            View all →
          </motion.button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * User search result card
 */
export function UserResult({ user, onClick }: UserResultProps) {
  const displayName = user.displayName || user.username || 'Unknown User';
  const handle = user.username || user.id.slice(0, 8);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />
        <div className="relative z-10 flex items-center gap-3 p-3 text-left">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={springs.snappy}
          >
            {user.avatarUrl ? (
              <div className="rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-0.5">
                <ThemedAvatar
                  src={user.avatarUrl}
                  alt={displayName}
                  size="small"
                  className="h-10 w-10"
                  avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white">
                {initial}
              </div>
            )}
          </motion.div>
          <div>
            <p className="bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent">
              {displayName}
            </p>
            <p className="text-sm text-gray-400">@{handle}</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

/**
 * Group search result card
 */
export function GroupResult({ group, onClick }: GroupResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />
        <div className="relative z-10 flex items-center gap-3 p-3 text-left">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={springs.snappy}
          >
            {group.iconUrl ? (
              <img
                src={group.iconUrl}
                alt={group.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="from-secondary-600 to-secondary-700 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br font-medium text-white">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent">
              {group.name}
            </p>
            <p className="text-sm text-gray-400">{group.memberCount} members</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

/**
 * Forum search result card
 */
export function ForumResult({ forum, onClick }: ForumResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />
        <div className="relative z-10 flex items-center gap-3 p-3 text-left">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={springs.snappy}
          >
            {forum.iconUrl ? (
              <img
                src={forum.iconUrl}
                alt={forum.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-700 font-medium text-white">
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent">
              {forum.name}
            </p>
            <p className="text-sm text-gray-400">{forum.postCount} posts</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

/**
 * Post search result card
 */
export function PostResult({ post, onClick }: PostResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />
        <div className="relative z-10 p-3 text-left">
          <p className="line-clamp-1 bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent">
            {post.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-400">{post.content}</p>
          <p className="mt-2 text-xs text-gray-500">
            by @{post.author.username || 'unknown'} in c/{post.forumSlug}
          </p>
        </div>
      </GlassCard>
    </motion.button>
  );
}

/**
 * Message search result card
 */
export function MessageResult({ message, onClick }: MessageResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />
        <div className="relative z-10 p-3 text-left">
          <p className="line-clamp-2 text-sm text-gray-300">{message.content}</p>
          <p className="mt-2 text-xs text-gray-500">from @{message.sender.username || 'unknown'}</p>
        </div>
      </GlassCard>
    </motion.button>
  );
}
