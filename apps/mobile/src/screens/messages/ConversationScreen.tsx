import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useE2EE } from '../../lib/crypto/E2EEContext';
import { MessagesStackParamList, Message, ConversationParticipant } from '../../types';
import { TelegramAttachmentPicker } from '../../components';
import { createLogger } from '../../lib/logger';

// Import modular components
import {
  EmptyConversation,
  MessageActionsMenu,
  ReactionPickerModal,
  AttachmentPreviewModal,
  ImageViewerModal,
  VideoPlayerModal,
  PinnedMessagesBar,
  ChatInputArea,
  MessageBubble,
} from './ConversationScreen/components';
import { GifPickerModal } from './ConversationScreen/components/GifPickerModal';
import type { GifResult } from './ConversationScreen/components/GifPickerModal';
import { styles } from './ConversationScreen/styles';
import {
  useMediaViewer,
  useMessageActions,
  useReactions,
  useAttachments,
  usePinAndDelete,
  useMessageReactions,
  useAttachmentUpload,
  useVoiceAndWave,
  useConversationSocket,
  useConversationHeader,
  usePresence,
  useConversationData,
  useTextMessageSending,
  usePinnedMessages,
  useSocketEventHandlers,
  useMessageActionWrappers,
} from './ConversationScreen/hooks';
import {
  formatSimpleTime,
  getMessageStatusInfo,
  isValidMessage,
  isOwnMessage as checkIsOwnMessage,
  getSenderInfo,
} from './ConversationScreen/utils';

const logger = createLogger('ConversationScreen');

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  route: RouteProp<MessagesStackParamList, 'Conversation'>;
};

export default function ConversationScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { isInitialized: isE2EEInitialized, encryptMessage } = useE2EE();

  // Track deleted message IDs to prevent re-adding them (must be before useConversationData)
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());

  // Conversation data hook - fetches conversation details and messages
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
    markMessageAsRead: _markMessageAsRead,
  } = useConversationData({
    conversationId,
    userId: user?.id,
    deletedMessageIdsRef,
  });

  const [isSending, setIsSending] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Presence and typing hook - manages online/typing state
  const {
    isOtherUserOnline,
    isOtherUserTyping,
    otherParticipantLastSeen,
    setOtherParticipantLastSeen,
    handleTextChange: presenceHandleTextChange,
    stopTypingIndicator,
  } = usePresence({
    conversationId,
    otherParticipantId,
  });

  // Media viewer hook (images, videos, files)
  const {
    selectedImage,
    setSelectedImage,
    imageGallery,
    currentImageIndex,
    setCurrentImageIndex,
    showImageViewer,
    imageGalleryRef,
    imageViewerAnim,
    imageScaleAnim,
    handleImagePress,
    closeImageViewer,
    showVideoPlayer,
    selectedVideoUrl,
    selectedVideoDuration,
    handleVideoPress,
    closeVideoPlayer,
    handleFilePress,
  } = useMediaViewer();

  // Message action menu state (from useMessageActions hook)
  const {
    selectedMessage,
    showMessageActions,
    replyingTo,
    backdropAnim,
    menuScaleAnim,
    messageActionsAnim,
    actionItemAnims,
    handleMessageLongPress,
    closeMessageActions,
    setReplyingTo,
    handleCopyMessage: _handleCopyMessage,
    clearReply,
  } = useMessageActions();

  // Reaction picker state (from useReactions hook)
  const {
    showReactionPicker,
    reactionPickerMessage,
    selectedEmojiCategory,
    openReactionPicker: openReactionPickerBase,
    closeReactionPicker,
    setSelectedEmojiCategory,
    hasReacted,
  } = useReactions();

  // Attachment state (from useAttachments hook)
  const {
    pendingAttachments,
    showAttachmentPreview,
    attachmentCaption,
    attachmentPreviewAnim,
    showAttachMenu,
    attachMenuAnim,
    setPendingAttachments,
    setAttachmentCaption,
    openAttachmentPreview,
    closeAttachmentPreview,
    openAttachMenu: _openAttachMenu,
    closeAttachMenu,
    toggleAttachMenu,
    handleImagePicker,
    handleCameraCapture: _handleCameraCapture,
    handleDocumentPicker: _handleDocumentPicker,
    clearAttachments: _clearAttachments,
    removeAttachment,
  } = useAttachments();

  // Message reactions hook (add/remove reactions via API)
  const {
    handleAddReaction,
    handleRemoveReaction,
    handleQuickReaction: handleQuickReactionBase,
    handleReactionTap,
    addReactionToMessage,
    removeReactionFromMessage,
  } = useMessageReactions({ user, setMessages });

  // Pin/delete handlers from hook - callbacks defined after setMessages is available
  const onMessagePinnedCallback = useCallback(
    (messageId: string, isPinned: boolean, pinnedAt?: string, pinnedById?: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_pinned: isPinned, pinned_at: pinnedAt, pinned_by_id: pinnedById }
            : m
        )
      );
    },
    []
  );

  const onMessageDeletedCallback = useCallback((messageId: string) => {
    deletedMessageIdsRef.current.add(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // usePinAndDelete hook for pin/unpin and delete operations
  const { handleTogglePin: handleTogglePinBase, handleUnsend: handleUnsendBase } = usePinAndDelete({
    conversationId,
    userId: user?.id,
    onMessagePinned: onMessagePinnedCallback,
    onMessageDeleted: onMessageDeletedCallback,
    onActionComplete: closeMessageActions,
  });

  // Track newly added messages for entrance animations
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // Track if component is mounted (for async operations)
  const isMountedRef = useRef(true);

  // Track if we should scroll to bottom on next content size change
  const _shouldScrollToBottomRef = useRef(true);
  const _contentHeightRef = useRef(0);

  // Animation refs (only those not provided by hooks)
  const _inputFocusAnim = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Callback for scrolling to bottom (used by upload hook)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, []);

  // Handle starting a call (audio or video)
  const handleStartCall = useCallback((type: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `${type === 'video' ? 'Video' : 'Voice'} Call`,
      `${type === 'video' ? 'Video' : 'Voice'} calls are coming soon! Stay tuned for real-time encrypted calls.`,
      [{ text: 'Got it', style: 'default' }]
    );
  }, []);

  // Conversation header hook - manages navigation header with status
  const { updateHeader } = useConversationHeader({
    navigation,
    colors,
    isOtherUserOnline,
    isOtherUserTyping,
    otherParticipantLastSeen,
    otherParticipantId,
    otherUser,
    onStartCall: handleStartCall,
  });

  // Attachment upload hook
  const {
    uploadAndSendFile: _uploadAndSendFile,
    sendPendingAttachments: sendPendingAttachmentsBase,
    addMoreAttachments,
  } = useAttachmentUpload({
    conversationId,
    setIsSending,
    setMessages,
    closeAttachmentPreview,
    attachmentPreviewAnim,
    handleImagePicker,
    onScrollToBottom: scrollToBottom,
  });

  // Wrapper for sendPendingAttachments to use current state
  const sendPendingAttachments = useCallback(async () => {
    await sendPendingAttachmentsBase(pendingAttachments, attachmentCaption);
  }, [sendPendingAttachmentsBase, pendingAttachments, attachmentCaption]);

  // Voice message and wave greeting hook
  const { waveAnim, handleVoiceComplete, handleSendWave } = useVoiceAndWave({
    conversationId,
    setIsSending,
    setIsVoiceMode,
    setMessages,
    onScrollToBottom: scrollToBottom,
  });

  // Text message sending hook
  const {
    inputText,
    setInputText,
    sendButtonAnim: _sendButtonAnim,
    sendMessage,
  } = useTextMessageSending({
    conversationId,
    isSending,
    setIsSending,
    isE2EEInitialized,
    otherParticipantId,
    encryptMessage,
    replyingTo,
    setReplyingTo,
    stopTypingIndicator,
    setMessages,
    setNewMessageIds,
    onScrollToBottom: scrollToBottom,
  });

  // GIF selection handler — sends as a gif-type message
  const handleGifSelect = useCallback(async (gif: GifResult) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const response = await (await import('../../lib/api')).default.post(
        `/api/v1/conversations/${conversationId}/messages`,
        {
          content: gif.url,
          content_type: 'gif',
          metadata: { gif_id: gif.id, title: gif.title, preview_url: gif.previewUrl, width: gif.width, height: gif.height },
        }
      );
      if (response.data?.data) {
        const newMsg = response.data.data;
        setMessages((prev: Message[]) => [...prev, newMsg]);
        scrollToBottom();
      }
    } catch (error) {
      logger.error('Failed to send GIF:', error);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, isSending, setMessages, scrollToBottom]);

  // Socket event handlers hook - centralizes all socket callbacks
  const {
    handleSocketNewMessage,
    handleSocketMessageUpdated,
    handleSocketMessageDeleted,
    handleSocketMessagePinned,
    handleSocketMessageUnpinned,
    handleSocketMessageRead,
    handleSocketReactionAdded,
    handleSocketReactionRemoved,
  } = useSocketEventHandlers({
    userId: user?.id,
    setMessages,
    scrollToBottom,
    addReactionToMessage,
    removeReactionFromMessage,
  });

  // Integrate conversation socket hook for real-time events
  const { sendTyping: _socketSendTyping } = useConversationSocket({
    conversationId,
    userId: user?.id,
    onNewMessage: handleSocketNewMessage,
    onMessageUpdated: handleSocketMessageUpdated,
    onMessageDeleted: handleSocketMessageDeleted,
    onMessagePinned: handleSocketMessagePinned,
    onMessageUnpinned: handleSocketMessageUnpinned,
    onMessageRead: handleSocketMessageRead,
    onReactionAdded: handleSocketReactionAdded,
    onReactionRemoved: handleSocketReactionRemoved,
  });

  // Pinned messages hook - manages pinned message state and navigation
  const {
    pinnedMessages,
    currentPinnedIndex,
    currentPinnedMessage,
    setCurrentPinnedIndex,
    scrollToMessage,
    navigatePinnedMessages,
  } = usePinnedMessages({
    messages,
    flatListRef,
  });

  // Message action wrappers hook - binds selected message to action handlers
  const {
    handleReply,
    cancelReply,
    handleQuickReaction,
    openReactionPicker,
    handleTogglePin,
    handleUnsend,
    getReactionState,
  } = useMessageActionWrappers({
    selectedMessage,
    inputRef,
    setReplyingTo,
    closeMessageActions,
    clearReply,
    hasReacted,
    handleQuickReactionBase: handleQuickReactionBase,
    openReactionPickerBase: openReactionPickerBase,
    handleTogglePinBase,
    handleUnsendBase,
  });

  // Wrap presence handleTextChange to also update local inputText
  const handleTextChange = useCallback(
    (text: string) => {
      presenceHandleTextChange(text, setInputText);
    },
    [presenceHandleTextChange]
  );

  // Track component mount state for async operations
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch messages on mount and when conversation changes
  useEffect(() => {
    fetchMessages();
  }, [conversationId, fetchMessages]);

  // Fetch conversation when user is available - separate effect to handle auth loading
  useEffect(() => {
    if (user?.id) {
      fetchConversation();
    }
  }, [conversationId, user?.id, fetchConversation]);

  // Update header when online or typing status changes, or conversation loads
  useEffect(() => {
    if (_conversation) {
      const conv = _conversation;
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId =
          p.userId || p.user_id || (p.user as Record<string, unknown>)?.id || p.id;
        return String(participantUserId) !== String(user?.id);
      });

      // Extract display name with comprehensive fallbacks for nested/flat structures
      // API returns camelCase: user.displayName, user.avatarUrl
      const displayName =
        conv.name ||
        otherParticipant?.nickname ||
        (otherParticipant?.user as Record<string, unknown>)?.displayName ||
        otherParticipant?.user?.display_name ||
        (otherParticipant as Record<string, unknown>)?.displayName ||
        otherParticipant?.display_name ||
        (otherParticipant?.user as Record<string, unknown>)?.username ||
        otherParticipant?.user?.username ||
        (otherParticipant as Record<string, unknown>)?.username ||
        'Conversation';

      updateHeader(displayName);

      // Set last seen from participant's user data (if hook callback wasn't used)
      if (otherParticipant) {
        const lastSeen = (otherParticipant?.user as Record<string, unknown>)?.lastSeenAt || null;
        setOtherParticipantLastSeen(lastSeen as string | null);
      }
    }
  }, [
    isOtherUserOnline,
    isOtherUserTyping,
    otherParticipantLastSeen,
    _conversation,
    updateHeader,
    user?.id,
    setOtherParticipantLastSeen,
  ]);

  // Get message status icon and color - delegates to utility
  const getMessageStatus = useCallback(
    (message: Message, isOwn: boolean) => {
      if (!isOwn) return null;
      const status =
        message.status || (message.read_at ? 'read' : message.delivered_at ? 'delivered' : 'sent');
      return getMessageStatusInfo(status, colors);
    },
    [colors]
  );

  // Format time - delegates to utility
  const formatTime = useCallback(
    (dateString: string | undefined | null): string => formatSimpleTime(dateString),
    []
  );

  // Handle assets selected from TelegramAttachmentPicker
  // IMPORTANT: This must be defined BEFORE any early returns to comply with Rules of Hooks
  const handleAttachmentPickerSelect = useCallback(
    (
      assets: Array<{
        uri: string;
        type: 'image' | 'video' | 'file';
        name?: string;
        mimeType?: string;
        duration?: number;
      }>
    ) => {
      if (assets.length === 0) return;

      const newAttachments = assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type,
        name: asset.name,
        mimeType: asset.mimeType,
        duration: asset.duration,
      }));

      setPendingAttachments((prev) => [...prev, ...newAttachments]);
      openAttachmentPreview();
    },
    [openAttachmentPreview]
  );

  // Render a single message using the extracted MessageBubble component
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      // Skip invalid messages (no ID, no sender, no content)
      if (!isValidMessage(item)) {
        if (__DEV__) {
          logger.debug('Skipping invalid message:', item.id);
        }
        return null;
      }

      // Check ownership and get sender info using utilities
      const isOwn = checkIsOwnMessage(item, user?.id);
      const { displayName, avatarUrl } = getSenderInfo(item);
      const isNewMessage = newMessageIds.has(item.id);

      return (
        <MessageBubble
          item={item}
          isOwnMessage={isOwn}
          senderDisplayName={displayName}
          senderAvatarUrl={avatarUrl}
          isNewMessage={isNewMessage}
          colors={colors}
          formatTime={formatTime}
          getMessageStatus={getMessageStatus}
          onLongPress={handleMessageLongPress}
          onImagePress={handleImagePress}
          onVideoPress={handleVideoPress}
          onFilePress={handleFilePress}
          onReactionTap={handleReactionTap}
        />
      );
    },
    [
      user?.id,
      colors,
      formatTime,
      getMessageStatus,
      handleMessageLongPress,
      handleImagePress,
      handleVideoPress,
      handleFilePress,
      handleReactionTap,
      newMessageIds,
    ]
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render wrapper for EmptyConversation component
  const renderEmptyConversation = () => (
    <EmptyConversation
      otherUser={otherUser}
      colors={colors}
      waveAnim={waveAnim}
      onSendWave={handleSendWave}
      onSetInputText={setInputText}
    />
  );

  // Render MessageActionsMenu with all props
  const renderMessageActionsMenu = () => (
    <MessageActionsMenu
      visible={showMessageActions}
      selectedMessage={selectedMessage}
      isOwnMessage={String(user?.id) === String(selectedMessage?.sender_id)}
      isDark={isDark}
      colors={colors}
      messageActionsAnim={messageActionsAnim}
      backdropAnim={backdropAnim}
      menuScaleAnim={menuScaleAnim}
      actionItemAnims={actionItemAnims}
      onClose={closeMessageActions}
      onReply={handleReply}
      onTogglePin={handleTogglePin}
      onUnsend={handleUnsend}
      onQuickReaction={handleQuickReaction}
      onOpenReactionPicker={openReactionPicker}
      getReactionState={getReactionState}
    />
  );

  // Render ReactionPickerModal with all props
  const renderReactionPickerModal = () => (
    <ReactionPickerModal
      visible={showReactionPicker}
      message={reactionPickerMessage}
      selectedCategory={selectedEmojiCategory}
      isDark={isDark}
      colors={colors}
      onClose={closeReactionPicker}
      onSelectCategory={setSelectedEmojiCategory}
      onAddReaction={handleAddReaction}
      onRemoveReaction={handleRemoveReaction}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Telegram-style Attachment Picker */}
      <TelegramAttachmentPicker
        visible={showAttachMenu}
        onClose={closeAttachMenu}
        onSelectAssets={handleAttachmentPickerSelect}
        maxSelection={10}
      />
      {renderMessageActionsMenu()}
      {renderReactionPickerModal()}

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        visible={showAttachmentPreview}
        attachments={pendingAttachments}
        caption={attachmentCaption}
        animValue={attachmentPreviewAnim}
        colors={colors}
        onClose={closeAttachmentPreview}
        onAddMore={addMoreAttachments}
        onRemove={removeAttachment}
        onCaptionChange={setAttachmentCaption}
        onSend={sendPendingAttachments}
      />

      {/* Full-screen Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        selectedImage={selectedImage}
        imageGallery={imageGallery}
        currentIndex={currentImageIndex}
        galleryRef={imageGalleryRef}
        animValue={imageViewerAnim}
        scaleAnim={imageScaleAnim}
        onClose={closeImageViewer}
        onIndexChange={setCurrentImageIndex}
        onImageSelect={setSelectedImage}
      />

      {/* Full-screen Video Player Modal */}
      <VideoPlayerModal
        visible={showVideoPlayer}
        videoUrl={selectedVideoUrl}
        duration={selectedVideoDuration}
        onClose={closeVideoPlayer}
      />

      {/* Enhanced Pinned Messages Bar */}
      {currentPinnedMessage && (
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          currentPinnedMessage={currentPinnedMessage}
          currentPinnedIndex={currentPinnedIndex}
          colors={colors}
          onScrollToMessage={scrollToMessage}
          onSetCurrentIndex={setCurrentPinnedIndex}
          onNavigate={navigatePinnedMessages}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        inverted={true}
        ListEmptyComponent={renderEmptyConversation}
        // Performance tuning for large message lists (10M+ user scale)
        windowSize={11}
        maxToRenderPerBatch={15}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        onScrollToIndexFailed={(info) => {
          // Handle scroll to index failure by scrolling to approximate offset
          flatListRef.current?.scrollToOffset({
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

      {/* Chat Input Area with Voice Recording */}
      <ChatInputArea
        inputText={inputText}
        replyingTo={replyingTo}
        isVoiceMode={isVoiceMode}
        isSending={isSending}
        showAttachMenu={showAttachMenu}
        attachMenuAnim={attachMenuAnim}
        inputRef={inputRef}
        colors={colors}
        onTextChange={handleTextChange}
        onSendMessage={sendMessage}
        onToggleAttachMenu={toggleAttachMenu}
        onStartVoice={() => setIsVoiceMode(true)}
        onCancelVoice={() => setIsVoiceMode(false)}
        onVoiceComplete={handleVoiceComplete}
        onCancelReply={cancelReply}
        onGifPress={() => setShowGifPicker(true)}
      />

      {/* GIF Picker Modal */}
      <GifPickerModal
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
      />
    </KeyboardAvoidingView>
  );
}
