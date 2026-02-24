/**
 * ChannelItem component
 * @module pages/groups
 */

import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { springs } from '@/lib/animation-presets';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ChannelItemProps } from './types';

export function ChannelItem({ channel, groupId, isActive }: ChannelItemProps) {
  const getIcon = () => {
    switch (channel.type) {
      case 'voice':
        return SpeakerWaveIcon;
      case 'video':
        return VideoCameraIcon;
      case 'announcement':
        return MegaphoneIcon;
      case 'forum':
        return ChatBubbleLeftRightIcon;
      default:
        return HashtagIcon;
    }
  };

  const Icon = getIcon();

  return (
    <NavLink
      to={`/groups/${groupId}/channels/${channel.id}`}
      onClick={() => HapticFeedback.light()}
      className="relative mx-2"
    >
      <motion.div
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative z-10 flex items-center gap-1.5 rounded px-2 py-1.5 transition-all ${
          isActive
            ? 'bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent text-white'
            : 'text-gray-400 hover:bg-dark-700/50 hover:text-gray-200'
        }`}
        style={isActive ? { boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' } : {}}
      >
        {isActive && (
          <motion.div
            layoutId={`activeChannel-${groupId}`}
            className="absolute -left-2 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
            style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}
            transition={springs.bouncy}
          />
        )}
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`}
          style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' } : {}}
        />
        <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{channel.name}</span>
        <AnimatePresence>
          {channel.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={springs.bouncy}
              className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white"
              style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
            >
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}
