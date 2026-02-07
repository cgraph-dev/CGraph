/**
 * Type definitions for EnhancedConversation module
 */

import type { Message } from '@/modules/chat/store';

export interface EnhancedMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  index: number;
  onAvatarClick?: (userId: string) => void;
}

export interface ConversationHeaderProps {
  conversationName: string;
  isTyping: boolean;
  onGenerateTheme: () => void;
}

export interface MessageInputAreaProps {
  messageInput: string;
  isSending: boolean;
  showStickerPicker: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onToggleStickerPicker: () => void;
  onStickerSelect: (sticker: import('@/data/stickers').Sticker) => void;
}

export interface TypingIndicatorProps {
  typingUserIds: string[];
}
