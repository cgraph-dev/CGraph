/**
 * StoriesRow — Instagram DM-style stories/status row at the top of conversation list.
 * @module modules/chat/components/conversation-list/stories-row
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface StoryUser {
  id: string;
  name: string;
  avatarUrl?: string;
  hasUnseenStory: boolean;
  isOwnStory?: boolean;
}

interface StoriesRowProps {
  stories: StoryUser[];
  onStoryPress?: (userId: string) => void;
  onCreateStory?: () => void;
  className?: string;
}

/**
 * Horizontal scrollable story ring row like Instagram DMs.
 */
export function StoriesRow({ stories, onStoryPress, onCreateStory, className }: StoriesRowProps) {
  if (stories.length === 0) return null;

  return (
    <div className={cn('border-b border-white/[0.06] px-3 py-3', className)}>
      <div className="scrollbar-none flex gap-4 overflow-x-auto">
        {/* Your story — always first */}
        <button
          type="button"
          onClick={onCreateStory}
          className="flex flex-shrink-0 flex-col items-center gap-1"
        >
          <div className="relative">
            <Avatar size="md" name="You" storyRing={false} />
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center',
                'rounded-full bg-[#5865F2] text-white ring-2 ring-[rgb(18,18,24)]'
              )}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
          <span className="max-w-[52px] truncate text-[10px] text-white/40">Your story</span>
        </button>

        {/* Friend stories */}
        {stories
          .filter((s) => !s.isOwnStory)
          .map((story, i) => (
            <motion.button
              key={story.id}
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => onStoryPress?.(story.id)}
              className="flex flex-shrink-0 flex-col items-center gap-1"
            >
              <Avatar
                size="md"
                name={story.name}
                src={story.avatarUrl}
                storyRing={story.hasUnseenStory}
              />
              <span className="max-w-[52px] truncate text-[10px] text-white/40">
                {story.name.split(' ')[0]}
              </span>
            </motion.button>
          ))}
      </div>
    </div>
  );
}

export default StoriesRow;
