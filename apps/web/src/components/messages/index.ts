/**
 * Message Components - Extracted from Conversation.tsx for modularity
 *
 * These components handle the message display and interaction in chat conversations.
 */

// Core message display
export { MessageBubble, type MessageBubbleProps, type UIPreferences } from './MessageBubble';

// Input area with emoji/sticker/GIF pickers
export { MessageInputArea, type MessageInputAreaProps } from './MessageInputArea';

// Modal components (E2EE, Forward, Search, Schedule, Calls)
export { ConversationModals, type ConversationModalsProps } from './ConversationModals';

// UI Settings panel for customization
export { UISettingsPanel, type UISettingsPanelProps } from './UISettingsPanel';

// Reply preview bar
export { ReplyPreview, type ReplyPreviewProps } from './ReplyPreview';

// Ambient background effects
export { AmbientBackground, type AmbientBackgroundProps } from './AmbientBackground';

// Message search (existing)
export { MessageSearch } from './MessageSearch';
