/**
 * ThreadView Component
 *
 * Comprehensive thread viewing experience with:
 * - Original post display with full content
 * - Virtualized comment list for performance
 * - Thread prefix badges
 * - Poll integration
 * - Rating system
 * - View counter
 * - Bookmark/subscribe functionality
 * - Share options
 * - Reply quick-action
 * - Moderation actions for privileged users
 * - View mode toggle (linear/threaded)
 * - User stars/post count indicators
 * - Export/print functionality
 *
 * @module modules/forums/components/thread-view
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { UserStars } from '@/modules/gamification/components/UserStars';
import { ThreadedCommentTree } from '../ThreadedCommentTree';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

import type { ThreadViewProps } from './types';
import {
  useViewMode,
  useSortedComments,
  useCommentVirtualizer,
  useReplyHandler,
  useVoteHandlers,
  useRating,
} from './hooks';
import {
  PrefixBadge,
  RatingStars,
  ShareMenu,
  MoreMenu,
  CommentForm,
  CommentCard,
  ViewModeToggle,
  ThreadLoadingSkeleton,
  EmptyCommentsState,
  ReplyIndicator,
} from './components';

export function ThreadView({
  post,
  comments,
  isLoading = false,
  onVote,
  onComment,
  onBookmark,
  onShare: _onShare,
  onSubscribe: _onSubscribe,
  onRate,
  onPin,
  onLock,
  onDelete,
  onEdit,
  onReport,
  onExport,
  onMarkBestAnswer,
  isBookmarked = false,
  isSubscribed: _isSubscribed = false,
  canModerate = false,
  canEdit = false,
  canMarkBestAnswer = false,
  variant = 'default',
  defaultViewMode = 'linear',
}: ThreadViewProps) {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  // State hooks
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom hooks
  const { viewMode, handleViewModeChange } = useViewMode(defaultViewMode);
  const sortedComments = useSortedComments(comments);
  const { parentRef, rowVirtualizer } = useCommentVirtualizer(sortedComments);
  const { replyToId, handleReplyTo, setReplyToId } = useReplyHandler();
  const { handlePostVote, handleCommentVote, handleThreadedVote } = useVoteHandlers(
    onVote,
    post.id,
    post.myVote
  );
  const { hoveredRating, setHoveredRating, handleRate } = useRating(onRate);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComment(commentContent.trim(), replyToId);
      setCommentContent('');
      setShowCommentForm(false);
      setReplyToId(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ThreadLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Post Card */}
      <GlassCard variant="frosted" className="mb-4 p-6">
        <div className="flex items-start gap-4">
          {/* Vote Sidebar */}
          <div className="flex min-w-[60px] flex-col items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePostVote(1)}
              className={`rounded p-1 ${post.myVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}
            >
              {post.myVote === 1 ? (
                <ArrowUpIconSolid className="h-6 w-6" />
              ) : (
                <ArrowUpIcon className="h-6 w-6" />
              )}
            </motion.button>
            <span
              className="text-lg font-bold"
              style={{ color: post.score > 0 ? '#22c55e' : post.score < 0 ? '#ef4444' : 'inherit' }}
            >
              {post.score}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePostVote(-1)}
              className={`rounded p-1 ${post.myVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              {post.myVote === -1 ? (
                <ArrowDownIconSolid className="h-6 w-6" />
              ) : (
                <ArrowDownIcon className="h-6 w-6" />
              )}
            </motion.button>
          </div>

          {/* Post Content */}
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
                  <span className="font-medium">
                    {post.author.displayName || post.author.username}
                  </span>
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
                  {post.editedAt && (
                    <span className="ml-2">• edited {formatTimeAgo(post.editedAt)}</span>
                  )}
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
                {/* Poll rendering would go here */}
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
                rating={post.rating}
                myRating={post.myRating}
                ratingCount={post.ratingCount}
                primaryColor={primaryColor}
                hoveredRating={hoveredRating}
                setHoveredRating={setHoveredRating}
                onRate={handleRate}
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
              onSubmit={handleSubmitComment}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        </div>
      </GlassCard>

      {/* Comments Section */}
      <div>
        {/* Comments Header with View Mode Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </h2>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            {onExport && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExport}
                className="flex items-center gap-1 rounded-lg bg-dark-600 px-3 py-1.5 text-sm text-gray-400 hover:bg-dark-500 hover:text-white"
                title="Export thread"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </motion.button>
            )}

            <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>

        {/* Reply-To Indicator */}
        <ReplyIndicator replyToId={replyToId} onCancel={() => setReplyToId(undefined)} />

        {/* Comments Display - Linear or Threaded */}
        {viewMode === 'threaded' ? (
          <ThreadedCommentTree
            comments={comments}
            currentUserId={user?.id}
            onVote={handleThreadedVote}
            onReply={handleReplyTo}
            onMarkBestAnswer={onMarkBestAnswer}
            canMarkBestAnswer={canMarkBestAnswer}
            primaryColor={primaryColor}
          />
        ) : (
          /* Linear View with Virtualization */
          <div
            ref={parentRef}
            className="scrollbar-thin scrollbar-thumb-dark-600 h-[600px] overflow-y-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const comment = sortedComments[virtualRow.index];
                if (!comment) return null;
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <CommentCard
                      comment={comment}
                      index={virtualRow.index}
                      onVote={handleCommentVote}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {comments.length === 0 && <EmptyCommentsState />}
      </div>
    </div>
  );
}

export default ThreadView;
