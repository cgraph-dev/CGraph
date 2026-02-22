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
export { MessageActionsMenu } from './message-actions-menu';
export { ReactionPickerModal } from './reaction-picker-modal';
export { AttachmentPreviewModal } from './attachment-preview-modal';
export { ImageViewerModal } from './image-viewer-modal';
export { VideoPlayerModal } from './video-player-modal';

// UI Components
export { EmptyConversation } from './empty-conversation';
export { TypingIndicator } from './typing-indicator';
export { MessageInput } from './message-input';
export { AttachmentPicker } from './attachment-picker';

// Animation Wrappers
export { AnimatedMessageWrapper } from './animated-message-wrapper';
export { AnimatedReactionBubble } from './animated-reaction-bubble';

// Video Components
export { VideoPlayerComponent } from './video-player-component';
export { AttachmentVideoPreview } from './attachment-video-preview';

// Types - Modals
export type { MessageActionsMenuProps } from './message-actions-menu';
export type { ReactionPickerModalProps } from './reaction-picker-modal';
export type { AttachmentPreviewModalProps } from './attachment-preview-modal';
export type { ImageViewerModalProps } from './image-viewer-modal';
export type { VideoPlayerModalProps } from './video-player-modal';

// Types - UI Components
export type { EmptyConversationProps } from './empty-conversation';
export type { TypingIndicatorProps } from './typing-indicator';
export type { MessageInputProps } from './message-input';
export type { AttachmentPickerProps, AttachmentType } from './attachment-picker';

// Constants
export { QUICK_REACTIONS, EMOJI_CATEGORIES, WAVE_EMOJIS, ACTION_COLORS } from './constants';
