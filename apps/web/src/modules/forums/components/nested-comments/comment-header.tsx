/**
 * Comment Header Component
 *
 * Displays author info, badges, and action buttons
 */

import { motion } from 'motion/react';
import { CheckBadgeIcon, StarIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Comment } from './types';

interface CommentHeaderProps {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  canMarkBestAnswer: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkBestAnswer: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Comment Header component.
 */
export function CommentHeader({
  comment,
  canEdit,
  canDelete,
  canMarkBestAnswer,
  onEdit,
  onDelete,
  onMarkBestAnswer,
}: CommentHeaderProps) {
  return (
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
            <span>{comment.author.pulse} pulse</span>
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
              onMarkBestAnswer();
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
              onEdit();
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
                onDelete();
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
  );
}
