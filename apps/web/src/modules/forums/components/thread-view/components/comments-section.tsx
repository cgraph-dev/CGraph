/**
 * CommentsSection Component
 *
 * Comments header, view mode toggle, export button,
 * and linear (virtualized) or threaded comment display.
 */

import { motion } from 'framer-motion';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { ThreadedCommentTree } from '../../threaded-comment-tree';
import type { Comment } from '@/modules/forums/store';
import type { CommentViewMode } from '../types';
// Import siblings directly to avoid circular dep through barrel
import { ViewModeToggle } from './view-mode-toggle';
import { CommentCard } from './comment-card';
import { EmptyCommentsState } from './empty-state';
import { ReplyIndicator } from './reply-indicator';
import type { Virtualizer } from '@tanstack/react-virtual';

interface CommentsSectionProps {
  comments: Comment[];
  sortedComments: Comment[];
  viewMode: CommentViewMode;
  onViewModeChange: (mode: CommentViewMode) => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  currentUserId?: string;
  primaryColor: string;
  replyToId?: string;
  onCancelReply: () => void;
  onReply: (id: string) => void;
  onCommentVote: (commentId: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  onThreadedVote: (
    commentId: string,
    value: 1 | -1 | null,
    currentVote: 1 | -1 | null
  ) => Promise<void>;
  onExport?: () => void;
  onMarkBestAnswer?: (commentId: string) => void;
  canMarkBestAnswer: boolean;
}

/**
 * unknown for the forums module.
 */
/**
 * Comments Section section component.
 */
export function CommentsSection({
  comments,
  sortedComments,
  viewMode,
  onViewModeChange,
  parentRef,
  rowVirtualizer,
  currentUserId,
  primaryColor,
  replyToId,
  onCancelReply,
  onReply,
  onCommentVote,
  onThreadedVote,
  onExport,
  onMarkBestAnswer,
  canMarkBestAnswer,
}: CommentsSectionProps) {
  return (
    <div>
      {/* Comments Header with View Mode Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {comments.length} Comment{comments.length !== 1 ? 's' : ''}
        </h2>

        <div className="flex items-center gap-2">
          {onExport && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExport}
              className="flex items-center gap-1 rounded-lg bg-dark-600 px-3 py-1.5 text-sm text-gray-400 hover:bg-dark-500 hover:text-white"
              title="Export thread"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          )}

          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>

      {/* Reply-To Indicator */}
      <ReplyIndicator replyToId={replyToId} onCancel={onCancelReply} />

      {/* Comments Display - Linear or Threaded */}
      {viewMode === 'threaded' ? (
        <ThreadedCommentTree
          comments={comments}
          currentUserId={currentUserId}
          onVote={onThreadedVote}
          onReply={onReply}
          onMarkBestAnswer={onMarkBestAnswer}
          canMarkBestAnswer={canMarkBestAnswer}
          primaryColor={primaryColor}
        />
      ) : (
        /* Linear View with Virtualization */
        <div
          ref={parentRef}
          className="scrollbar-thin scrollbar-thumb-dark-600 h-[600px] overflow-y-auto"
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
              if (!comment) return null;
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
                  <CommentCard comment={comment} index={virtualRow.index} onVote={onCommentVote} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {comments.length === 0 && <EmptyCommentsState />}
    </div>
  );
}
