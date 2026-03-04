/**
 * Individual channel item component.
 * @module
 */
import { motion } from 'motion/react';
import { NavLink, useParams } from 'react-router-dom';
import { HashtagIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { channelTypeIcons, channelTypeColors } from './constants';
import type { ChannelItemProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * unknown for the groups module.
 */
/**
 * Channel Item component.
 */
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
          className={`relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
            routeActive || isActive
              ? 'text-white'
              : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
          }`}
        >
          {/* Active indicator with shared layout animation */}
          {(routeActive || isActive) && (
            <motion.div
              layoutId="activeChannelIndicator"
              className="absolute inset-0 rounded-lg bg-primary-600/20"
              transition={springs.snappy}
            />
          )}

          {/* Unread glow indicator — left bar pulse */}
          {channel.unreadCount > 0 && !routeActive && !isActive && (
            <motion.div
              className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r-full bg-primary-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={loop(tweens.ambient)}
            />
          )}
          {/* Channel icon */}
          <Icon className={`h-5 w-5 flex-shrink-0 ${routeActive ? 'text-white' : iconColor}`} />

          {/* Channel name — bolder + glow pulse when unread */}
          <span
            className={`flex-1 truncate text-sm ${
              channel.unreadCount > 0 ? 'font-semibold text-white' : 'font-medium'
            }`}
          >
            {channel.name}
          </span>

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
              transition={springs.superBouncy}
              className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5"
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={loop(tweens.ambient)}
                className="absolute inset-0 rounded-full bg-red-500"
              />
              <span className="relative text-[10px] font-bold text-white">
                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}
