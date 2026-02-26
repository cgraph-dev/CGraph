/**
 * Comment item component with voting, replies, and nested children.
 * @module pages/forums/forum-post/comment-item
 */
/**
 * CommentItem component for ForumPost
 * Renders a single comment with voting, replies, and nested children
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { formatTimeAgo } from '@/lib/utils';
import MarkdownRenderer from '@/components/content/markdown-renderer';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { CommentItemProps } from './types';
import { MAX_COMMENT_INDENT, COMMENT_INDENT_PER_LEVEL } from './constants';

/**
 * unknown for the forums module.
 */
/**
 * Comment Item component.
 */
export function CommentItem({
  comment,
  onVote,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  depth = 0,
}: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(comment.isCollapsed);

  const marginLeft = Math.min(depth * COMMENT_INDENT_PER_LEVEL, MAX_COMMENT_INDENT);

  return (
    <div style={{ marginLeft }}>
      <div className="flex gap-2">
        {/* Thread line */}
        {depth > 0 && (
          <div className="flex flex-col items-center">
            <div
              className="w-px flex-1 cursor-pointer bg-dark-600 hover:bg-primary-500"
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          </div>
        )}

        <div className="flex-1">
          {/* Comment header */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link
              to={comment.author.username ? `/u/${comment.author.username}` : '#'}
              className="flex items-center gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-dark-600">
                {comment.author.avatarUrl ? (
                  <ThemedAvatar
                    src={comment.author.avatarUrl}
                    alt={comment.author.username || comment.author.displayName || 'User'}
                    size="xs"
                    avatarBorderId={
                      comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null
                    }
                  />
                ) : (
                  <span className="text-[10px]">
                    {(comment.author.username || comment.author.displayName || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-300 hover:underline">
                {comment.author.username || comment.author.displayName || 'Unknown'}
              </span>
            </Link>
            <span>•</span>
            <span>{formatTimeAgo(comment.createdAt)}</span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-white"
            >
              [{isCollapsed ? '+' : '-'}]
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Content */}
              <div className="mt-1">
                <MarkdownRenderer content={comment.content} className="text-sm" />
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                <button
                  onClick={() => onVote(comment.id, 1, comment.myVote)}
                  className={`rounded p-1 hover:bg-dark-700 ${
                    comment.myVote === 1 ? 'text-orange-500' : 'hover:text-orange-500'
                  }`}
                >
                  {comment.myVote === 1 ? (
                    <ArrowUpIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={`font-medium ${
                    comment.myVote === 1
                      ? 'text-orange-500'
                      : comment.myVote === -1
                        ? 'text-blue-500'
                        : ''
                  }`}
                >
                  {comment.score}
                </span>
                <button
                  onClick={() => onVote(comment.id, -1, comment.myVote)}
                  className={`rounded p-1 hover:bg-dark-700 ${
                    comment.myVote === -1 ? 'text-blue-500' : 'hover:text-blue-500'
                  }`}
                >
                  {comment.myVote === -1 ? (
                    <ArrowDownIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="rounded px-2 py-1 transition-colors hover:bg-dark-700"
                >
                  Reply
                </button>
                <button className="rounded px-2 py-1 transition-colors hover:bg-dark-700">
                  Share
                </button>
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="rounded-full bg-primary-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Child comments */}
              {comment.children && comment.children.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.children.map((child) => (
                    <CommentItem
                      key={child.id}
                      comment={child}
                      onVote={onVote}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      onSubmitReply={onSubmitReply}
                      isSubmitting={isSubmitting}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
