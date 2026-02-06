/**
 * Messages Page Component
 *
 * Main messages page with conversation sidebar and content area.
 */

import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';
import { MessageSearch } from '@/modules/chat/components/MessageSearch';

import { ConversationSidebar } from './ConversationSidebar';
import { NoConversationSelected } from './EmptyStates';
import { filterConversations } from './utils';
import type { OnlineStatusMap } from './types';

const logger = createLogger('Messages');

export default function Messages() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, isLoadingConversations, fetchConversations, createConversation } =
    useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});
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
      const statusMap: OnlineStatusMap = {};

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
  const filteredConversations = filterConversations(conversations, searchQuery, user?.id || '');

  return (
    <div className="flex h-full max-h-screen flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Conversations Sidebar */}
      <ConversationSidebar
        conversations={filteredConversations}
        activeConversationId={conversationId}
        currentUserId={user?.id || ''}
        onlineStatus={onlineStatus}
        searchQuery={searchQuery}
        isLoading={isLoadingConversations}
        onSearchChange={setSearchQuery}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNewConversation={() => {
          // TODO: Open new conversation modal
        }}
      />

      {/* Conversation Content */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {conversationId ? <Outlet /> : <NoConversationSelected />}
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
