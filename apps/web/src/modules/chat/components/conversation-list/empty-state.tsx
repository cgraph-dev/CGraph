/**
 * EmptyState component
 * @module modules/chat/components/conversation-list
 */

import { AnimatedEmptyState } from '@/shared/components';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  searchQuery: string;
  onNewChat: () => void;
}

/**
 * Empty State — animated fallback UI for empty conversation list.
 */
export function EmptyState({ searchQuery, onNewChat }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <AnimatedEmptyState
        title="No matches found"
        description="Try a different search term"
        variant="search"
      />
    );
  }

  return (
    <AnimatedEmptyState
      title="No conversations yet"
      description="Start a new conversation to connect with others"
      icon={<ChatBubbleLeftRightIcon className="h-20 w-20 text-gray-500" />}
      action={{ label: 'Start a Conversation', onClick: onNewChat }}
    />
  );
}
