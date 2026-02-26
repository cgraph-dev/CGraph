/**
 * ConversationSidebar Component
 *
 * Sidebar with search, conversation list, and actions.
 */

import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MagnifyingGlassPlusIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ConversationItem } from './conversation-item';
import { EmptyConversationList, LoadingSpinner } from './empty-states';
import type { ConversationSidebarProps } from './types';
import { tweens } from '@/lib/animation-presets';

/**
 * unknown for the messages module.
 */
/**
 * Conversation Sidebar component.
 */
export function ConversationSidebar({
  conversations,
  activeConversationId,
  currentUserId,
  onlineStatus,
  searchQuery,
  isLoading,
  onSearchChange,
  onOpenSearch,
  onNewConversation,
}: ConversationSidebarProps) {
  return (
    <div className="relative flex h-full w-80 flex-col border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
      {/* Ambient glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

      {/* Header */}
      <div className="relative z-10 border-b border-primary-500/20 p-4">
        <motion.div
          className="mb-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tweens.moderate}
        >
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-400" />
            Messages
          </h2>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => {
                onOpenSearch();
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
              onClick={() => {
                onNewConversation();
                HapticFeedback.medium();
              }}
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
          transition={{ ...tweens.moderate, delay: 0.1 }}
        >
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <MagnifyingGlassIcon className="h-4 w-4 text-primary-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations"
            className="w-full rounded-xl border border-primary-500/30 bg-dark-800/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </motion.div>
      </div>

      {/* Conversations List */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <LoadingSpinner />
        ) : conversations.length === 0 ? (
          <EmptyConversationList searchQuery={searchQuery} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={tweens.standard}
          >
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...tweens.standard, delay: index * 0.05 }}
              >
                <ConversationItem
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  currentUserId={currentUserId}
                  onlineStatus={onlineStatus}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
