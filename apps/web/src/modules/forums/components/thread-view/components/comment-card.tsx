/**
 * Comment Card Component
 * @module modules/forums/components/thread-view/components/comment-card
 */

import { motion } from 'framer-motion';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';
import type { Comment } from '@/modules/forums/store';

interface CommentCardProps {
  comment: Comment;
  index: number;
  onVote: (commentId: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
}

export function CommentCard({ comment, index, onVote }: CommentCardProps) {
  return (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard
        variant={comment.isBestAnswer ? 'neon' : 'frosted'}
        className={`mb-2 p-4 ${comment.isBestAnswer ? 'border-2 border-green-500' : ''}`}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => onVote(comment.id, 1, comment.userVote ?? null)}
              className={
                comment.userVote === 1 ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
              }
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">{comment.score}</span>
            <button
              onClick={() => onVote(comment.id, -1, comment.userVote ?? null)}
              className={
                comment.userVote === -1 ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }
            >
              <ChevronUpIcon className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Comment content */}
          <div className="min-w-0 flex-1">
            {comment.isBestAnswer && (
              <div className="mb-2 flex items-center gap-1 text-sm font-medium text-green-500">
                <StarIconSolid className="h-4 w-4" />
                Best Answer
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <ThemedAvatar
                src={comment.author.avatarUrl}
                alt={comment.author.displayName ?? comment.author.username ?? 'User'}
                size="xs"
                avatarBorderId={
                  comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null
                }
              />
              <span className="text-sm font-medium">
                {comment.author.displayName || comment.author.username}
              </span>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">{comment.content}</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
