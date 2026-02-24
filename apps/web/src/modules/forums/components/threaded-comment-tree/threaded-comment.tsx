/**
 * Threaded Comment
 *
 * Individual comment component in the threaded tree.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ThreadLine } from './thread-line';
import { CommentHeader } from './comment-header';
import { CommentActions } from './comment-actions';
import { countDescendants } from './utils';
import type { ThreadedCommentProps } from './types';
import { tweens } from '@/lib/animation-presets';

export const ThreadedComment = memo(function ThreadedComment({
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
      <ThreadLine depth={depth} isLast={isLast} />

      {/* Comment Content */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tweens.fast}
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

        <CommentHeader
          comment={comment}
          isOwnComment={isOwnComment}
          hasChildren={hasChildren}
          descendantCount={descendantCount}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Comment Content */}
        <div
          className="prose prose-invert prose-sm max-w-none text-gray-300"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } }),
          }}
        />

        <CommentActions
          score={comment.score}
          currentVote={currentVote}
          isBestAnswer={comment.isBestAnswer}
          canMarkBestAnswer={canMarkBestAnswer ?? false}
          isVoting={isVoting}
          onVote={handleVote}
          onReply={handleReply}
          onMarkBestAnswer={handleMarkBestAnswer}
        />
      </motion.div>

      {/* Children Comments */}
      {hasChildren && !shouldContinueInNewThread && (
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={tweens.fast}
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
