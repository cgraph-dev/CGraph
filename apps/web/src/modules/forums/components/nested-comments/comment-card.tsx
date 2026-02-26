/**
 * Comment Card Component
 *
 * Single comment display with all interactions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useAuthStore } from '@/modules/auth/store';
import { CommentHeader } from './comment-header';
import { CommentVoteButtons } from './comment-vote-buttons';
import { ReplyForm, EditForm } from './comment-forms';
import { BestAnswerBadge } from './best-answer-badge';
import type { Comment } from './types';
import { tweens } from '@/lib/animation-presets';

interface CommentCardProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  isAuthorOfPost: boolean;
  canMarkBestAnswer: boolean;
  isCollapsed: boolean;
  isReplying: boolean;
  isEditing: boolean;
  replyContent: string;
  editContent: string;
  onToggleCollapse: (commentId: string) => void;
  onSetReplyingTo: (commentId: string | null) => void;
  onSetEditingComment: (commentId: string | null) => void;
  onSetReplyContent: (content: string) => void;
  onSetEditContent: (content: string) => void;
  onReply: (parentId: string | null) => Promise<void>;
  onEdit: (commentId: string) => Promise<void>;
  onVote: (commentId: string, value: 1 | -1 | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onMarkBestAnswer: (commentId: string) => Promise<void>;
  sortedComments: (comments: Comment[]) => Comment[];
  renderComment: (comment: Comment, depth: number) => React.ReactElement;
}

/**
 * unknown for the forums module.
 */
/**
 * Comment Card display component.
 */
export function CommentCard({
  comment,
  depth,
  maxDepth,
  isAuthorOfPost,
  canMarkBestAnswer,
  isCollapsed,
  isReplying,
  isEditing,
  replyContent,
  editContent,
  onToggleCollapse,
  onSetReplyingTo,
  onSetEditingComment,
  onSetReplyContent,
  onSetEditContent,
  onReply,
  onEdit,
  onVote,
  onDelete,
  onMarkBestAnswer,
  sortedComments,
  renderComment,
}: CommentCardProps) {
  const hasReplies = comment.replies && comment.replies.length > 0;
  const user = useAuthStore.getState().user;
  const isOwnComment = user?.id === comment.authorId;
  const canEdit = isOwnComment;
  const canDelete = isOwnComment || isAuthorOfPost;
  const indentLevel = Math.min(depth, maxDepth);
  const continueThread = depth < maxDepth;

  return (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={tweens.standard}
      className={`${indentLevel > 0 ? 'ml-6 md:ml-12' : ''} relative`}
      style={{
        borderLeft: indentLevel > 0 ? '2px solid rgba(16, 185, 129, 0.2)' : 'none',
        paddingLeft: indentLevel > 0 ? '16px' : '0',
      }}
    >
      <GlassCard
        variant={comment.isBestAnswer ? 'neon' : 'frosted'}
        glow={comment.isBestAnswer}
        className={`mb-3 ${comment.isBestAnswer ? 'border-green-500/50' : ''}`}
      >
        {comment.isBestAnswer && <BestAnswerBadge />}

        <div className="p-4">
          <CommentHeader
            comment={comment}
            canEdit={canEdit}
            canDelete={canDelete}
            canMarkBestAnswer={canMarkBestAnswer}
            onEdit={() => {
              onSetEditingComment(comment.id);
              onSetEditContent(comment.content);
            }}
            onDelete={() => onDelete(comment.id)}
            onMarkBestAnswer={() => onMarkBestAnswer(comment.id)}
          />

          {/* Comment Content */}
          {isEditing ? (
            <EditForm
              content={editContent}
              onContentChange={onSetEditContent}
              onSubmit={() => onEdit(comment.id)}
              onCancel={() => {
                onSetEditingComment(null);
                onSetEditContent('');
              }}
            />
          ) : (
            <div className="mb-3 whitespace-pre-wrap break-words text-gray-200">
              {comment.content}
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <CommentVoteButtons comment={comment} onVote={onVote} />

            {/* Reply Button */}
            <button
              onClick={() => {
                onSetReplyingTo(isReplying ? null : comment.id);
                onSetReplyContent('');
                HapticFeedback.light();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-primary-500/20 hover:text-primary-400"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>Reply</span>
            </button>

            {/* Collapse Thread Button */}
            {hasReplies && (
              <button
                onClick={() => onToggleCollapse(comment.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-dark-700 hover:text-gray-200"
              >
                <span>
                  {isCollapsed ? 'Show' : 'Hide'} {comment.replies.length} replies
                </span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <ReplyForm
              authorUsername={comment.author.username}
              content={replyContent}
              onContentChange={onSetReplyContent}
              onSubmit={() => onReply(comment.id)}
              onCancel={() => {
                onSetReplyingTo(null);
                onSetReplyContent('');
              }}
            />
          )}
        </div>
      </GlassCard>

      {/* Nested Replies */}
      {!isCollapsed && hasReplies && continueThread && (
        <div className="space-y-2">
          {sortedComments(comment.replies).map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}

      {/* Max Depth Reached */}
      {!isCollapsed && hasReplies && !continueThread && (
        <div className="mb-3 ml-6 md:ml-12">
          <button className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300">
            <span>Continue this thread →</span>
            <span className="text-gray-500">({comment.replies.length} more)</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
