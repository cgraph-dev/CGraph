import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

// Reserved for future use
void formatDistanceToNow;
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  BellSlashIcon,
  BookmarkIcon as PinIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useChatStore, type Conversation } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

/**
 * ConversationList Component
 *
 * Displays all conversations with filtering and organization.
 * Features:
 * - Search conversations
 * - Filter by type (DM, Group)
 * - Pinned conversations
 * - Unread indicators
 * - Typing indicators
 * - Last message preview
 * - Archive/Mute actions
 * - New conversation modal
 * - Online status indicators
 */

interface ConversationListProps {
  className?: string;
}

type FilterType = 'all' | 'direct' | 'group' | 'unread';

export function ConversationList({ className = '' }: ConversationListProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, typingUsers } = useChatStore();
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showNewChat, setShowNewChat] = useState(false);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (conv) =>
          getConversationName(conv, user?.id).toLowerCase().includes(query) ||
          conv.lastMessage?.content.toLowerCase().includes(query)
      );
    }

    // Apply filter
    switch (filter) {
      case 'direct':
        result = result.filter((conv) => !conv.isGroup);
        break;
      case 'group':
        result = result.filter((conv) => conv.isGroup);
        break;
      case 'unread':
        result = result.filter((conv) => conv.unreadCount > 0);
        break;
    }

    // Sort: pinned first, then by last message
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return result;
  }, [conversations, searchQuery, filter, user?.id]);

  // Group by pinned
  const { pinnedConversations, regularConversations } = useMemo(() => {
    return {
      pinnedConversations: filteredConversations.filter((c) => c.isPinned),
      regularConversations: filteredConversations.filter((c) => !c.isPinned),
    };
  }, [filteredConversations]);

  const handleConversationClick = useCallback(
    (conv: Conversation) => {
      HapticFeedback.light();
      navigate(`/messages/${conv.id}`);
    },
    [navigate]
  );

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNewChat(true)}
            className="rounded-xl bg-primary-600 p-2 text-white"
            style={{ backgroundColor: colors.primary }}
          >
            <PlusIcon className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-700/50 bg-dark-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2">
          {[
            { id: 'all' as FilterType, label: 'All' },
            { id: 'direct' as FilterType, label: 'Direct' },
            { id: 'group' as FilterType, label: 'Groups' },
            { id: 'unread' as FilterType, label: 'Unread' },
          ].map((f) => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned */}
        {pinnedConversations.length > 0 && (
          <div className="py-2">
            <div className="flex items-center gap-2 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <PinIcon className="h-3 w-3" />
              Pinned
            </div>
            {pinnedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={user?.id}
                typingUsers={typingUsers[conv.id] || []}
                onClick={() => handleConversationClick(conv)}
              />
            ))}
          </div>
        )}

        {/* Regular */}
        {regularConversations.length > 0 && (
          <div className="py-2">
            {pinnedConversations.length > 0 && (
              <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                All Messages
              </div>
            )}
            {regularConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={user?.id}
                typingUsers={typingUsers[conv.id] || []}
                onClick={() => handleConversationClick(conv)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <ChatBubbleLeftRightIcon className="mb-4 h-16 w-16 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-400">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </h3>
            <p className="mt-1 text-center text-sm text-gray-500">
              {searchQuery
                ? 'Try a different search term'
                : 'Start a new conversation to connect with others'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNewChat(true)}
                className="mt-4 rounded-xl bg-primary-600 px-4 py-2 font-medium text-white"
              >
                Start a Conversation
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      </AnimatePresence>
    </div>
  );
}

// Conversation Item Component
function ConversationItem({
  conversation,
  currentUserId,
  typingUsers,
  onClick,
}: {
  conversation: Conversation;
  currentUserId?: string;
  typingUsers: string[];
  onClick: () => void;
}) {
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
            isActive ? 'border-l-2 border-primary-500 bg-primary-600/10' : 'hover:bg-dark-700/50'
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
                >
                  <span className="text-[10px] font-bold text-white">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
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
                    console.debug(action, conversation.id);
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

// Conversation Menu Component
function ConversationMenu({
  conversation,
  onAction,
}: {
  conversation: Conversation;
  onAction: (action: 'pin' | 'mute' | 'archive' | 'delete') => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowDropdown(!showDropdown);
        }}
        className="rounded p-1 hover:bg-dark-600"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-gray-700 bg-dark-800 py-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onAction('pin')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700"
            >
              <PinIcon className="h-4 w-4" />
              {conversation.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => onAction('mute')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700"
            >
              <BellSlashIcon className="h-4 w-4" />
              {conversation.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={() => onAction('archive')}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700"
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              Archive
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// New Chat Modal Component
function NewChatModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const navigate = useNavigate();
  void navigate; // Reserved for navigation after chat creation

  // Mock users - would come from API
  const users = [
    { id: '1', username: 'alice', displayName: 'Alice', avatarUrl: null, status: 'online' },
    { id: '2', username: 'bob', displayName: 'Bob', avatarUrl: null, status: 'offline' },
    { id: '3', username: 'charlie', displayName: 'Charlie', avatarUrl: null, status: 'online' },
  ];

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = () => {
    if (selectedUsers.length === 0) return;
    // TODO: Create conversation and navigate
    HapticFeedback.success();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-6">
          <h2 className="mb-4 text-xl font-bold text-white">New Conversation</h2>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-dark-800 py-2 pl-9 pr-4 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <motion.div
                    key={userId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-primary-600/20 px-2 py-1 text-sm text-primary-400"
                  >
                    <span>{user.displayName}</span>
                    <button
                      onClick={() => setSelectedUsers((prev) => prev.filter((id) => id !== userId))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  setSelectedUsers((prev) =>
                    prev.includes(user.id)
                      ? prev.filter((id) => id !== user.id)
                      : [...prev, user.id]
                  );
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  selectedUsers.includes(user.id) ? 'bg-primary-600/20' : 'hover:bg-dark-700'
                }`}
              >
                <div className="relative">
                  <ThemedAvatar
                    src={user.avatarUrl}
                    alt={user.displayName}
                    size="small"
                    avatarBorderId={
                      (user as any)?.avatarBorderId ?? (user as any)?.avatar_border_id
                    }
                  />
                  {user.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-dark-900 bg-green-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{user.displayName}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-dark-700 py-2 text-gray-300 hover:bg-dark-600"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              disabled={selectedUsers.length === 0}
              className="flex-1 rounded-xl bg-primary-600 py-2 font-semibold text-white disabled:opacity-50"
            >
              {selectedUsers.length > 1 ? 'Create Group' : 'Start Chat'}
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// Helper Functions
function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.isGroup) {
    return conversation.name || 'Group Chat';
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.displayName || otherParticipant?.user?.username || 'Unknown';
}

function getConversationAvatar(conversation: Conversation, currentUserId?: string): string | null {
  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.avatarUrl || null;
}

function getConversationAvatarBorderId(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return (
    (otherParticipant as any)?.user?.avatarBorderId ??
    (otherParticipant as any)?.user?.avatar_border_id ??
    null
  );
}

function getConversationOnlineStatus(conversation: Conversation, currentUserId?: string): boolean {
  if (conversation.isGroup) return false;
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.status === 'online';
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

export default ConversationList;
