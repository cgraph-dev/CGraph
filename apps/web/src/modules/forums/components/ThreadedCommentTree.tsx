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
 *
 * @version 1.0.0
 * @since v0.8.0
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { UserStars } from '@/modules/gamification/components/UserStars';
import { formatTimeAgo } from '@/lib/utils';
import type { Comment } from '@/stores/forumStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// =============================================================================
// TYPES
// =============================================================================

export interface ThreadedCommentTreeProps {
  /** All comments (flat array - will be converted to tree) */
  comments: Comment[];
  /** Currently authenticated user ID */
  currentUserId?: string;
  /** Callback when voting on a comment */
  onVote: (commentId: string, value: 1 | -1 | null, currentVote: 1 | -1 | null) => Promise<void>;
  /** Callback when replying to a comment */
  onReply: (parentId: string) => void;
  /** Callback to mark as best answer (if allowed) */
  onMarkBestAnswer?: (commentId: string) => void;
  /** Whether current user can mark best answers */
  canMarkBestAnswer?: boolean;
  /** Maximum nesting depth before flattening */
  maxDepth?: number;
  /** Default collapsed state for deeply nested comments */
  collapseAfterDepth?: number;
  /** Primary theme color */
  primaryColor?: string;
}

interface CommentTreeNode extends Comment {
  children: CommentTreeNode[];
}

interface ThreadedCommentProps {
  comment: CommentTreeNode;
  depth: number;
  maxDepth: number;
  collapseAfterDepth: number;
  currentUserId?: string;
  onVote: (commentId: string, value: 1 | -1 | null, currentVote: 1 | -1 | null) => Promise<void>;
  onReply: (parentId: string) => void;
  onMarkBestAnswer?: (commentId: string) => void;
  canMarkBestAnswer?: boolean;
  primaryColor: string;
  isLast: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Converts a flat array of comments to a nested tree structure
 */
function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const commentMap = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  // First pass: Create all nodes with empty children arrays
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });

  // Second pass: Build parent-child relationships
  comments.forEach((comment) => {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by score (best first) then by date
  const sortChildren = (nodes: CommentTreeNode[]): void => {
    nodes.sort((a, b) => {
      // Best answers first
      if (a.isBestAnswer && !b.isBestAnswer) return -1;
      if (!a.isBestAnswer && b.isBestAnswer) return 1;
      // Then by score
      if (b.score !== a.score) return b.score - a.score;
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    nodes.forEach((node) => sortChildren(node.children));
  };

  sortChildren(roots);
  return roots;
}

/**
 * Count total descendants of a comment
 */
function countDescendants(node: CommentTreeNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

// =============================================================================
// THREADED COMMENT COMPONENT
// =============================================================================

const ThreadedComment = memo(function ThreadedComment({
  comment,
  depth,
  maxDepth,
  collapseAfterDepth,
  currentUserId,
  onVote,
  onReply,
  onMarkBestAnswer,
  canMarkBestAnswer,
  primaryColor,
  isLast,
}: ThreadedCommentProps) {
  const [isCollapsed, setIsCollapsed] = useState(depth >= collapseAfterDepth);
  const [isVoting, setIsVoting] = useState(false);

  const descendantCount = useMemo(() => countDescendants(comment), [comment]);
  const hasChildren = comment.children.length > 0;
  const isOwnComment = currentUserId === comment.authorId;

  const handleVote = useCallback(
    async (value: 1 | -1) => {
      if (isVoting) return;
      setIsVoting(true);
      try {
        const currentVote = comment.myVote ?? comment.userVote ?? null;
        const newValue = currentVote === value ? null : value;
        await onVote(comment.id, newValue, currentVote);
      } finally {
        setIsVoting(false);
      }
    },
    [comment.id, comment.myVote, comment.userVote, onVote, isVoting]
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleReply = useCallback(() => {
    onReply(comment.id);
  }, [comment.id, onReply]);

  const handleMarkBestAnswer = useCallback(() => {
    onMarkBestAnswer?.(comment.id);
  }, [comment.id, onMarkBestAnswer]);

  // Determine if we should show "continue thread" link
  const shouldContinueInNewThread = depth >= maxDepth && hasChildren;

  // Indentation based on depth
  const indentSize = Math.min(depth, 4) * 24; // Max 4 levels of visible indent

  const currentVote = comment.myVote ?? comment.userVote ?? null;

  return (
    <div className="relative">
      {/* Thread line connecting to parent */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 w-0.5 bg-dark-600"
          style={{
            left: -12,
            height: isLast ? 24 : '100%',
          }}
        />
      )}

      {/* Horizontal connector to thread line */}
      {depth > 0 && (
        <div
          className="absolute h-0.5 bg-dark-600"
          style={{
            left: -12,
            top: 24,
            width: 12,
          }}
        />
      )}

      {/* Comment Content */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-lg ${
          comment.isBestAnswer
            ? 'border border-green-500/30 bg-green-500/5'
            : 'border border-dark-600 bg-dark-800/50'
        } p-3`}
        style={{ marginLeft: indentSize }}
      >
        {/* Best Answer Badge */}
        {comment.isBestAnswer && (
          <div className="absolute -top-2 left-3 rounded bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
            ✓ Best Answer
          </div>
        )}

        {/* Comment Header */}
        <div className="mb-2 flex items-center gap-3">
          {/* Avatar */}
          <ThemedAvatar
            src={comment.author.avatarUrl}
            alt={comment.author.displayName || comment.author.username || 'User'}
            size="small"
            avatarBorderId={
              comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null
            }
          />

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {comment.author.displayName || comment.author.username}
              </span>
              {comment.author.reputation !== undefined && (
                <UserStars postCount={comment.author.reputation} size="xs" compact />
              )}
              {isOwnComment && (
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
              {comment.editedAt && (
                <span className="ml-2">• edited {formatTimeAgo(comment.editedAt)}</span>
              )}
            </span>
          </div>

          {/* Collapse/Expand Button */}
          {hasChildren && (
            <button
              onClick={toggleCollapse}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-dark-600 hover:text-white"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand replies' : 'Collapse replies'}
            >
              {isCollapsed ? (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>{descendantCount} replies</span>
                </>
              ) : (
                <>
                  <MinusIcon className="h-4 w-4" />
                  <span>Hide</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Comment Content */}
        <div
          className="prose prose-invert prose-sm max-w-none text-gray-300"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } }),
          }}
        />

        {/* Comment Actions */}
        <div className="mt-3 flex items-center gap-4">
          {/* Vote Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote(1)}
              disabled={isVoting}
              className={`rounded p-1 transition-colors ${
                currentVote === 1
                  ? 'text-green-500'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-green-400'
              }`}
              aria-label="Upvote"
            >
              {currentVote === 1 ? (
                <ArrowUpIconSolid className="h-4 w-4" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </button>
            <span
              className={`min-w-[2ch] text-center text-sm font-medium ${
                comment.score > 0
                  ? 'text-green-500'
                  : comment.score < 0
                    ? 'text-red-500'
                    : 'text-gray-400'
              }`}
            >
              {comment.score}
            </span>
            <button
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              className={`rounded p-1 transition-colors ${
                currentVote === -1
                  ? 'text-red-500'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-red-400'
              }`}
              aria-label="Downvote"
            >
              {currentVote === -1 ? (
                <ArrowDownIconSolid className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Reply Button */}
          <button
            onClick={handleReply}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-dark-600 hover:text-white"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            Reply
          </button>

          {/* Mark Best Answer */}
          {canMarkBestAnswer && !comment.isBestAnswer && (
            <button
              onClick={handleMarkBestAnswer}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-green-500/20 hover:text-green-400"
            >
              ✓ Mark as Best
            </button>
          )}
        </div>
      </motion.div>

      {/* Children Comments */}
      {hasChildren && !shouldContinueInNewThread && (
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mt-2 pl-6"
            >
              <div className="space-y-2">
                {comment.children.map((child, index) => (
                  <ThreadedComment
                    key={child.id}
                    comment={child}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    collapseAfterDepth={collapseAfterDepth}
                    currentUserId={currentUserId}
                    onVote={onVote}
                    onReply={onReply}
                    onMarkBestAnswer={onMarkBestAnswer}
                    canMarkBestAnswer={canMarkBestAnswer}
                    primaryColor={primaryColor}
                    isLast={index === comment.children.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Continue in Thread Link */}
      {shouldContinueInNewThread && (
        <div className="mt-2 pl-6">
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-2 rounded-lg border border-dashed border-dark-500 px-3 py-2 text-sm text-gray-400 hover:border-primary-500 hover:text-primary-400"
            style={{ borderColor: isCollapsed ? undefined : primaryColor }}
          >
            {isCollapsed ? (
              <>
                <ChevronRightIcon className="h-4 w-4" />
                Continue thread ({descendantCount} more replies)
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                Collapse deep thread
              </>
            )}
          </button>

          {/* Render deep thread inline when expanded */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 space-y-2 border-l-2 pl-4"
                style={{ borderColor: primaryColor }}
              >
                {comment.children.map((child, index) => (
                  <ThreadedComment
                    key={child.id}
                    comment={child}
                    depth={0} // Reset depth for deep threads
                    maxDepth={maxDepth}
                    collapseAfterDepth={collapseAfterDepth}
                    currentUserId={currentUserId}
                    onVote={onVote}
                    onReply={onReply}
                    onMarkBestAnswer={onMarkBestAnswer}
                    canMarkBestAnswer={canMarkBestAnswer}
                    primaryColor={primaryColor}
                    isLast={index === comment.children.length - 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

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
