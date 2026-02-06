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

export { MessageInput, default } from './MessageInput';
export { ReplyPreview } from './ReplyPreview';
export { AttachmentsPreview } from './AttachmentsPreview';
export { AttachmentMenu } from './AttachmentMenu';
export { InputToolbar } from './InputToolbar';
export { MentionAutocomplete } from './MentionAutocomplete';
export { useMessageInput } from './useMessageInput';
export type {
  MessageInputProps,
  ReplyInfo,
  MessagePayload,
  AttachmentMode,
  MentionUser,
  VoiceMessageData,
} from './types';
