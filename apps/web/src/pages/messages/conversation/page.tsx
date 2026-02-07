/**
 * Conversation Page
 *
 * Real-time messaging view with E2EE support, message reactions,
 * voice/video calls, sticker/GIF pickers, and scheduled messages.
 * Modularized from original 1006-line Conversation.tsx.
 *
 * @module pages/messages/conversation/page
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import { AnimatePresence } from 'framer-motion';

// Extracted module pieces
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

// External hooks
import { useMessageActions, useScheduleMessage, useCallModals } from '@/hooks';

// Utilities
import { groupMessagesByDate } from '@/lib/chat/messageUtils';
import { themeEngine } from '@/lib/ai/ThemeEngine';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { formatLastSeen } from '@/lib/chat/messageUtils';

// UI Components
import { ConversationHeader } from '@/modules/chat/components';
import {
  MessageInputArea,
  UISettingsPanel,
  ReplyPreview,
  AmbientBackground,
} from '@/modules/chat/components';
import { ConversationMessages } from './ConversationMessages';
import { E2EETesterModal, E2EEError, CallModals, InfoPanel } from './ConversationModals';
import { ForwardMessageModal } from '@/modules/chat/components/ForwardMessageModal';
import { MessageSearch } from '@/modules/chat/components';
import { ScheduledMessagesList } from '@/modules/chat/components/ScheduledMessagesList';
import { ScheduleMessageModal } from '@/modules/chat/components/ScheduleMessageModal';

export default function Conversation() {
  // Apply adaptive theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);

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
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];
  const { messagesEndRef, messagesContainerRef } = useAutoScroll(conversationMessages.length);
  const groupedMessages = useMemo(
    () => groupMessagesByDate(conversationMessages),
    [conversationMessages]
  );

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

  // ── Loading state ────────────────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
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
          uiPreferences={uiPreferences as Parameters<typeof ConversationHeader>[0]['uiPreferences']}
          onStartVoiceCall={() => callModals.handleStartVoiceCall(uiPreferences.enableHaptic)}
          onStartVideoCall={() => callModals.handleStartVideoCall(uiPreferences.enableHaptic)}
          onToggleSearch={() => hapticToggle(setShowMessageSearch)}
          onToggleScheduledList={() =>
            hapticToggle(() =>
              scheduleActions.setShowScheduledList(!scheduleActions.showScheduledList)
            )
          }
          onToggleInfoPanel={() => hapticToggle(setShowInfoPanel)}
          onToggleSettings={() => hapticToggle(setShowSettings)}
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

        <ConversationMessages
          groupedMessages={groupedMessages}
          hasMore={!!hasMoreMessages[conversationId || '']}
          isLoading={isLoadingMessages}
          typing={typing}
          user={user}
          uiPreferences={uiPreferences}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          activeMessageMenu={messageActions.activeMessageMenu}
          editingMessageId={messageActions.editingMessageId}
          editContent={messageActions.editContent}
          onLoadMore={handleLoadMore}
          onReply={setReplyTo}
          onStartEdit={messageActions.handleStartEdit}
          onDeleteMessage={messageActions.handleDeleteMessage}
          onPinMessage={(id) => messageActions.handlePinMessage(id, conversationId || '')}
          onOpenForward={(msg) => messageActions.handleOpenForward(msg, uiPreferences.enableHaptic)}
          onToggleMessageMenu={messageActions.handleToggleMessageMenu}
          onEditContentChange={messageActions.setEditContent}
          onSaveEdit={messageActions.handleSaveEdit}
          onCancelEdit={messageActions.handleCancelEdit}
        />

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

        <E2EETesterModal
          showE2EETester={showE2EETester}
          otherParticipantUserId={otherParticipantUserId}
          conversationId={conversationId || ''}
          conversationName={conversationName}
          onClose={() => setShowE2EETester(false)}
        />

        <E2EEError
          isOpen={showE2EEError}
          errorMessage={e2eeErrorMessage}
          recipientName={conversationName}
          onClose={() => {
            setShowE2EEError(false);
            setPendingMessage(null);
          }}
          onRetry={handleRetryE2EE}
          onSendUnencrypted={handleSendUnencrypted}
        />

        {messageActions.messageToForward && (
          <ForwardMessageModal
            isOpen={messageActions.showForwardModal}
            onClose={() => messageActions.handleCloseForward()}
            onForward={(ids) =>
              messageActions.handleForwardMessage(ids, sendMessage, uiPreferences.enableHaptic)
            }
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
            onReschedule={(msg) =>
              scheduleActions.handleRescheduleClick(msg, uiPreferences.enableHaptic)
            }
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

      <InfoPanel
        showInfoPanel={showInfoPanel}
        otherParticipant={otherParticipant as unknown as Record<string, unknown>}
        conversationId={conversationId || ''}
        isOtherUserOnline={isOtherUserOnline}
        mutualFriends={mutualFriends}
        onClose={() => setShowInfoPanel(false)}
      />

      <CallModals
        showVoiceCallModal={callModals.showVoiceCallModal}
        showVideoCallModal={callModals.showVideoCallModal}
        conversationId={conversationId || ''}
        otherParticipant={otherParticipant ?? null}
        conversationName={conversationName}
        incomingRoomId={callModals.incomingRoomId}
        onCloseVoice={() => callModals.closeVoiceCallModal()}
        onCloseVideo={() => callModals.closeVideoCallModal()}
      />
    </div>
  );
}
