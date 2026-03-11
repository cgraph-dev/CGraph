/**
 * Message Bubble Types
 *
 * Type definitions for the message bubble component and its sub-components.
 */

import type { Message } from '@/modules/chat/store';
import type { UIPreferences } from '@/pages/messages/conversation/types';

/**
 * Re-export UIPreferences for consumers
 */
export type { UIPreferences } from '@/pages/messages/conversation/types';

/**
 * Props for the MessageBubble component
 */
export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  uiPreferences: UIPreferences;
  onAvatarClick?: (userId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

/**
 * Read receipt entry
 */
export interface ReadByEntry {
  id?: string;
  userId?: string;
  readAt?: string;
  avatarUrl?: string;
  username?: string;
}

/**
 * Props for MessageEditForm component
 */
export interface MessageEditFormProps {
  editContent: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

/**
 * Props for MessageActionMenu component
 */
export interface MessageActionMenuProps {
  onReply: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onTip?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  isOwn: boolean;
  /** Message ID for save/bookmark functionality */
  messageId?: string;
}
