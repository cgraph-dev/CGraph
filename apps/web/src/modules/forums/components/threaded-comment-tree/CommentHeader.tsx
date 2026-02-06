/**
 * Comment Header
 *
 * Header section with avatar, author info, and collapse button.
 */

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { UserStars } from '@/modules/gamification/components/UserStars';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { formatTimeAgo } from '@/lib/utils';
import type { CommentTreeNode } from './types';

interface CommentHeaderProps {
  comment: CommentTreeNode;
  isOwnComment: boolean;
  hasChildren: boolean;
  descendantCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function CommentHeader({
  comment,
  isOwnComment,
  hasChildren,
  descendantCount,
  isCollapsed,
  onToggleCollapse,
}: CommentHeaderProps) {
  return (
    <div className="mb-2 flex items-center gap-3">
      {/* Avatar */}
      <ThemedAvatar
        src={comment.author.avatarUrl}
        alt={comment.author.displayName || comment.author.username || 'User'}
        size="small"
        avatarBorderId={comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null}
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
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">You</span>
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
          onClick={onToggleCollapse}
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
  );
}
