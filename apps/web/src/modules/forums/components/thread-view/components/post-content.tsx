/**
 * PostContent Component
 *
 * Main post body: meta badges, title, author, sanitized HTML content,
 * poll placeholder, stats bar, action buttons, and comment form.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { formatTimeAgo } from '@/lib/utils';
import { UserStars } from '@/modules/gamification/components/user-stars';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { Post } from '@/modules/forums/store';
// Import siblings directly to avoid circular dep through barrel
import { PrefixBadge } from './prefix-badge';
import { RatingStars } from './rating-stars';
import { ShareMenu } from './share-menu';
import { MoreMenu } from './more-menu';
import { CommentForm } from './comment-form';

interface PostContentProps {
  post: Post;
  primaryColor: string;
  isBookmarked: boolean;
  canModerate: boolean;
  canEdit: boolean;
  variant: string;
  hoveredRating: number;
  setHoveredRating: (r: number) => void;
  onRate: (r: number) => void;
  onBookmark?: () => Promise<void>;
  onEdit?: () => void;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
  showCommentForm: boolean;
  setShowCommentForm: (v: boolean) => void;
  commentContent: string;
  setCommentContent: (v: string) => void;
  isSubmitting: boolean;
  onSubmitComment: () => void;
}

export function PostContent({
  post,
  primaryColor,
  isBookmarked,
  canModerate,
  canEdit,
  variant,
  hoveredRating,
  setHoveredRating,
  onRate,
  onBookmark,
  onEdit,
  onPin,
  onLock,
  onDelete,
  onReport,
  showCommentForm,
  setShowCommentForm,
  commentContent,
  setCommentContent,
  isSubmitting,
  onSubmitComment,
}: PostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className="min-w-0 flex-1">
      {/* Meta Info */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {post.prefix && <PrefixBadge prefix={post.prefix} />}
        {post.isPinned && (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <MapPinIcon className="h-3.5 w-3.5" />
            Pinned
          </span>
        )}
        {post.isLocked && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <LockClosedIcon className="h-3.5 w-3.5" />
            Locked
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-3 text-2xl font-bold">{post.title}</h1>

      {/* Author Info */}
      <div className="mb-4 flex items-center gap-3">
        <ThemedAvatar
          src={post.author.avatarUrl}
          alt={post.author.displayName || post.author.username || 'User'}
          size="medium"
          avatarBorderId={post.author.avatarBorderId ?? post.author.avatar_border_id ?? null}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{post.author.displayName || post.author.username}</span>
            {post.author.reputation !== undefined && (
              <>
                <UserStars postCount={post.author.reputation} size="xs" showLabel={false} />
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-400">
                  {post.author.reputation} karma
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {formatTimeAgo(post.createdAt)}
            {post.editedAt && <span className="ml-2">• edited {formatTimeAgo(post.editedAt)}</span>}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={`prose prose-invert max-w-none ${!isExpanded && variant !== 'expanded' ? 'relative max-h-96 overflow-hidden' : ''}`}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content, { USE_PROFILES: { html: true } }),
          }}
        />
        {!isExpanded && variant !== 'expanded' && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-800 to-transparent" />
        )}
      </div>

      {variant !== 'expanded' && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-sm hover:underline"
          style={{ color: primaryColor }}
        >
          {isExpanded ? (
            <>
              <ArrowsPointingInIcon className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ArrowsPointingOutIcon className="h-4 w-4" />
              Show more
            </>
          )}
        </button>
      )}

      {/* Poll if present */}
      {post.poll && (
        <div className="mt-4 rounded-lg border border-dark-600 bg-dark-700/50 p-4">
          <h3 className="mb-3 font-medium">{post.poll.question}</h3>
        </div>
      )}

      {/* Stats Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-dark-700 pt-4 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <EyeIcon className="h-4 w-4" />
          {post.views.toLocaleString()} views
        </span>
        <span className="flex items-center gap-1">
          <ChatBubbleLeftIcon className="h-4 w-4" />
          {post.commentCount} comments
        </span>
        <RatingStars
          rating={post.rating ?? undefined}
          myRating={post.myRating ?? undefined}
          ratingCount={post.ratingCount ?? undefined}
          primaryColor={primaryColor}
          hoveredRating={hoveredRating}
          setHoveredRating={setHoveredRating}
          onRate={onRate}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          Reply
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBookmark}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
            isBookmarked
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
        >
          {isBookmarked ? (
            <BookmarkIconSolid className="h-4 w-4" />
          ) : (
            <BookmarkIcon className="h-4 w-4" />
          )}
          {isBookmarked ? 'Saved' : 'Save'}
        </motion.button>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 rounded-lg bg-dark-600 px-4 py-2 text-sm text-gray-300 hover:bg-dark-500"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </motion.button>
          <ShareMenu
            isOpen={showShareMenu}
            onClose={() => setShowShareMenu(false)}
            postTitle={post.title}
          />
        </div>

        {(canModerate || canEdit) && (
          <div className="relative ml-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="rounded-lg bg-dark-600 p-2 text-gray-300 hover:bg-dark-500"
            >
              •••
            </motion.button>
            <MoreMenu
              isOpen={showMoreMenu}
              onClose={() => setShowMoreMenu(false)}
              post={post}
              canEdit={canEdit}
              canModerate={canModerate}
              onEdit={onEdit}
              onPin={onPin}
              onLock={onLock}
              onDelete={onDelete}
              onReport={onReport}
            />
          </div>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm
        isOpen={showCommentForm}
        content={commentContent}
        setContent={setCommentContent}
        isSubmitting={isSubmitting}
        primaryColor={primaryColor}
        onSubmit={onSubmitComment}
        onCancel={() => setShowCommentForm(false)}
      />
    </div>
  );
}
