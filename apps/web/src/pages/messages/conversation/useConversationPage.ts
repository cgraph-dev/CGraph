/**
 * Conversation page state and handler hook.
 *
 * Extracts all local state, derived data, handler factory wiring,
 * and inline event handlers from the Conversation page component.
 *
 * @module pages/messages/conversation/useConversationPage
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import { useThreadStore } from '@/modules/chat/store/threadStore';

import {
  useConversationParticipant,
  usePresenceStatus,
  useConversationChannel,
  useTypingIndicator,
  useAutoScroll,
} from './hooks';
import {
  createSendHandler,
  createE2EERetryHandler,
  createUnencryptedSendHandler,
  createStickerSelectHandler,
  createGifSelectHandler,
  createVoiceCompleteHandler,
  createFileSelectHandler,
} from './handlers';
import type { UIPreferences, PendingE2EEMessage } from './types';
import { DEFAULT_UI_PREFERENCES } from './types';

import { useMessageActions, useScheduleMessage } from '@/modules/chat/hooks';
import { useCallModals } from '@/modules/calls/hooks';
import { groupMessagesByDate } from '@/lib/chat/messageUtils';
import { HapticFeedback } from '@/lib/animations/animation-engine';

/**
 * unknown for the messages module.
 */
/**
 * Hook for managing conversation page.
 */
export function useConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── Extracted hooks ──────────────────────────────────────────────────
  const {
    conversation,
    otherParticipant,
    otherParticipantUserId,
    conversationName,
    mutualFriends,
  } = useConversationParticipant(conversationId);
  const isOtherUserOnline = usePresenceStatus(conversationId, otherParticipantUserId);
  useConversationChannel(conversationId);
  const {
    handleTyping,
    stopTyping: _stopTyping,
    typingTimeoutRef,
  } = useTypingIndicator(conversationId);

  // ── External hooks ───────────────────────────────────────────────────
  const messageActions = useMessageActions();
  const scheduleActions = useScheduleMessage();
  const callModals = useCallModals(conversationId);

  // ── Store selectors ──────────────────────────────────────────────────
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);

  // ── Local state ──────────────────────────────────────────────────────
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Panel states
  const [showSettings, setShowSettings] = useState(false);
  const [showE2EETester, setShowE2EETester] = useState(false);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // E2EE error state
  const [showE2EEError, setShowE2EEError] = useState(false);
  const [e2eeErrorMessage, setE2EEErrorMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<PendingE2EEMessage | null>(null);

  // UI preferences
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES);
  const updatePreference = <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
    setUiPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // ── Derived data ─────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];
  const { messagesEndRef, messagesContainerRef } = useAutoScroll(conversationMessages.length);
  const groupedMessages = useMemo(
    () => groupMessagesByDate(conversationMessages),
    [conversationMessages]
  );

  // Fetch thread reply counts when messages change
  const fetchReplyCounts = useThreadStore((s) => s.fetchReplyCounts);
  useEffect(() => {
    if (!conversationId || conversationMessages.length === 0) return;
    const messageIds = conversationMessages.map((m) => m.id);
    fetchReplyCounts(conversationId, messageIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversationMessages.length, fetchReplyCounts]);

  // ── Handler factories ────────────────────────────────────────────────
  const handlerContext = {
    conversationId: conversationId || '',
    messageInput,
    replyTo,
    pendingMessage,
    isSending,
    uiPreferences,
    sendMessage,
    setMessageInput,
    setReplyTo,
    setIsSending,
    setPendingMessage,
    setE2EEErrorMessage,
    setShowE2EEError,
    typingTimeoutRef,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSend = useCallback(createSendHandler(handlerContext), [
    conversationId,
    messageInput,
    replyTo,
    isSending,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRetryE2EE = useCallback(createE2EERetryHandler(handlerContext), [
    conversationId,
    pendingMessage,
    isSending,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendUnencrypted = useCallback(createUnencryptedSendHandler(handlerContext), [
    conversationId,
    pendingMessage,
    isSending,
  ]);

  const mediaContext = {
    conversationId: conversationId || '',
    replyTo,
    uiPreferences,
    sendMessage,
    setReplyTo,
    setIsSending,
    setShowStickerPicker,
    setShowGifPicker,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleStickerSelect = useCallback(createStickerSelectHandler(mediaContext), [
    conversationId,
    replyTo,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleGifSelect = useCallback(createGifSelectHandler(mediaContext), [
    conversationId,
    replyTo,
  ]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setMessageInput((prev) => prev + emoji);
      if (uiPreferences.enableHaptic) HapticFeedback.light();
    },
    [uiPreferences.enableHaptic]
  );

  const voiceContext = {
    conversationId: conversationId || '',
    uiPreferences,
    setIsSending,
    setIsVoiceMode,
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleVoiceComplete = useCallback(createVoiceCompleteHandler(voiceContext), [
    conversationId,
  ]);

  const fileContext = {
    conversationId: conversationId || '',
    replyTo,
    uiPreferences,
    sendMessage,
    setReplyTo,
    setIsSending,
    fileInputRef,
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleFileSelect = useCallback(createFileSelectHandler(fileContext), [
    conversationId,
    replyTo,
  ]);

  // ── Event handlers ───────────────────────────────────────────────────
  const handleSchedule = async (scheduledAt: Date) => {
    if (!conversationId) return;
    await scheduleActions.handleSchedule(
      scheduledAt,
      conversationId,
      replyTo?.id,
      uiPreferences.enableHaptic
    );
    setMessageInput('');
    setReplyTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadMore = () => {
    if (!conversationId || !hasMoreMessages[conversationId]) return;
    const oldestMessage = conversationMessages[0];
    if (oldestMessage) fetchMessages(conversationId, oldestMessage.id);
  };

  const handleSearchResultClick = (searchConversationId: string, messageId: string) => {
    setShowMessageSearch(false);
    if (searchConversationId !== conversationId) {
      navigate(`/messages/${searchConversationId}?highlightMessage=${messageId}`);
      return;
    }
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2', 'ring-offset-dark-900');
      setTimeout(
        () =>
          el.classList.remove(
            'ring-2',
            'ring-primary-500',
            'ring-offset-2',
            'ring-offset-dark-900'
          ),
        2000
      );
    }
    if (uiPreferences.enableHaptic) HapticFeedback.success();
  };

  const hapticToggle = (setter: (fn: (v: boolean) => boolean) => void) => {
    setter((v) => !v);
    if (uiPreferences.enableHaptic) HapticFeedback.medium();
  };

  return {
    // Route
    conversationId,
    // Data
    conversation,
    conversationName,
    otherParticipant,
    otherParticipantUserId,
    isOtherUserOnline,
    mutualFriends,
    groupedMessages,
    typing,
    user,
    isLoadingMessages,
    hasMoreMessages,
    // Input state
    messageInput,
    setMessageInput,
    isSending,
    replyTo,
    setReplyTo,
    isVoiceMode,
    setIsVoiceMode,
    showStickerPicker,
    setShowStickerPicker,
    showGifPicker,
    setShowGifPicker,
    showEmojiPicker,
    setShowEmojiPicker,
    // Panel state
    showSettings,
    setShowSettings,
    showE2EETester,
    setShowE2EETester,
    showSafetyNumber,
    setShowSafetyNumber,
    showInfoPanel,
    setShowInfoPanel,
    showMessageSearch,
    setShowMessageSearch,
    // E2EE state
    showE2EEError,
    setShowE2EEError,
    e2eeErrorMessage,
    pendingMessage,
    setPendingMessage,
    // UI preferences
    uiPreferences,
    setUiPreferences,
    updatePreference,
    // Refs
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    // Handlers
    handleSend,
    handleRetryE2EE,
    handleSendUnencrypted,
    handleStickerSelect,
    handleGifSelect,
    handleEmojiSelect,
    handleVoiceComplete,
    handleFileSelect,
    handleSchedule,
    handleKeyPress,
    handleLoadMore,
    handleSearchResultClick,
    handleTyping,
    hapticToggle,
    // Delegated hooks
    messageActions,
    scheduleActions,
    callModals,
    sendMessage,
  };
}
