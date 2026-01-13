/**
 * Message Entity
 * 
 * Core domain entity representing a message in the CGraph platform.
 */

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: MessageContentType;
  replyToId?: string;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readBy: string[];
  isEncrypted: boolean;
  encryptionVersion?: number;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageContentType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'file'
  | 'sticker'
  | 'gif'
  | 'embed';

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // For audio/video
  thumbnailUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface ConversationEntity {
  id: string;
  type: ConversationType;
  name?: string;
  participants: ConversationParticipant[];
  lastMessageId?: string;
  lastMessageAt?: Date;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationType = 'direct' | 'group' | 'channel';

export interface ConversationParticipant {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  isMuted: boolean;
  mutedUntil?: Date;
}

/**
 * Check if a message can be edited
 * Messages can be edited within 15 minutes of creation
 */
export function canEditMessage(message: MessageEntity, userId: string): boolean {
  if (message.senderId !== userId) return false;
  if (message.isDeleted) return false;
  
  const fifteenMinutes = 15 * 60 * 1000;
  const timeSinceCreation = Date.now() - message.createdAt.getTime();
  
  return timeSinceCreation < fifteenMinutes;
}

/**
 * Check if a message can be deleted
 * Messages can be deleted by sender or by moderators
 */
export function canDeleteMessage(
  message: MessageEntity, 
  userId: string, 
  isModerator: boolean
): boolean {
  if (message.isDeleted) return false;
  return message.senderId === userId || isModerator;
}

/**
 * Format message content for display
 * Handles mentions, links, and formatting
 */
export function formatMessageContent(content: string): string {
  // URL detection and linkification
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formatted = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  
  // Mention detection (@username)
  const mentionRegex = /@(\w+)/g;
  formatted = formatted.replace(mentionRegex, '<span class="mention">@$1</span>');
  
  // Bold (**text**)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Strikethrough (~~text~~)
  formatted = formatted.replace(/~~(.+?)~~/g, '<s>$1</s>');
  
  return formatted;
}
