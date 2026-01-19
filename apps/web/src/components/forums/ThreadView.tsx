import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  ClockIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
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
import type { Post, Comment, ThreadPrefix, Poll } from '@/stores/forumStore';

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
 */

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
  isBookmarked?: boolean;
  isSubscribed?: boolean;
  canModerate?: boolean;
  canEdit?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
}

export function ThreadView({
  post,
  comments,
  isLoading = false,
  onVote,
  onComment,
  onBookmark,
  onShare,
  onSubscribe,
  onRate,
  onPin,
  onLock,
  onDelete,
  onEdit,
  onReport,
  isBookmarked = false,
  isSubscribed = false,
  canModerate = false,
  canEdit = false,
  variant = 'default',
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

  const handleCommentVote = async (commentId: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
    HapticFeedback.light();
    const newValue = currentVote === value ? null : value;
    await onVote('comment', commentId, newValue);
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    HapticFeedback.success();
    try {
      await onComment(commentContent.trim());
      setCommentContent('');
      setShowCommentForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      className="px-2 py-0.5 text-xs font-semibold rounded-full mr-2"
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
      {post.ratingCount && (
        <span className="text-xs text-gray-500 ml-1">
          ({post.ratingCount})
        </span>
      )}
    </div>
  );

  const renderPost = () => (
    <GlassCard variant="frosted" className="p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start gap-4">
        {/* Vote Sidebar */}
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(1)}
            className={`p-1 rounded ${post.myVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}
          >
            {post.myVote === 1 ? (
              <ArrowUpIconSolid className="h-6 w-6" />
            ) : (
              <ArrowUpIcon className="h-6 w-6" />
            )}
          </motion.button>
          <span
            className="font-bold text-lg"
            style={{ color: post.score > 0 ? '#22c55e' : post.score < 0 ? '#ef4444' : 'inherit' }}
          >
            {post.score}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(-1)}
            className={`p-1 rounded ${post.myVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            {post.myVote === -1 ? (
              <ArrowDownIconSolid className="h-6 w-6" />
            ) : (
              <ArrowDownIcon className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
          <h1 className="text-2xl font-bold mb-3">{post.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4">
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
                {post.author.reputation && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    {post.author.reputation} karma
                  </span>
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
            className={`prose prose-invert max-w-none ${!isExpanded && variant !== 'expanded' ? 'max-h-96 overflow-hidden relative' : ''}`}
          >
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
            {!isExpanded && variant !== 'expanded' && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-800 to-transparent" />
            )}
          </div>

          {variant !== 'expanded' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm mt-2 hover:underline"
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
            <div className="mt-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
              <h3 className="font-medium mb-3">{post.poll.question}</h3>
              {/* Poll rendering would go here */}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-dark-700 text-sm text-gray-400">
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
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                isBookmarked ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-dark-600 text-gray-300 hover:bg-dark-500"
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
                    className="absolute top-full left-0 mt-1 w-48 bg-dark-700 rounded-lg shadow-xl border border-dark-600 py-1 z-50"
                  >
                    <button
                      onClick={copyLink}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-dark-600"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank');
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
                  className="p-2 rounded-lg bg-dark-600 text-gray-300 hover:bg-dark-500"
                >
                  •••
                </motion.button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-1 w-48 bg-dark-700 rounded-lg shadow-xl border border-dark-600 py-1 z-50"
                    >
                      {canEdit && (
                        <button
                          onClick={() => { onEdit?.(); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {canModerate && (
                        <>
                          <button
                            onClick={() => { onPin?.(); setShowMoreMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                          >
                            <MapPinIcon className="h-4 w-4" />
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => { onLock?.(); setShowMoreMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                            {post.isLocked ? 'Unlock' : 'Lock'}
                          </button>
                          <hr className="my-1 border-dark-600" />
                          <button
                            onClick={() => { onDelete?.(); setShowMoreMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { onReport?.(); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
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
                  className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg resize-none focus:outline-none focus:border-primary"
                  rows={4}
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <div className="flex justify-end gap-2 mt-2">
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
                    className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
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
        className={`p-4 mb-2 ${comment.isBestAnswer ? 'border-2 border-green-500' : ''}`}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => handleCommentVote(comment.id, 1, comment.userVote)}
              className={comment.userVote === 1 ? 'text-green-500' : 'text-gray-500 hover:text-green-400'}
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">{comment.score}</span>
            <button
              onClick={() => handleCommentVote(comment.id, -1, comment.userVote)}
              className={comment.userVote === -1 ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}
            >
              <ChevronUpIcon className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            {comment.isBestAnswer && (
              <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-2">
                <StarIconSolid className="h-4 w-4" />
                Best Answer
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <img
                src={comment.author.avatarUrl || '/default-avatar.png'}
                alt={comment.author.displayName || comment.author.username}
                className="h-6 w-6 rounded-full"
              />
              <span className="font-medium text-sm">
                {comment.author.displayName || comment.author.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              {comment.content}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <GlassCard variant="frosted" className="p-6 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 space-y-2">
              <div className="h-6 w-6 bg-dark-700 rounded mx-auto" />
              <div className="h-4 w-10 bg-dark-700 rounded mx-auto" />
              <div className="h-6 w-6 bg-dark-700 rounded mx-auto" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-8 w-3/4 bg-dark-700 rounded" />
              <div className="h-4 w-1/2 bg-dark-700 rounded" />
              <div className="h-32 bg-dark-700 rounded" />
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
        <h2 className="text-lg font-semibold mb-4">
          {comments.length} Comment{comments.length !== 1 ? 's' : ''}
        </h2>

        <div
          ref={parentRef}
          className="h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600"
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

        {comments.length === 0 && (
          <GlassCard variant="frosted" className="p-8 text-center">
            <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

export default ThreadView;
