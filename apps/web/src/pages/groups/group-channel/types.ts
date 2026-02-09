/**
 * GroupChannel Types
 *
 * Type definitions for the group channel page components.
 */

import type { ChannelMessage, Member } from '@/modules/groups/store';

/**
 * Message item component props
 */
export interface ChannelMessageItemProps {
  message: ChannelMessage;
  showHeader: boolean;
  onReply: () => void;
}

/**
 * Member item component props
 */
export interface MemberItemProps {
  member: Member;
  isOffline?: boolean;
}

/**
 * Grouped messages for date-based organization
 */
export interface GroupedMessages {
  date: Date;
  messages: ChannelMessage[];
}

/**
 * Channel header props
 */
export interface ChannelHeaderProps {
  channelName: string;
  channelTopic?: string;
  showMembers: boolean;
  onToggleMembers: () => void;
  showPinnedMessages?: boolean;
  onTogglePinnedMessages?: () => void;
  pinnedCount?: number;
}

/**
 * Messages area props
 */
export interface MessagesAreaProps {
  groupedMessages: GroupedMessages[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  channelName: string;
  typing: string[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onLoadMore: () => void;
  onReply: (message: ChannelMessage) => void;
  formatDateHeader: (date: Date) => string;
}

/**
 * Message input props
 */
export interface MessageInputProps {
  channelName: string;
  messageInput: string;
  isSending: boolean;
  replyTo: ChannelMessage | null;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onCancelReply: () => void;
}

/**
 * Members sidebar props
 */
export interface MembersSidebarProps {
  onlineMembers: Member[];
  offlineMembers: Member[];
}

// Re-export store types for convenience
export type { ChannelMessage, Member } from '@/modules/groups/store';
