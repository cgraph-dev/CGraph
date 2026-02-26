/**
 * EmptyState component
 * @module modules/chat/components/conversation-list
 */

import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  searchQuery: string;
  onNewChat: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Empty State — fallback UI for empty data states.
 */
export function EmptyState({ searchQuery, onNewChat }: EmptyStateProps) {
  return (
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
          onClick={onNewChat}
          className="mt-4 rounded-xl bg-primary-600 px-4 py-2 font-medium text-white"
        >
          Start a Conversation
        </motion.button>
      )}
    </div>
  );
}
