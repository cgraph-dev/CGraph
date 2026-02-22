/**
 * SearchResultItem Component
 *
 * Displays a single search result with appropriate icon and metadata.
 */

import { motion } from 'framer-motion';
import { FireIcon, ChatBubbleLeftIcon, HashtagIcon, TagIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';
import type { SearchResultItemProps } from './types';

export function SearchResultItem({
  result,
  index,
  isSelected,
  primaryColor,
  onClick,
}: SearchResultItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`cursor-pointer p-3 transition-colors ${
        isSelected ? 'bg-dark-600' : 'hover:bg-dark-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {result.type === 'user' ? (
          <ThemedAvatar
            src={result.author.avatarUrl}
            alt={result.author.username}
            size="medium"
            avatarBorderId={result.author.avatarBorderId ?? result.author.avatar_border_id ?? null}
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            {result.type === 'post' ? (
              <ChatBubbleLeftIcon className="h-5 w-5" style={{ color: primaryColor }} />
            ) : result.type === 'comment' ? (
              <HashtagIcon className="h-5 w-5" style={{ color: primaryColor }} />
            ) : (
              <TagIcon className="h-5 w-5" style={{ color: primaryColor }} />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-500">{result.type}</span>
            {result.forumName && (
              <span className="text-xs text-gray-400">in {result.forumName}</span>
            )}
          </div>
          <p className="truncate font-medium">{result.title}</p>
          <p className="line-clamp-2 text-sm text-gray-400">{result.snippet}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>by {result.author.username}</span>
            <span>{formatTimeAgo(result.createdAt)}</span>
            {result.score !== undefined && (
              <span className="flex items-center gap-0.5">
                <FireIcon className="h-3 w-3" />
                {result.score}
              </span>
            )}
            {result.commentCount !== undefined && (
              <span className="flex items-center gap-0.5">
                <ChatBubbleLeftIcon className="h-3 w-3" />
                {result.commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
