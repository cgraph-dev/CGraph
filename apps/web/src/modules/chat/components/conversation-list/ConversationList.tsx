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

import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkIcon as PinIcon } from '@heroicons/react/24/outline';
import { staggerConfigs } from '@/lib/animation-presets/presets';

const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.fast.staggerChildren },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};
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
            <motion.div variants={listContainer} initial="hidden" animate="show">
              {pinnedConversations.map((conv) => (
                <motion.div key={conv.id} variants={listItem}>
                  <ConversationItem
                    conversation={conv}
                    currentUserId={user?.id}
                    typingUsers={typingUsers[conv.id] || []}
                    onClick={() => handleConversationClick(conv)}
                  />
                </motion.div>
              ))}
            </motion.div>
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
            <motion.div variants={listContainer} initial="hidden" animate="show">
              {regularConversations.map((conv) => (
                <motion.div key={conv.id} variants={listItem}>
                  <ConversationItem
                    conversation={conv}
                    currentUserId={user?.id}
                    typingUsers={typingUsers[conv.id] || []}
                    onClick={() => handleConversationClick(conv)}
                  />
                </motion.div>
              ))}
            </motion.div>
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
