/**
 * ConversationItem component
 * @module modules/chat/components/conversation-list
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { chatLogger } from '@/lib/logger';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import type { ConversationItemProps } from './types';
import { ConversationMenu } from './ConversationMenu';
import {
  getConversationName,
  getConversationAvatar,
  getConversationAvatarBorderId,
  getConversationOnlineStatus,
  formatMessageTime,
} from './utils';

export function ConversationItem({
  conversation,
  currentUserId,
  typingUsers,
  onClick,
}: ConversationItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const name = getConversationName(conversation, currentUserId);
  const avatarUrl = getConversationAvatar(conversation, currentUserId);
  const avatarBorderId = getConversationAvatarBorderId(conversation, currentUserId);
  const isOnline = getConversationOnlineStatus(conversation, currentUserId);
  const lastMessageTime = conversation.lastMessage?.createdAt
    ? formatMessageTime(conversation.lastMessage.createdAt)
    : '';

  // Typing indicator text
  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length > 1
        ? 'Several people are typing...'
        : null;

  return (
    <NavLink to={`/messages/${conversation.id}`}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 2 }}
          onClick={onClick}
          className={`relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
            isActive
              ? 'border-l-2 border-primary-500 bg-primary-600/10'
              : conversation.unreadCount > 0
                ? 'border-l-2 border-primary-400/50 bg-primary-500/5 hover:bg-dark-700/50'
                : 'hover:bg-dark-700/50'
          }`}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.isGroup ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-purple-600">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <ThemedAvatar
                src={avatarUrl}
                alt={name}
                size="medium"
                avatarBorderId={avatarBorderId}
              />
            )}
            {isOnline && !conversation.isGroup && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-dark-900 bg-green-500" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="truncate font-semibold text-white">{name}</span>
              <span className="text-xs text-gray-500">{lastMessageTime}</span>
            </div>

            <div className="mt-0.5 flex items-center justify-between">
              {typingText ? (
                <span className="truncate text-sm text-primary-400">{typingText}</span>
              ) : (
                <span className="truncate text-sm text-gray-400">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </span>
              )}

              {conversation.unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5"
                  style={{
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border border-primary-400/60"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-2"
              >
                <ConversationMenu
                  conversation={conversation}
                  onAction={(action) => {
                    chatLogger.debug('Menu action:', action, conversation.id);
                    setShowMenu(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </NavLink>
  );
}
