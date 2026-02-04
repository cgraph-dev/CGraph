import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { normalizeMessage, normalizeMessages } from '../../lib/normalizers';
import {
  MessagesStackParamList,
  Message,
  Conversation,
  ConversationParticipant,
  UserBasic,
} from '../../types';
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
} from './ConversationScreen/hooks';
import {
  processMessagesWithReactions,
  formatSimpleTime,
  formatLastSeen,
  getMessageStatusInfo,
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

  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [otherUser, setOtherUser] = useState<UserBasic | null>(null);

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

  // Track deleted message IDs to prevent re-adding them
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());

  // Track if component is mounted (for async operations)
  const isMountedRef = useRef(true);

  // Track if we should scroll to bottom on next content size change
  const _shouldScrollToBottomRef = useRef(true);
  const _contentHeightRef = useRef(0);

  // Animation refs (only those not provided by hooks)
  const sendButtonAnim = useRef(new Animated.Value(1)).current;
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

  // Socket event handlers for useConversationSocket
  const handleSocketNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [message, ...prev];
      });
      // Scroll to bottom when receiving new message
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const handleSocketMessageUpdated = useCallback((message: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
  }, []);

  const handleSocketMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleSocketMessagePinned = useCallback(
    (messageId: string, pinnedAt: string, pinnedById: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_pinned: true, pinned_at: pinnedAt, pinned_by_id: pinnedById }
            : m
        )
      );
    },
    []
  );

  const handleSocketMessageUnpinned = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, is_pinned: false, pinned_at: undefined, pinned_by_id: undefined }
          : m
      )
    );
  }, []);

  const handleSocketMessageRead = useCallback(
    (messageId: string, _userId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender_id === user?.id && m.id <= messageId && !m.read_at) {
            return { ...m, read_at: new Date().toISOString(), status: 'read' as const };
          }
          return m;
        })
      );
    },
    [user?.id]
  );

  const handleSocketReactionAdded = useCallback(
    (data: {
      messageId: string;
      emoji: string;
      userId: string;
      user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
    }) => {
      addReactionToMessage(data.messageId, data.emoji, data.userId, data.user);
    },
    [addReactionToMessage]
  );

  const handleSocketReactionRemoved = useCallback(
    (data: { messageId: string; emoji: string; userId: string }) => {
      removeReactionFromMessage(data.messageId, data.emoji, data.userId);
    },
    [removeReactionFromMessage]
  );

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

  // Pinned messages - get all pinned, sorted by pin date (most recent first)
  const pinnedMessages = useMemo(() => {
    return messages
      .filter((m) => m.is_pinned)
      .sort((a, b) => {
        const aDate = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const bDate = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        return bDate - aDate;
      });
  }, [messages]);

  // Current pinned message index for navigation
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);

  // Reset pinned index when pinned messages change (e.g., when unpinning)
  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setCurrentPinnedIndex(0);
    } else if (currentPinnedIndex >= pinnedMessages.length) {
      // If current index is out of bounds, reset to last valid index
      setCurrentPinnedIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, currentPinnedIndex]);

  // Get the current pinned message to display
  const currentPinnedMessage =
    pinnedMessages.length > 0
      ? pinnedMessages[Math.min(currentPinnedIndex, pinnedMessages.length - 1)]
      : null;

  // Scroll to a specific message by ID
  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.3, // Show message in upper third of screen
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [messages]
  );

  // Navigate to next/prev pinned message
  const navigatePinnedMessages = useCallback(
    (direction: 'next' | 'prev') => {
      if (pinnedMessages.length <= 1) return;

      if (direction === 'next') {
        setCurrentPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
      } else {
        setCurrentPinnedIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
      }
      Haptics.selectionAsync();
    },
    [pinnedMessages.length]
  );

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
  }, [conversationId]);

  // Fetch conversation when user is available - separate effect to handle auth loading
  useEffect(() => {
    if (user?.id) {
      fetchConversation();
    }
  }, [conversationId, user?.id]);

  const fetchConversation = async () => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}`);
      const conv = response.data.data || response.data;
      setConversation(conv);

      // Find other participant - API returns camelCase (userId, user.displayName)
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId =
          p.userId || p.user_id || (p.user as Record<string, unknown>)?.id || p.id;
        return String(participantUserId) !== String(currentUserId);
      });

      // Store other participant's user ID for presence tracking
      const rawOtherUserId =
        otherParticipant?.userId ||
        otherParticipant?.user_id ||
        (otherParticipant?.user as Record<string, unknown>)?.id;
      const otherUserId = rawOtherUserId ? String(rawOtherUserId) : null;

      if (otherUserId) {
        setOtherParticipantId(otherUserId);

        // Store full other user info for profile access
        const otherUserInfo: UserBasic = {
          id: otherUserId,
          username:
            (otherParticipant?.user as Record<string, unknown>)?.username ||
            otherParticipant?.username ||
            null,
          display_name:
            (otherParticipant?.user as Record<string, unknown>)?.displayName ||
            (otherParticipant?.user as Record<string, unknown>)?.display_name ||
            null,
          avatar_url:
            (otherParticipant?.user as Record<string, unknown>)?.avatarUrl ||
            (otherParticipant?.user as Record<string, unknown>)?.avatar_url ||
            null,
          status: 'offline',
        };
        setOtherUser(otherUserInfo);

        // Extract last seen from participant's user data
        const lastSeen = (otherParticipant?.user as Record<string, unknown>)?.lastSeenAt || null;
        setOtherParticipantLastSeen(lastSeen);

        // Use global friend presence first, then fall back to conversation presence
        const presenceOnline =
          socketManager.isFriendOnline(otherUserId) ||
          socketManager.isUserOnline(conversationId, otherUserId);
        setIsOtherUserOnline(presenceOnline);
      }

      // Extract display name - API uses camelCase (displayName, not display_name)
      const displayName =
        conv.name ||
        otherParticipant?.nickname ||
        (otherParticipant?.user as Record<string, unknown>)?.displayName ||
        (otherParticipant?.user as Record<string, unknown>)?.display_name ||
        otherParticipant?.displayName ||
        otherParticipant?.display_name ||
        (otherParticipant?.user as Record<string, unknown>)?.username ||
        otherParticipant?.username ||
        'Conversation';

      updateHeader(displayName);
    } catch (error) {
      logger.error('Error fetching conversation:', error);
    }
  };

  // Update header when online or typing status changes
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
    }
  }, [
    isOtherUserOnline,
    isOtherUserTyping,
    otherParticipantLastSeen,
    _conversation,
    updateHeader,
    user?.id,
  ]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
      const rawMessages = response.data.data || response.data.messages || [];
      if (isMountedRef.current) {
        const normalized = normalizeMessages(rawMessages);
        // Process reactions to set hasReacted based on current user
        const withReactions = processMessagesWithReactions(normalized, user?.id);
        // Deduplicate and filter out deleted messages
        const uniqueMessages = withReactions.reduce((acc: Message[], msg: Message) => {
          // Skip messages that were deleted in this session
          if (deletedMessageIdsRef.current.has(msg.id)) {
            return acc;
          }
          if (!acc.some((m) => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);

        // Sort messages reverse chronologically (newest first) for inverted list
        // Inverted FlatList displays from bottom, so newest appears at bottom visually
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const dateA = new Date(a.inserted_at).getTime();
          const dateB = new Date(b.inserted_at).getTime();
          return dateB - dateA; // Newest first
        });

        setMessages(sortedMessages);

        // Mark latest message as read if it's not from current user
        const latestUnread = sortedMessages.find((m) => m.sender_id !== user?.id);
        if (latestUnread) {
          markMessageAsRead(latestUnread.id);
        }
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Mark message as read via WebSocket
  const markMessageAsRead = useCallback(
    (messageId: string) => {
      const channel = socketManager.getChannel(`conversation:${conversationId}`);
      if (channel) {
        channel.push('mark_read', { message_id: messageId });
      }
    },
    [conversationId]
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMessages();
      await fetchConversation();
      // fetchMessages already handles scrolling to bottom
    } finally {
      setIsRefreshing(false);
    }
  };

  // Animated send button press effect
  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(sendButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  };

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    // Trigger send button animation
    animateSendButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsSending(true);
    setInputText('');
    const currentReplyTo = replyingTo;
    setReplyingTo(null); // Clear reply after capturing

    // Stop typing indicator when sending
    stopTypingIndicator();

    try {
      const clientMessageId = Crypto.randomUUID();
      let messagePayload: Record<string, unknown> = {
        content,
        client_message_id: clientMessageId,
      };
      if (currentReplyTo) {
        messagePayload.reply_to_id = currentReplyTo.id;
      }

      // E2EE: Encrypt message for direct conversations if E2EE is initialized
      const plaintextForLocal = content;
      if (isE2EEInitialized && otherParticipantId) {
        try {
          const encryptedMsg = await encryptMessage(otherParticipantId, content);
          messagePayload = {
            content: encryptedMsg.ciphertext,
            is_encrypted: true,
            ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
            nonce: encryptedMsg.nonce,
            recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
            one_time_prekey_id: encryptedMsg.oneTimePreKeyId,
            client_message_id: clientMessageId,
          };
          if (currentReplyTo) {
            messagePayload.reply_to_id = currentReplyTo.id;
          }
          logger.log('Sent E2EE encrypted message');
        } catch (encryptError) {
          logger.error('E2EE encryption failed, falling back to plaintext:', encryptError);
          // Fall through to plaintext
        }
      }

      const response = await api.post(
        `/api/v1/conversations/${conversationId}/messages`,
        messagePayload
      );
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);

      // For encrypted messages, store plaintext locally (we know what we sent)
      if (messagePayload.is_encrypted) {
        normalized.content = plaintextForLocal;
      }

      // Mark as new message for entrance animation
      setNewMessageIds((prev) => new Set(prev).add(normalized.id));

      // Add with deduplication - socket may also deliver this message
      // Prepend for inverted list (newest first)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });

      // Scroll to the new message (offset 0 for inverted list)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

      // Clear new message flag after animation completes
      setTimeout(() => {
        setNewMessageIds((prev) => {
          const next = new Set(prev);
          next.delete(normalized.id);
          return next;
        });
      }, 500);
    } catch (error) {
      logger.error('Error sending message:', error);
      setInputText(content);
      if (currentReplyTo) setReplyingTo(currentReplyTo); // Restore reply on error
    } finally {
      setIsSending(false);
    }
  };

  // Handle reply to message (wraps hook's setReplyingTo with focus)
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      closeMessageActions();
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedMessage, closeMessageActions, setReplyingTo]);

  // Cancel reply - use clearReply from hook
  const cancelReply = clearReply;

  // Quick reaction wrapper (uses hook's handleQuickReaction)
  const handleQuickReaction = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        handleQuickReactionBase(
          selectedMessage,
          emoji,
          hasReacted(selectedMessage, emoji),
          closeMessageActions
        );
      }
    },
    [selectedMessage, hasReacted, closeMessageActions, handleQuickReactionBase]
  );

  // Open full reaction picker (wraps hook's openReactionPicker)
  const openReactionPicker = useCallback(() => {
    if (selectedMessage) {
      openReactionPickerBase(selectedMessage);
      closeMessageActions();
    }
  }, [selectedMessage, closeMessageActions, openReactionPickerBase]);

  // Pin/unpin message wrapper (uses hook's handleTogglePin)
  const handleTogglePin = useCallback(() => {
    if (selectedMessage) {
      handleTogglePinBase(selectedMessage);
    }
  }, [selectedMessage, handleTogglePinBase]);

  // Unsend message wrapper (uses hook's handleUnsend)
  const handleUnsend = useCallback(() => {
    if (selectedMessage) {
      handleUnsendBase(selectedMessage);
    }
  }, [selectedMessage, handleUnsendBase]);

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
      // Skip rendering messages without proper ID or that appear empty/invalid
      if (!item.id) {
        if (__DEV__) {
          logger.debug('Skipping message without ID');
        }
        return null;
      }

      // Skip messages without valid sender info (ghost messages)
      const hasSender = item.sender_id || item.sender?.id;
      if (!hasSender) {
        if (__DEV__) {
          logger.debug('Skipping message without sender:', item.id);
        }
        return null;
      }

      // Skip messages that have no actual content
      const hasTextContent =
        item.content && item.content.trim().length > 0 && item.content !== '[Voice Message]';
      const hasMediaUrl = item.metadata?.url || item.file_url;
      const isVoiceWithUrl = item.type === 'voice' && hasMediaUrl;
      const isFileWithUrl = (item.type === 'file' || item.type === 'image') && hasMediaUrl;

      if (!hasTextContent && !isVoiceWithUrl && !isFileWithUrl) {
        if (__DEV__) {
          logger.debug('Skipping empty/invalid message:', item.id, {
            type: item.type,
            content: item.content?.substring(0, 20),
            hasUrl: !!hasMediaUrl,
          });
        }
        return null;
      }

      // Get current user ID - ensure string comparison
      const currentUserId = user?.id ? String(user.id) : '';

      // Get message sender ID
      const messageSenderId = item.sender_id
        ? String(item.sender_id)
        : item.sender?.id
          ? String(item.sender.id)
          : '';

      // Message is from current user if IDs match
      const isOwnMessage = currentUserId !== '' && currentUserId === messageSenderId;

      // Get sender display name with fallbacks
      const senderDisplayName =
        item.sender?.display_name ||
        (item.sender as Record<string, unknown>)?.displayName ||
        item.sender?.username ||
        'User';
      const senderAvatarUrl =
        item.sender?.avatar_url || (item.sender as Record<string, unknown>)?.avatarUrl;

      // Check if this is a new message for entrance animation
      const isNewMessage = newMessageIds.has(item.id);

      return (
        <MessageBubble
          item={item}
          isOwnMessage={isOwnMessage}
          senderDisplayName={senderDisplayName}
          senderAvatarUrl={senderAvatarUrl as string | undefined}
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

  // Callback for checking reaction state - must be before any conditional returns
  const getReactionState = useCallback(
    (emoji: string) => {
      return selectedMessage?.reactions?.some((r) => r.emoji === emoji && r.hasReacted) || false;
    },
    [selectedMessage]
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
      />
    </KeyboardAvoidingView>
  );
}
