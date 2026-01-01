import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { useChatStore, Conversation } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function Messages() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, isLoadingConversations, fetchConversations, createConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Memoized handler for starting conversation with user
  const handleStartConversationWithUser = useCallback(async (userId: string) => {
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
      console.error('Failed to create conversation:', error);
      navigate('/messages', { replace: true });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [conversations, createConversation, navigate]);

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
    <div className="flex flex-1">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-dark-800 border-r border-dark-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <button
              className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
              title="New conversation"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <UserIcon className="h-12 w-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Start a new conversation to get started
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === conversationId}
                currentUserId={user?.id || ''}
              />
            ))
          )}
        </div>
      </div>

      {/* Conversation Content */}
      <div className="flex-1 flex flex-col">
        {conversationId ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-dark-900">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-10 w-10 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
              <p className="text-gray-400 max-w-sm">
                Select a conversation or start a new one to begin messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get conversation name
function getConversationName(conv: Conversation, currentUserId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.nickname || otherParticipant.user.displayName || otherParticipant.user.username;
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

// Conversation item component
function ConversationItem({
  conversation,
  isActive,
  currentUserId,
}: {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
}) {
  const name = getConversationName(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  const isOnline = otherParticipant?.user.status === 'online';

  return (
    <NavLink
      to={`/messages/${conversation.id}`}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-all duration-200 group ${
        isActive ? 'bg-dark-700 border-l-2 border-primary-500' : 'border-l-2 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-dark-600 transition-transform duration-200 group-hover:scale-105">
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg font-bold text-gray-400">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {conversation.type === 'direct' && isOnline && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-dark-800" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
            {name}
          </span>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 text-xs font-bold flex items-center justify-center animate-pulse-subtle">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
