/**
 * Hook consolidating all conversation state, actions, and side-effect wiring.
 * Keeps the main ConversationScreen component slim by centralising hook orchestration.
 * @module screens/messages/conversation-screen/hooks/use-conversation-setup
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, TextInput, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Message } from '../../../types';
import type { GifResult } from '../components/gif-picker-modal';
import { createLogger } from '../../../lib/logger';
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
  useTextMessageSending,
  usePinnedMessages,
  useSocketEventHandlers,
  useMessageActionWrappers,
} from './index';
import {
  formatSimpleTime,
  getMessageStatusInfo,
} from '../utils';

const logger = createLogger('useConversationSetup');

interface SetupParams {
  conversationId: string;
  user: { id: string } | null;
  isE2EEInitialized: boolean;
  otherParticipantId: string | null;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<string>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  deletedMessageIdsRef: React.MutableRefObject<Set<string>>;
  navigation: unknown;
  colors: Record<string, unknown>;
}

 
export function useConversationSetup(params: SetupParams) {
  const {
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
  } = params;

  // ── Local state ──────────────────────────────────────────────
  const [isSending, setIsSending] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // ── Refs ─────────────────────────────────────────────────────
  const isMountedRef = useRef(true);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { flatListRef.current?.scrollToOffset({ offset: 0, animated: true }); }, 100);
  }, []);

  // ── Hooks ────────────────────────────────────────────────────
  const presence = usePresence({ conversationId, otherParticipantId });
  const mediaViewer = useMediaViewer();
  const messageActions = useMessageActions();
  const reactions = useReactions();
  const attachments = useAttachments();
  const messageReactions = useMessageReactions({ user, setMessages });

  const onMessagePinnedCallback = useCallback(
    (messageId: string, isPinned: boolean, pinnedAt?: string, pinnedById?: string) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_pinned: isPinned, pinned_at: pinnedAt, pinned_by_id: pinnedById } : m));
    }, [setMessages]);

  const onMessageDeletedCallback = useCallback((messageId: string) => {
    deletedMessageIdsRef.current.add(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, [setMessages, deletedMessageIdsRef]);

  const pinAndDelete = usePinAndDelete({
    conversationId,
    userId: user?.id,
    onMessagePinned: onMessagePinnedCallback,
    onMessageDeleted: onMessageDeletedCallback,
    onActionComplete: messageActions.closeMessageActions,
  });

  const handleStartCall = useCallback((type: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(`${type === 'video' ? 'Video' : 'Voice'} Call`, `${type === 'video' ? 'Video' : 'Voice'} calls are coming soon! Stay tuned for real-time encrypted calls.`, [{ text: 'Got it', style: 'default' }]);
  }, []);

  const header = useConversationHeader({
    navigation, colors,
    isOtherUserOnline: presence.isOtherUserOnline,
    isOtherUserTyping: presence.isOtherUserTyping,
    otherParticipantLastSeen: presence.otherParticipantLastSeen,
    otherParticipantId,
    otherUser: null, // set from outside
    onStartCall: handleStartCall,
  });

  const attachmentUpload = useAttachmentUpload({
    conversationId, setIsSending, setMessages,
    closeAttachmentPreview: attachments.closeAttachmentPreview,
    attachmentPreviewAnim: attachments.attachmentPreviewAnim,
    handleImagePicker: attachments.handleImagePicker,
    onScrollToBottom: scrollToBottom,
  });

  const sendPendingAttachments = useCallback(async () => {
    await attachmentUpload.sendPendingAttachments(attachments.pendingAttachments, attachments.attachmentCaption);
  }, [attachmentUpload, attachments.pendingAttachments, attachments.attachmentCaption]);

  const voiceAndWave = useVoiceAndWave({
    conversationId, setIsSending, setIsVoiceMode, setMessages, onScrollToBottom: scrollToBottom,
  });

  const textSending = useTextMessageSending({
    conversationId, isSending, setIsSending, isE2EEInitialized, otherParticipantId, encryptMessage,
    replyingTo: messageActions.replyingTo,
    setReplyingTo: messageActions.setReplyingTo,
    stopTypingIndicator: presence.stopTypingIndicator,
    setMessages, setNewMessageIds, onScrollToBottom: scrollToBottom,
  });

  // GIF handler
  const handleGifSelect = useCallback(async (gif: GifResult) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const response = await (await import('../../../lib/api')).default.post(
        `/api/v1/conversations/${conversationId}/messages`,
        { content: gif.url, content_type: 'gif', metadata: { gif_id: gif.id, title: gif.title, preview_url: gif.previewUrl, width: gif.width, height: gif.height } }
      );
      if (response.data?.data) {
        setMessages((prev: Message[]) => [...prev, response.data.data].slice(-500));
        scrollToBottom();
      }
    } catch (error) { logger.error('Failed to send GIF:', error); }
    finally { setIsSending(false); }
  }, [conversationId, isSending, setMessages, scrollToBottom]);

  const socketHandlers = useSocketEventHandlers({
    userId: user?.id, setMessages, scrollToBottom,
    addReactionToMessage: messageReactions.addReactionToMessage,
    removeReactionFromMessage: messageReactions.removeReactionFromMessage,
  });

  const _socket = useConversationSocket({
    conversationId, userId: user?.id,
    onNewMessage: socketHandlers.handleSocketNewMessage,
    onMessageUpdated: socketHandlers.handleSocketMessageUpdated,
    onMessageDeleted: socketHandlers.handleSocketMessageDeleted,
    onMessagePinned: socketHandlers.handleSocketMessagePinned,
    onMessageUnpinned: socketHandlers.handleSocketMessageUnpinned,
    onMessageRead: socketHandlers.handleSocketMessageRead,
    onReactionAdded: socketHandlers.handleSocketReactionAdded,
    onReactionRemoved: socketHandlers.handleSocketReactionRemoved,
  });

  const pinned = usePinnedMessages({ messages, flatListRef });

  const actionWrappers = useMessageActionWrappers({
    selectedMessage: messageActions.selectedMessage,
    inputRef,
    setReplyingTo: messageActions.setReplyingTo,
    closeMessageActions: messageActions.closeMessageActions,
    clearReply: messageActions.clearReply,
    hasReacted: reactions.hasReacted,
    handleQuickReactionBase: messageReactions.handleQuickReaction,
    openReactionPickerBase: reactions.openReactionPicker,
    handleTogglePinBase: pinAndDelete.handleTogglePin,
    handleUnsendBase: pinAndDelete.handleUnsend,
  });

  const handleTextChange = useCallback((text: string) => {
    presence.handleTextChange(text, textSending.setInputText);
  }, [presence, textSending.setInputText]);

  const handleAttachmentPickerSelect = useCallback(
    (assets: Array<{ uri: string; type: 'image' | 'video' | 'file'; name?: string; mimeType?: string; duration?: number }>) => {
      if (assets.length === 0) return;
      const newAttachments = assets.map((a) => ({ uri: a.uri, type: a.type, name: a.name, mimeType: a.mimeType, duration: a.duration }));
      attachments.setPendingAttachments((prev: unknown[]) => [...prev, ...newAttachments]);
      attachments.openAttachmentPreview();
    }, [attachments]);

  const getMessageStatus = useCallback((message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    const status = message.status || (message.read_at ? 'read' : message.delivered_at ? 'delivered' : 'sent');
    return getMessageStatusInfo(status, colors);
  }, [colors]);

  const formatTime = useCallback((dateString: string | undefined | null): string => formatSimpleTime(dateString), []);

  return {
    // state
    isSending, isVoiceMode, setIsVoiceMode, showGifPicker, setShowGifPicker, newMessageIds,
    // refs
    flatListRef, inputRef, isMountedRef,
    // grouped hooks
    presence, mediaViewer, messageActions, reactions, attachments,
    messageReactions, pinAndDelete, header, attachmentUpload,
    voiceAndWave, textSending, pinned, actionWrappers,
    // handlers
    scrollToBottom, handleStartCall, handleGifSelect, handleTextChange,
    handleAttachmentPickerSelect, sendPendingAttachments,
    getMessageStatus, formatTime,
  };
}
