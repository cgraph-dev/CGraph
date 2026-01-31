import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/Toast';
import type { GifResult } from '@/components/chat/GifPicker';
import type { Sticker } from '@/data/stickers';

// Enhanced UI v3.0 components - NEXT GEN
import {
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  ConversationHeader,
  TypingIndicator,
} from '@/components/conversation';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { themeEngine } from '@/lib/ai/ThemeEngine';

// Extracted message components
import {
  MessageBubble,
  MessageInputArea,
  ConversationModals,
  UISettingsPanel,
  ReplyPreview,
  AmbientBackground,
  type UIPreferences,
} from '@/components/messages';

const logger = createLogger('Conversation');

export default function Conversation() {
  // Apply adaptive theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();

  // Split Zustand selectors to prevent infinite re-renders
  // Each selector returns a stable reference (primitive or function)
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const scheduleMessage = useChatStore((state) => state.scheduleMessage);
  const rescheduleMessage = useChatStore((state) => state.rescheduleMessage);

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
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== MESSAGE ACTIONS STATE ======
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // ====== CALL STATE ======
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [incomingRoomId, setIncomingRoomId] = useState<string | undefined>(undefined);

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
    options?: { type?: string; metadata?: Record<string, any> };
  } | null>(null);

  // ====== FORWARD MESSAGE STATE ======
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);

  // ====== SCHEDULE MESSAGE STATE ======
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [messageToSchedule, setMessageToSchedule] = useState<string>('');
  const [showScheduledList, setShowScheduledList] = useState(false);
  const [messageToReschedule, setMessageToReschedule] = useState<Message | null>(null);

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

  // Handle incoming call query params - auto-answer calls from notifications
  useEffect(() => {
    const incomingCallParam = searchParams.get('incomingCall');
    const callTypeParam = searchParams.get('callType');

    if (incomingCallParam && callTypeParam) {
      // Store the incoming room ID
      setIncomingRoomId(incomingCallParam);

      // Auto-open the appropriate modal
      if (callTypeParam === 'video') {
        setShowVideoCallModal(true);
      } else {
        setShowVoiceCallModal(true);
      }

      // Clean up query params after handling
      searchParams.delete('incomingCall');
      searchParams.delete('callType');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  // Handle schedule message
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    if (uiPreferences.enableHaptic) HapticFeedback.light();
  };

  const handleSchedule = async (scheduledAt: Date) => {
    if (!conversationId) return;

    // Check if we're rescheduling an existing message
    if (messageToReschedule) {
      try {
        await rescheduleMessage(messageToReschedule.id, scheduledAt);
        setMessageToReschedule(null);
        if (uiPreferences.enableHaptic) HapticFeedback.success();
      } catch (error) {
        logger.warn('Failed to reschedule message:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to reschedule message';
        toast.error(errorMessage);
        if (uiPreferences.enableHaptic) HapticFeedback.error();
        throw error;
      }
    } else if (messageToSchedule.trim()) {
      // Scheduling a new message
      try {
        await scheduleMessage(conversationId, messageToSchedule, scheduledAt, {
          type: 'text',
          replyToId: replyTo?.id,
        });
        setMessageInput('');
        setMessageToSchedule('');
        setReplyTo(null);
        if (uiPreferences.enableHaptic) HapticFeedback.success();
      } catch (error) {
        logger.warn('Failed to schedule message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to schedule message';
        toast.error(errorMessage);
        if (uiPreferences.enableHaptic) HapticFeedback.error();
        throw error;
      }
    }
  };

  // Handle opening reschedule modal
  const handleRescheduleClick = (message: Message) => {
    setMessageToReschedule(message);
    setMessageToSchedule(message.content);
    setShowScheduledList(false);
    setShowScheduleModal(true);
    if (uiPreferences.enableHaptic) HapticFeedback.medium();
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

  // ====== MESSAGE ACTION HANDLERS ======

  // Start editing a message
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setActiveMessageMenu(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!conversationId || !editingMessageId || !editContent.trim()) return;

    try {
      const { editMessage } = useChatStore.getState();
      await editMessage(editingMessageId, editContent.trim());
      toast.success('Message edited');
      handleCancelEdit();
    } catch (error) {
      logger.warn('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  };

  // Delete a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!conversationId) return;

    try {
      const { deleteMessage } = useChatStore.getState();
      await deleteMessage(messageId);
      toast.success('Message deleted');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Pin a message
  const handlePinMessage = async (messageId: string) => {
    if (!conversationId) return;

    try {
      await api.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/pin`);
      toast.success('Message pinned');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to pin message:', error);
      toast.error('Failed to pin message');
    }
  };

  // Open forward modal
  const handleOpenForward = (message: Message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setActiveMessageMenu(null);
    if (uiPreferences.enableHaptic) HapticFeedback.medium();
  };

  // Forward message to selected conversations
  const handleForwardMessage = async (conversationIds: string[]) => {
    if (!messageToForward) return;

    try {
      // Forward to each selected conversation
      const forwardPromises = conversationIds.map((targetConversationId) => {
        const forwardedContent =
          messageToForward.messageType === 'text'
            ? messageToForward.content
            : `[Forwarded ${messageToForward.messageType}]`;

        return sendMessage(targetConversationId, forwardedContent, undefined, {
          type: messageToForward.messageType,
          metadata: {
            ...messageToForward.metadata,
            forwarded: true,
            originalSenderId: messageToForward.senderId,
            originalMessageId: messageToForward.id,
          },
        });
      });

      await Promise.all(forwardPromises);

      const count = conversationIds.length;
      toast.success(`Message forwarded to ${count} conversation${count > 1 ? 's' : ''}`);
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to forward message:', error);
      toast.error('Failed to forward message');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    }
  };

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

  // Toggle message action menu
  const handleToggleMessageMenu = (messageId: string) => {
    setActiveMessageMenu(activeMessageMenu === messageId ? null : messageId);
  };

  // ====== CALL HANDLERS ======

  // Start voice call
  const handleStartVoiceCall = () => {
    if (!conversationId) return;
    setShowVoiceCallModal(true);
    if (uiPreferences.enableHaptic) HapticFeedback.medium();
  };

  // Start video call
  const handleStartVideoCall = () => {
    if (!conversationId) return;
    setShowVideoCallModal(true);
    if (uiPreferences.enableHaptic) HapticFeedback.medium();
  };

  // Format date header
  const formatDateHeader = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 'Unknown';
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Format last seen timestamp into human-readable text
  const formatLastSeen = (lastSeenAt: string | null | undefined): string => {
    if (!lastSeenAt) return 'Offline';

    const lastSeen = new Date(lastSeenAt);
    if (isNaN(lastSeen.getTime())) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${format(lastSeen, 'MMM d')}`;
  };

  // Safe date parser that handles various formats and invalid dates
  const parseMessageDate = (dateStr: string | undefined | null): Date => {
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  let currentGroup: { date: Date; messages: Message[] } | null = null;

  conversationMessages.forEach((msg) => {
    const msgDate = parseMessageDate(msg.createdAt);
    if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
      currentGroup = { date: msgDate, messages: [msg] };
      groupedMessages.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

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
        {/* Ambient Background Effects - Optimized */}
        {uiPreferences.showParticles && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {[
              ...Array(
                uiPreferences.animationIntensity === 'low'
                  ? 5
                  : uiPreferences.animationIntensity === 'medium'
                    ? 10
                    : 15
              ),
            ].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-primary-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.15,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.1, 0.25, 0.1],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

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
            setShowScheduledList(!showScheduledList);
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
          showScheduledList={showScheduledList}
          showInfoPanel={showInfoPanel}
          showSettings={showSettings}
          formatLastSeen={formatLastSeen}
        />

        {/* Settings Panel (Next Gen UI Customization) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="z-20"
            >
              <GlassCard variant="neon" glow className="mx-4 mt-4 rounded-2xl p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                      <SparklesIcon className="h-5 w-5 text-primary-400" />
                      Next Gen UI Customization
                    </h3>
                    <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-gray-400">
                      BETA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Glass Effect */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Glass Effect
                      </label>
                      <select
                        value={uiPreferences.glassEffect}
                        onChange={(e) =>
                          updatePreference('glassEffect', e.target.value as GlassEffect)
                        }
                        className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
                      >
                        <option value="default">Default</option>
                        <option value="frosted">Frosted</option>
                        <option value="crystal">Crystal</option>
                        <option value="neon">Neon</option>
                        <option value="holographic">Holographic</option>
                      </select>
                    </div>

                    {/* Voice Visualizer Theme */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Voice Theme
                      </label>
                      <select
                        value={uiPreferences.voiceVisualizerTheme}
                        onChange={(e) =>
                          updatePreference('voiceVisualizerTheme', e.target.value as VoiceTheme)
                        }
                        className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
                      >
                        <option value="matrix-green">Matrix Green</option>
                        <option value="cyber-blue">Cyber Blue</option>
                        <option value="neon-pink">Neon Pink</option>
                        <option value="amber">Amber</option>
                      </select>
                    </div>

                    {/* Animation Intensity */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Animation Intensity
                      </label>
                      <select
                        value={uiPreferences.animationIntensity}
                        onChange={(e) =>
                          updatePreference(
                            'animationIntensity',
                            e.target.value as AnimationIntensity
                          )
                        }
                        className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
                      >
                        <option value="low">Low (Performance)</option>
                        <option value="medium">Medium</option>
                        <option value="high">High (Beautiful)</option>
                      </select>
                    </div>

                    {/* Message Animation */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Message Animation
                      </label>
                      <select
                        value={uiPreferences.messageEntranceAnimation}
                        onChange={(e) =>
                          updatePreference(
                            'messageEntranceAnimation',
                            e.target.value as EntranceAnimation
                          )
                        }
                        className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
                      >
                        <option value="slide">Slide</option>
                        <option value="scale">Scale</option>
                        <option value="fade">Fade</option>
                        <option value="bounce">Bounce</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'showParticles', label: 'Particles' },
                      { key: 'enableGlow', label: 'Glow Effects' },
                      { key: 'enable3D', label: '3D Effects' },
                      { key: 'enableHaptic', label: 'Haptic' },
                    ].map(({ key, label }) => (
                      <motion.button
                        key={key}
                        onClick={() => {
                          setUiPreferences({
                            ...uiPreferences,
                            [key]: !uiPreferences[key as keyof typeof uiPreferences],
                          });
                          if (uiPreferences.enableHaptic) HapticFeedback.light();
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          uiPreferences[key as keyof typeof uiPreferences]
                            ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            : 'border border-dark-600 bg-dark-700/50 text-gray-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
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
                        isMenuOpen={activeMessageMenu === message.id}
                        onToggleMenu={() => handleToggleMessageMenu(message.id)}
                        isEditing={editingMessageId === message.id}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
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
                              onPress={() => handleAddReaction(message.id, emoji, conversationId)}
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

        {/* Enhanced Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="z-10 px-4 py-2"
            >
              <GlassCard
                variant={uiPreferences.glassEffect}
                glow={uiPreferences.enableGlow}
                borderGradient
                className="flex items-center justify-between rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-10 w-1.5 rounded-full bg-gradient-to-b from-primary-500 to-purple-500"
                    animate={
                      uiPreferences.enableGlow
                        ? {
                            boxShadow: [
                              '0 0 5px rgba(16, 185, 129, 0.3)',
                              '0 0 15px rgba(16, 185, 129, 0.6)',
                              '0 0 5px rgba(16, 185, 129, 0.3)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div>
                    <p className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-xs font-semibold text-transparent">
                      Replying to{' '}
                      {replyTo.sender?.displayName || replyTo.sender?.username || 'Unknown'}
                    </p>
                    <p className="max-w-md truncate text-sm text-gray-300">{replyTo.content}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    setReplyTo(null);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className="group rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="h-4 w-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Input Area */}
        <div className="z-10 p-4">
          <GlassCard
            variant={uiPreferences.glassEffect}
            glow={uiPreferences.enableGlow}
            hover3D={false}
            borderGradient
            className="rounded-2xl p-2"
          >
            {/* Sticker & GIF Pickers - positioned above input */}
            <div className="relative" ref={inputContainerRef}>
              <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={handleStickerSelect}
              />
              <GifPicker
                isOpen={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                onSelect={handleGifSelect}
                className="bottom-16 left-0"
              />
              <EmojiPicker
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={handleEmojiSelect}
                className="bottom-16 left-0"
              />
            </div>

            {isVoiceMode ? (
              /* Voice Recorder UI */
              <VoiceMessageRecorder
                onComplete={handleVoiceComplete}
                onCancel={() => {
                  setIsVoiceMode(false);
                  if (uiPreferences.enableHaptic) HapticFeedback.medium();
                }}
                maxDuration={120}
                className="w-full"
              />
            ) : (
              /* Next Gen Input UI */
              <div className="flex items-end gap-3 p-2">
                <motion.button
                  onClick={() => {
                    fileInputRef.current?.click();
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
                  whileHover={{ scale: 1.1, rotate: -15 }}
                  whileTap={{ scale: 0.9 }}
                  title="Attach file"
                >
                  <PaperClipIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </motion.button>

                <div className="flex-1 rounded-xl border border-primary-500/20 bg-dark-900/50 transition-all focus-within:border-primary-500/50">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-32 w-full resize-none bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                    style={{ minHeight: '48px' }}
                  />
                </div>

                {/* Emoji Button */}
                <motion.button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowStickerPicker(false);
                    setShowGifPicker(false);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className={`group rounded-xl p-2.5 transition-all ${
                    showEmojiPicker
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:bg-primary-500/20 hover:text-primary-400'
                  }`}
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                  title="Add emoji"
                >
                  <FaceSmileIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </motion.button>

                {/* Sticker Button */}
                <StickerButton
                  onClick={() => {
                    setShowStickerPicker(!showStickerPicker);
                    setShowGifPicker(false);
                    setShowEmojiPicker(false);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  isActive={showStickerPicker}
                  className="rounded-xl hover:bg-primary-500/20 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />

                {/* GIF Button */}
                <motion.button
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowStickerPicker(false);
                    setShowEmojiPicker(false);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  className={`group rounded-xl p-2.5 transition-all ${
                    showGifPicker
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:bg-primary-500/20 hover:text-primary-400'
                  }`}
                  whileHover={{ scale: 1.1, rotate: -15 }}
                  whileTap={{ scale: 0.9 }}
                  title="Send GIF"
                >
                  <SparklesIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </motion.button>

                {/* Schedule Button */}
                {messageInput.trim() && (
                  <motion.button
                    onClick={() => {
                      setMessageToSchedule(messageInput);
                      setShowScheduleModal(true);
                      if (uiPreferences.enableHaptic) HapticFeedback.medium();
                    }}
                    className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-purple-500/20 hover:text-purple-400"
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                    title="Schedule message"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <ClockIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  </motion.button>
                )}

                {/* Morphing Send/Mic Button */}
                <AnimatePresence mode="wait">
                  {messageInput.trim() ? (
                    <motion.button
                      key="send"
                      onClick={() => {
                        handleSend();
                        if (uiPreferences.enableHaptic) HapticFeedback.success();
                      }}
                      disabled={isSending}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 p-3 text-white transition-all hover:from-primary-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {uiPreferences.enableGlow && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 transition-opacity group-hover:opacity-50"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      <PaperAirplaneIcon className="relative z-10 h-5 w-5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="mic"
                      onClick={() => {
                        setIsVoiceMode(true);
                        if (uiPreferences.enableHaptic) HapticFeedback.medium();
                      }}
                      disabled={isSending}
                      className="group rounded-xl border border-red-500/20 p-3 text-gray-400 transition-all hover:bg-red-500/20 hover:text-red-400"
                      title="Record voice message"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MicrophoneIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </div>

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
        {messageToForward && (
          <ForwardMessageModal
            isOpen={showForwardModal}
            onClose={() => {
              setShowForwardModal(false);
              setMessageToForward(null);
            }}
            onForward={handleForwardMessage}
            message={messageToForward}
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
            isOpen={showScheduledList}
            onClose={() => setShowScheduledList(false)}
            conversationId={conversationId}
            onReschedule={handleRescheduleClick}
          />
        )}

        {/* Schedule Message Modal */}
        <ScheduleMessageModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setMessageToSchedule('');
            setMessageToReschedule(null);
          }}
          onSchedule={handleSchedule}
          messagePreview={messageToSchedule}
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
              theme: otherParticipant?.user?.theme ?? undefined,
            }}
            mutualFriends={mutualFriends}
            sharedForums={otherParticipant?.user?.sharedForums ?? []}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={showVoiceCallModal}
        onClose={() => {
          setShowVoiceCallModal(false);
          setIncomingRoomId(undefined);
        }}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipant?.user?.avatarUrl ?? undefined}
        incomingRoomId={incomingRoomId}
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCallModal}
        onClose={() => {
          setShowVideoCallModal(false);
          setIncomingRoomId(undefined);
        }}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipant?.user?.avatarUrl ?? undefined}
        incomingRoomId={incomingRoomId}
      />
    </div>
  );
}
