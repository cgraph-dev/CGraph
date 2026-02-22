/**
 * Comment List
 *
 * Renders the list of comments with loading and empty states.
 *
 * @module pages/forums/forum-post/CommentList
 */

import type { Comment } from '@/modules/forums/store';
import { CommentItem } from './comment-item';

/** Props for CommentList */
export interface CommentListProps {
  /** Array of comments to display */
  comments: Comment[];
  /** Whether comments are loading */
  isLoading: boolean;
  /** Vote handler */
  onVote: (id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  /** ID of the comment being replied to */
  replyingTo: string | null;
  /** Set reply target */
  setReplyingTo: (id: string | null) => void;
  /** Current reply text */
  replyContent: string;
  /** Update reply text */
  setReplyContent: (v: string) => void;
  /** Submit reply handler */
  onSubmitReply: (parentId: string) => void;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
}

/** Forum post comment list with loading/empty states */
export function CommentList({
  comments,
  isLoading,
  onVote,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="mt-4 py-8 text-center text-gray-400">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onVote={(id, value, currentVote) => onVote(id, value, currentVote)}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
}
