/**
 * Conversation Components
 * 
 * Extracted from ConversationScreen for better maintainability and reusability.
 * Each component is memoized for optimal performance.
 * 
 * @module components/conversation
 * @since v0.7.29
 */

// Modals
export { MessageActionsMenu } from './MessageActionsMenu';
export { ReactionPickerModal } from './ReactionPickerModal';
export { AttachmentPreviewModal } from './AttachmentPreviewModal';
export { ImageViewerModal } from './ImageViewerModal';
export { VideoPlayerModal } from './VideoPlayerModal';

// UI Components
export { EmptyConversation } from './EmptyConversation';
export { TypingIndicator } from './TypingIndicator';
export { MessageInput } from './MessageInput';
export { AttachmentPicker } from './AttachmentPicker';

// Animation Wrappers
export { AnimatedMessageWrapper } from './AnimatedMessageWrapper';
export { AnimatedReactionBubble } from './AnimatedReactionBubble';

// Video Components
export { VideoPlayerComponent } from './VideoPlayerComponent';
export { AttachmentVideoPreview } from './AttachmentVideoPreview';

// Types - Modals
export type { MessageActionsMenuProps } from './MessageActionsMenu';
export type { ReactionPickerModalProps } from './ReactionPickerModal';
export type { AttachmentPreviewModalProps } from './AttachmentPreviewModal';
export type { ImageViewerModalProps } from './ImageViewerModal';
export type { VideoPlayerModalProps } from './VideoPlayerModal';

// Types - UI Components
export type { EmptyConversationProps } from './EmptyConversation';
export type { TypingIndicatorProps } from './TypingIndicator';
export type { MessageInputProps } from './MessageInput';
export type { AttachmentPickerProps, AttachmentType } from './AttachmentPicker';

// Constants
export { QUICK_REACTIONS, EMOJI_CATEGORIES, WAVE_EMOJIS, ACTION_COLORS } from './constants';
