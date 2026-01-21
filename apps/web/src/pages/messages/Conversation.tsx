import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { socketManager } from '@/lib/socket';
import { api } from '@/lib/api';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/Toast';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
// Enhanced UI v3.0 components - NEXT GEN
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
import { AnimatedReactionBubble } from '@/components/conversation/AnimatedReactionBubble';
import GlassCard from '@/components/ui/GlassCard';
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import MessageReactions from '@/components/chat/MessageReactions';
import RichMediaEmbed from '@/components/chat/RichMediaEmbed';
import E2EEConnectionTester from '@/components/chat/E2EEConnectionTester';

// Sticker system integration
import { StickerPicker, StickerButton } from '@/components/chat/StickerPicker';
import type { Sticker } from '@/data/stickers';

import { themeEngine } from '@/lib/ai/ThemeEngine';

// Theme system integration
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// Profile card integration
import UserProfileCard from '@/components/profile/UserProfileCard';

// Chat info panel
import ChatInfoPanel from '@/components/chat/ChatInfoPanel';

// ============================================================================
// TYPE-SAFE REACTION AGGREGATION UTILITIES
// ============================================================================

/**
 * Aggregated reaction format expected by MessageReactions component.
 * Transforms raw reaction arrays into grouped, counted summaries.
 */
interface AggregatedReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string }>;
  hasReacted: boolean;
}

/**
 * Raw reaction format from the chat store.
 * Includes individual user attribution for each reaction instance.
 */
interface RawReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

/**
 * Aggregates raw reactions into grouped format with counts and user lists.
 * Uses a Map-based accumulator pattern for O(n) complexity.
 *
 * @param reactions - Array of individual reaction records
 * @returns Array of aggregated reactions grouped by emoji
 */
function aggregateReactions(reactions: RawReaction[] | undefined): AggregatedReaction[] {
  if (!reactions || reactions.length === 0) return [];

  const currentUserId = useAuthStore.getState().user?.id;
  const aggregationMap = new Map<string, AggregatedReaction>();

  for (const reaction of reactions) {
    // Skip reactions with missing required data
    if (!reaction?.emoji) continue;

    const userId = reaction.user?.id ?? reaction.userId ?? 'unknown';
    const username = reaction.user?.username ?? 'Unknown User';
    const existing = aggregationMap.get(reaction.emoji);

    if (existing) {
      existing.count++;
      existing.users.push({ id: userId, username });
      if (reaction.userId === currentUserId) {
        existing.hasReacted = true;
      }
    } else {
      aggregationMap.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        users: [{ id: userId, username }],
        hasReacted: reaction.userId === currentUserId,
      });
    }
  }

  return Array.from(aggregationMap.values());
}

/**
 * Handles removal of a reaction from a message.
 * Integrates with the chat store's reaction management system.
 *
 * @param messageId - The ID of the message to remove reaction from
 * @param emoji - The emoji to remove
 */
async function handleRemoveReaction(messageId: string, emoji: string): Promise<void> {
  try {
    const { removeReaction } = useChatStore.getState();
    await removeReaction(messageId, emoji);
  } catch (error) {
    console.error('Failed to remove reaction:', error);
  }
}

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
  const {
    conversations,
    messages,
    isLoadingMessages,
    typingUsers,
    hasMoreMessages,
    fetchMessages,
    sendMessage,
    markAsRead,
    setActiveConversation,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // ====== NEXT GEN UI CUSTOMIZATION STATE ======
  const [showSettings, setShowSettings] = useState(false);
  const [showE2EETester, setShowE2EETester] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [uiPreferences, setUiPreferences] = useState({
    glassEffect: 'holographic' as 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic',
    animationIntensity: 'high' as 'low' | 'medium' | 'high',
    showParticles: true,
    enableGlow: true,
    enable3D: true,
    enableHaptic: true,
    voiceVisualizerTheme: 'matrix-green' as 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber',
    messageEntranceAnimation: 'slide' as 'slide' | 'scale' | 'fade' | 'bounce',
  });

  // Fetch friends list for mutual friends calculation
  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends.length]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!conversationId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchMessages(conversationId);
    } finally {
      setIsRefreshing(false);
    }
  }, [conversationId, isRefreshing, fetchMessages]);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  // Filter out current user from typing list - only show when OTHER users are typing
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  // Get other participant for DM - handle multiple data formats
  // Backend returns participants with userId and nested user object
  const otherParticipant = conversation?.participants.find((p: any) => {
    const participantUserId = p.userId || p.user_id || p.user?.id || p.id;
    return participantUserId !== user?.id;
  });

  // Extract userId with fallbacks for matching
  const otherParticipantUserId =
    (otherParticipant as any)?.userId ||
    (otherParticipant as any)?.user_id ||
    otherParticipant?.user?.id ||
    (otherParticipant as any)?.id;

  // Extract display name with fallbacks for both nested and flat formats
  const conversationName =
    conversation?.name ||
    otherParticipant?.nickname ||
    otherParticipant?.user?.displayName ||
    (otherParticipant?.user as any)?.display_name ||
    otherParticipant?.user?.username ||
    (otherParticipant as any)?.displayName ||
    (otherParticipant as any)?.display_name ||
    (otherParticipant as any)?.username ||
    'Unknown';

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
  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;

    setActiveConversation(conversationId);

    // Ensure socket is connected before joining conversation
    const initializeChannel = async () => {
      await socketManager.connect();
      if (mounted) {
        socketManager.joinConversation(conversationId);
      }
    };

    initializeChannel();
    fetchMessages(conversationId);
    markAsRead(conversationId);

    return () => {
      mounted = false;
      setActiveConversation(null);
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
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
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
      console.error('Failed to send sticker:', error);
      toast.error('Failed to send sticker.');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
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

      // Upload voice message
      await api.post('/api/v1/voice-messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refetch messages to show the new voice message
      // (alternatively, we could add the message directly to the store)
      await fetchMessages(conversationId);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message.');
    } finally {
      setIsSending(false);
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
        <GlassCard
          variant={uiPreferences.glassEffect}
          hover3D={false}
          glow={uiPreferences.enableGlow}
          borderGradient
          className="z-10 flex h-16 flex-shrink-0 items-center justify-between rounded-none"
        >
          <div className="flex h-full w-full items-center pl-4 pr-2">
            <motion.div
              className="flex min-w-0 flex-1 items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <UserProfileCard
                userId={otherParticipant?.user?.id || ''}
                trigger="both"
                className="cursor-pointer"
              >
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ThemedAvatar
                    src={otherParticipant?.user?.avatarUrl}
                    alt={conversationName}
                    size="large"
                    userTheme={(otherParticipant?.user as any)?.theme}
                  />
                  {isOtherUserOnline && (
                    <motion.div
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-dark-900 bg-green-500 shadow-lg"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(34, 197, 94, 0.7)',
                          '0 0 0 6px rgba(34, 197, 94, 0)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </UserProfileCard>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  {conversationName}
                  {uiPreferences.enableGlow && (
                    <SparklesIcon className="h-4 w-4 animate-pulse text-primary-400" />
                  )}
                </h2>
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon
                    className="h-3 w-3 text-green-400"
                    title="End-to-end encrypted"
                  />
                  <p className="text-xs text-gray-400">
                    {typing.length > 0 ? (
                      <motion.span
                        className="font-medium text-primary-400"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        typing...
                      </motion.span>
                    ) : isOtherUserOnline ? (
                      <span className="font-medium text-green-400">Online</span>
                    ) : (
                      formatLastSeen(otherParticipant?.user?.lastSeenAt)
                    )}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="ml-auto flex flex-shrink-0 items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* E2EE Indicator with Glow - Now Clickable! */}
              <motion.button
                onClick={() => {
                  setShowE2EETester(true);
                  HapticFeedback.medium();
                }}
                className="mr-2 flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1 backdrop-blur-sm transition-all hover:bg-green-500/20"
                title="Click to test E2EE connection"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                animate={
                  uiPreferences.enableGlow
                    ? {
                        boxShadow: [
                          '0 0 10px rgba(34, 197, 94, 0.2)',
                          '0 0 20px rgba(34, 197, 94, 0.4)',
                          '0 0 10px rgba(34, 197, 94, 0.2)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <LockClosedIcon className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs font-bold tracking-wider text-green-400">E2EE</span>
              </motion.button>

              {/* Action Buttons */}
              <motion.button
                onClick={() => {
                  handleRefresh();
                  if (uiPreferences.enableHaptic) HapticFeedback.light();
                }}
                disabled={isRefreshing}
                className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
                title="Refresh messages"
                whileHover={{ scale: 1.1, rotate: uiPreferences.enable3D ? 180 : 0 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>

              <motion.button
                onClick={() => uiPreferences.enableHaptic && HapticFeedback.medium()}
                className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Voice call"
              >
                <PhoneIcon className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={() => uiPreferences.enableHaptic && HapticFeedback.medium()}
                className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Video call"
              >
                <VideoCameraIcon className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={() => {
                  setShowInfoPanel(!showInfoPanel);
                  if (uiPreferences.enableHaptic) HapticFeedback.medium();
                }}
                className={`rounded-lg p-2 transition-all duration-200 hover:bg-white/10 ${
                  showInfoPanel
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Toggle user info panel"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </motion.button>

              {/* UI Settings Button */}
              <motion.button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (uiPreferences.enableHaptic) HapticFeedback.medium();
                }}
                className="ml-1 rounded-lg border border-purple-500/30 bg-purple-500/20 p-2 text-purple-400 transition-all duration-200 hover:bg-purple-500/30"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                title="UI Customization"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>
        </GlassCard>

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
                          setUiPreferences({ ...uiPreferences, glassEffect: e.target.value as any })
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
                          setUiPreferences({
                            ...uiPreferences,
                            voiceVisualizerTheme: e.target.value as any,
                          })
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
                          setUiPreferences({
                            ...uiPreferences,
                            animationIntensity: e.target.value as any,
                          })
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
                          setUiPreferences({
                            ...uiPreferences,
                            messageEntranceAnimation: e.target.value as any,
                          })
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
                  // Extract sender ID with comprehensive fallback chain
                  // Check both camelCase and snake_case, plus nested sender.id
                  const rawSenderId =
                    message.senderId ||
                    (message as any).sender_id ||
                    message.sender?.id ||
                    (message.sender as any)?.user_id ||
                    '';
                  const messageSenderId = rawSenderId ? String(rawSenderId).trim() : '';

                  // Extract current user ID with same robust handling
                  const rawUserId = user?.id || (user as any)?.userId || '';
                  const currentUserId = rawUserId ? String(rawUserId).trim() : '';

                  // Debug logging for alignment issues
                  if (import.meta.env.DEV && msgIndex === 0) {
                    console.log('[Conversation Web] First message debug:', {
                      messageId: message.id,
                      rawSenderId,
                      messageSenderId,
                      rawUserId,
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
                    ? String(
                        prevMessage.senderId ||
                          (prevMessage as any).sender_id ||
                          prevMessage.sender?.id ||
                          ''
                      ).trim()
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
            {typing.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.3, type: 'spring' }}
              >
                <div className="ml-4 inline-block">
                  <GlassCard
                    variant="crystal"
                    glow={uiPreferences.enableGlow}
                    className="inline-flex items-center gap-3 rounded-2xl px-4 py-2"
                  >
                    <div className="flex space-x-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary-400 to-purple-400"
                          animate={{
                            y: [0, -8, 0],
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                          }}
                          style={{
                            boxShadow: uiPreferences.enableGlow
                              ? '0 0 10px rgba(16, 185, 129, 0.5)'
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-sm font-medium text-transparent">
                      typing...
                    </span>
                  </GlassCard>
                </div>
              </motion.div>
            )}
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
            {/* Sticker Picker - positioned above input */}
            <div className="relative" ref={inputContainerRef}>
              <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={handleStickerSelect}
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
                  onClick={() => uiPreferences.enableHaptic && HapticFeedback.light()}
                  className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
                  whileHover={{ scale: 1.1, rotate: -15 }}
                  whileTap={{ scale: 0.9 }}
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

                {/* Sticker Button */}
                <StickerButton
                  onClick={() => {
                    setShowStickerPicker(!showStickerPicker);
                    if (uiPreferences.enableHaptic) HapticFeedback.light();
                  }}
                  isActive={showStickerPicker}
                  className="rounded-xl hover:bg-primary-500/20 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />

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
              level: (otherParticipant?.user as any)?.level || 1,
              xp: (otherParticipant?.user as any)?.xp || 0,
              karma: (otherParticipant?.user as any)?.karma || 0,
              streak: (otherParticipant?.user as any)?.streak || 0,
              onlineStatus: isOtherUserOnline ? 'online' : 'offline',
              lastSeenAt: otherParticipant?.user?.lastSeenAt ?? undefined,
              bio: (otherParticipant?.user as any)?.bio,
              badges: (otherParticipant?.user as any)?.badges || [],
              theme: (otherParticipant?.user as any)?.theme,
            }}
            mutualFriends={mutualFriends}
            sharedForums={(otherParticipant?.user as any)?.sharedForums || []}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  uiPreferences,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  uiPreferences: {
    glassEffect: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
    animationIntensity: 'low' | 'medium' | 'high';
    showParticles: boolean;
    enableGlow: boolean;
    enable3D: boolean;
    enableHaptic: boolean;
    voiceVisualizerTheme: 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber';
    messageEntranceAnimation: 'slide' | 'scale' | 'fade' | 'bounce';
  };
  onAvatarClick?: (userId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  // Safe time formatter that handles invalid dates
  const formatMessageTime = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`group flex animate-fade-in items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && message.sender?.id && (
            <UserProfileCard userId={message.sender.id} trigger="both" className="cursor-pointer">
              <ThemedAvatar
                src={message.sender?.avatarUrl}
                alt={message.sender?.displayName || message.sender?.username || 'User'}
                size="small"
                userTheme={(message as any).senderTheme}
              />
            </UserProfileCard>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={`mb-1 rounded-lg bg-dark-700/50 px-3 py-1.5 text-xs ${isOwn ? 'text-right' : ''}`}
          >
            <span className="text-primary-400">
              {message.replyTo.sender?.username || 'Unknown'}
            </span>
            <p className="max-w-xs truncate text-gray-400">{message.replyTo.content}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Actions (for own messages, show on left) */}
          {isOwn && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={onReply}
                className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                title="Reply"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                title="More"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`rounded-2xl px-4 py-2 transition-all duration-200 hover:shadow-lg ${
              isOwn
                ? 'rounded-br-md bg-primary-600 text-white hover:bg-primary-500'
                : 'rounded-bl-md bg-dark-700 text-white hover:bg-dark-600'
            }`}
          >
            {/* Image/Media messages */}
            {message.messageType === 'image' && message.metadata?.url && (
              <img
                src={message.metadata.url as string}
                alt="Shared image"
                className="mb-2 max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                onClick={() => window.open(message.metadata.url as string, '_blank')}
              />
            )}
            {message.messageType === 'video' && message.metadata?.url && (
              <video
                src={message.metadata.url as string}
                controls
                className="mb-2 max-w-xs rounded-lg"
              />
            )}
            {message.messageType === 'file' && message.metadata?.url && (
              <a
                href={message.metadata.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 flex items-center gap-2 rounded-lg bg-dark-600/50 p-2 transition-colors hover:bg-dark-600"
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="truncate text-sm">
                  {(message.metadata.filename as string) || 'File'}
                </span>
              </a>
            )}
            {/* Voice/Audio messages with Advanced Visualizer */}
            {(message.messageType === 'voice' || message.messageType === 'audio') &&
              message.metadata?.url && (
                <div className="min-w-[280px] space-y-2">
                  {/* Advanced Voice Visualizer - Next Gen UI */}
                  <AdvancedVoiceVisualizer
                    audioUrl={message.metadata.url as string}
                    variant="spectrum"
                    theme={uiPreferences.voiceVisualizerTheme}
                    height={120}
                    width={280}
                    className="rounded-xl"
                  />
                  {/* Fallback Classic Player */}
                  <VoiceMessagePlayer
                    messageId={message.id}
                    audioUrl={message.metadata.url as string}
                    duration={(message.metadata.duration as number) || 0}
                    waveformData={message.metadata.waveform as number[] | undefined}
                    className={isOwn ? 'voice-player-own' : ''}
                  />
                </div>
              )}
            {/* Text content - hide for voice messages */}
            {message.content &&
              message.messageType !== 'voice' &&
              message.messageType !== 'audio' && (
                <>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {/* Rich Media Embeds - automatically detect and render URLs */}
                  <RichMediaEmbed content={message.content} isOwnMessage={isOwn} />
                </>
              )}
            <div
              className={`mt-1 flex items-center gap-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}
            >
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && <span>(edited)</span>}
            </div>
          </div>

          {/* Actions (for other messages, show on right) */}
          {!isOwn && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={onReply}
                className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                title="Reply"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
                title="React"
              >
                <FaceSmileIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Reactions System */}
        <div className="mt-1">
          <MessageReactions
            messageId={message.id}
            reactions={aggregateReactions(message.reactions)}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            currentUserId={useAuthStore.getState().user?.id || ''}
            disabled={false}
          />
        </div>

        {/* Read Receipts - Only show for own messages */}
        {isOwn && message.metadata?.readBy && Array.isArray(message.metadata.readBy) && (
          <motion.div
            className="mt-1 flex items-center gap-1 px-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex -space-x-1">
              {(
                message.metadata.readBy as Array<{
                  id: string;
                  avatarUrl?: string;
                  username?: string;
                }>
              )
                .slice(0, 3)
                .map((reader, idx) => (
                  <motion.div
                    key={reader.id}
                    className="h-4 w-4 overflow-hidden rounded-full border border-dark-900 bg-gradient-to-br from-primary-500 to-purple-600"
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    title={`Read by ${reader.username || 'User'}`}
                  >
                    {reader.avatarUrl ? (
                      <img
                        src={reader.avatarUrl}
                        alt={reader.username || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">
                        {(reader.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
            {(message.metadata.readBy as any[]).length > 3 && (
              <span className="text-[10px] font-medium text-gray-500">
                +{(message.metadata.readBy as any[]).length - 3}
              </span>
            )}
            <span className="text-[10px] text-gray-500">
              {(message.metadata.readBy as any[]).length === 1 ? 'Seen' : 'Seen'}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Handles adding a reaction to a message.
 * Uses the chat store's reaction system with proper state management.
 * The conversationId parameter is retained for potential future use
 * in conversation-scoped reaction analytics.
 *
 * @param messageId - The ID of the message to react to
 * @param emoji - The emoji to add as reaction
 * @param _conversationId - Reserved for conversation context (unused currently)
 */
async function handleAddReaction(
  messageId: string,
  emoji: string,
  _conversationId?: string
): Promise<void> {
  try {
    const { addReaction } = useChatStore.getState();
    await addReaction(messageId, emoji);
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
}
