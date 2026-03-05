/**
 * Channel List Item — Discord-exact channel row
 *
 * Features:
 * - Icon by type: # text, speaker voice, megaphone announcements, lock private
 * - Truncated channel name
 * - Unread: bold name + white dot
 * - Mentions: brand badge with count
 * - Muted: dimmed text + mute icon
 * - Hover: action icons (invite, settings) slide in
 * - Active: brighter bg + bold name
 *
 * @module modules/groups/components/channel-list-item
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useParams } from 'react-router-dom';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  MegaphoneIcon,
  LockClosedIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  UserPlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';
import Tooltip from '@/components/ui/tooltip';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ChannelListItemProps {
  channel: {
    id: string;
    name: string;
    type: 'text' | 'voice' | 'video' | 'announcement' | 'forum';
    isPrivate?: boolean;
    isMuted?: boolean;
    unreadCount?: number;
    mentionCount?: number;
  };
  className?: string;
}

// ── Icon Map ───────────────────────────────────────────────────────────

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  video: VideoCameraIcon,
  announcement: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
};

// ── Component ──────────────────────────────────────────────────────────

export function ChannelListItem({ channel, className }: ChannelListItemProps) {
  const { groupId } = useParams();
  const [hovered, setHovered] = useState(false);

  const Icon = channel.isPrivate ? LockClosedIcon : (typeIcons[channel.type] ?? HashtagIcon);
  const hasUnread = (channel.unreadCount ?? 0) > 0;
  const hasMentions = (channel.mentionCount ?? 0) > 0;

  return (
    <NavLink
      to={`/groups/${groupId}/channels/${channel.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn('group relative block px-2', className)}
    >
      {({ isActive }) => (
        <motion.div
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
          className={cn(
            'relative flex items-center gap-1.5 rounded-md px-2 py-[5px] transition-colors',
            isActive && 'bg-white/[0.08]',
            channel.isMuted && 'opacity-40',
          )}
        >
          {/* Unread left dot */}
          {hasUnread && !isActive && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute -left-1.5 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-white"
            />
          )}

          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="active-channel"
              className="absolute inset-0 rounded-md bg-white/[0.08]"
              transition={springs.snappy}
            />
          )}

          {/* Channel icon */}
          <Icon
            className={cn(
              'relative h-4 w-4 flex-shrink-0',
              isActive ? 'text-white' : 'text-gray-500',
              hasUnread && !isActive && 'text-gray-300',
            )}
          />

          {/* Channel name */}
          <span
            className={cn(
              'relative flex-1 truncate text-[15px]',
              isActive ? 'font-semibold text-white' : 'font-medium text-gray-500',
              hasUnread && !isActive && 'font-semibold text-gray-200',
              channel.isMuted && 'text-gray-600',
            )}
          >
            {channel.name}
          </span>

          {/* Hover action icons */}
          <AnimatePresence>
            {hovered && !hasMentions && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                className="relative flex items-center gap-0.5"
              >
                <Tooltip content="Create Invite" side="top">
                  <button className="rounded p-0.5 hover:bg-white/[0.08]">
                    <UserPlusIcon className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </Tooltip>
                <Tooltip content="Edit Channel" side="top">
                  <button className="rounded p-0.5 hover:bg-white/[0.08]">
                    <Cog6ToothIcon className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mention count badge */}
          {hasMentions && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.superBouncy}
              className="relative flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1"
            >
              <span className="text-[10px] font-bold text-white">
                {(channel.mentionCount ?? 0) > 99 ? '99+' : channel.mentionCount}
              </span>
            </motion.div>
          )}

          {/* Muted icon */}
          {channel.isMuted && !hovered && (
            <SpeakerWaveIcon className="relative h-3.5 w-3.5 text-gray-600" />
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

export default ChannelListItem;
