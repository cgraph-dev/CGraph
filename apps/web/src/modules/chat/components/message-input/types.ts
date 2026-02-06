/**
 * Type definitions for MessageInput module
 */

export interface MessageInputProps {
  conversationId?: string;
  channelId?: string;
  replyTo?: ReplyInfo | null;
  onSend: (message: MessagePayload) => void;
  onCancelReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface ReplyInfo {
  id: string;
  content: string;
  author: string;
}

export interface MessagePayload {
  content: string;
  attachments?: File[];
  replyToId?: string;
  type?: 'text' | 'voice' | 'sticker' | 'gif';
  metadata?: Record<string, unknown>;
}

export type AttachmentMode = 'none' | 'file' | 'emoji' | 'sticker' | 'gif' | 'voice';

export interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export interface VoiceMessageData {
  blob: Blob;
  duration: number;
  waveform: number[];
}
