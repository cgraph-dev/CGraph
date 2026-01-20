import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon,
  StarIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { UserStars } from '@/components/gamification/UserStars';
import { ThreadedCommentTree } from './ThreadedCommentTree';
import type { Post, Comment, ThreadPrefix } from '@/stores/forumStore';

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
 */

// View modes for comment display
export type CommentViewMode = 'linear' | 'threaded';

interface ThreadViewProps {
  post: Post;
  comments: Comment[];
  isLoading?: boolean;
  onVote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
  onComment: (content: string, parentId?: string) => Promise<void>;
  onBookmark?: () => Promise<void>;
  onShare?: () => void;
  onSubscribe?: () => Promise<void>;
  onRate?: (rating: number) => Promise<void>;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  onReport?: () => void;
  onExport?: () => void;
  onMarkBestAnswer?: (commentId: string) => void;
  isBookmarked?: boolean;
  isSubscribed?: boolean;
  canModerate?: boolean;
  canEdit?: boolean;
  canMarkBestAnswer?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
  /** Initial view mode - persisted to localStorage */
  defaultViewMode?: CommentViewMode;
}

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

  const parentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);

  // View mode state - persisted to localStorage
  const [viewMode, setViewMode] = useState<CommentViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgraph_thread_view_mode');
      if (saved === 'linear' || saved === 'threaded') {
        return saved;
      }
    }
    return defaultViewMode;
  });

  // Persist view mode changes
  const handleViewModeChange = useCallback((mode: CommentViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgraph_thread_view_mode', mode);
    }
  }, []);

  // Handle reply to specific comment
  const handleReplyTo = useCallback((parentId: string) => {
    setReplyToId(parentId);
    setShowCommentForm(true);
    // Scroll to comment form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Sort comments - best answers first, then by score
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (a.isBestAnswer && !b.isBestAnswer) return -1;
      if (!a.isBestAnswer && b.isBestAnswer) return 1;
      return b.score - a.score;
    });
  }, [comments]);

  // Virtual list for comments
  const rowVirtualizer = useVirtualizer({
    count: sortedComments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const handleVote = async (value: 1 | -1) => {
    HapticFeedback.light();
    const newValue = post.myVote === value ? null : value;
    await onVote('post', post.id, newValue);
  };

  const handleCommentVote = async (
    commentId: string,
    value: 1 | -1,
    currentVote: 1 | -1 | null
  ) => {
    HapticFeedback.light();
    const newValue = currentVote === value ? null : value;
    await onVote('comment', commentId, newValue);
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    HapticFeedback.success();
    try {
      await onComment(commentContent.trim(), replyToId);
      setCommentContent('');
      setShowCommentForm(false);
      setReplyToId(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment vote for threaded view
  const handleThreadedVote = useCallback(
    async (commentId: string, value: 1 | -1 | null, _currentVote: 1 | -1 | null) => {
      await onVote('comment', commentId, value);
    },
    [onVote]
  );

  const handleRate = async (rating: number) => {
    if (!onRate) return;
    HapticFeedback.medium();
    await onRate(rating);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    HapticFeedback.success();
    setShowShareMenu(false);
  };

  const renderPrefix = (prefix: ThreadPrefix) => (
    <span
      className="mr-2 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `${prefix.color}20`,
        color: prefix.color,
        border: `1px solid ${prefix.color}40`,
      }}
    >
      {prefix.name}
    </span>
  );

  const renderRatingStars = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoveredRating || post.myRating || 0);
        const isAverage = !hoveredRating && !post.myRating && star <= Math.round(post.rating || 0);
        return (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRate(star)}
            className="focus:outline-none"
          >
            {isFilled || isAverage ? (
              <StarIconSolid
                className="h-5 w-5"
                style={{ color: isFilled ? primaryColor : '#FFD700' }}
              />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-500" />
            )}
          </motion.button>
        );
      })}
      {post.ratingCount && <span className="ml-1 text-xs text-gray-500">({post.ratingCount})</span>}
    </div>
  );

  const renderPost = () => (
    <GlassCard variant="frosted" className="mb-4 p-6">
      {/* Post Header */}
      <div className="flex items-start gap-4">
        {/* Vote Sidebar */}
        <div className="flex min-w-[60px] flex-col items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(1)}
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
            onClick={() => handleVote(-1)}
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
            {post.prefix && renderPrefix(post.prefix)}
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
            <img
              src={post.author.avatarUrl || '/default-avatar.png'}
              alt={post.author.displayName || post.author.username || 'User'}
              className="h-10 w-10 rounded-full"
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
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
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
            {renderRatingStars()}
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

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
                  >
                    <button
                      onClick={copyLink}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-dark-600"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => {
                        window.open(
                          `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`,
                          '_blank'
                        );
                        setShowShareMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-dark-600"
                    >
                      Share on Twitter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
                    >
                      {canEdit && (
                        <button
                          onClick={() => {
                            onEdit?.();
                            setShowMoreMenu(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {canModerate && (
                        <>
                          <button
                            onClick={() => {
                              onPin?.();
                              setShowMoreMenu(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                          >
                            <MapPinIcon className="h-4 w-4" />
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => {
                              onLock?.();
                              setShowMoreMenu(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                            {post.isLocked ? 'Unlock' : 'Lock'}
                          </button>
                          <hr className="my-1 border-dark-600" />
                          <button
                            onClick={() => {
                              onDelete?.();
                              setShowMoreMenu(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          onReport?.();
                          setShowMoreMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                      >
                        <FlagIcon className="h-4 w-4" />
                        Report
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Comment Form */}
          <AnimatePresence>
            {showCommentForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="focus:border-primary w-full resize-none rounded-lg border border-dark-600 bg-dark-700 p-3 focus:outline-none"
                  rows={4}
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitComment}
                    disabled={!commentContent.trim() || isSubmitting}
                    className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white',
                    }}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );

  const renderComment = (comment: Comment, index: number) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard
        variant={comment.isBestAnswer ? 'neon' : 'frosted'}
        className={`mb-2 p-4 ${comment.isBestAnswer ? 'border-2 border-green-500' : ''}`}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => handleCommentVote(comment.id, 1, comment.userVote ?? null)}
              className={
                comment.userVote === 1 ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
              }
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">{comment.score}</span>
            <button
              onClick={() => handleCommentVote(comment.id, -1, comment.userVote ?? null)}
              className={
                comment.userVote === -1 ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }
            >
              <ChevronUpIcon className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Comment content */}
          <div className="min-w-0 flex-1">
            {comment.isBestAnswer && (
              <div className="mb-2 flex items-center gap-1 text-sm font-medium text-green-500">
                <StarIconSolid className="h-4 w-4" />
                Best Answer
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <img
                src={comment.author.avatarUrl || '/default-avatar.png'}
                alt={comment.author.displayName ?? comment.author.username ?? 'User'}
                className="h-6 w-6 rounded-full"
              />
              <span className="text-sm font-medium">
                {comment.author.displayName || comment.author.username}
              </span>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">{comment.content}</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <GlassCard variant="frosted" className="animate-pulse p-6">
          <div className="flex gap-4">
            <div className="w-16 space-y-2">
              <div className="mx-auto h-6 w-6 rounded bg-dark-700" />
              <div className="mx-auto h-4 w-10 rounded bg-dark-700" />
              <div className="mx-auto h-6 w-6 rounded bg-dark-700" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-8 w-3/4 rounded bg-dark-700" />
              <div className="h-4 w-1/2 rounded bg-dark-700" />
              <div className="h-32 rounded bg-dark-700" />
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderPost()}

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

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-dark-600 bg-dark-700/50 p-0.5">
              <button
                onClick={() => handleViewModeChange('linear')}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'linear'
                    ? 'bg-dark-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Linear view - comments in order"
              >
                <ListBulletIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Linear</span>
              </button>
              <button
                onClick={() => handleViewModeChange('threaded')}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'threaded'
                    ? 'bg-dark-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Threaded view - nested replies"
              >
                <Bars3BottomLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Threaded</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reply-To Indicator */}
        <AnimatePresence>
          {replyToId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-2 text-sm"
            >
              <span className="text-gray-400">Replying to comment</span>
              <button
                onClick={() => setReplyToId(undefined)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                    {renderComment(comment, virtualRow.index)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {comments.length === 0 && (
          <GlassCard variant="frosted" className="p-8 text-center">
            <ChatBubbleLeftIcon className="mx-auto mb-3 h-12 w-12 text-gray-500" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

export default ThreadView;
