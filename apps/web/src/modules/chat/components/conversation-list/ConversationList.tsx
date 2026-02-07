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
 *
 * @module modules/chat/components/conversation-list
 */

import { AnimatePresence } from 'framer-motion';
import { BookmarkIcon as PinIcon } from '@heroicons/react/24/outline';
import { useChatStore } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import type { ConversationListProps } from './types';
import { useConversationList } from './useConversationList';
import { ConversationListHeader } from './ConversationListHeader';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from './EmptyState';
import { NewChatModal } from './NewChatModal';

export function ConversationList({ className = '' }: ConversationListProps) {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();
  const {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    showNewChat,
    setShowNewChat,
    pinnedConversations,
    regularConversations,
    filteredConversations,
    handleConversationClick,
  } = useConversationList();

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <ConversationListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        onNewChat={() => setShowNewChat(true)}
      />

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
          <EmptyState searchQuery={searchQuery} onNewChat={() => setShowNewChat(true)} />
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default ConversationList;
