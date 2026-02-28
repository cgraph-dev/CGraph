/**
 * Conversation screen for viewing and sending messages in a thread.
 * @module screens/messages/conversation-screen
 */
import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore, useThemeStore } from '@/stores';
import { usePrivacySettings } from '../../stores/settingsStore';
import { useE2EE } from '../../lib/crypto/e2-ee-context';
import { MessagesStackParamList, Message, ConversationParticipant } from '../../types';
import { createLogger } from '../../lib/logger';
import { useChatStore } from '../../stores/chatStore';

import {
  EmptyConversation,
  PinnedMessagesBar,
  ChatInputArea,
  MessageBubble,
} from './conversation-screen/components';
import { ConversationModals } from './conversation-screen/components/conversation-modals';
import { styles } from './conversation-screen/styles';
import { useConversationData } from './conversation-screen/hooks';
import { useAutoReadOnVisibility } from './conversation-screen/hooks/useConversationSocket';
import { useConversationSetup } from './conversation-screen/hooks/use-conversation-setup';
import {
  isValidMessage,
  isOwnMessage as checkIsOwnMessage,
  getSenderInfo,
} from './conversation-screen/utils';

const logger = createLogger('ConversationScreen');

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  route: RouteProp<MessagesStackParamList, 'Conversation'>;
};

/**
 *
 */
export default function ConversationScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { colors, colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  const { isInitialized: isE2EEInitialized, encryptMessage } = useE2EE();
  const privacy = usePrivacySettings();
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Core data hook
  const {
    conversation: _conversation,
    messages,
    setMessages,
    isLoading,
    isRefreshing,
    otherParticipantId,
    otherUser,
    fetchMessages,
    fetchConversation,
    onRefresh,
  } = useConversationData({ conversationId, userId: user?.id, deletedMessageIdsRef });

  // Consolidated hook for all actions / sub-hooks
  const setup = useConversationSetup({
    conversationId,
    user,
    isE2EEInitialized,
    otherParticipantId,
    encryptMessage,
    messages,
    setMessages,
    deletedMessageIdsRef,
    navigation,
    colors,
  });

  // Auto-read on scroll visibility (gated by privacy toggle)
  const { handleViewableItemsChanged, triggerInitialRead } = useAutoReadOnVisibility({
    conversationId,
    userId: user?.id,
    showReadReceipts: privacy?.showReadReceipts ?? true,
  });

  // Viewability config for auto-read (50% threshold)
  const viewabilityConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Trigger initial read when messages load
  useEffect(() => {
    if (messages.length > 0) {
      triggerInitialRead(messages);
    }
  }, [messages.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch messages on mount
  useEffect(() => { fetchMessages(); }, [conversationId, fetchMessages]);

  // Fetch conversation when user available
  useEffect(() => { if (user?.id) fetchConversation(); }, [conversationId, user?.id, fetchConversation]);

  // Update header when conversation/presence changes
  useEffect(() => {
    if (_conversation) {
      const conv = _conversation;
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const pid = p.userId || p.user_id || (p.user as Record<string, unknown>)?.id || p.id;
        return String(pid) !== String(user?.id);
      });
      const displayName =
        conv.name || otherParticipant?.nickname ||
        (otherParticipant?.user as Record<string, unknown>)?.displayName ||
        otherParticipant?.user?.display_name ||
        (otherParticipant as Record<string, unknown>)?.displayName ||
        otherParticipant?.display_name ||
        (otherParticipant?.user as Record<string, unknown>)?.username ||
        otherParticipant?.user?.username ||
        (otherParticipant as Record<string, unknown>)?.username || 'Conversation';
      setup.header.updateHeader(displayName);
      if (otherParticipant) {
        const lastSeen = (otherParticipant?.user as Record<string, unknown>)?.lastSeenAt || null;
        setup.presence.setOtherParticipantLastSeen(lastSeen as string | null);
      }
    }
  }, [
    setup.presence.isOtherUserOnline, setup.presence.isOtherUserTyping,
    setup.presence.otherParticipantLastSeen, _conversation,
    setup.header, user?.id, setup.presence,
  ]);

  // ── Edit handlers ──────────────────────────────────────────────────
  const handleEdit = useCallback(() => {
    const msg = setup.messageActions.selectedMessage;
    if (msg) {
      setEditingMessageId(msg.id);
      setup.messageActions.closeMessageActions();
    }
  }, [setup.messageActions]);

  const handleSaveEdit = useCallback(
    async (messageId: string, content: string) => {
      try {
        await useChatStore.getState().editMessage(conversationId, messageId, content);
      } catch {
        // Error silently — store handles toast/feedback
      }
      setEditingMessageId(null);
    },
    [conversationId],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  // Render a single message
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (!isValidMessage(item)) {
        if (__DEV__) logger.debug('Skipping invalid message:', item.id);
        return null;
      }
      const isOwn = checkIsOwnMessage(item, user?.id);
      const { displayName, avatarUrl } = getSenderInfo(item);
      const isNewMessage = setup.newMessageIds.has(item.id);
      return (
        <MessageBubble
          item={item}
          isOwnMessage={isOwn}
          senderDisplayName={displayName}
          senderAvatarUrl={avatarUrl}
          isNewMessage={isNewMessage}
          colors={colors}
          formatTime={setup.formatTime}
          getMessageStatus={setup.getMessageStatus}
          onLongPress={setup.messageActions.handleMessageLongPress}
          onImagePress={setup.mediaViewer.handleImagePress}
          onVideoPress={setup.mediaViewer.handleVideoPress}
          onFilePress={setup.mediaViewer.handleFilePress}
          onReactionTap={setup.messageReactions.handleReactionTap}
          isEditing={editingMessageId === item.id}
          onSaveEdit={(content: string) => handleSaveEdit(item.id, content)}
          onCancelEdit={handleCancelEdit}
        />
      );
    },
    [user?.id, colors, setup, editingMessageId, handleSaveEdit, handleCancelEdit],
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ConversationModals
        showAttachMenu={setup.attachments.showAttachMenu}
        closeAttachMenu={setup.attachments.closeAttachMenu}
        onSelectAssets={setup.handleAttachmentPickerSelect}
        showMessageActions={setup.messageActions.showMessageActions}
        selectedMessage={setup.messageActions.selectedMessage}
        isOwnMessage={String(user?.id) === String(setup.messageActions.selectedMessage?.sender_id)}
        isDark={isDark}
        colors={colors}
        messageActionsAnim={setup.messageActions.messageActionsAnim}
        backdropAnim={setup.messageActions.backdropAnim}
        menuScaleAnim={setup.messageActions.menuScaleAnim}
        actionItemAnims={setup.messageActions.actionItemAnims}
        closeMessageActions={setup.messageActions.closeMessageActions}
        onReply={setup.actionWrappers.handleReply}
        onEdit={handleEdit}
        onTogglePin={setup.actionWrappers.handleTogglePin}
        onUnsend={setup.actionWrappers.handleUnsend}
        onQuickReaction={setup.actionWrappers.handleQuickReaction}
        onOpenReactionPicker={setup.actionWrappers.openReactionPicker}
        getReactionState={setup.actionWrappers.getReactionState}
        showReactionPicker={setup.reactions.showReactionPicker}
        reactionPickerMessage={setup.reactions.reactionPickerMessage}
        selectedEmojiCategory={setup.reactions.selectedEmojiCategory}
        closeReactionPicker={setup.reactions.closeReactionPicker}
        setSelectedEmojiCategory={setup.reactions.setSelectedEmojiCategory}
        handleAddReaction={setup.messageReactions.handleAddReaction}
        handleRemoveReaction={setup.messageReactions.handleRemoveReaction}
        conversationId={conversationId}
        showAttachmentPreview={setup.attachments.showAttachmentPreview}
        pendingAttachments={setup.attachments.pendingAttachments}
        attachmentCaption={setup.attachments.attachmentCaption}
        attachmentPreviewAnim={setup.attachments.attachmentPreviewAnim}
        closeAttachmentPreview={setup.attachments.closeAttachmentPreview}
        addMoreAttachments={setup.attachmentUpload.addMoreAttachments}
        removeAttachment={setup.attachments.removeAttachment}
        setAttachmentCaption={setup.attachments.setAttachmentCaption}
        sendPendingAttachments={setup.sendPendingAttachments}
        showImageViewer={setup.mediaViewer.showImageViewer}
        selectedImage={setup.mediaViewer.selectedImage}
        imageGallery={setup.mediaViewer.imageGallery}
        currentImageIndex={setup.mediaViewer.currentImageIndex}
        imageGalleryRef={setup.mediaViewer.imageGalleryRef}
        imageViewerAnim={setup.mediaViewer.imageViewerAnim}
        imageScaleAnim={setup.mediaViewer.imageScaleAnim}
        closeImageViewer={setup.mediaViewer.closeImageViewer}
        setCurrentImageIndex={setup.mediaViewer.setCurrentImageIndex}
        setSelectedImage={setup.mediaViewer.setSelectedImage}
        showVideoPlayer={setup.mediaViewer.showVideoPlayer}
        selectedVideoUrl={setup.mediaViewer.selectedVideoUrl}
        selectedVideoDuration={setup.mediaViewer.selectedVideoDuration}
        closeVideoPlayer={setup.mediaViewer.closeVideoPlayer}
        showGifPicker={setup.showGifPicker}
        setShowGifPicker={setup.setShowGifPicker}
        handleGifSelect={setup.handleGifSelect}
      />

      {setup.pinned.currentPinnedMessage && (
        <PinnedMessagesBar
          pinnedMessages={setup.pinned.pinnedMessages}
          currentPinnedMessage={setup.pinned.currentPinnedMessage}
          currentPinnedIndex={setup.pinned.currentPinnedIndex}
          colors={colors}
          onScrollToMessage={setup.pinned.scrollToMessage}
          onSetCurrentIndex={setup.pinned.setCurrentPinnedIndex}
          onNavigate={setup.pinned.navigatePinnedMessages}
        />
      )}

      <FlatList
        ref={setup.flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        inverted={true}
        ListEmptyComponent={
          <EmptyConversation
            otherUser={otherUser}
            colors={colors}
            waveAnim={setup.voiceAndWave.waveAnim}
            onSendWave={setup.voiceAndWave.handleSendWave}
            onSetInputText={setup.textSending.setInputText}
          />
        }
        windowSize={11}
        maxToRenderPerBatch={15}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        onScrollToIndexFailed={(info) => {
          setup.flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <ChatInputArea
        inputText={setup.textSending.inputText}
        replyingTo={setup.messageActions.replyingTo}
        isVoiceMode={setup.isVoiceMode}
        isSending={setup.isSending}
        showAttachMenu={setup.attachments.showAttachMenu}
        attachMenuAnim={setup.attachments.attachMenuAnim}
        inputRef={setup.inputRef}
        colors={colors}
        onTextChange={setup.handleTextChange}
        onSendMessage={setup.textSending.sendMessage}
        onToggleAttachMenu={setup.attachments.toggleAttachMenu}
        onStartVoice={() => setup.setIsVoiceMode(true)}
        onCancelVoice={() => setup.setIsVoiceMode(false)}
        onVoiceComplete={setup.voiceAndWave.handleVoiceComplete}
        onCancelReply={setup.actionWrappers.cancelReply}
        onGifPress={() => setup.setShowGifPicker(true)}
      />
    </KeyboardAvoidingView>
  );
}
