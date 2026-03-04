/**
 * Individual forum row component in category list.
 * @module
 */
import { motion } from 'motion/react';
import {
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  LockClosedIcon,
  SparklesIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import type { Forum } from '@/modules/forums/store';

interface ForumRowProps {
  forum: Forum;
  index: number;
  primaryColor: string;
  variant: 'default' | 'compact' | 'cards';
  onForumClick?: (forum: Forum) => void;
}

/**
 * A single forum row rendered inside an expanded category.
 */
export function ForumRow({ forum, index, primaryColor, variant, onForumClick }: ForumRowProps) {
  const isHot = forum.hotScore > 100;
  const isNew = new Date(forum.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      key={forum.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex cursor-pointer items-center gap-4 border-t border-white/[0.06]/50 p-4 pl-14 hover:bg-white/[0.08]/30"
      onClick={() => onForumClick?.(forum)}
    >
      {/* Forum Icon */}
      <div className="relative">
        {forum.iconUrl ? (
          <img src={forum.iconUrl} alt={forum.name} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
        )}

        {/* Status Badges */}
        {(isHot || isNew) && (
          <div className="absolute -right-1 -top-1">
            {isHot ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                <FireIcon className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <SparklesIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forum Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-medium group-hover:underline">{forum.name}</h4>
          {forum.isPrivate && <LockClosedIcon className="h-4 w-4 text-gray-500" />}
        </div>
        {forum.description && <p className="truncate text-sm text-gray-400">{forum.description}</p>}
      </div>

      {/* Stats */}
      {variant !== 'compact' && (
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="min-w-[60px] text-center">
            <div className="font-medium text-white">{forum.memberCount.toLocaleString()}</div>
            <div className="text-xs">Members</div>
          </div>
          <div className="min-w-[60px] text-center">
            <div className="font-medium text-white">{forum.score.toLocaleString()}</div>
            <div className="text-xs">Score</div>
          </div>
        </div>
      )}

      {/* Arrow */}
      <ChevronRightIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-white" />
    </motion.div>
  );
}
