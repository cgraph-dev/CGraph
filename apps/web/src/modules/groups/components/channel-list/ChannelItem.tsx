import { motion } from 'framer-motion';
import { NavLink, useParams } from 'react-router-dom';
import { HashtagIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { channelTypeIcons, channelTypeColors } from './constants';
import type { ChannelItemProps } from './types';

export function ChannelItem({ channel, isActive }: ChannelItemProps) {
  const { groupId } = useParams();

  const Icon = channelTypeIcons[channel.type] || HashtagIcon;
  const iconColor = channelTypeColors[channel.type] || 'text-gray-400';

  return (
    <NavLink
      to={`/groups/${groupId}/channels/${channel.id}`}
      onClick={() => HapticFeedback.light()}
    >
      {({ isActive: routeActive }) => (
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
            routeActive || isActive
              ? 'bg-primary-600/20 text-white'
              : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
          }`}
        >
          {/* Channel icon */}
          <Icon className={`h-5 w-5 flex-shrink-0 ${routeActive ? 'text-white' : iconColor}`} />

          {/* Channel name */}
          <span className="flex-1 truncate text-sm font-medium">{channel.name}</span>

          {/* NSFW badge */}
          {channel.isNsfw && (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
              NSFW
            </span>
          )}

          {/* Private indicator */}
          {channel.type === 'text' && (
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              {/* Add lock icon for private channels if needed */}
            </span>
          )}

          {/* Unread indicator */}
          {channel.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5"
            >
              <span className="text-[10px] font-bold text-white">
                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}
