/**
 * Conversation page component
 * Modularized from original 1006-line Conversation.tsx
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/shared/components/ui';

// Extracted hooks from this module
import {
  useConversationParticipant,
  usePresenceStatus,
  useConversationChannel,
  useTypingIndicator,
  useAutoScroll,
} from './hooks';

// Extracted handlers from this module
import {
  createSendHandler,
  createE2EERetryHandler,
  createUnencryptedSendHandler,
  createStickerSelectHandler,
  createGifSelectHandler,
  createVoiceCompleteHandler,
  createFileSelectHandler,
} from './handlers';

// Types from this module
import type { UIPreferences, PendingE2EEMessage } from './types';
import { DEFAULT_UI_PREFERENCES } from './types';

// External hooks
import { useMessageActions, useScheduleMessage, useCallModals } from '@/hooks';

// Utility functions
import { formatDateHeader, formatLastSeen, groupMessagesByDate } from '@/lib/chat/messageUtils';
import { getMessageSenderId } from '@/lib/apiUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';

// Theme engine
import { themeEngine } from '@/lib/ai/ThemeEngine';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { createLogger } from '@/lib/logger';

// UI Components
import {
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  ConversationHeader,
  TypingIndicator,
} from '@/modules/chat/components';
import { GlassCard } from '@/shared/components/ui';
import {
  MessageBubble,
  MessageInputArea,
  UISettingsPanel,
  ReplyPreview,
  AmbientBackground,
  MessageSearch,
} from '@/modules/chat/components';
import E2EEConnectionTester from '@/modules/chat/components/E2EEConnectionTester';
import { E2EEErrorModal } from '@/modules/chat/components/E2EEErrorModal';
import { ForwardMessageModal } from '@/modules/chat/components/ForwardMessageModal';
import { ScheduledMessagesList } from '@/modules/chat/components/ScheduledMessagesList';
import { ScheduleMessageModal } from '@/modules/chat/components/ScheduleMessageModal';
import ChatInfoPanel from '@/modules/chat/components/ChatInfoPanel';
import { VoiceCallModal } from '@/modules/calls/components/VoiceCallModal';
import { VideoCallModal } from '@/modules/calls/components/VideoCallModal';

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

  // Use extracted hooks for participant and presence
  const {
    conversation,
    otherParticipant,
    otherParticipantUserId,
    conversationName,
    mutualFriends,
  } = useConversationParticipant(conversationId);
  const isOtherUserOnline = usePresenceStatus(conversationId, otherParticipantUserId);

  // Use extracted hooks for channel and typing
  useConversationChannel(conversationId);
  const { handleTyping, stopTyping, typingTimeoutRef } = useTypingIndicator(conversationId);

  // External hooks
  const messageActions = useMessageActions();
  const scheduleActions = useScheduleMessage();
  const callModals = useCallModals(conversationId);

  // Split Zustand selectors
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);

  // Local state
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

  // Derived data
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  // Auto scroll
  const { messagesEndRef, messagesContainerRef } = useAutoScroll(conversationMessages.length);

  // Group messages by date
  const groupedMessages = useMemo(
    () => groupMessagesByDate(conversationMessages),
    [conversationMessages]
  );

  // Create handlers using factories
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

  const handleSend = useCallback(createSendHandler(handlerContext), [
    conversationId,
    messageInput,
    replyTo,
    isSending,
  ]);

  const handleRetryE2EE = useCallback(createE2EERetryHandler(handlerContext), [
    conversationId,
    pendingMessage,
    isSending,
  ]);

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

  const handleStickerSelect = useCallback(createStickerSelectHandler(mediaContext), [
    conversationId,
    replyTo,
  ]);

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

  const handleFileSelect = useCallback(createFileSelectHandler(fileContext), [
    conversationId,
    replyTo,
  ]);

  // Handle scheduling
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

  const handleRescheduleClick = (message: Message) => {
    scheduleActions.handleRescheduleClick(message, uiPreferences.enableHaptic);
  };

  // Key press handler
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

  // Message action wrappers
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

  // Search result click
  const handleSearchResultClick = (searchConversationId: string, messageId: string) => {
    setShowMessageSearch(false);

    if (searchConversationId !== conversationId) {
      navigate(`/messages/${searchConversationId}?highlightMessage=${messageId}`);
      return;
    }

    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // Call handlers
  const handleStartVoiceCall = () => callModals.handleStartVoiceCall(uiPreferences.enableHaptic);
  const handleStartVideoCall = () => callModals.handleStartVideoCall(uiPreferences.enableHaptic);

  // Loading state
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
        <AmbientBackground uiPreferences={uiPreferences} />

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

          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
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

              <div className="space-y-1">
                {group.messages.map((message, msgIndex) => {
                  const messageSenderId =
                    getMessageSenderId(message as unknown as Record<string, unknown>) || '';
                  const currentUserId = user?.id || '';

                  if (import.meta.env.DEV && msgIndex === 0) {
                    logger.debug('Web] First message debug:', {
                      messageId: message.id,
                      messageSenderId,
                      currentUserId,
                      isEqual: messageSenderId === currentUserId,
                    });
                  }

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

          <AnimatePresence>
            <TypingIndicator
              typing={typing}
              enableGlow={uiPreferences.enableGlow}
              glassEffect="crystal"
            />
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

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

        {messageActions.messageToForward && (
          <ForwardMessageModal
            isOpen={messageActions.showForwardModal}
            onClose={() => messageActions.handleCloseForward()}
            onForward={handleForwardMessage}
            message={messageActions.messageToForward}
          />
        )}

        <MessageSearch
          isOpen={showMessageSearch}
          onClose={() => setShowMessageSearch(false)}
          onResultClick={handleSearchResultClick}
          conversationId={conversationId}
        />

        {conversationId && (
          <ScheduledMessagesList
            isOpen={scheduleActions.showScheduledList}
            onClose={() => scheduleActions.setShowScheduledList(false)}
            conversationId={conversationId}
            onReschedule={handleRescheduleClick}
          />
        )}

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

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
      </div>

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

      <VoiceCallModal
        isOpen={callModals.showVoiceCallModal}
        onClose={() => callModals.closeVoiceCallModal()}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipant?.user?.avatarUrl ?? undefined}
        incomingRoomId={callModals.incomingRoomId}
      />

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
