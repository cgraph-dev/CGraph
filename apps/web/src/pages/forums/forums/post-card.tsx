/**
 * PostCard component for displaying individual forum posts
 * @module pages/forums/forums/post-card
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import ThreadPrefix from '@/modules/forums/components/thread-prefix';
import ThreadRating from '@/modules/forums/components/thread-rating';
import { getVoteScoreClass } from './constants';
import type { PostCardProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';

/**
 * unknown for the forums module.
 */
/**
 * Post Card display component.
 */
export function PostCard({ post, onVote }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={springs.bouncy}
    >
      <GlassCard variant="crystal" className="group relative overflow-hidden">
        {/* Hover gradient glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />

        <div className="relative z-10 flex">
          {/* Vote sidebar - Enhanced */}
          <div className="flex flex-col items-center gap-1 rounded-l-lg bg-dark-700/50 p-3 backdrop-blur-sm">
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(1);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded p-1 transition-colors ${
                post.myVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
              style={{
                filter: post.myVote === 1 ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' : 'none',
              }}
            >
              {post.myVote === 1 ? (
                <ArrowUpIconSolid className="h-5 w-5" />
              ) : (
                <ArrowUpIcon className="h-5 w-5" />
              )}
            </motion.button>
            <motion.span
              key={post.score}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-bold ${getVoteScoreClass(post.myVote)}`}
            >
              {post.score}
            </motion.span>
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(-1);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded p-1 transition-colors ${
                post.myVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
              }`}
              style={{
                filter:
                  post.myVote === -1 ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none',
              }}
            >
              {post.myVote === -1 ? (
                <ArrowDownIconSolid className="h-5 w-5" />
              ) : (
                <ArrowDownIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            {/* Meta */}
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <Link
                to={`/forums/${post.forum.slug}`}
                className="flex items-center gap-1 hover:underline"
              >
                <div className="h-5 w-5 overflow-hidden rounded-full bg-dark-600">
                  {post.forum.iconUrl ? (
                    <img src={post.forum.iconUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px]">{post.forum.name.charAt(0)}</span>
                  )}
                </div>
                <span className="font-medium text-gray-300">c/{post.forum.slug}</span>
              </Link>
              <span>•</span>
              <span>
                Posted by{' '}
                <Link
                  to={post.author.username ? `/u/${post.author.username}` : '#'}
                  className="hover:underline"
                >
                  u/{post.author.username || post.author.displayName || 'unknown'}
                </Link>
              </span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>

            {/* Title */}
            <Link to={`/forums/${post.forum.slug}/post/${post.id}`}>
              <div className="mb-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {post.isPinned && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-green-600 px-1.5 py-0.5 text-xs">
                      📌 Pinned
                    </span>
                  )}
                  {post.isLocked && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-yellow-600 px-1.5 py-0.5 text-xs">
                      <LockClosedIcon className="h-3 w-3" /> Locked
                    </span>
                  )}
                  {post.isNsfw && (
                    <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-xs">
                      NSFW
                    </span>
                  )}
                  {post.category && (
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-xs"
                      style={{ backgroundColor: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  {post.prefix && <ThreadPrefix prefix={post.prefix} size="sm" />}
                </div>
                <h2 className="text-lg font-medium text-white transition-colors hover:text-primary-400">
                  {post.title}
                </h2>
              </div>
            </Link>

            {/* Preview content */}
            {post.postType === 'text' && post.content && (
              <p className="mb-3 line-clamp-3 text-sm text-gray-400">{post.content}</p>
            )}

            {post.postType === 'link' && post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block truncate text-sm text-primary-400 hover:underline"
              >
                {post.linkUrl}
              </a>
            )}

            {post.postType === 'image' && post.mediaUrls?.[0] && (
              <div className="mb-3 max-h-96 overflow-hidden rounded-lg">
                <img src={post.mediaUrls[0]} alt="" className="h-auto max-w-full object-contain" />
              </div>
            )}

            {/* Thread Rating */}
            {(post.rating !== undefined || post.ratingCount !== undefined) && (
              <div className="mb-3">
                <ThreadRating
                  threadId={post.id}
                  rating={post.rating}
                  ratingCount={post.ratingCount}
                  myRating={post.myRating}
                  size="sm"
                  interactive={false}
                />
              </div>
            )}

            {/* Actions - Enhanced */}
            <div className="flex items-center gap-4 text-gray-400">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={`/forums/${post.forum.slug}/post/${post.id}`}
                  onClick={() => HapticFeedback.light()}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-primary-400"
                  style={{
                    boxShadow: '0 0 0 rgba(16, 185, 129, 0)',
                    transition: 'box-shadow 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 rgba(16, 185, 129, 0)';
                  }}
                >
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{post.commentCount} Comments</span>
                </Link>
              </motion.div>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-purple-400"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </motion.button>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-yellow-400"
              >
                <BookmarkIcon className="h-4 w-4" />
                <span>Save</span>
              </motion.button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
