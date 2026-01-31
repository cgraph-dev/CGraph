import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, Conversation } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { formatTimeAgo, getAvatarBorderId } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { toast } from '@/components/Toast';

const logger = createLogger('Messages');
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { MessageSearch } from '@/components/messages/MessageSearch';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

export default function Messages() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, isLoadingConversations, fetchConversations, createConversation } =
    useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle search result click - navigate to conversation and scroll to message
  const handleSearchResultClick = useCallback(
    (convId: string, messageId: string) => {
      setIsSearchOpen(false);
      navigate(`/messages/${convId}?scrollTo=${messageId}`);
    },
    [navigate]
  );

  // Track online status changes for all conversations
  useEffect(() => {
    const unsubscribe = socketManager.onStatusChange((convId, userId, isOnline) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [`${convId}-${userId}`]: isOnline,
      }));
    });

    return unsubscribe;
  }, []);

  // Initialize presence checking for loaded conversations
  useEffect(() => {
    if (conversations.length > 0) {
      // Get initial presence state from socket manager
      const allStatuses = socketManager.getAllOnlineStatuses();
      const statusMap: Record<string, boolean> = {};

      conversations.forEach((conv) => {
        const onlineUsers = allStatuses.get(conv.id);
        if (onlineUsers) {
          const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
          if (otherParticipant) {
            statusMap[`${conv.id}-${otherParticipant.userId}`] = onlineUsers.has(
              otherParticipant.userId
            );
          }
        }
      });

      setOnlineStatus(statusMap);

      // Peek at all conversations to get presence updates
      const conversationIds = conversations.map((c) => c.id);
      socketManager.peekConversationsPresence(conversationIds);
    }
  }, [conversations, user?.id]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized handler for starting conversation with user
  const handleStartConversationWithUser = useCallback(
    async (userId: string) => {
      // Check if conversation already exists with this user
      const existingConv = conversations.find((conv) => {
        if (conv.type !== 'direct') return false;
        return conv.participants.some((p) => p.userId === userId);
      });

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`, { replace: true });
        return;
      }

      // Create new conversation
      setIsCreatingConversation(true);
      try {
        const newConv = await createConversation([userId]);
        navigate(`/messages/${newConv.id}`, { replace: true });
      } catch (error) {
        logger.error('Failed to create conversation:', error);
        toast.error('Failed to start conversation. Please try again.');
        navigate('/messages', { replace: true });
      } finally {
        setIsCreatingConversation(false);
      }
    },
    [conversations, createConversation, navigate]
  );

  // Handle userId query param (from friends page)
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && !isCreatingConversation) {
      handleStartConversationWithUser(userId);
    }
  }, [searchParams, isCreatingConversation, handleStartConversationWithUser]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    const name = getConversationName(conv, user?.id || '');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full max-h-screen flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Conversations Sidebar - Next Gen */}
      <div className="relative flex h-full w-80 flex-col border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
        {/* Ambient glow effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        {/* Header */}
        <div className="relative z-10 border-b border-primary-500/20 p-4">
          <motion.div
            className="mb-4 flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-400" />
              Messages
            </h2>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => {
                  setIsSearchOpen(true);
                  HapticFeedback.light();
                }}
                className="group rounded-xl p-2 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
                title="Search messages"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </motion.button>
              <motion.button
                onClick={() => HapticFeedback.medium()}
                className="group rounded-xl p-2 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
                title="New conversation"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced Search */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <MagnifyingGlassIcon className="h-4 w-4 text-primary-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
              className="w-full rounded-xl border border-primary-500/30 bg-dark-800/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </motion.div>
        </div>

        {/* Conversations List */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {isLoadingConversations && conversations.length === 0 ? (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          ) : filteredConversations.length === 0 ? (
            <motion.div
              className="px-4 py-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-4 inline-block">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 to-purple-500/20 backdrop-blur-sm">
                  <UserIcon className="h-8 w-8 text-primary-400" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-primary-400/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-lg font-semibold text-transparent">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="mt-2 text-sm text-gray-500">Start a new conversation to get started</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ConversationItem
                    conversation={conv}
                    isActive={conv.id === conversationId}
                    currentUserId={user?.id || ''}
                    onlineStatus={onlineStatus}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Conversation Content */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {conversationId ? (
          <Outlet />
        ) : (
          <motion.div
            className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Ambient particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-primary-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.1,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}

            <motion.div
              className="relative z-10 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="relative mb-6 inline-block">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl backdrop-blur-sm">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary-400" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-purple-400/20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -inset-4 rounded-3xl border border-primary-400/20"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
              </div>

              <h3 className="mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent">
                Your Messages
                <SparklesIcon className="h-6 w-6 animate-pulse text-primary-400" />
              </h3>
              <p className="max-w-md text-lg text-gray-400">
                Select a conversation or start a new one to begin messaging
              </p>

              <motion.div
                className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                End-to-end encrypted
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Message Search Modal */}
      <MessageSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onResultClick={handleSearchResultClick}
      />
    </div>
  );
}

// Helper function to get conversation name
function getConversationName(conv: Conversation, currentUserId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    if (otherParticipant) {
      return (
        otherParticipant.nickname ||
        otherParticipant.user.displayName ||
        otherParticipant.user.username
      );
    }
  }
  return 'Unknown';
}

// Helper function to get conversation avatar
function getConversationAvatar(conv: Conversation, currentUserId: string): string | null {
  if (conv.avatarUrl) return conv.avatarUrl;
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.user.avatarUrl;
    }
  }
  return null;
}

function getConversationAvatarBorderId(conv: Conversation, currentUserId: string): string | null {
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    const user = (otherParticipant as Record<string, unknown> | undefined)?.user;
    return getAvatarBorderId(user);
  }

  return getAvatarBorderId(conv);
}

// Enhanced Conversation item component
function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onlineStatus,
}: {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onlineStatus: Record<string, boolean>;
}) {
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
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
            transition={{ duration: 2, repeat: Infinity }}
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
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
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
