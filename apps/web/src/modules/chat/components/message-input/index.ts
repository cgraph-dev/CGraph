/**
 * MessageInput module - rich message input with media support
 *
 * This module provides:
 * - Text input with auto-resize and @mentions
 * - File attachments with preview
 * - Emoji, sticker, and GIF pickers
 * - Voice message recording
 * - Reply preview functionality
 * - Typing indicator support
 */

export { MessageInput, default } from './message-input';
export { ReplyPreview } from './reply-preview';
export { AttachmentsPreview } from './attachments-preview';
export { AttachmentMenu } from './attachment-menu';
export { InputToolbar } from './input-toolbar';
export { MentionAutocomplete } from './mention-autocomplete';
export { useMessageInput } from './useMessageInput';
export type {
  MessageInputProps,
  ReplyInfo,
  MessagePayload,
  AttachmentMode,
  MentionUser,
  VoiceMessageData,
} from './types';
