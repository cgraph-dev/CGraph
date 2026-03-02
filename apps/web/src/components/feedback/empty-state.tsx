/**
 * Feedback empty state component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';
import { tweens, staggerConfigs } from '@/lib/animation-presets';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.standard.staggerChildren },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: tweens.standard },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: tweens.standard },
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for when there's no data to display.
 * Used for empty lists, no search results, etc.
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      className={`px-4 py-12 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {icon && (
        <motion.div
          variants={iconVariants}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800"
        >
          {icon}
        </motion.div>
      )}
      <motion.h3
        variants={itemVariants}
        className="mb-1 text-lg font-medium text-gray-900 dark:text-white"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          variants={itemVariants}
          className="mx-auto mb-6 max-w-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios

/**
 * unknown for the feedback module.
 */
/**
 * Empty Messages — fallback UI for empty data states.
 */
export function EmptyMessages({ onStartConversation }: { onStartConversation?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      }
      title="No messages yet"
      description="Start a conversation with someone to begin chatting."
      action={
        onStartConversation
          ? { label: 'Start Conversation', onClick: onStartConversation }
          : undefined
      }
    />
  );
}

/**
 * unknown for the feedback module.
 */
/**
 * Empty Conversations — fallback UI for empty data states.
 */
export function EmptyConversations({ onNewConversation }: { onNewConversation?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      }
      title="No conversations"
      description="You don't have any conversations yet. Start chatting with friends!"
      action={
        onNewConversation ? { label: 'New Conversation', onClick: onNewConversation } : undefined
      }
    />
  );
}

/**
 * unknown for the feedback module.
 */
/**
 * Empty Groups — fallback UI for empty data states.
 */
export function EmptyGroups({ onCreateGroup }: { onCreateGroup?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="No groups"
      description="Join or create a group to connect with communities."
      action={onCreateGroup ? { label: 'Create Group', onClick: onCreateGroup } : undefined}
    />
  );
}

/**
 * unknown for the feedback module.
 */
/**
 * Empty Forums — fallback UI for empty data states.
 */
export function EmptyForums({ onCreateForum }: { onCreateForum?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      }
      title="No forums"
      description="Create or discover forums to discuss topics you're interested in."
      action={onCreateForum ? { label: 'Create Forum', onClick: onCreateForum } : undefined}
    />
  );
}

/**
 * unknown for the feedback module.
 */
/**
 * Empty Search Results — fallback UI for empty data states.
 */
export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

/**
 * unknown for the feedback module.
 */
/**
 * Empty Notifications — fallback UI for empty data states.
 */
export function EmptyNotifications() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      }
      title="All caught up!"
      description="You don't have any new notifications."
    />
  );
}

/**
 * Empty Channels — no channels in the group yet.
 */
export function EmptyChannels({ onCreateChannel }: { onCreateChannel?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          />
        </svg>
      }
      title="No channels"
      description="Create a channel to start organizing conversations."
      action={onCreateChannel ? { label: 'Create Channel', onClick: onCreateChannel } : undefined}
    />
  );
}

/**
 * Empty Scheduled Messages — no pending scheduled messages.
 */
export function EmptyScheduledMessages() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No scheduled messages"
      description="Schedule messages to send them at a later time."
    />
  );
}

/**
 * Empty Explore — no communities to discover.
 */
export function EmptyExplore() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No communities yet"
      description="Communities will appear here as they're created. Check back soon!"
    />
  );
}

/**
 * Empty Voice Messages — no voice messages.
 */
export function EmptyVoiceMessages() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      }
      title="No voice messages"
      description="Send or receive voice messages to see them here."
    />
  );
}

/**
 * Empty File Attachments — no files shared.
 */
export function EmptyFileAttachments() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      }
      title="No files shared"
      description="Files shared in conversations will appear here."
    />
  );
}

/**
 * Empty Moderation Queue — all clear.
 */
export function EmptyModerationQueue() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      }
      title="Queue clear!"
      description="No items need moderation. Nice work keeping the community safe."
    />
  );
}

export default EmptyState;
