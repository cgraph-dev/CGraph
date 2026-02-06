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

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { CommentCard } from './CommentCard';
import { sortComments, getTopLevelComments } from './utils';
import type { Comment, NestedCommentsProps } from './types';

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
        onVote={onVote}
        onDelete={onDelete}
        onMarkBestAnswer={onMarkBestAnswer}
        sortedComments={sortedCommentsCallback}
        renderComment={renderComment}
      />
    );
  };

  const topLevelComments = getTopLevelComments(comments);

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
