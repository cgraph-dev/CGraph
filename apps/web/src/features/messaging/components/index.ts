/**
 * Messaging Components
 * 
 * Re-exports messaging-related components from the legacy structure
 * for backward compatibility while enabling feature-based imports.
 */

// Re-export from legacy locations for backward compatibility
// These will be gradually migrated to this directory

// Chat components - available
export { default as StickerPicker } from '@/components/chat/StickerPicker';
export { default as RichMediaEmbed } from '@/components/chat/RichMediaEmbed';
export { default as MessageReactions } from '@/components/chat/MessageReactions';
export { default as E2EEConnectionTester } from '@/components/chat/E2EEConnectionTester';

// Conversation components - available
export { default as AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
export { default as AnimatedReactionBubble } from '@/components/conversation/AnimatedReactionBubble';

// TODO: Create these components when needed
// export { default as AnimatedReactions } from '@/components/conversation/AnimatedReactions';
// export { default as ReplyPreview } from '@/components/conversation/ReplyPreview';

// Core messaging components - TODO: Create
// export { default as MessageInput } from '@/components/MessageInput';
// export { default as MessageList } from '@/components/MessageList';
// export { default as ConversationList } from '@/components/ConversationList';
