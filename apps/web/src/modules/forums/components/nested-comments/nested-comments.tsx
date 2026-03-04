/**
 * Nested Comments Component for Forum Posts
 *
 * Implements a sophisticated threaded comment system with features:
 * - Infinite nesting depth with visual indentation
 * - Upvote/downvote with score display
 * - Best Answer marking (for question posts)
 * - Collapsible comment threads
 * - Reply functionality at any depth
 * - Edit and delete (for own comments)
 * - Real-time vote updates with optimistic UI
 * - Sort comments by best, new, old, controversial
 */

import React, { useState, useCallback, useOptimistic } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { CommentCard } from './comment-card';
import { sortComments, getTopLevelComments } from './utils';
import type { Comment, NestedCommentsProps } from './types';

/**
 * Recursively update a comment's vote state in a nested comment tree.
 * Computes the score delta from the previous vote so the displayed score
 * reflects the change immediately.
 */
function applyOptimisticVote(
  comments: Comment[],
  commentId: string,
  value: 1 | -1 | null
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      const scoreDelta = (value ?? 0) - (comment.userVote ?? 0);
      return { ...comment, userVote: value, score: comment.score + scoreDelta };
    }
    if (comment.replies.length > 0) {
      return { ...comment, replies: applyOptimisticVote(comment.replies, commentId, value) };
    }
    return comment;
  });
}

/**
 * Nested Comments component.
 */
export default function NestedComments({
  comments,
  isAuthorOfPost,
  canMarkBestAnswer,
  sortBy = 'best',
  onVote,
  onReply,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  maxDepth = 10,
}: NestedCommentsProps) {
  // React 19 useOptimistic: immediately reflect vote changes in the UI
  // before the onVote API call resolves. When `comments` props update with
  // the real server state, the optimistic overlay is automatically discarded.
  const [optimisticComments, addOptimisticVote] = useOptimistic(
    comments,
    (currentComments: Comment[], vote: { commentId: string; value: 1 | -1 | null }) =>
      applyOptimisticVote(currentComments, vote.commentId, vote.value)
  );

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const sortedCommentsCallback = useCallback(
    (commentsToSort: Comment[]) => sortComments(commentsToSort, sortBy),
    [sortBy]
  );

  const toggleCollapse = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
    HapticFeedback.light();
  };

  const handleReply = async (parentId: string | null) => {
    if (!replyContent.trim()) return;
    await onReply(parentId, replyContent);
    setReplyContent('');
    setReplyingTo(null);
    HapticFeedback.success();
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    await onEdit(commentId, editContent);
    setEditContent('');
    setEditingComment(null);
    HapticFeedback.success();
  };

  // Wrap onVote: apply optimistic update first, then call the actual API
  const handleVote = async (commentId: string, value: 1 | -1 | null) => {
    addOptimisticVote({ commentId, value });
    await onVote(commentId, value);
  };

  const renderComment = (comment: Comment, depth: number = 0): React.ReactElement => {
    const isCollapsed = expandedComments.has(comment.id);
    const isReplying = replyingTo === comment.id;
    const isEditing = editingComment === comment.id;

    return (
      <CommentCard
        key={comment.id}
        comment={comment}
        depth={depth}
        maxDepth={maxDepth}
        isAuthorOfPost={isAuthorOfPost}
        canMarkBestAnswer={canMarkBestAnswer}
        isCollapsed={isCollapsed}
        isReplying={isReplying}
        isEditing={isEditing}
        replyContent={replyContent}
        editContent={editContent}
        onToggleCollapse={toggleCollapse}
        onSetReplyingTo={setReplyingTo}
        onSetEditingComment={setEditingComment}
        onSetReplyContent={setReplyContent}
        onSetEditContent={setEditContent}
        onReply={handleReply}
        onEdit={handleEdit}
        onVote={handleVote}
        onDelete={onDelete}
        onMarkBestAnswer={onMarkBestAnswer}
        sortedComments={sortedCommentsCallback}
        renderComment={renderComment}
      />
    );
  };

  const topLevelComments = getTopLevelComments(optimisticComments);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sortedCommentsCallback(topLevelComments).map((comment) => renderComment(comment, 0))}
      </AnimatePresence>

      {topLevelComments.length === 0 && (
        <div className="py-12 text-center">
          <ChatBubbleLeftIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
