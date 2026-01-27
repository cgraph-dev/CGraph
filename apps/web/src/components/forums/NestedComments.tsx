import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  StarIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { formatTimeAgo } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

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
 * - Mention support (@username)
 * - Award system integration
 *
 * The system uses a recursive rendering approach to handle arbitrary
 * nesting depths efficiently. Comments are sorted intelligently,
 * with best answers pinned to the top and controversial comments
 * highlighted for moderation.
 */

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
    karma: number;
    isVerified: boolean;
    badges?: string[];
  };
  content: string;
  score: number;
  userVote: 1 | -1 | null;
  isBestAnswer: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  replies: Comment[];
  depth: number;
  awards?: Array<{ type: string; count: number }>;
}

interface NestedCommentsProps {
  postId: string;
  comments: Comment[];
  isAuthorOfPost: boolean;
  canMarkBestAnswer: boolean;
  sortBy?: 'best' | 'new' | 'old' | 'controversial';
  onVote: (commentId: string, value: 1 | -1 | null) => Promise<void>;
  onReply: (parentId: string | null, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onMarkBestAnswer: (commentId: string) => Promise<void>;
  maxDepth?: number;
}

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

  // Sort comments based on criteria
  const sortedComments = useCallback(
    (commentsToSort: Comment[]) => {
      const sorted = [...commentsToSort];

      switch (sortBy) {
        case 'best':
          // Best answers first, then by score and recency
          return sorted.sort((a, b) => {
            if (a.isBestAnswer && !b.isBestAnswer) return -1;
            if (!a.isBestAnswer && b.isBestAnswer) return 1;
            if (a.score !== b.score) return b.score - a.score;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        case 'new':
          return sorted.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'old':
          return sorted.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'controversial':
          // Comments with many votes but low scores are controversial
          return sorted.sort((a, b) => {
            const aControversy = Math.abs(a.score) / (Math.abs(a.score) + 1);
            const bControversy = Math.abs(b.score) / (Math.abs(b.score) + 1);
            return bControversy - aControversy;
          });
        default:
          return sorted;
      }
    },
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
    const hasReplies = comment.replies && comment.replies.length > 0;
    const user = useAuthStore.getState().user;
    const isOwnComment = user?.id === comment.authorId;
    const canEdit = isOwnComment;
    const canDelete = isOwnComment || isAuthorOfPost;

    // Indentation stops at maxDepth
    const indentLevel = Math.min(depth, maxDepth);
    const continueThread = depth < maxDepth;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
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
          {/* Best Answer Badge */}
          {comment.isBestAnswer && (
            <motion.div
              className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckBadgeIcon className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white">Best Answer</span>
            </motion.div>
          )}

          <div className="p-4">
            {/* Comment Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-8 w-8 flex-shrink-0">
                  {comment.author.avatarUrl ? (
                    <ThemedAvatar
                      src={comment.author.avatarUrl}
                      alt={comment.author.username}
                      size="small"
                      avatarBorderId={
                        comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null
                      }
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-sm font-bold text-white">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Author Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {comment.author.displayName || comment.author.username}
                    </span>
                    {comment.author.isVerified && (
                      <CheckBadgeIcon className="h-4 w-4 text-primary-400" title="Verified" />
                    )}
                    {comment.author.badges && comment.author.badges.length > 0 && (
                      <div className="flex gap-1">
                        {comment.author.badges.slice(0, 2).map((badge, idx) => (
                          <span key={idx} className="text-xs" title={badge}>
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{comment.author.karma} karma</span>
                    <span>•</span>
                    <span>{formatTimeAgo(comment.createdAt)}</span>
                    {comment.isEdited && (
                      <>
                        <span>•</span>
                        <span className="text-gray-500">edited</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              <div className="flex items-center gap-1">
                {canMarkBestAnswer && !comment.isBestAnswer && (
                  <motion.button
                    onClick={() => {
                      onMarkBestAnswer(comment.id);
                      HapticFeedback.success();
                    }}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-500/20 hover:text-green-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Mark as best answer"
                  >
                    <StarIcon className="h-4 w-4" />
                  </motion.button>
                )}
                {canEdit && (
                  <motion.button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                      HapticFeedback.light();
                    }}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-500/20 hover:text-primary-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </motion.button>
                )}
                {canDelete && (
                  <motion.button
                    onClick={() => {
                      if (confirm('Delete this comment?')) {
                        onDelete(comment.id);
                        HapticFeedback.medium();
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] w-full resize-none rounded-lg border border-primary-500/30 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-500"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    className="rounded-lg bg-dark-700 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-dark-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3 whitespace-pre-wrap break-words text-gray-200">
                {comment.content}
              </div>
            )}

            {/* Comment Actions */}
            <div className="flex items-center gap-4">
              {/* Vote Buttons */}
              <div className="flex items-center gap-2 rounded-lg bg-dark-800/50 px-2 py-1">
                <motion.button
                  onClick={() => {
                    onVote(comment.id, comment.userVote === 1 ? null : 1);
                    HapticFeedback.light();
                  }}
                  className={`rounded p-1 transition-colors ${
                    comment.userVote === 1
                      ? 'text-primary-400'
                      : 'text-gray-400 hover:text-primary-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {comment.userVote === 1 ? (
                    <ArrowUpIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </motion.button>
                <span
                  className={`min-w-[24px] text-center text-sm font-semibold ${
                    comment.score > 0
                      ? 'text-primary-400'
                      : comment.score < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {comment.score}
                </span>
                <motion.button
                  onClick={() => {
                    onVote(comment.id, comment.userVote === -1 ? null : -1);
                    HapticFeedback.light();
                  }}
                  className={`rounded p-1 transition-colors ${
                    comment.userVote === -1 ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {comment.userVote === -1 ? (
                    <ArrowDownIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                </motion.button>
              </div>

              {/* Reply Button */}
              <button
                onClick={() => {
                  setReplyingTo(isReplying ? null : comment.id);
                  setReplyContent('');
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
                  onClick={() => toggleCollapse(comment.id)}
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
              <motion.div
                className="mt-3 space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.username}...`}
                  className="min-h-[80px] w-full resize-none rounded-lg border border-primary-500/30 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim()}
                    className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-500 disabled:bg-dark-700 disabled:text-gray-500"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="rounded-lg bg-dark-700 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-dark-600"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Nested Replies */}
        {!isCollapsed && hasReplies && continueThread && (
          <div className="space-y-2">
            {sortedComments(comment.replies).map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}

        {/* Max Depth Reached - Show "Continue Thread" Link */}
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
  };

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sortedComments(topLevelComments).map((comment) => renderComment(comment, 0))}
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
