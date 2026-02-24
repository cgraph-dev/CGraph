/**
 * ConversationItem Component
 *
 * Single conversation item in the sidebar list.
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getConversationName, getConversationAvatar, getConversationAvatarBorderId } from './utils';
import type { ConversationItemProps } from './types';
import { springs } from '@/lib/animation-presets/presets';
import { tweens, loop } from '@/lib/animation-presets';

export function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onlineStatus,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const name = getConversationName(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const avatarBorderId = getConversationAvatarBorderId(conversation, currentUserId);
  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  // Use Phoenix Presence for real-time online status (single source of truth)
  const isOnline = otherParticipant
    ? onlineStatus[`${conversation.id}-${otherParticipant.userId}`] || false
    : false;

  return (
    <NavLink
      to={`/messages/${conversation.id}`}
      className={`group relative flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
        isActive
          ? 'border-l-2 border-primary-500 bg-primary-500/10'
          : 'border-l-2 border-transparent hover:bg-primary-500/5'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        HapticFeedback.selection();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      {isHovered && !isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Avatar with gradient border */}
      <motion.div
        className="relative z-10 flex-shrink-0"
        whileHover={{ scale: 1.08 }}
        transition={springs.snappy}
      >
        <div
          className={`h-12 w-12 overflow-hidden rounded-full p-0.5 transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-br from-primary-500 to-purple-600'
              : isHovered
                ? 'bg-gradient-to-br from-primary-500/50 to-purple-600/50'
                : 'bg-dark-700'
          }`}
        >
          {avatar ? (
            <ThemedAvatar
              src={avatar}
              alt={name}
              size="medium"
              className="h-full w-full"
              avatarBorderId={avatarBorderId}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-purple-400 bg-clip-text text-sm font-bold text-transparent">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {conversation.type === 'direct' && isOnline && (
          <motion.div
            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-dark-900 bg-green-500 shadow-lg"
            animate={{
              boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 6px rgba(34, 197, 94, 0)'],
            }}
            transition={loop(tweens.ambient)}
          />
        )}
      </motion.div>

      {/* Content */}
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate font-semibold transition-colors ${
              conversation.unreadCount > 0
                ? 'text-white'
                : isActive
                  ? 'text-primary-300'
                  : 'text-gray-300'
            }`}
          >
            {name}
          </span>
          {conversation.lastMessage && (
            <span
              className={`flex-shrink-0 text-xs transition-colors ${
                isActive ? 'text-primary-400' : 'text-gray-500'
              }`}
            >
              {formatTimeAgo(conversation.lastMessage.createdAt, { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`truncate text-sm transition-colors ${
              conversation.unreadCount > 0 ? 'font-medium text-gray-300' : 'text-gray-500'
            }`}
          >
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
          <AnimatePresence>
            {conversation.unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: 0,
                }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  rotate: springs.wobbly,
                }}
                className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-purple-600 px-1.5 text-xs font-bold text-white shadow-lg"
                style={{
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
                }}
              >
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </NavLink>
  );
}
