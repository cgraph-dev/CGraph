/**
 * Forum post page with voting, comments, and moderation features.
 * @module pages/forums/forum-post/page
 */
/**
 * ForumPost Page
 *
 * Displays a single forum post with voting, content, comments,
 * and moderation features. Composed from focused sub-components.
 *
 * @module pages/forums/forum-post/page
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import EditHistoryModal from '@/modules/forums/components/edit-history-modal';

import { useForumPostActions } from './useForumPostActions';
import { PostVoteSidebar } from './post-vote-sidebar';
import { PostContent } from './post-content';
import { PostActionBar } from './post-action-bar';
import { CommentInput } from './comment-input';
import { CommentList } from './comment-list';
import { ReportModal } from './report-modal';
import { PostSkeleton, BackButton } from './loading';

/**
 * Forum Post component.
 */
export default function ForumPost() {
  const { forumSlug, postId } = useParams<{ forumSlug: string; postId: string }>();
  const { user } = useAuthStore();
  const {
    currentPost,
    comments,
    isLoadingComments,
    fetchPost,
    fetchComments,
    fetchForum,
    currentForum,
  } = useForumStore();

  const actions = useForumPostActions(postId);
  const postComments = postId ? comments[postId] || [] : [];

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
      fetchComments(postId);
    }
  }, [postId, fetchPost, fetchComments]);

  useEffect(() => {
    if (forumSlug && (!currentForum || currentForum.slug !== forumSlug)) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, currentForum, fetchForum]);

  if (!currentPost) {
    return <PostSkeleton forumSlug={forumSlug} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      <BackButton forumSlug={forumSlug || ''} />

      <div className="animate-fadeIn mx-auto max-w-4xl px-4 py-4">
        {/* Post article */}
        <article className="animate-slideUp rounded-lg border border-dark-700 bg-dark-800">
          <div className="flex">
            <PostVoteSidebar
              postId={currentPost.id}
              score={currentPost.score}
              myVote={currentPost.myVote}
              onVote={actions.handleVote}
            />

            <div className="flex-1 p-4">
              <PostContent
                post={currentPost}
                currentUserId={user?.id}
                onShowEditHistory={() => actions.setShowEditHistory(true)}
              />

              <PostActionBar
                postId={currentPost.id}
                forumSlug={forumSlug || ''}
                forumId={currentPost.forum?.id}
                commentCount={currentPost.commentCount}
                authorId={currentPost.authorId}
                isPinned={currentPost.isPinned}
                isLocked={currentPost.isLocked}
                isSubscribed={actions.isSubscribed}
                onToggleSubscription={actions.handleToggleSubscription}
                onReport={() => actions.setShowReportModal(true)}
              />
            </div>
          </div>
        </article>

        {/* Comment input */}
        <CommentInput
          isLocked={currentPost.isLocked}
          username={user?.username ?? undefined}
          value={actions.commentContent}
          onChange={actions.setCommentContent}
          onSubmit={actions.handleSubmitComment}
          isSubmitting={actions.isSubmitting}
        />

        {/* Comments list */}
        <CommentList
          comments={postComments}
          isLoading={isLoadingComments}
          onVote={(id, value, currentVote) => actions.handleVote('comment', id, value, currentVote)}
          replyingTo={actions.replyingTo}
          setReplyingTo={actions.setReplyingTo}
          replyContent={actions.replyContent}
          setReplyContent={actions.setReplyContent}
          onSubmitReply={actions.handleSubmitReply}
          isSubmitting={actions.isSubmitting}
        />
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={actions.showReportModal}
        onClose={() => actions.setShowReportModal(false)}
        reportReason={actions.reportReason}
        setReportReason={actions.setReportReason}
        onSubmit={actions.handleReport}
        isReporting={actions.isReporting}
      />

      <EditHistoryModal
        postId={currentPost.id}
        isOpen={actions.showEditHistory}
        onClose={() => actions.setShowEditHistory(false)}
      />
    </div>
  );
}
