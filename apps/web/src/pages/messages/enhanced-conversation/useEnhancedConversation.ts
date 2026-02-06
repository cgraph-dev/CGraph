/**
 * useEnhancedConversation hook - state and handlers for the conversation
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { themeEngine } from '@/lib/ai/ThemeEngine';
import type { Sticker } from '@/data/stickers';

const logger = createLogger('EnhancedConversation');

export function useEnhancedConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, messages, typingUsers, sendMessage } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  // Apply AI theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Handle send message
  const handleSend = async () => {
    if (!conversationId || !messageInput.trim() || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);

    try {
      await sendMessage(conversationId, messageInput.trim(), replyTo?.id);
      setMessageInput('');
      setReplyTo(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      logger.error('Failed to send message:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle sticker selection
  const handleStickerSelect = async (sticker: Sticker) => {
    if (!conversationId || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);
    setShowStickerPicker(false);

    try {
      const stickerMessage = `[sticker:${sticker.id}:${sticker.emoji}:${sticker.name}]`;
      await sendMessage(conversationId, stickerMessage, replyTo?.id);
      setReplyTo(null);
    } catch (error) {
      logger.error('Failed to send sticker:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle theme generation
  const handleGenerateTheme = () => {
    const theme = themeEngine.generateTheme();
    themeEngine.applyTheme(theme);
    HapticFeedback.light();
  };

  // Handle avatar click
  const handleAvatarClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  return {
    // Data
    conversationId,
    conversation,
    conversationMessages,
    typing,
    user,
    // State
    messageInput,
    setMessageInput,
    isSending,
    replyTo,
    setReplyTo,
    showStickerPicker,
    setShowStickerPicker,
    // Refs
    messagesEndRef,
    inputContainerRef,
    // Handlers
    handleSend,
    handleStickerSelect,
    handleGenerateTheme,
    handleAvatarClick,
  };
}
