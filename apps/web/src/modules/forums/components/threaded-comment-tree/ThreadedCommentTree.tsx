/**
 * ThreadedCommentTree Component
 *
 * Renders comments in a threaded/nested tree view, as opposed to
 * the default linear/flat view. Each reply is indented under its parent.
 *
 * Features:
 * - Recursive tree rendering with configurable max depth
 * - Collapse/expand subtrees
 * - Smooth animations for expand/collapse
 * - Visual thread lines connecting parent-child comments
 * - Performance optimized with React.memo
 * - Keyboard navigation support
 */

import { useMemo } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { ThreadedComment } from './ThreadedComment';
import { buildCommentTree } from './utils';
import type { ThreadedCommentTreeProps } from './types';

export function ThreadedCommentTree({
  comments,
  currentUserId,
  onVote,
  onReply,
  onMarkBestAnswer,
  canMarkBestAnswer = false,
  maxDepth = 6,
  collapseAfterDepth = 4,
  primaryColor = '#10B981',
}: ThreadedCommentTreeProps) {
  // Build tree structure from flat comments
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  if (commentTree.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChatBubbleLeftIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
        <p className="text-gray-400">No comments yet. Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commentTree.map((comment, index) => (
        <ThreadedComment
          key={comment.id}
          comment={comment}
          depth={0}
          maxDepth={maxDepth}
          collapseAfterDepth={collapseAfterDepth}
          currentUserId={currentUserId}
          onVote={onVote}
          onReply={onReply}
          onMarkBestAnswer={onMarkBestAnswer}
          canMarkBestAnswer={canMarkBestAnswer}
          primaryColor={primaryColor}
          isLast={index === commentTree.length - 1}
        />
      ))}
    </div>
  );
}

export default ThreadedCommentTree;
