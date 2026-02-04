import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
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
import { VoiceMessagePlayer, TelegramAttachmentPicker, RichMediaEmbed } from '../../components';
import { createLogger } from '../../lib/logger';

// Import modular components
import {
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  InlineVideoThumbnail,
  EmptyConversation,
  MessageActionsMenu,
  ReactionPickerModal,
  AttachmentPreviewModal,
  ImageViewerModal,
  VideoPlayerModal,
  PinnedMessagesBar,
  ChatInputArea,
} from './ConversationScreen/components';
import { styles } from './ConversationScreen/styles';
import { useMediaViewer, EMOJI_CATEGORIES } from './ConversationScreen/hooks';
import {
  getMimeType,
  getFileIcon,
  formatFileSize,
  processMessagesWithReactions,
} from './ConversationScreen/utils';

const logger = createLogger('ConversationScreen');

// Fun waving emojis for empty conversation
const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'];

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
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [otherParticipantLastSeen, setOtherParticipantLastSeen] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [otherUser, setOtherUser] = useState<UserBasic | null>(null);

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

  // Message action menu state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerMessage, setReactionPickerMessage] = useState<Message | null>(null);
  const [selectedEmojiCategory, setSelectedEmojiCategory] =
    useState<keyof typeof EMOJI_CATEGORIES>('Smileys');

  // Attachment preview state
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{
      uri: string;
      type: 'image' | 'file' | 'video';
      name?: string;
      mimeType?: string;
      duration?: number;
    }>
  >([]);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const attachmentPreviewAnim = useRef(new Animated.Value(0)).current;

  // Track newly added messages for entrance animations
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // Picker lock to prevent concurrent picker operations
  const isPickerActiveRef = useRef(false);

  // Track deleted message IDs to prevent re-adding them
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());

  // Track if we should scroll to bottom on next content size change
  const shouldScrollToBottomRef = useRef(true);
  const contentHeightRef = useRef(0);

  // Animation refs
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const messageActionsAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const menuScaleAnim = useRef(new Animated.Value(0.9)).current;
  const sendButtonAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const actionItemAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

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

  // Format last seen timestamp for display
  const formatLastSeen = (lastSeenAt: string | null | undefined): string => {
    if (!lastSeenAt) return '';

    const lastSeen = new Date(lastSeenAt);
    // Check if it's a valid date
    if (isNaN(lastSeen.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastSeen.toLocaleDateString();
  };

  // Subscribe to presence changes (both conversation and global friend presence)
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;

    // Initial check - first try global friend presence, then conversation presence
    const isOnline =
      socketManager.isFriendOnline(otherParticipantId) ||
      socketManager.isUserOnline(conversationId, otherParticipantId);
    setIsOtherUserOnline(isOnline);

    // Subscribe to conversation-level status changes
    const unsubscribeConv = socketManager.onStatusChange((convId, participantId, isOnline) => {
      if (convId === conversationId && participantId === otherParticipantId) {
        setIsOtherUserOnline(isOnline);
      }
    });

    // Subscribe to global friend status changes
    const unsubscribeGlobal = socketManager.onGlobalStatusChange((userId, isOnline) => {
      if (userId === otherParticipantId) {
        setIsOtherUserOnline(isOnline);
      }
    });

    return () => {
      unsubscribeConv();
      unsubscribeGlobal();
    };
  }, [conversationId, otherParticipantId]);

  // Subscribe to typing indicator changes
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;

    // Initial check for any typing users
    const typingUsers = socketManager.getTypingUsers(conversationId);
    const otherTyping = typingUsers.some((t) => String(t.userId) === String(otherParticipantId));
    setIsOtherUserTyping(otherTyping);

    // Subscribe to typing changes
    const unsubscribe = socketManager.onTypingChange((convId, userId, isTyping) => {
      if (convId === conversationId && String(userId) === String(otherParticipantId)) {
        setIsOtherUserTyping(isTyping);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherParticipantId]);

  // Handle input text changes with typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      const channelTopic = `conversation:${conversationId}`;

      // Send typing indicator when user starts typing
      if (text.length > 0) {
        socketManager.sendTyping(channelTopic, true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator after pause (aligned with backend)
        typingTimeoutRef.current = setTimeout(() => {
          socketManager.sendTyping(channelTopic, false);
        }, 5000);
      }
    },
    [conversationId]
  );

  // Stop typing indicator when sending message or unmounting
  const stopTypingIndicator = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketManager.sendTyping(`conversation:${conversationId}`, false);
  }, [conversationId]);

  // Track if component is still mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const channelTopic = `conversation:${conversationId}`;

    const initializeConversation = async () => {
      await socketManager.connect();
      if (!isMountedRef.current) return;

      // joinChannel has built-in debouncing - safe to call on every mount
      socketManager.joinChannel(channelTopic);

      const unsubscribe = socketManager.onChannelMessage(channelTopic, (event, payload) => {
        if (!isMountedRef.current) return;

        // Handle message read event
        if (event === 'message_read') {
          const readData = payload as { user_id: string; message_id: string };
          if (readData.message_id && readData.user_id !== user?.id) {
            // Mark all messages up to this one as read
            setMessages((prev) =>
              prev.map((m) => {
                // Update messages sent by current user that are now read by recipient
                if (m.sender_id === user?.id && m.id <= readData.message_id && !m.read_at) {
                  return { ...m, read_at: new Date().toISOString(), status: 'read' as const };
                }
                return m;
              })
            );
          }
          return;
        }

        // Handle events with message_id only (delete, unpin, reactions)
        if (event === 'message_deleted') {
          const deleteData = payload as { message_id?: string; message?: { id: string } };
          const messageId = deleteData.message_id || deleteData.message?.id;
          if (messageId) {
            // Track deleted message to prevent re-adding
            deletedMessageIdsRef.current.add(messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
          return;
        }

        if (event === 'message_unpinned') {
          const unpinData = payload as { message_id?: string; message?: { id: string } };
          const messageId = unpinData.message_id || unpinData.message?.id;
          if (messageId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId
                  ? { ...m, is_pinned: false, pinned_at: undefined, pinned_by_id: undefined }
                  : m
              )
            );
          }
          return;
        }

        // Handle reaction added
        if (event === 'reaction_added') {
          const reactionData = payload as {
            message_id: string;
            emoji: string;
            user_id: string;
            user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
          };
          if (reactionData.message_id && reactionData.emoji) {
            const reactingUserId = String(reactionData.user_id);
            const currentUserId = String(user?.id || '');

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== reactionData.message_id) return m;
                const reactions = [...(m.reactions || [])];
                const existingIdx = reactions.findIndex((r) => r.emoji === reactionData.emoji);

                if (existingIdx >= 0) {
                  // Add user to existing reaction
                  const existing = reactions[existingIdx];
                  const userAlreadyReacted = existing.users.some(
                    (u) => String(u.id) === reactingUserId
                  );
                  if (!userAlreadyReacted) {
                    reactions[existingIdx] = {
                      ...existing,
                      count: existing.count + 1,
                      users: [
                        ...existing.users,
                        {
                          id: reactionData.user_id,
                          username: reactionData.user?.username || null,
                          display_name: reactionData.user?.display_name,
                          avatar_url: reactionData.user?.avatar_url,
                          status: 'online',
                        },
                      ],
                      hasReacted: existing.hasReacted || reactingUserId === currentUserId,
                    };
                  }
                } else {
                  // Create new reaction
                  reactions.push({
                    emoji: reactionData.emoji,
                    count: 1,
                    users: [
                      {
                        id: reactionData.user_id,
                        username: reactionData.user?.username || null,
                        display_name: reactionData.user?.display_name,
                        avatar_url: reactionData.user?.avatar_url,
                        status: 'online',
                      },
                    ],
                    hasReacted: reactingUserId === currentUserId,
                  });
                }
                return { ...m, reactions };
              })
            );
          }
          return;
        }

        // Handle reaction removed
        if (event === 'reaction_removed') {
          const reactionData = payload as { message_id: string; emoji: string; user_id: string };
          if (reactionData.message_id && reactionData.emoji) {
            const removedUserId = String(reactionData.user_id);
            const currentUserId = String(user?.id || '');

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== reactionData.message_id) return m;
                const reactions = [...(m.reactions || [])];
                const existingIdx = reactions.findIndex((r) => r.emoji === reactionData.emoji);

                if (existingIdx >= 0) {
                  const existing = reactions[existingIdx];
                  const newUsers = existing.users.filter((u) => String(u.id) !== removedUserId);
                  if (newUsers.length === 0) {
                    // Remove reaction entirely
                    reactions.splice(existingIdx, 1);
                  } else {
                    reactions[existingIdx] = {
                      ...existing,
                      count: newUsers.length,
                      users: newUsers,
                      hasReacted: newUsers.some((u) => String(u.id) === currentUserId),
                    };
                  }
                }
                return { ...m, reactions };
              })
            );
          }
          return;
        }

        const data = payload as { message: Record<string, unknown> };

        // Validate message data before normalizing
        if (!data.message || !data.message.id) {
          if (__DEV__) {
            logger.debug('Skipping invalid message payload:', data);
          }
          return;
        }

        const normalized = normalizeMessage(data.message);

        // Additional validation - skip messages without sender info (except for pin events)
        if (event !== 'message_pinned' && !normalized.sender_id && !normalized.sender?.id) {
          if (__DEV__) {
            logger.debug('Skipping message without sender:', normalized.id);
          }
          return;
        }

        // Validate message has actual content or media (except for pin events)
        if (event !== 'message_pinned') {
          const hasRealContent =
            normalized.content &&
            normalized.content.trim().length > 0 &&
            normalized.content !== '[Voice Message]';
          const hasMediaUrl = normalized.metadata?.url || normalized.file_url;
          if (!hasRealContent && !hasMediaUrl) {
            if (__DEV__) {
              logger.debug('Skipping empty WebSocket message:', normalized.id);
            }
            return;
          }
        }

        if (event === 'new_message') {
          // Skip if message was deleted
          if (deletedMessageIdsRef.current.has(normalized.id)) {
            if (__DEV__) {
              logger.debug('Skipping deleted message:', normalized.id);
            }
            return;
          }

          setMessages((prev) => {
            // Check for duplicates before adding
            const exists = prev.some((m) => m.id === normalized.id);
            if (exists) {
              if (__DEV__) {
                logger.debug('Skipping duplicate message:', normalized.id);
              }
              return prev;
            }
            // Prepend for inverted list (newest first)
            return [normalized, ...prev];
          });

          // Mark message as read if it's from someone else
          if (normalized.sender_id !== user?.id) {
            const channel = socketManager.getChannel(channelTopic);
            if (channel) {
              channel.push('mark_read', { message_id: normalized.id });
            }
          }

          // Scroll to top (visually bottom in inverted list) when receiving new message
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        } else if (event === 'message_updated') {
          // Skip if message was deleted
          if (deletedMessageIdsRef.current.has(normalized.id)) {
            return;
          }
          setMessages((prev) => prev.map((m) => (m.id === normalized.id ? normalized : m)));
        } else if (event === 'message_pinned') {
          // Update message to show as pinned
          setMessages((prev) =>
            prev.map((m) =>
              m.id === normalized.id
                ? {
                    ...m,
                    is_pinned: true,
                    pinned_at: normalized.pinned_at,
                    pinned_by_id: normalized.pinned_by_id,
                  }
                : m
            )
          );
        }
      });

      cleanupRef.current = unsubscribe;
    };

    fetchMessages();
    initializeConversation();

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Stop typing indicator on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
      // Don't leave channel - socket manager keeps channel alive for session
      // The join debouncing will prevent duplicate joins on remount
    };
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

  // Update header with current online and typing status
  const updateHeader = useCallback(
    (displayName: string) => {
      // Determine status text with priority: typing > online > last seen > offline
      const lastSeenText = formatLastSeen(otherParticipantLastSeen);
      let statusText = lastSeenText ? `Last seen ${lastSeenText}` : 'Offline';
      let statusColor = '#6b7280';
      let showPulse = false;

      if (isOtherUserTyping) {
        statusText = 'Typing...';
        statusColor = '#3b82f6';
        showPulse = true;
      } else if (isOtherUserOnline) {
        statusText = 'Online';
        statusColor = '#22c55e';
        showPulse = true;
      }

      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            style={styles.headerTitleContainer}
            onPress={() => {
              if (otherParticipantId) {
                // Navigate to FriendsTab and then to UserProfile screen
                (navigation as NavigationProp<ParamListBase>).navigate('FriendsTab', {
                  screen: 'UserProfile',
                  params: { userId: otherParticipantId },
                });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.headerAvatar, { backgroundColor: colors.surfaceHover }]}>
              {otherUser?.avatar_url ? (
                <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatarImage} />
              ) : (
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{displayName}</Text>
              <View style={styles.headerStatusRow}>
                {(isOtherUserOnline || isOtherUserTyping) && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColor },
                      showPulse && styles.statusDotPulse,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.headerSubtitle,
                    {
                      color:
                        isOtherUserOnline || isOtherUserTyping ? statusColor : colors.textSecondary,
                    },
                    (isOtherUserOnline || isOtherUserTyping) && { fontWeight: '500' },
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => handleStartCall('audio')}
            >
              <Ionicons name="call-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => handleStartCall('video')}
            >
              <Ionicons name="videocam-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        ),
      });
    },
    [
      colors,
      isOtherUserOnline,
      isOtherUserTyping,
      otherParticipantLastSeen,
      otherParticipantId,
      otherUser,
      navigation,
    ]
  );

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

  // Handle voice message completion - upload and send as a message
  const handleVoiceComplete = async (voiceData: {
    uri: string;
    duration: number;
    waveform: number[];
  }) => {
    setIsSending(true);
    setIsVoiceMode(false);

    try {
      // Note: FileSystem.getInfoAsync is deprecated in Expo SDK 54+
      // However, for file existence check, we can use try-catch on the formData
      // If the file doesn't exist, the upload will fail anyway

      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', {
        uri: voiceData.uri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as unknown);
      formData.append('duration', String(Math.round(voiceData.duration)));
      formData.append('waveform', JSON.stringify(voiceData.waveform));
      formData.append('conversation_id', conversationId);

      // Upload voice message
      const response = await api.post('/api/v1/voice-messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const rawMessage = response.data.data || response.data.message || response.data;

      // Validate message has required fields before adding
      if (!rawMessage || !rawMessage.id) {
        logger.warn('Invalid message response:', rawMessage);
        return;
      }

      const normalized = normalizeMessage(rawMessage);

      // Add with deduplication - socket may also deliver this message
      // Prepend for inverted list (newest first)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });

      // Scroll to the new voice message (offset 0 for inverted list)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

      // Clean up the temporary file
      await FileSystem.deleteAsync(voiceData.uri, { idempotent: true });
    } catch (error) {
      logger.error('Error sending voice message:', error);
      // Alert user of failure
      Alert.alert('Error', 'Failed to send voice message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle starting a call (audio or video)
  const handleStartCall = (type: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // For now, show coming soon alert - calls can be implemented with WebRTC
    Alert.alert(
      `${type === 'video' ? 'Video' : 'Voice'} Call`,
      `${type === 'video' ? 'Video' : 'Voice'} calls are coming soon! Stay tuned for real-time encrypted calls.`,
      [{ text: 'Got it', style: 'default' }]
    );
  };

  // Close attachment menu with animation - always animate to closed state
  const closeAttachMenu = useCallback(() => {
    setShowAttachMenu(false);
    Animated.spring(attachMenuAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [attachMenuAnim]);

  // Open attachment menu with animation
  const openAttachMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachMenu(true);
    Animated.spring(attachMenuAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [attachMenuAnim]);

  // Toggle attachment menu with animation
  const toggleAttachMenu = useCallback(() => {
    if (showAttachMenu) {
      closeAttachMenu();
    } else {
      openAttachMenu();
    }
  }, [showAttachMenu, closeAttachMenu, openAttachMenu]);

  // Handle long press on message to show actions
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedMessage(message);
      setShowMessageActions(true);

      // Reset all animations
      backdropAnim.setValue(0);
      menuScaleAnim.setValue(0.9);
      messageActionsAnim.setValue(0);
      actionItemAnims.forEach((anim) => anim.setValue(0));

      // Staggered entrance animation
      Animated.parallel([
        // Backdrop fade in
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Menu slide up with spring
        Animated.spring(messageActionsAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        // Menu scale up
        Animated.spring(menuScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
      ]).start(() => {
        // Stagger action items
        const staggerDelay = 50;
        actionItemAnims.forEach((anim, index) => {
          setTimeout(() => {
            Animated.spring(anim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 120,
              friction: 8,
            }).start();
          }, index * staggerDelay);
        });
      });
    },
    [messageActionsAnim, backdropAnim, menuScaleAnim, actionItemAnims]
  );

  // Close message actions menu
  const closeMessageActions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(messageActionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuScaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMessageActions(false);
      setSelectedMessage(null);
    });
  }, [messageActionsAnim, backdropAnim, menuScaleAnim]);

  // Handle reply to message
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      closeMessageActions();
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedMessage, closeMessageActions]);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Handle adding a reaction to a message
  // Limit: 1 reaction per user per message - will replace existing reaction
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Optimistic update - add reaction locally (replacing any existing user reaction)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            let reactions = [...(m.reactions || [])];
            const currentUserId = user?.id;

            // First, remove user's previous reaction if any (1 reaction per user limit)
            reactions = reactions
              .map((r) => {
                if (r.hasReacted && r.emoji !== emoji) {
                  const newUsers = r.users.filter((u) => u.id !== currentUserId);
                  if (newUsers.length === 0) {
                    return null; // Mark for removal
                  }
                  return {
                    ...r,
                    count: newUsers.length,
                    hasReacted: false,
                    users: newUsers,
                  };
                }
                return r;
              })
              .filter(Boolean) as typeof reactions;

            // Now add the new reaction
            const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

            if (existingIdx >= 0) {
              const existing = reactions[existingIdx];
              if (!existing.hasReacted) {
                reactions[existingIdx] = {
                  ...existing,
                  count: existing.count + 1,
                  hasReacted: true,
                  users: [
                    ...existing.users,
                    {
                      id: currentUserId || '',
                      username: user?.username || null,
                      display_name: user?.display_name,
                      avatar_url: user?.avatar_url,
                      status: 'online',
                    },
                  ],
                };
              }
            } else {
              reactions.push({
                emoji,
                count: 1,
                hasReacted: true,
                users: [
                  {
                    id: currentUserId || '',
                    username: user?.username || null,
                    display_name: user?.display_name,
                    avatar_url: user?.avatar_url,
                    status: 'online',
                  },
                ],
              });
            }
            return { ...m, reactions };
          })
        );
      } catch (error: unknown) {
        // 409 means user already has this exact reaction - silently ignore
        if (error?.response?.status !== 409) {
          logger.warn('Error adding reaction:', error?.message || error);
        }
      }
    },
    [user]
  );

  // Handle removing a reaction from a message
  const handleRemoveReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api.delete(`/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Optimistic update - remove reaction locally
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

            if (existingIdx >= 0) {
              const existing = reactions[existingIdx];
              const newUsers = existing.users.filter((u) => u.id !== user?.id);
              if (newUsers.length === 0) {
                reactions.splice(existingIdx, 1);
              } else {
                reactions[existingIdx] = {
                  ...existing,
                  count: newUsers.length,
                  hasReacted: false,
                  users: newUsers,
                };
              }
            }
            return { ...m, reactions };
          })
        );
      } catch (error) {
        logger.error('Error removing reaction:', error);
        Alert.alert('Error', 'Failed to remove reaction');
      }
    },
    [user?.id]
  );

  // Handle quick reaction from message actions menu
  const handleQuickReaction = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        const hasReacted = selectedMessage.reactions?.some(
          (r) => r.emoji === emoji && r.hasReacted
        );
        if (hasReacted) {
          handleRemoveReaction(selectedMessage.id, emoji);
        } else {
          handleAddReaction(selectedMessage.id, emoji);
        }
        closeMessageActions();
      }
    },
    [selectedMessage, handleAddReaction, handleRemoveReaction, closeMessageActions]
  );

  // Handle reaction tap on message bubble
  const handleReactionTap = useCallback(
    (messageId: string, emoji: string, hasReacted: boolean) => {
      if (hasReacted) {
        handleRemoveReaction(messageId, emoji);
      } else {
        handleAddReaction(messageId, emoji);
      }
    },
    [handleAddReaction, handleRemoveReaction]
  );

  // Open full reaction picker
  const openReactionPicker = useCallback(() => {
    if (selectedMessage) {
      setReactionPickerMessage(selectedMessage);
      closeMessageActions();
      setTimeout(() => setShowReactionPicker(true), 200);
    }
  }, [selectedMessage, closeMessageActions]);

  // Close reaction picker
  const closeReactionPicker = useCallback(() => {
    setShowReactionPicker(false);
    setReactionPickerMessage(null);
  }, []);

  // Handle pin/unpin message
  const handleTogglePin = useCallback(async () => {
    if (!selectedMessage) return;

    const channelTopic = `conversation:${conversationId}`;
    const channel = socketManager.getChannel(channelTopic);
    if (!channel) {
      Alert.alert('Error', 'Not connected to conversation');
      closeMessageActions();
      return;
    }

    const isPinned = selectedMessage.is_pinned;
    const event = isPinned ? 'unpin_message' : 'pin_message';

    channel
      .push(event, { message_id: selectedMessage.id })
      .receive('ok', (response: Record<string, unknown>) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Update local state with proper pin timestamp from server
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selectedMessage.id
              ? {
                  ...m,
                  is_pinned: !isPinned,
                  pinned_at: !isPinned
                    ? response?.pinned_at || new Date().toISOString()
                    : undefined,
                  pinned_by_id: !isPinned ? response?.pinned_by_id || user?.id : undefined,
                }
              : m
          )
        );
      })
      .receive('error', (err: unknown) => {
        // Extract reason from various error formats
        const reason = typeof err === 'string' ? err : err?.reason || err?.error || '';
        logger.warn('Pin error:', reason);

        let errorMsg = `Failed to ${isPinned ? 'unpin' : 'pin'} message`;

        if (reason === 'pin_limit_reached' || reason.includes('limit')) {
          errorMsg = 'You can only pin up to 3 messages. Unpin a message first.';
        } else if (reason === 'already_pinned') {
          errorMsg = 'This message is already pinned.';
        } else if (reason === 'unauthorized' || reason === 'not_authorized') {
          errorMsg = 'You do not have permission to pin messages.';
        } else if (reason === 'not_found') {
          errorMsg = 'Message not found.';
        }

        Alert.alert('Pin Error', errorMsg);
      });

    closeMessageActions();
  }, [selectedMessage, conversationId, closeMessageActions]);

  // Handle unsend/delete message (for everyone)
  const handleUnsend = useCallback(async () => {
    if (!selectedMessage) return;

    const isOwnMessage = String(user?.id) === String(selectedMessage.sender_id);
    if (!isOwnMessage) {
      Alert.alert('Error', 'You can only unsend your own messages');
      closeMessageActions();
      return;
    }

    Alert.alert(
      'Unsend Message',
      'This message will be deleted for everyone in this conversation. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: () => {
            const channelTopic = `conversation:${conversationId}`;
            const channel = socketManager.getChannel(channelTopic);
            if (!channel) {
              Alert.alert('Error', 'Not connected to conversation');
              return;
            }

            channel
              .push('delete_message', { message_id: selectedMessage.id })
              .receive('ok', () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Track deleted message ID to prevent re-adding
                deletedMessageIdsRef.current.add(selectedMessage.id);
                // Remove from local state
                setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
              })
              .receive('error', (err: unknown) => {
                logger.error('Failed to unsend message:', err);
                Alert.alert('Error', 'Failed to unsend message');
              });
          },
        },
      ]
    );

    closeMessageActions();
  }, [selectedMessage, user?.id, conversationId, closeMessageActions]);

  // Handle image picker
  const handlePickImage = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting image picker...');
    closeAttachMenu();

    // Longer delay to ensure modal is fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Requesting media library permission...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      logger.debug('Permission result:', permission.granted);
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to send images.');
        return;
      }

      logger.debug('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      logger.debug(
        'Image picker result:',
        result.canceled ? 'canceled' : `${result.assets?.length} selected`
      );

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add to pending attachments and show preview
        const newAttachments = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image' as const,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        setPendingAttachments((prev) => [...prev, ...newAttachments]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library');
    } finally {
      isPickerActiveRef.current = false;
    }
  };

  // Handle camera capture - opens native camera with photo/video toggle (like Telegram)
  const handleTakePhoto = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting camera...');
    closeAttachMenu();

    // Longer delay to ensure modal is fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Requesting camera permission...');
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      logger.debug('Camera permission:', cameraPermission.granted);
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }

      // Note: Microphone permission is automatically requested by the camera when recording video
      // No need to request it separately for expo-image-picker

      logger.debug('Launching camera with photo/video support...');
      // Open native camera with BOTH photo and video options - user can switch in camera UI
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'], // Allow both - user decides in native camera
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max for videos
        videoQuality: 1, // High quality video
      });
      logger.debug('Camera result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets[0]) {
        // Add to pending attachments and show preview
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        logger.debug('Asset type:', asset.type, 'mimeType:', asset.mimeType, 'isVideo:', isVideo);
        setPendingAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: isVideo ? ('video' as const) : ('image' as const),
            name: asset.fileName || `camera_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
            mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
            duration: asset.duration ?? undefined,
          },
        ]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      isPickerActiveRef.current = false;
    }
  };

  // Handle document picker
  const handlePickDocument = async () => {
    // Prevent concurrent picker operations
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting document picker...');
    closeAttachMenu();

    // Longer delay to ensure modal is fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Launching document picker...');
      // Note: multiple selection disabled - causes issues with bundle files on iOS
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.*',
          'application/vnd.ms-excel',
          'image/*',
          'audio/*',
          'video/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      logger.debug('Document picker result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Filter out directory bundles (like .band files)
        if (asset.name?.endsWith('.band') || asset.mimeType === 'application/octet-stream') {
          // Check if it might be a bundle/directory
          Alert.alert(
            'Unsupported File',
            'This file type is not supported. Please choose a different file.'
          );
          return;
        }
        // Add single file to pending attachments
        setPendingAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: 'file' as const,
            name: asset.name || `file_${Date.now()}`,
            mimeType: asset.mimeType || 'application/octet-stream',
          },
        ]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to open file picker');
    } finally {
      isPickerActiveRef.current = false;
    }
  };

  // Open attachment preview modal
  const openAttachmentPreview = useCallback(() => {
    setShowAttachmentPreview(true);
    Animated.spring(attachmentPreviewAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [attachmentPreviewAnim]);

  // Close attachment preview modal
  const closeAttachmentPreview = useCallback(() => {
    Animated.timing(attachmentPreviewAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAttachmentPreview(false);
      setPendingAttachments([]);
      setAttachmentCaption('');
    });
  }, [attachmentPreviewAnim]);

  // Remove a specific attachment from pending list
  const removeAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingAttachments((prev) => {
      const newList = prev.filter((_, i) => i !== index);
      if (newList.length === 0) {
        closeAttachmentPreview();
      }
      return newList;
    });
  };

  // Send all pending attachments
  const sendPendingAttachments = async () => {
    if (pendingAttachments.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const caption = attachmentCaption.trim();
    const attachmentsToSend = [...pendingAttachments];
    closeAttachmentPreview();
    setIsSending(true);

    try {
      // Separate images, videos, and files
      const images = attachmentsToSend.filter((a) => a.type === 'image');
      const videos = attachmentsToSend.filter((a) => a.type === 'video');
      const files = attachmentsToSend.filter((a) => a.type === 'file');

      // Upload all images and collect URLs for grid message
      if (images.length > 0) {
        const uploadedUrls: string[] = [];

        for (const image of images) {
          const formData = new FormData();
          const name = image.name || `photo_${Date.now()}.jpg`;
          // Use helper to get correct MIME type from filename, fallback to asset's mimeType or jpeg
          const mimeType = getMimeType(name, image.mimeType || 'image/jpeg');

          formData.append('file', {
            uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
            name,
            type: mimeType,
          } as unknown);
          formData.append('context', 'message');

          const response = await api.post('/api/v1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });

          const fileUrl =
            response.data?.data?.url || response.data?.url || response.data?.file?.url;
          if (fileUrl) {
            uploadedUrls.push(fileUrl);
          }
        }

        // Send all images as a single message with grid metadata
        if (uploadedUrls.length > 0) {
          // Use 'image' content_type for backend compatibility, store grid info in metadata
          const msgPayload = {
            content: caption || `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
            content_type: 'image', // Use standard 'image' type for backend compatibility
            file_url: uploadedUrls[0], // Primary image
            // Store grid_images in link_preview since backend persists it as a :map
            link_preview:
              uploadedUrls.length > 1
                ? {
                    grid_images: uploadedUrls,
                    image_count: uploadedUrls.length,
                  }
                : undefined,
          };
          logger.debug('Sending message:', JSON.stringify(msgPayload));
          const msgResponse = await api.post(
            `/api/v1/conversations/${conversationId}/messages`,
            msgPayload
          );

          const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
          if (__DEV__) {
            logger.debug('Server response metadata:', JSON.stringify(rawMessage?.metadata));
            logger.debug('Message ID:', rawMessage?.id);
          }
          // Don't add message here - let WebSocket handler add it to avoid duplicates
          // The WebSocket broadcast happens server-side before we get the API response
          // So by this point, the message is already added via WebSocket
          if (rawMessage?.id) {
            // Just scroll to show the new message that WebSocket already added
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }
      }

      // Send files individually (each as separate message)
      for (const file of files) {
        await uploadAndSendFile(
          file.uri,
          file.type,
          file.name,
          files.indexOf(file) === 0 ? caption : undefined
        );
      }

      // Send videos individually (each as separate message)
      for (const video of videos) {
        await uploadAndSendFile(
          video.uri,
          'video',
          video.name,
          videos.indexOf(video) === 0 && !files.length ? caption : undefined,
          video.duration
        );
      }
    } catch (error: unknown) {
      logger.error('Error sending attachments:', error);
      logger.error('Error response:', error?.response?.data);
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to send attachments. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // Add more attachments to pending list
  const addMoreAttachments = async () => {
    // Close preview temporarily
    Animated.timing(attachmentPreviewAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(async () => {
      setShowAttachmentPreview(false);
      await handlePickImage();
    });
  };

  // Upload and send file as message
  const uploadAndSendFile = async (
    uri: string,
    type: 'image' | 'file' | 'video',
    filename?: string,
    caption?: string,
    duration?: number
  ) => {
    setIsSending(true);

    try {
      const formData = new FormData();
      const defaultExt = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'bin';
      const name = filename || `${type}_${Date.now()}.${defaultExt}`;

      // Use helper for accurate MIME type detection
      const defaultMime =
        type === 'image'
          ? 'image/jpeg'
          : type === 'video'
            ? 'video/mp4'
            : 'application/octet-stream';
      const mimeType = getMimeType(name, defaultMime);

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name,
        type: mimeType,
      } as unknown);
      formData.append('context', 'message');

      logger.debug('Uploading file:', { name, type: mimeType, uri: uri.substring(0, 50) });

      const response = await api.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for video uploads
      });

      logger.debug('Upload response:', JSON.stringify(response.data));

      // Extract URL from various response formats
      const fileUrl = response.data?.data?.url || response.data?.url || response.data?.file?.url;

      if (fileUrl) {
        // Send message with file attachment
        // Use caption if provided, otherwise default content
        const messageContent =
          caption || (type === 'image' ? 'Photo' : type === 'video' ? 'Video' : `${name}`);
        const msgPayload: Record<string, unknown> = {
          content: messageContent,
          content_type: type,
          file_url: fileUrl,
          file_name: name,
          file_mime_type: mimeType,
        };

        // Add metadata for videos (duration, mimeType for proper detection)
        if (type === 'video') {
          msgPayload.metadata = {
            duration: duration || 0,
            mimeType: mimeType, // Include mimeType in metadata for normalizer detection
          };
        }

        const msgResponse = await api.post(
          `/api/v1/conversations/${conversationId}/messages`,
          msgPayload
        );

        const rawMessage = msgResponse.data.data || msgResponse.data.message || msgResponse.data;
        if (rawMessage?.id) {
          const normalized = normalizeMessage(rawMessage);
          // Prepend for inverted list (newest first)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === normalized.id);
            if (exists) return prev;
            return [normalized, ...prev];
          });
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      } else {
        logger.error('No file URL in response:', response.data);
        Alert.alert('Error', 'Upload failed - no file URL returned.');
      }
    } catch (error: unknown) {
      logger.error('Error uploading file:', error?.response?.data || error?.message || error);
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to send file. Please try again.';
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Send a wave greeting
  const handleSendWave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const emoji = WAVE_EMOJIS[Math.floor(Math.random() * WAVE_EMOJIS.length)];

    // Trigger wave animation
    Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Send the wave message directly
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content: emoji,
        type: 'text',
      });

      const rawMessage = response.data.data || response.data.message || response.data;
      if (rawMessage?.id) {
        const normalized = normalizeMessage(rawMessage);
        // Prepend for inverted list (newest first)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === normalized.id);
          if (exists) return prev;
          return [normalized, ...prev];
        });
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      logger.error('Error sending wave:', error);
    }
  };

  // Get message status icon and color
  const getMessageStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;

    const status =
      message.status || (message.read_at ? 'read' : message.delivered_at ? 'delivered' : 'sent');

    switch (status) {
      case 'sending':
        return { icon: 'time-outline' as const, color: colors.textTertiary };
      case 'sent':
        return { icon: 'checkmark-outline' as const, color: colors.textTertiary };
      case 'delivered':
        return { icon: 'checkmark-done-outline' as const, color: colors.textTertiary };
      case 'read':
        return { icon: 'checkmark-done-outline' as const, color: '#3b82f6' };
      case 'failed':
        return { icon: 'alert-circle-outline' as const, color: '#ef4444' };
      default:
        return { icon: 'checkmark-outline' as const, color: colors.textTertiary };
    }
  };

  /**
   * Safely formats a date string to local time.
   * Handles invalid dates gracefully to prevent RangeError.
   */
  const formatTime = (dateString: string | undefined | null): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        logger.warn('Invalid date string:', dateString);
        return '';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      logger.error('Error formatting date:', error);
      return '';
    }
  };

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

  // Extracted message content renderer - must be defined before renderMessage
  const renderMessageContent = useCallback(
    (item: Message, isOwnMessage: boolean, senderDisplayName: string) => {
      return (
        <>
          {/* Reply preview if this message is a reply */}
          {item.reply_to && (
            <View
              style={[
                styles.replyContainer,
                {
                  backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                  borderLeftColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.replyAuthor,
                  { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.primary },
                ]}
                numberOfLines={1}
              >
                {item.reply_to.sender?.display_name || item.reply_to.sender?.username || 'Unknown'}
              </Text>
              <Text
                style={[
                  styles.replyText,
                  { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                ]}
                numberOfLines={2}
              >
                {item.reply_to.content ||
                  (item.reply_to.type === 'image'
                    ? 'Photo'
                    : item.reply_to.type === 'file'
                      ? 'File'
                      : 'Message')}
              </Text>
            </View>
          )}
          {/* Image Grid messages - multiple photos in one message (check FIRST before single image) */}
          {item.type === 'image' &&
            item.metadata?.grid_images &&
            Array.isArray(item.metadata.grid_images) &&
            item.metadata.grid_images.length > 0 && (
              <View style={styles.imageGrid}>
                {(() => {
                  const images = item.metadata.grid_images as string[];
                  const count = images.length;

                  // Calculate grid layout based on image count
                  const gridStyle =
                    count === 1
                      ? styles.imageGridSingle
                      : count === 2
                        ? styles.imageGridTwo
                        : count === 3
                          ? styles.imageGridThree
                          : count === 4
                            ? styles.imageGridFour
                            : styles.imageGridMany;

                  return (
                    <View style={gridStyle}>
                      {images.slice(0, 4).map((imgUrl, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.9}
                          onPress={() => handleImagePress(imgUrl, images, idx)}
                          style={[
                            styles.gridImageContainer,
                            count === 1 && styles.gridImageFull,
                            count === 2 && styles.gridImageHalf,
                            count === 3 &&
                              (idx === 0 ? styles.gridImageThreeMain : styles.gridImageThreeSide),
                            count >= 4 && styles.gridImageQuarter,
                          ]}
                        >
                          <Image
                            source={{ uri: imgUrl }}
                            style={styles.gridImage}
                            resizeMode="cover"
                          />
                          {/* Show "+X more" overlay on 4th image if more than 4 */}
                          {idx === 3 && count > 4 && (
                            <View style={styles.gridMoreOverlay}>
                              <Text style={styles.gridMoreText}>+{count - 4}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
                {/* Photo count badge */}
                {(item.metadata.grid_images as string[]).length > 1 && (
                  <View style={styles.imageGridBadge}>
                    <Text style={styles.imageGridBadgeText}>
                      {(item.metadata.grid_images as string[]).length} photos
                    </Text>
                  </View>
                )}
              </View>
            )}
          {/* Single Image messages (only if NOT a grid) */}
          {item.type === 'image' && item.metadata?.url && !item.metadata?.grid_images && (
            <View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleImagePress(item.metadata!.url!)}
              >
                <Image
                  source={{ uri: item.metadata.url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.9)" />
                </View>
              </TouchableOpacity>
              <View style={styles.imageGridBadge}>
                <Text style={styles.imageGridBadgeText}>Photo</Text>
              </View>
            </View>
          )}
          {/* File messages */}
          {item.type === 'file' && item.metadata?.url && (
            <TouchableOpacity
              style={[
                styles.fileAttachment,
                { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : colors.input },
              ]}
              onPress={() => handleFilePress(item.metadata!.url!, item.metadata?.filename)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.fileIconContainer,
                  {
                    backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : colors.primary + '20',
                  },
                ]}
              >
                <Ionicons
                  name={getFileIcon(item.metadata?.filename)}
                  size={20}
                  color={isOwnMessage ? '#fff' : colors.primary}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text
                  style={{ color: isOwnMessage ? '#fff' : colors.text, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {item.metadata.filename || 'File'}
                </Text>
                {item.metadata.size && (
                  <Text
                    style={{
                      color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {formatFileSize(item.metadata.size)}
                  </Text>
                )}
              </View>
              <Ionicons
                name="download-outline"
                size={20}
                color={isOwnMessage ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {/* Video messages */}
          {(() => {
            // Debug logging for video detection
            if (
              __DEV__ &&
              (item.type === 'video' || item.metadata?.url?.match(/\.(mp4|mov|m4v)$/i))
            ) {
              console.log(
                '[Video] Message type:',
                item.type,
                'URL:',
                item.metadata?.url,
                'mimeType:',
                item.metadata?.mimeType
              );
            }
            return null;
          })()}
          {item.type === 'video' && item.metadata?.url && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleVideoPress(item.metadata!.url!, item.metadata?.duration)}
              style={styles.videoMessageContainer}
            >
              {/* Video thumbnail - show inline video frame or image thumbnail */}
              {item.metadata.thumbnail ? (
                <Image
                  source={{ uri: item.metadata.thumbnail }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <InlineVideoThumbnail videoUrl={item.metadata.url} />
              )}
              {/* Play button overlay */}
              <View style={styles.videoPlayOverlayMessage}>
                <View style={styles.videoPlayButtonMessage}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
              </View>
              {/* Duration badge */}
              {item.metadata.duration && (
                <View style={styles.videoDurationBadgeMessage}>
                  <Text style={styles.videoDurationTextMessage}>
                    {Math.floor(item.metadata.duration / 60)}:
                    {String(Math.floor(item.metadata.duration % 60)).padStart(2, '0')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {/* Voice messages */}
          {(item.type === 'voice' || item.type === 'audio') && item.metadata?.url && (
            <VoiceMessagePlayer
              audioUrl={item.metadata.url}
              duration={item.metadata.duration || 0}
              waveformData={item.metadata.waveform}
              isSender={isOwnMessage}
            />
          )}
          {/* Text content - hide for voice, video, and image messages with default placeholder content */}
          {item.content &&
            item.type !== 'voice' &&
            item.type !== 'audio' &&
            item.type !== 'video' &&
            item.type !== 'image' &&
            !item.content.match(/^(📷 Photo|Photo|🎥 Video|Video|📎 .+|\d+ photos?)$/) && (
              <Text style={[styles.messageText, { color: isOwnMessage ? '#fff' : colors.text }]}>
                {item.content}
              </Text>
            )}
          {/* Show caption for media if it's not just a placeholder */}
          {item.content &&
            (item.type === 'video' || item.type === 'image') &&
            !item.content.match(/^(📷 Photo|Photo|🎥 Video|Video|\d+ photos?)$/) && (
              <Text style={[styles.messageText, { color: isOwnMessage ? '#fff' : colors.text }]}>
                {item.content}
              </Text>
            )}
          {/* Rich Media Embeds for URLs in text messages */}
          {item.content && item.type === 'text' && item.content.match(/https?:\/\/[^\s]+/) && (
            <RichMediaEmbed content={item.content} isOwnMessage={isOwnMessage} maxEmbeds={2} />
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
              ]}
            >
              {formatTime(item.inserted_at)}
              {item.is_edited && ' • edited'}
            </Text>
            {/* Message status indicator for own messages */}
            {isOwnMessage &&
              (() => {
                const statusInfo = getMessageStatus(item, isOwnMessage);
                if (!statusInfo) return null;
                return (
                  <Ionicons
                    name={statusInfo.icon}
                    size={14}
                    color={statusInfo.color}
                    style={styles.messageStatusIcon}
                  />
                );
              })()}
          </View>
          {/* Reactions display with animations */}
          {item.reactions && item.reactions.length > 0 && (
            <View
              style={[
                styles.reactionsContainer,
                isOwnMessage ? styles.reactionsOwn : styles.reactionsOther,
              ]}
            >
              {item.reactions.map((reaction, index) => (
                <AnimatedReactionBubble
                  key={`${reaction.emoji}-${index}`}
                  reaction={reaction}
                  isOwnMessage={isOwnMessage}
                  onPress={() => handleReactionTap(item.id, reaction.emoji, reaction.hasReacted)}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </>
      );
    },
    [
      colors,
      handleImagePress,
      handleFilePress,
      getFileIcon,
      formatFileSize,
      formatTime,
      getMessageStatus,
      handleReactionTap,
    ]
  );

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

      // Get message sender ID - normalizer sets sender_id (snake_case)
      // Fallback to sender.id for backwards compatibility
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
        <AnimatedMessageWrapper isOwnMessage={isOwnMessage} index={0} isNew={isNewMessage}>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleMessageLongPress(item)}
            delayLongPress={400}
          >
            <View
              style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage,
              ]}
            >
              {!isOwnMessage && (
                <View style={styles.avatarSmall}>
                  {senderAvatarUrl ? (
                    <Image source={{ uri: senderAvatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {senderDisplayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {/* Pin indicator */}
              {item.is_pinned && (
                <View style={styles.pinnedIndicator}>
                  <Ionicons name="pin" size={12} color={colors.primary} />
                </View>
              )}
              {isOwnMessage ? (
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.messageBubble,
                    styles.ownMessageBubble,
                    item.is_pinned && styles.pinnedBubble,
                  ]}
                >
                  {renderMessageContent(item, isOwnMessage, senderDisplayName)}
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.messageBubble,
                    styles.otherMessageBubble,
                    { backgroundColor: colors.surface },
                    item.is_pinned && styles.pinnedBubble,
                  ]}
                >
                  {renderMessageContent(item, isOwnMessage, senderDisplayName)}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </AnimatedMessageWrapper>
      );
    },
    [user?.id, colors, handleMessageLongPress, renderMessageContent, newMessageIds]
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
