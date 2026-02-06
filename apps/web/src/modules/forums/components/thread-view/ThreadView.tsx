/**
 * ThreadView Component
 *
 * Comprehensive thread viewing experience with:
 * - Original post display with full content
 * - Virtualized comment list for performance
 * - Thread prefix badges and poll integration
 * - Rating system, view counter, bookmark/subscribe
 * - Moderation actions for privileged users
 * - View mode toggle (linear/threaded)
 *
 * @module modules/forums/components/thread-view
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useAuthStore } from '@/stores/authStore';

import type { ThreadViewProps } from './types';
import {
  useViewMode,
  useSortedComments,
  useCommentVirtualizer,
  useReplyHandler,
  useVoteHandlers,
  useRating,
} from './hooks';
import { ThreadLoadingSkeleton, PostVoteSidebar, PostContent, CommentsSection } from './components';

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

  // State
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
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

  if (isLoading) return <ThreadLoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Post Card */}
      <GlassCard variant="frosted" className="mb-4 p-6">
        <div className="flex items-start gap-4">
          <PostVoteSidebar score={post.score} myVote={post.myVote} onVote={handlePostVote} />
          <PostContent
            post={post}
            primaryColor={primaryColor}
            isBookmarked={isBookmarked}
            canModerate={canModerate}
            canEdit={canEdit}
            variant={variant}
            hoveredRating={hoveredRating}
            setHoveredRating={setHoveredRating}
            onRate={handleRate}
            onBookmark={onBookmark}
            onEdit={onEdit}
            onPin={onPin}
            onLock={onLock}
            onDelete={onDelete}
            onReport={onReport}
            showCommentForm={showCommentForm}
            setShowCommentForm={setShowCommentForm}
            commentContent={commentContent}
            setCommentContent={setCommentContent}
            isSubmitting={isSubmitting}
            onSubmitComment={handleSubmitComment}
          />
        </div>
      </GlassCard>

      {/* Comments */}
      <CommentsSection
        comments={comments}
        sortedComments={sortedComments}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        parentRef={parentRef}
        rowVirtualizer={rowVirtualizer}
        currentUserId={user?.id}
        primaryColor={primaryColor}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(undefined)}
        onReply={handleReplyTo}
        onCommentVote={handleCommentVote}
        onThreadedVote={handleThreadedVote}
        onExport={onExport}
        onMarkBestAnswer={onMarkBestAnswer}
        canMarkBestAnswer={canMarkBestAnswer}
      />
    </div>
  );
}

export default ThreadView;
