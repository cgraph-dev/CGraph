/**
 * Chat Facade
 *
 * Unified interface for messaging and real-time communication.
 * Aggregates: chatStore, chatEffectsStore, chatBubbleStore, incomingCallStore
 *
 * @module stores/facades/chatFacade
 */

import { useChatStore, useChatEffectsStore, useChatBubbleStore } from '../../modules/chat/store';
import { useIncomingCallStore } from '../incomingCallStore';

/**
 * Unified chat and messaging facade
 * Provides a single hook for all chat-related state and actions
 */
export function useChatFacade() {
  const chat = useChatStore();
  const effects = useChatEffectsStore();
  const bubble = useChatBubbleStore();
  const calls = useIncomingCallStore();

  return {
    // === Messages State ===
    messages: chat.messages,
    conversations: chat.conversations,
    activeConversationId: chat.activeConversationId,
    typingUsers: chat.typingUsers,
    typingUsersInfo: chat.typingUsersInfo,
    isLoadingMessages: chat.isLoadingMessages,
    isLoadingConversations: chat.isLoadingConversations,
    hasMoreMessages: chat.hasMoreMessages,

    // === Message Actions ===
    sendMessage: chat.sendMessage,
    editMessage: chat.editMessage,
    deleteMessage: chat.deleteMessage,
    addReaction: chat.addReaction,
    removeReaction: chat.removeReaction,
    setActiveConversation: chat.setActiveConversation,
    fetchMessages: chat.fetchMessages,
    fetchConversations: chat.fetchConversations,
    markAsRead: chat.markAsRead,
    createConversation: chat.createConversation,

    // === Scheduled Messages ===
    scheduledMessages: chat.scheduledMessages,
    scheduleMessage: chat.scheduleMessage,
    cancelScheduledMessage: chat.cancelScheduledMessage,
    rescheduleMessage: chat.rescheduleMessage,

    // === Effects State ===
    activeMessageEffect: effects.activeMessageEffect,
    activeBubbleStyle: effects.activeBubbleStyle,
    activeTypingIndicator: effects.activeTypingIndicator,
    soundsEnabled: effects.soundsEnabled,

    // === Effects Actions ===
    setMessageEffect: effects.setMessageEffect,
    setBubbleStyle: effects.setBubbleStyle,
    activateEffect: effects.activateEffect,
    toggleSounds: effects.toggleSounds,
    playSound: effects.playSound,

    // === Bubble Customization ===
    bubbleStyle: bubble.style,
    updateBubbleStyle: bubble.updateStyle,
    resetBubbleStyle: bubble.resetStyle,
    applyBubblePreset: bubble.applyPreset,

    // === Calls State ===
    incomingCall: calls.incomingCall,

    // === Calls Actions ===
    setIncomingCall: calls.setIncomingCall,
    acceptCall: calls.acceptCall,
    declineCall: calls.declineCall,

    // === Direct Store Access (for edge cases) ===
    _stores: { chat, effects, bubble, calls },
  };
}

export type ChatFacade = ReturnType<typeof useChatFacade>;
