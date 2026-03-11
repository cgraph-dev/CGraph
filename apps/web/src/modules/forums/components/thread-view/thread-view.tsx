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
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useAuthStore } from '@/modules/auth/store';
import { useUnlockContent } from '@/modules/nodes/hooks/useNodes';
import { TipButton } from '@/modules/nodes/components/tip-button';
import toast from 'react-hot-toast';

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

/**
 * unknown for the forums module.
 */
/**
 * Thread View component.
 */
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
  const navigate = useNavigate();
  const unlockMutation = useUnlockContent();

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

        {/* Tip the author — Nodes Economy */}
        {user && post.author.id !== user.id && (
          <div className="flex justify-end border-t border-white/5 px-2 pt-3">
            <TipButton
              recipientId={post.author.id}
              recipientName={post.author.displayName || post.author.username || 'User'}
            />
          </div>
        )}
      </GlassCard>

      {/* Content Gating Overlay — Phase 31 */}
      {post.isContentGated && (
        <GlassCard variant="frosted" className="mb-4 p-6 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-3xl">🔒</span>
            <h3 className="text-lg font-semibold text-white">Content Gated</h3>
            <p className="max-w-sm text-sm text-white/50">
              This thread's full content is gated. Unlock it to read the complete post and join the discussion.
            </p>
            <button
              className="mt-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={unlockMutation.isPending}
              onClick={() => {
                unlockMutation.mutate(post.id, {
                  onSuccess: () => {
                    toast.success('Content unlocked!');
                  },
                  onError: (error: unknown) => {
                    const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
                    if (msg === 'insufficient_balance') {
                      toast.error('Not enough Nodes');
                      navigate('/nodes/shop');
                    } else {
                      toast.error('Unlock failed. Please try again.');
                    }
                  },
                });
              }}
            >
              {unlockMutation.isPending ? 'Unlocking…' : `Unlock for ${post.gatePriceNodes ?? '?'} Nodes`}
            </button>
          </div>
        </GlassCard>
      )}

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
