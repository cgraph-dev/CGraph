/**
 * Conversation Page
 *
 * Real-time messaging view with E2EE support, message reactions,
 * voice/video calls, sticker/GIF pickers, and scheduled messages.
 * Modularized from original 1006-line Conversation.tsx.
 *
 * @module pages/messages/conversation/page
 */

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import type { Message } from '@/modules/chat/store';
import { useConversationPage } from './useConversationPage';
import { ConversationOverlays } from './conversation-overlays';
import { ConversationMessages } from './conversation-messages';
import { CallModals, InfoPanel } from './conversation-modals';

import { ConversationHeader } from '@/modules/chat/components';
import {
  MessageInputArea,
  UISettingsPanel,
  ReplyPreview,
  AmbientBackground,
} from '@/modules/chat/components';
import { ThreadPanel } from '@/modules/chat/components/thread-panel';
import { useThreadStore } from '@/modules/chat/store/threadStore';

import { themeEngine } from '@/lib/ai/theme-engine';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatLastSeen } from '@/lib/chat/messageUtils';
import {
  FullScreenChatEffect,
  useChatEffect,
} from '@/modules/chat/components/chat-effects/full-screen-chat-effect';

/**
 * Conversation component.
 */
export default function Conversation() {
  // Apply adaptive theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);

  const ctx = useConversationPage();
  const chatEffect = useChatEffect();
  const activeThread = useThreadStore((s) => s.activeThread);

  // ── Loading state ────────────────────────────────────────────────────
  if (!ctx.conversation) {
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
        <AmbientBackground uiPreferences={ctx.uiPreferences} />
        <FullScreenChatEffect effect={chatEffect.activeEffect} onComplete={chatEffect.clear} />

        <ConversationHeader
          conversationName={ctx.conversationName}
          otherParticipant={ctx.otherParticipant}
          isOtherUserOnline={ctx.isOtherUserOnline}
          typing={ctx.typing}
          uiPreferences={
             
            ctx.uiPreferences as Parameters< // safe downcast – structural boundary
              typeof ConversationHeader
            >[0]['uiPreferences'] 
          }
          onStartVoiceCall={() =>
            ctx.callModals.handleStartVoiceCall(ctx.uiPreferences.enableHaptic)
          }
          onStartVideoCall={() =>
            ctx.callModals.handleStartVideoCall(ctx.uiPreferences.enableHaptic)
          }
          onToggleSearch={() => ctx.hapticToggle(ctx.setShowMessageSearch)}
          onToggleScheduledList={() =>
            ctx.hapticToggle(() =>
              ctx.scheduleActions.setShowScheduledList(!ctx.scheduleActions.showScheduledList)
            )
          }
          onToggleInfoPanel={() => ctx.hapticToggle(ctx.setShowInfoPanel)}
          onToggleSettings={() => ctx.hapticToggle(ctx.setShowSettings)}
          onToggleE2EETester={() => {
            ctx.setShowE2EETester(true);
            HapticFeedback.medium();
          }}
          showScheduledList={ctx.scheduleActions.showScheduledList}
          showInfoPanel={ctx.showInfoPanel}
          showSettings={ctx.showSettings}
          formatLastSeen={formatLastSeen}
        />

        <AnimatePresence>
          {ctx.showSettings && (
            <UISettingsPanel
              uiPreferences={ctx.uiPreferences}
              setUiPreferences={ctx.setUiPreferences}
              updatePreference={ctx.updatePreference}
            />
          )}
        </AnimatePresence>

        <ConversationMessages
          groupedMessages={ctx.groupedMessages}
          hasMore={!!ctx.hasMoreMessages[ctx.conversationId || '']}
          isLoading={ctx.isLoadingMessages}
          typing={ctx.typing}
          user={ctx.user}
          uiPreferences={ctx.uiPreferences}
          messagesEndRef={ctx.messagesEndRef}
          messagesContainerRef={ctx.messagesContainerRef}
          activeMessageMenu={ctx.messageActions.activeMessageMenu}
          editingMessageId={ctx.messageActions.editingMessageId}
          editContent={ctx.messageActions.editContent}
          onLoadMore={ctx.handleLoadMore}
          onReply={ctx.setReplyTo}
          onStartEdit={ctx.messageActions.handleStartEdit}
          onDeleteMessage={ctx.messageActions.handleDeleteMessage}
          onPinMessage={(id) => ctx.messageActions.handlePinMessage(id, ctx.conversationId || '')}
          onOpenForward={(msg) =>
            ctx.messageActions.handleOpenForward(msg, ctx.uiPreferences.enableHaptic)
          }
          onToggleMessageMenu={ctx.messageActions.handleToggleMessageMenu}
          onEditContentChange={ctx.messageActions.setEditContent}
          onSaveEdit={ctx.messageActions.handleSaveEdit}
          onCancelEdit={ctx.messageActions.handleCancelEdit}
        />

        <AnimatePresence>
          {ctx.replyTo && (
            <ReplyPreview
              replyTo={ctx.replyTo}
              uiPreferences={ctx.uiPreferences}
              onClear={() => {
                ctx.setReplyTo(null);
                if (ctx.uiPreferences.enableHaptic) HapticFeedback.light();
              }}
            />
          )}
        </AnimatePresence>

        <MessageInputArea
          messageInput={ctx.messageInput}
          setMessageInput={ctx.setMessageInput}
          isSending={ctx.isSending}
          isVoiceMode={ctx.isVoiceMode}
          setIsVoiceMode={ctx.setIsVoiceMode}
          showStickerPicker={ctx.showStickerPicker}
          setShowStickerPicker={ctx.setShowStickerPicker}
          showGifPicker={ctx.showGifPicker}
          setShowGifPicker={ctx.setShowGifPicker}
          showEmojiPicker={ctx.showEmojiPicker}
          setShowEmojiPicker={ctx.setShowEmojiPicker}
          uiPreferences={ctx.uiPreferences}
          fileInputRef={ctx.fileInputRef}
          onTyping={ctx.handleTyping}
          onSend={ctx.handleSend}
          onKeyPress={ctx.handleKeyPress}
          onVoiceComplete={ctx.handleVoiceComplete}
          onStickerSelect={ctx.handleStickerSelect}
          onGifSelect={ctx.handleGifSelect}
          onEmojiSelect={ctx.handleEmojiSelect}
          onScheduleClick={() => {
            ctx.scheduleActions.setMessageToSchedule(ctx.messageInput);
            ctx.scheduleActions.setShowScheduleModal(true);
          }}
        />

        <ConversationOverlays
          conversationId={ctx.conversationId || ''}
          conversationName={ctx.conversationName}
          otherParticipantUserId={ctx.otherParticipantUserId}
          uiPreferences={ctx.uiPreferences}
          showE2EETester={ctx.showE2EETester}
          onCloseE2EETester={() => ctx.setShowE2EETester(false)}
          showE2EEError={ctx.showE2EEError}
          e2eeErrorMessage={ctx.e2eeErrorMessage}
          onCloseE2EEError={() => {
            ctx.setShowE2EEError(false);
            ctx.setPendingMessage(null);
          }}
          onRetryE2EE={ctx.handleRetryE2EE}
          onSendUnencrypted={ctx.handleSendUnencrypted}
          showForwardModal={ctx.messageActions.showForwardModal}
          messageToForward={ctx.messageActions.messageToForward}
          onCloseForward={() => ctx.messageActions.handleCloseForward()}
          onForwardMessage={(ids) =>
            ctx.messageActions.handleForwardMessage(
              ids,
              ctx.sendMessage,
              ctx.uiPreferences.enableHaptic
            )
          }
          showMessageSearch={ctx.showMessageSearch}
          onCloseSearch={() => ctx.setShowMessageSearch(false)}
          onSearchResultClick={ctx.handleSearchResultClick}
          showScheduledList={ctx.scheduleActions.showScheduledList}
          onCloseScheduledList={() => ctx.scheduleActions.setShowScheduledList(false)}
          onReschedule={(msg: Message) =>
            ctx.scheduleActions.handleRescheduleClick(msg, ctx.uiPreferences.enableHaptic)
          }
          showScheduleModal={ctx.scheduleActions.showScheduleModal}
          onCloseScheduleModal={() => {
            ctx.scheduleActions.setShowScheduleModal(false);
            ctx.scheduleActions.setMessageToSchedule('');
            ctx.scheduleActions.setMessageToReschedule(null);
          }}
          onSchedule={ctx.handleSchedule}
          messageToSchedule={ctx.scheduleActions.messageToSchedule}
          fileInputRef={ctx.fileInputRef}
          onFileSelect={ctx.handleFileSelect}
        />
      </div>

      <InfoPanel
        showInfoPanel={ctx.showInfoPanel}
        otherParticipant={
           
          ctx.otherParticipant as unknown as Record< // safe downcast – structural boundary
            string,
            unknown
          >
        }
        conversationId={ctx.conversationId || ''}
        isOtherUserOnline={ctx.isOtherUserOnline}
        mutualFriends={ctx.mutualFriends}
        onClose={() => ctx.setShowInfoPanel(false)}
      />

      <CallModals
        showVoiceCallModal={ctx.callModals.showVoiceCallModal}
        showVideoCallModal={ctx.callModals.showVideoCallModal}
        conversationId={ctx.conversationId || ''}
        otherParticipant={ctx.otherParticipant ?? null}
        conversationName={ctx.conversationName}
        incomingRoomId={ctx.callModals.incomingRoomId}
        onCloseVoice={() => ctx.callModals.closeVoiceCallModal()}
        onCloseVideo={() => ctx.callModals.closeVideoCallModal()}
      />

      {/* Thread side panel */}
      <AnimatePresence>
        {activeThread && (
          <ThreadPanel
            isOpen={!!activeThread}
            onClose={useThreadStore.getState().closeThread}
            parentMessage={
              activeThread
                ? {
                    id: activeThread.id,
                    content: activeThread.content,
                    sender_id: activeThread.senderId,
                    sender_name:
                      activeThread.sender?.displayName || activeThread.sender?.username || 'User',
                    sender_avatar: activeThread.sender?.avatarUrl || undefined,
                    inserted_at: activeThread.createdAt,
                  }
                : null
            }
            conversationId={ctx.conversationId || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
