import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { socketManager } from '@/lib/socket';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import {
  getParticipantUserId,
  getParticipantDisplayName,
  getMessageSenderId,
} from '@/lib/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/shared/components/ui';
import type { GifResult } from '@/modules/chat/components/GifPicker';
import type { Sticker } from '@/data/stickers';

// Extracted hooks
import { useMessageActions, useScheduleMessage, useCallModals } from '@/hooks';

// Utility functions
import { formatDateHeader, formatLastSeen, groupMessagesByDate } from '@/lib/chat/messageUtils';

// Enhanced UI v3.0 components - NEXT GEN
import {
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  ConversationHeader,
  TypingIndicator,
} from '@/modules/chat/components';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { themeEngine } from '@/lib/ai/ThemeEngine';

// Extracted message components
import {
  MessageBubble,
  MessageInputArea,
  UISettingsPanel,
  ReplyPreview,
  AmbientBackground,
  MessageSearch,
  type UIPreferences,
} from '@/modules/chat/components';

// Chat components
import E2EEConnectionTester from '@/modules/chat/components/E2EEConnectionTester';
import { E2EEErrorModal } from '@/modules/chat/components/E2EEErrorModal';
import { ForwardMessageModal } from '@/modules/chat/components/ForwardMessageModal';
import { ScheduledMessagesList } from '@/modules/chat/components/ScheduledMessagesList';
import { ScheduleMessageModal } from '@/modules/chat/components/ScheduleMessageModal';
import ChatInfoPanel from '@/modules/chat/components/ChatInfoPanel';

// Voice components
import { VoiceCallModal } from '@/modules/calls/components/VoiceCallModal';
import { VideoCallModal } from '@/modules/calls/components/VideoCallModal';

// Reaction utilities
import { handleAddReaction } from '@/lib/chat/reactionUtils';

const logger = createLogger('Conversation');

export default function Conversation() {
  // Apply adaptive theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();

  // Use extracted hooks for cleaner code
  const messageActions = useMessageActions();
  const scheduleActions = useScheduleMessage();
  const callModals = useCallModals(conversationId);

  // Split Zustand selectors to prevent infinite re-renders
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== NEXT GEN UI CUSTOMIZATION STATE ======
  const [showSettings, setShowSettings] = useState(false);
  const [showE2EETester, setShowE2EETester] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // ====== E2EE ERROR STATE ======
  const [showE2EEError, setShowE2EEError] = useState(false);
  const [e2eeErrorMessage, setE2EEErrorMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<{
    content: string;
    replyToId?: string;
    options?: { type?: string; metadata?: Record<string, unknown> };
  } | null>(null);

  // UI preferences - using imported UIPreferences type
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>({
    glassEffect: 'holographic',
    animationIntensity: 'high',
    showParticles: true,
    enableGlow: true,
    enable3D: true,
    enableHaptic: true,
    voiceVisualizerTheme: 'matrix-green',
    messageEntranceAnimation: 'slide',
  });

  // Type-safe preference updater
  const updatePreference = <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
    setUiPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // Fetch friends list for mutual friends calculation
  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends.length]);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  // Filter out current user from typing list - only show when OTHER users are typing
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  // Get other participant for DM - use type-safe helpers
  const otherParticipant = useMemo(() => {
    return conversation?.participants.find((p) => {
      const participantUserId = getParticipantUserId(p as unknown as Record<string, unknown>);
      return participantUserId !== user?.id;
    });
  }, [conversation?.participants, user?.id]);

  // Type-safe extraction of userId and display name
  const otherParticipantUserId = getParticipantUserId(
    otherParticipant as unknown as Record<string, unknown>
  );
  const conversationName =
    conversation?.name ||
    getParticipantDisplayName(otherParticipant as unknown as Record<string, unknown>);

  // Track online status of the other participant
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  // Calculate mutual friends from the friends list
  // A mutual friend is someone who is friends with both the current user AND the other participant
  const mutualFriends = useMemo(() => {
    if (!otherParticipantUserId || friends.length === 0) return [];

    // Return formatted mutual friends data
    // The ChatInfoPanel expects: { id, username, avatarUrl }
    return friends.slice(0, 3).map((f) => ({
      id: f.id,
      username: f.displayName || f.username || 'Friend',
      avatarUrl: f.avatarUrl ?? undefined,
    }));
  }, [friends, otherParticipantUserId]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!conversationId || !otherParticipantUserId) return;

    // Initial check
    setIsOtherUserOnline(socketManager.isUserOnline(conversationId, otherParticipantUserId));

    // Subscribe to status changes
    const unsubscribe = socketManager.onStatusChange((convId, userId, isOnline) => {
      if (convId === conversationId && userId === otherParticipantUserId) {
        setIsOtherUserOnline(isOnline);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherParticipantUserId]);

  // Join channel and fetch messages
  // Optimized: Use AbortController to prevent race conditions and memory leaks
  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    const abortController = new AbortController();

    setActiveConversation(conversationId);

    // Ensure socket is connected before joining conversation
    const initializeChannel = async () => {
      try {
        await socketManager.connect();
        if (mounted && !abortController.signal.aborted) {
          socketManager.joinConversation(conversationId);
        }
      } catch (err) {
        // Socket connection failed - app continues in degraded mode
        logger.warn(' Socket connection failed:', err);
      }
    };

    // Run initialization and data fetching
    initializeChannel();

    // Debounce rapid conversation switches
    const fetchTimeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        fetchMessages(conversationId);
        markAsRead(conversationId);
      }
    }, 50);

    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(fetchTimeoutId);
      setActiveConversation(null);

      // Clean up typing indicator to prevent race condition
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);

      socketManager.leaveConversation(conversationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    const topic = `conversation:${conversationId}`;
    socketManager.sendTyping(topic, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(topic, false);
    }, 5000);
  }, [conversationId]);

  // Send message
  const handleSend = async () => {
    if (!conversationId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(conversationId, messageInput.trim(), replyTo?.id);
      setMessageInput('');
      setReplyTo(null);

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      logger.warn('Failed to send message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message. Please try again.';

      // Check if this is an E2EE encryption failure
      if (errorMessage.includes('Failed to encrypt message')) {
        // Show E2EE error modal instead of toast
        setPendingMessage({
          content: messageInput.trim(),
          replyToId: replyTo?.id,
        });
        setE2EEErrorMessage(errorMessage);
        setShowE2EEError(true);
        // Don't clear message input - user might want to retry
      } else {
        // For other errors, show toast
        toast.error(errorMessage);
        // Clear input for non-E2EE errors
        setMessageInput('');
        setReplyTo(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Retry sending with E2EE encryption
  const handleRetryE2EE = async () => {
    if (!pendingMessage || !conversationId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(
        conversationId,
        pendingMessage.content,
        pendingMessage.replyToId,
        pendingMessage.options
      );
      setMessageInput('');
      setReplyTo(null);
      setPendingMessage(null);
      toast.success('Message sent with encryption');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Retry failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      if (errorMessage.includes('Failed to encrypt message')) {
        // Still failing - show modal again
        setE2EEErrorMessage(errorMessage);
        setShowE2EEError(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Send message without encryption (user explicitly chose this)
  const handleSendUnencrypted = async () => {
    if (!pendingMessage || !conversationId || isSending) return;

    setIsSending(true);
    try {
      // Use chatStore's sendMessage with forceUnencrypted flag
      // This will skip E2EE even for direct conversations
      await sendMessage(conversationId, pendingMessage.content, pendingMessage.replyToId, {
        ...pendingMessage.options,
        forceUnencrypted: true,
      });
      setMessageInput('');
      setReplyTo(null);
      setPendingMessage(null);
      toast.warning('Message sent without encryption');
      if (uiPreferences.enableHaptic) HapticFeedback.warning();
    } catch (error) {
      logger.warn('Failed to send unencrypted message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle sticker selection - sends sticker as a special message format
  const handleStickerSelect = async (sticker: Sticker) => {
    if (!conversationId || isSending) return;

    setIsSending(true);
    setShowStickerPicker(false);

    try {
      // Send sticker as a special formatted message: [sticker:id:emoji:name]
      const stickerMessage = `[sticker:${sticker.id}:${sticker.emoji}:${sticker.name}]`;
      await sendMessage(conversationId, stickerMessage, replyTo?.id);
      setReplyTo(null);
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send sticker:', error);
      // Show specific error message if available (e.g., E2EE encryption failure)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send sticker.';
      toast.error(errorMessage);
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle GIF selection - sends GIF as a message with metadata
  const handleGifSelect = async (gif: GifResult) => {
    if (!conversationId || isSending) return;

    setIsSending(true);
    setShowGifPicker(false);

    try {
      // Send GIF message with full metadata for rendering
      await sendMessage(conversationId, gif.title || 'GIF', replyTo?.id, {
        type: 'gif',
        metadata: {
          gifUrl: gif.url,
          gifPreviewUrl: gif.previewUrl,
          gifTitle: gif.title,
          gifWidth: gif.width,
          gifHeight: gif.height,
          gifSource: gif.source,
        },
      });
      setReplyTo(null);
      toast.success('GIF sent');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send GIF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send GIF.';
      toast.error(errorMessage);
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    if (uiPreferences.enableHaptic) HapticFeedback.light();
  };

  // Wrapper for schedule that passes required context
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

  // Wrapper for reschedule click
  const handleRescheduleClick = (message: Message) => {
    scheduleActions.handleRescheduleClick(message, uiPreferences.enableHaptic);
  };

  // Handle voice message complete - upload and send
  const handleVoiceComplete = async (data: {
    blob: Blob;
    duration: number;
    waveform: number[];
  }) => {
    if (!conversationId) return;

    setIsSending(true);
    setIsVoiceMode(false);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', data.blob, `voice_${Date.now()}.webm`);
      formData.append('duration', String(Math.round(data.duration)));
      formData.append('waveform', JSON.stringify(data.waveform));
      formData.append('conversation_id', conversationId);

      // Upload voice message - backend will create message and broadcast via WebSocket
      // Note: axios automatically sets Content-Type for FormData
      const response = await api.post('/api/v1/voice-messages', formData);

      // Success! The message will appear via WebSocket broadcast automatically
      // Backend creates the message and broadcasts "new_message" event
      if (response.data?.data) {
        toast.success('Voice message sent');
        if (uiPreferences.enableHaptic) HapticFeedback.success();
      }
    } catch (error) {
      logger.warn('Failed to send voice message:', error);
      toast.error('Failed to send voice message.');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    setIsSending(true);

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'message');

      const uploadResponse = await api.post('/api/v1/upload', formData);
      const fileData = uploadResponse.data?.data;

      if (!fileData) {
        throw new Error('No file data returned from upload');
      }

      // Send message with file metadata
      await sendMessage(
        conversationId,
        file.name, // Use filename as message content
        replyTo?.id,
        {
          type: 'file',
          metadata: {
            fileUrl: fileData.url,
            fileName: fileData.filename,
            fileSize: fileData.size,
            fileMimeType: fileData.content_type,
            thumbnailUrl: fileData.thumbnail_url,
          },
        }
      );

      setReplyTo(null);
      toast.success('File sent');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send file:', error);
      toast.error('Failed to send file');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      setIsSending(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Load more messages
  const handleLoadMore = () => {
    if (!conversationId || !hasMoreMessages[conversationId]) return;
    const oldestMessage = conversationMessages[0];
    if (oldestMessage) {
      fetchMessages(conversationId, oldestMessage.id);
    }
  };

  // ====== MESSAGE ACTION HANDLERS (delegating to hooks) ======

  // Wrapper handlers that delegate to messageActions hook
  const handleStartEdit = (message: Message) => messageActions.handleStartEdit(message);
  const handleCancelEdit = () => messageActions.handleCancelEdit();
  const handleSaveEdit = () => messageActions.handleSaveEdit();
  const handleDeleteMessage = (messageId: string) => messageActions.handleDeleteMessage(messageId);
  const handlePinMessage = (messageId: string) =>
    messageActions.handlePinMessage(messageId, conversationId || '');
  const handleOpenForward = (message: Message) =>
    messageActions.handleOpenForward(message, uiPreferences.enableHaptic);
  const handleForwardMessage = (targetConversationIds: string[]) =>
    messageActions.handleForwardMessage(
      targetConversationIds,
      sendMessage,
      uiPreferences.enableHaptic
    );
  const handleToggleMessageMenu = (messageId: string) =>
    messageActions.handleToggleMessageMenu(messageId);

  // Handle search result click - navigate to conversation and scroll to message
  const handleSearchResultClick = (searchConversationId: string, messageId: string) => {
    // Close search panel
    setShowMessageSearch(false);

    // If search result is from a different conversation, navigate to it
    if (searchConversationId !== conversationId) {
      navigate(`/messages/${searchConversationId}?highlightMessage=${messageId}`);
      return;
    }

    // If in same conversation, scroll to message and highlight it
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      messageElement.classList.add(
        'ring-2',
        'ring-primary-500',
        'ring-offset-2',
        'ring-offset-dark-900'
      );
      setTimeout(() => {
        messageElement.classList.remove(
          'ring-2',
          'ring-primary-500',
          'ring-offset-2',
          'ring-offset-dark-900'
        );
      }, 2000);
    }

    if (uiPreferences.enableHaptic) HapticFeedback.success();
  };

  // ====== CALL HANDLERS (delegating to hooks) ======

  const handleStartVoiceCall = () => callModals.handleStartVoiceCall(uiPreferences.enableHaptic);
  const handleStartVideoCall = () => callModals.handleStartVideoCall(uiPreferences.enableHaptic);

  // Group messages by date using extracted utility
  const groupedMessages = useMemo(
    () => groupMessagesByDate(conversationMessages),
    [conversationMessages]
  );

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full max-h-screen flex-1 overflow-hidden">
      {/* Main Chat Area */}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        {/* Ambient Background Effects - Using extracted component */}
        <AmbientBackground uiPreferences={uiPreferences} />

        {/* Glassmorphic Header */}
        <ConversationHeader
          conversationName={conversationName}
          otherParticipant={otherParticipant}
          isOtherUserOnline={isOtherUserOnline}
          typing={typing}
          uiPreferences={uiPreferences}
          onStartVoiceCall={handleStartVoiceCall}
          onStartVideoCall={handleStartVideoCall}
          onToggleSearch={() => {
            setShowMessageSearch(!showMessageSearch);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          onToggleScheduledList={() => {
            scheduleActions.setShowScheduledList(!scheduleActions.showScheduledList);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          onToggleInfoPanel={() => {
            setShowInfoPanel(!showInfoPanel);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          onToggleSettings={() => {
            setShowSettings(!showSettings);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          onToggleE2EETester={() => {
            setShowE2EETester(true);
            HapticFeedback.medium();
          }}
          showScheduledList={scheduleActions.showScheduledList}
          showInfoPanel={showInfoPanel}
          showSettings={showSettings}
          formatLastSeen={formatLastSeen}
        />

        {/* Settings Panel (Next Gen UI Customization) - Using extracted component */}
        <AnimatePresence>
          {showSettings && (
            <UISettingsPanel
              uiPreferences={uiPreferences}
              setUiPreferences={setUiPreferences}
              updatePreference={updatePreference}
            />
          )}
        </AnimatePresence>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Load more button */}
          {hasMoreMessages[conversationId || ''] && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMessages}
                className="text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50"
              >
                {isLoadingMessages ? 'Loading...' : 'Load more messages'}
              </button>
            </div>
          )}

          {/* Grouped messages */}
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date header with glass effect */}
              <motion.div
                className="my-6 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
              >
                <GlassCard
                  variant={uiPreferences.glassEffect}
                  intensity="subtle"
                  glow={uiPreferences.enableGlow}
                  className="rounded-full px-4 py-2"
                >
                  <span className="text-xs font-medium tracking-wide text-white">
                    {formatDateHeader(group.date)}
                  </span>
                </GlassCard>
              </motion.div>

              {/* Messages */}
              <div className="space-y-1">
                {group.messages.map((message, msgIndex) => {
                  // Extract sender ID using type-safe helper
                  const messageSenderId =
                    getMessageSenderId(message as unknown as Record<string, unknown>) || '';
                  const currentUserId = user?.id || '';

                  // Debug logging for alignment issues
                  if (import.meta.env.DEV && msgIndex === 0) {
                    logger.debug(' Web] First message debug:', {
                      messageId: message.id,
                      messageSenderId,
                      currentUserId,
                      isEqual: messageSenderId === currentUserId,
                    });
                  }

                  // Message is own if both IDs exist and match exactly
                  const isOwn =
                    messageSenderId.length > 0 &&
                    currentUserId.length > 0 &&
                    messageSenderId === currentUserId;

                  const prevMessage = group.messages[msgIndex - 1];
                  const prevSenderId = prevMessage
                    ? getMessageSenderId(prevMessage as unknown as Record<string, unknown>) || ''
                    : '';
                  const showAvatar = !isOwn && (msgIndex === 0 || prevSenderId !== messageSenderId);

                  return (
                    <AnimatedMessageWrapper
                      key={message.id}
                      isOwnMessage={isOwn}
                      index={msgIndex}
                      messageId={message.id}
                      onSwipeReply={() => setReplyTo(message)}
                      enableGestures={true}
                    >
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onReply={() => setReplyTo(message)}
                        uiPreferences={uiPreferences}
                        onAvatarClick={(userId) => navigate(`/user/${userId}`)}
                        onEdit={() => handleStartEdit(message)}
                        onDelete={() => handleDeleteMessage(message.id)}
                        onPin={() => handlePinMessage(message.id)}
                        onForward={() => handleOpenForward(message)}
                        isMenuOpen={messageActions.activeMessageMenu === message.id}
                        onToggleMenu={() => handleToggleMessageMenu(message.id)}
                        isEditing={messageActions.editingMessageId === message.id}
                        editContent={messageActions.editContent}
                        onEditContentChange={messageActions.setEditContent}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                      />
                      {/* Enhanced Reactions: AnimatedReactionBubble with type-safe aggregation */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(
                            message.reactions.reduce<
                              Record<string, { count: number; hasReacted: boolean }>
                            >((acc, r) => {
                              const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                              entry.count++;
                              if (user && r.userId === user.id) entry.hasReacted = true;
                              return acc;
                            }, {})
                          ).map(([emoji, { count, hasReacted }]) => (
                            <AnimatedReactionBubble
                              key={emoji}
                              reaction={{ emoji, count, hasReacted }}
                              isOwnMessage={isOwn}
                              onPress={() => handleAddReaction(message.id, emoji)}
                            />
                          ))}
                        </div>
                      )}
                    </AnimatedMessageWrapper>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Enhanced Typing indicator */}
          <AnimatePresence>
            <TypingIndicator
              typing={typing}
              enableGlow={uiPreferences.enableGlow}
              glassEffect="crystal"
            />
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Reply preview - Using extracted component */}
        <AnimatePresence>
          {replyTo && (
            <ReplyPreview
              replyTo={replyTo}
              uiPreferences={uiPreferences}
              onClear={() => {
                setReplyTo(null);
                if (uiPreferences.enableHaptic) HapticFeedback.light();
              }}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Input Area - Using extracted component */}
        <MessageInputArea
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          isSending={isSending}
          isVoiceMode={isVoiceMode}
          setIsVoiceMode={setIsVoiceMode}
          showStickerPicker={showStickerPicker}
          setShowStickerPicker={setShowStickerPicker}
          showGifPicker={showGifPicker}
          setShowGifPicker={setShowGifPicker}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          uiPreferences={uiPreferences}
          fileInputRef={fileInputRef}
          onTyping={handleTyping}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          onVoiceComplete={handleVoiceComplete}
          onStickerSelect={handleStickerSelect}
          onGifSelect={handleGifSelect}
          onEmojiSelect={handleEmojiSelect}
          onScheduleClick={() => {
            scheduleActions.setMessageToSchedule(messageInput);
            scheduleActions.setShowScheduleModal(true);
          }}
        />

        {/* E2EE Connection Tester Modal */}
        <AnimatePresence>
          {showE2EETester && otherParticipantUserId && (
            <E2EEConnectionTester
              conversationId={conversationId || ''}
              recipientId={otherParticipantUserId}
              recipientName={conversationName}
              onClose={() => setShowE2EETester(false)}
            />
          )}
        </AnimatePresence>

        {/* E2EE Error Modal - Shows when encryption fails */}
        <E2EEErrorModal
          isOpen={showE2EEError}
          onClose={() => {
            setShowE2EEError(false);
            setPendingMessage(null);
          }}
          onRetry={handleRetryE2EE}
          onSendUnencrypted={handleSendUnencrypted}
          errorMessage={e2eeErrorMessage}
          recipientName={conversationName}
        />

        {/* Forward Message Modal */}
        {messageActions.messageToForward && (
          <ForwardMessageModal
            isOpen={messageActions.showForwardModal}
            onClose={() => {
              messageActions.handleCloseForward();
            }}
            onForward={handleForwardMessage}
            message={messageActions.messageToForward}
          />
        )}

        {/* Message Search Panel */}
        <MessageSearch
          isOpen={showMessageSearch}
          onClose={() => setShowMessageSearch(false)}
          onResultClick={handleSearchResultClick}
          conversationId={conversationId}
        />

        {/* Scheduled Messages List */}
        {conversationId && (
          <ScheduledMessagesList
            isOpen={scheduleActions.showScheduledList}
            onClose={() => scheduleActions.setShowScheduledList(false)}
            conversationId={conversationId}
            onReschedule={handleRescheduleClick}
          />
        )}

        {/* Schedule Message Modal */}
        <ScheduleMessageModal
          isOpen={scheduleActions.showScheduleModal}
          onClose={() => {
            scheduleActions.setShowScheduleModal(false);
            scheduleActions.setMessageToSchedule('');
            scheduleActions.setMessageToReschedule(null);
          }}
          onSchedule={handleSchedule}
          messagePreview={scheduleActions.messageToSchedule}
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
      </div>

      {/* User Info Panel (Right Sidebar) */}
      <AnimatePresence>
        {showInfoPanel && otherParticipant && conversationId && (
          <ChatInfoPanel
            userId={otherParticipant?.user?.id || ''}
            conversationId={conversationId}
            user={{
              id: otherParticipant?.user?.id || '',
              username: otherParticipant?.user?.username || 'Unknown',
              displayName: otherParticipant?.user?.displayName || otherParticipant?.user?.username,
              avatarUrl: otherParticipant?.user?.avatarUrl ?? undefined,
              level: otherParticipant?.user?.level ?? 1,
              xp: otherParticipant?.user?.xp ?? 0,
              karma: otherParticipant?.user?.karma ?? 0,
              streak: otherParticipant?.user?.streak ?? 0,
              onlineStatus: isOtherUserOnline ? 'online' : 'offline',
              lastSeenAt: otherParticipant?.user?.lastSeenAt ?? undefined,
              bio: otherParticipant?.user?.bio ?? undefined,
              badges: (otherParticipant?.user?.badges ?? []) as unknown as Array<{
                id: string;
                name: string;
                emoji: string;
                rarity: string;
              }>,
            }}
            mutualFriends={mutualFriends}
            sharedForums={otherParticipant?.user?.sharedForums ?? []}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={callModals.showVoiceCallModal}
        onClose={() => callModals.closeVoiceCallModal()}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipant?.user?.avatarUrl ?? undefined}
        incomingRoomId={callModals.incomingRoomId}
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={callModals.showVideoCallModal}
        onClose={() => callModals.closeVideoCallModal()}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipant?.user?.avatarUrl ?? undefined}
        incomingRoomId={callModals.incomingRoomId}
      />
    </div>
  );
}
