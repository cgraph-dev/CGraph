import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { api } from '@/lib/api';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
import { AnimationEngine, HapticFeedback } from '@/lib/animations/AnimationEngine';
import MessageReactions from '@/components/chat/MessageReactions';
import RichMediaEmbed from '@/components/chat/RichMediaEmbed';
import E2EEConnectionTester from '@/components/chat/E2EEConnectionTester';

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ====== NEXT GEN UI CUSTOMIZATION STATE ======
  const [showSettings, setShowSettings] = useState(false);
  const [showE2EETester, setShowE2EETester] = useState(false);
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
    ? (typingUsers[conversationId] || []).filter(userId => userId !== user?.id) 
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
  }, [conversationId, setActiveConversation, fetchMessages, markAsRead]);

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
    } finally {
      setIsSending(false);
    }
  };

  // Handle voice message complete - upload and send
  const handleVoiceComplete = async (data: { blob: Blob; duration: number; waveform: number[] }) => {
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
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 h-full max-h-screen overflow-hidden relative">
      {/* Ambient Background Effects - Optimized */}
      {uiPreferences.showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(uiPreferences.animationIntensity === 'low' ? 5 : uiPreferences.animationIntensity === 'medium' ? 10 : 15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary-400"
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
        className="h-16 flex items-center justify-between flex-shrink-0 rounded-none z-10"
      >
        <div className="w-full h-full flex items-center justify-between px-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-purple-600 p-0.5">
              <div className="h-full w-full rounded-full overflow-hidden bg-dark-800">
                {otherParticipant?.user?.avatarUrl ? (
                  <img
                    src={otherParticipant.user.avatarUrl}
                    alt={conversationName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg font-bold text-gradient bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                    {conversationName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            {isOtherUserOnline && (
              <motion.div
                className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-dark-900 shadow-lg"
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
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              {conversationName}
              {uiPreferences.enableGlow && (
                <SparklesIcon className="h-4 w-4 text-primary-400 animate-pulse" />
              )}
            </h2>
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-3 w-3 text-green-400" title="End-to-end encrypted" />
              <p className="text-xs text-gray-400">
                {typing.length > 0 ? (
                  <motion.span
                    className="text-primary-400 font-medium"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    typing...
                  </motion.span>
                ) : isOtherUserOnline ? (
                  <span className="text-green-400 font-medium">Online</span>
                ) : (
                  formatLastSeen(otherParticipant?.user?.lastSeenAt)
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm cursor-pointer transition-all hover:bg-green-500/20"
            title="Click to test E2EE connection"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            animate={uiPreferences.enableGlow ? {
              boxShadow: [
                '0 0 10px rgba(34, 197, 94, 0.2)',
                '0 0 20px rgba(34, 197, 94, 0.4)',
                '0 0 10px rgba(34, 197, 94, 0.2)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <LockClosedIcon className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400 font-bold tracking-wider">E2EE</span>
          </motion.button>

          {/* Action Buttons */}
          <motion.button
            onClick={() => {
              handleRefresh();
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all duration-200 disabled:opacity-50 group"
            title="Refresh messages"
            whileHover={{ scale: 1.1, rotate: uiPreferences.enable3D ? 180 : 0 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''} group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
          </motion.button>

          <motion.button
            onClick={() => uiPreferences.enableHaptic && HapticFeedback.medium()}
            className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all duration-200 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PhoneIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          <motion.button
            onClick={() => uiPreferences.enableHaptic && HapticFeedback.medium()}
            className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all duration-200 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <VideoCameraIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          <motion.button
            onClick={() => uiPreferences.enableHaptic && HapticFeedback.medium()}
            className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all duration-200 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <InformationCircleIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          {/* UI Settings Button */}
          <motion.button
            onClick={() => {
              setShowSettings(!showSettings);
              if (uiPreferences.enableHaptic) HapticFeedback.medium();
            }}
            className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all duration-200 group border border-purple-500/30"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            title="UI Customization"
          >
            <Cog6ToothIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
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
            <GlassCard
              variant="neon"
              glow
              className="mx-4 mt-4 rounded-2xl p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-primary-400" />
                    Next Gen UI Customization
                  </h3>
                  <span className="text-xs text-gray-400 bg-primary-500/10 px-2 py-1 rounded-full">
                    BETA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Glass Effect */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Glass Effect</label>
                    <select
                      value={uiPreferences.glassEffect}
                      onChange={(e) => setUiPreferences({ ...uiPreferences, glassEffect: e.target.value as any })}
                      className="w-full bg-dark-700/50 border border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
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
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Voice Theme</label>
                    <select
                      value={uiPreferences.voiceVisualizerTheme}
                      onChange={(e) => setUiPreferences({ ...uiPreferences, voiceVisualizerTheme: e.target.value as any })}
                      className="w-full bg-dark-700/50 border border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="matrix-green">Matrix Green</option>
                      <option value="cyber-blue">Cyber Blue</option>
                      <option value="neon-pink">Neon Pink</option>
                      <option value="amber">Amber</option>
                    </select>
                  </div>

                  {/* Animation Intensity */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Animation Intensity</label>
                    <select
                      value={uiPreferences.animationIntensity}
                      onChange={(e) => setUiPreferences({ ...uiPreferences, animationIntensity: e.target.value as any })}
                      className="w-full bg-dark-700/50 border border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="low">Low (Performance)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Beautiful)</option>
                    </select>
                  </div>

                  {/* Message Animation */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Message Animation</label>
                    <select
                      value={uiPreferences.messageEntranceAnimation}
                      onChange={(e) => setUiPreferences({ ...uiPreferences, messageEntranceAnimation: e.target.value as any })}
                      className="w-full bg-dark-700/50 border border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
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
                        setUiPreferences({ ...uiPreferences, [key]: !uiPreferences[key as keyof typeof uiPreferences] });
                        if (uiPreferences.enableHaptic) HapticFeedback.light();
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        uiPreferences[key as keyof typeof uiPreferences]
                          ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-dark-700/50 text-gray-400 border border-dark-600'
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
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
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
              className="flex items-center justify-center my-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <GlassCard
                variant={uiPreferences.glassEffect}
                intensity="subtle"
                glow={uiPreferences.enableGlow}
                className="px-4 py-2 rounded-full"
              >
                <span className="text-xs font-medium text-white tracking-wide">
                  {formatDateHeader(group.date)}
                </span>
              </GlassCard>
            </motion.div>

            {/* Messages */}
            <div className="space-y-1">
              {group.messages.map((message, msgIndex) => {
                // Extract sender ID with comprehensive fallback chain
                // Check both camelCase and snake_case, plus nested sender.id
                const rawSenderId = message.senderId 
                  || (message as any).sender_id 
                  || message.sender?.id 
                  || (message.sender as any)?.user_id 
                  || '';
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
                    isEqual: messageSenderId === currentUserId
                  });
                }
                
                // Message is own if both IDs exist and match exactly
                const isOwn = messageSenderId.length > 0 
                  && currentUserId.length > 0 
                  && messageSenderId === currentUserId;
                
                const prevMessage = group.messages[msgIndex - 1];
                const prevSenderId = prevMessage 
                  ? String(prevMessage.senderId || (prevMessage as any).sender_id || prevMessage.sender?.id || '').trim() 
                  : '';
                const showAvatar =
                  !isOwn &&
                  (msgIndex === 0 || prevSenderId !== messageSenderId);

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
              <div className="inline-block ml-4">
                <GlassCard
                  variant="crystal"
                  glow={uiPreferences.enableGlow}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl"
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
                <span className="text-sm font-medium bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
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
            className="px-4 py-2 z-10"
          >
            <GlassCard
              variant={uiPreferences.glassEffect}
              glow={uiPreferences.enableGlow}
              borderGradient
              className="flex items-center justify-between rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-1.5 h-10 bg-gradient-to-b from-primary-500 to-purple-500 rounded-full"
                  animate={uiPreferences.enableGlow ? {
                    boxShadow: [
                      '0 0 5px rgba(16, 185, 129, 0.3)',
                      '0 0 15px rgba(16, 185, 129, 0.6)',
                      '0 0 5px rgba(16, 185, 129, 0.3)',
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div>
                  <p className="text-xs font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                    Replying to {replyTo.sender.displayName || replyTo.sender.username}
                  </p>
                  <p className="text-sm text-gray-300 truncate max-w-md">{replyTo.content}</p>
                </div>
              </div>
              <motion.button
                onClick={() => {
                  setReplyTo(null);
                  if (uiPreferences.enableHaptic) HapticFeedback.light();
                }}
                className="p-2 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-colors group"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="h-4 w-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Input Area */}
      <div className="p-4 z-10">
        <GlassCard
          variant={uiPreferences.glassEffect}
          glow={uiPreferences.enableGlow}
          hover3D={false}
          borderGradient
          className="rounded-2xl p-2"
        >
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
                className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all group"
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
              >
                <PaperClipIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </motion.button>

              <div className="flex-1 bg-dark-900/50 rounded-xl border border-primary-500/20 focus-within:border-primary-500/50 transition-all">
                <textarea
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none max-h-32"
                  style={{ minHeight: '48px' }}
                />
              </div>

              <motion.button
                onClick={() => uiPreferences.enableHaptic && HapticFeedback.light()}
                className="p-2.5 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaceSmileIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </motion.button>

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
                    className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all relative overflow-hidden group"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {uiPreferences.enableGlow && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <PaperAirplaneIcon className="h-5 w-5 relative z-10" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="mic"
                    onClick={() => {
                      setIsVoiceMode(true);
                      if (uiPreferences.enableHaptic) HapticFeedback.medium();
                    }}
                    disabled={isSending}
                    className="p-3 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all group border border-red-500/20"
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
  );
}

// Message bubble component
function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  uiPreferences,
  onAvatarClick,
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
      className={`flex items-end gap-2 group animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <button
              onClick={() => message.sender?.id && onAvatarClick?.(message.sender.id)}
              className="h-8 w-8 rounded-full overflow-hidden bg-dark-600 cursor-pointer hover:ring-2 hover:ring-primary-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              title={`View ${message.sender?.displayName || message.sender?.username || 'user'}'s profile`}
            >
              {message.sender?.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender?.displayName || message.sender?.username || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-400">
                  {(message.sender?.displayName || message.sender?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg bg-dark-700/50 text-xs ${isOwn ? 'text-right' : ''}`}>
            <span className="text-primary-400">{message.replyTo.sender.username}</span>
            <p className="text-gray-400 truncate max-w-xs">{message.replyTo.content}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Actions (for own messages, show on left) */}
          {isOwn && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={onReply}
                className="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white"
                title="Reply"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button className="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white" title="More">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl transition-all duration-200 hover:shadow-lg ${
              isOwn
                ? 'bg-primary-600 text-white rounded-br-md hover:bg-primary-500'
                : 'bg-dark-700 text-white rounded-bl-md hover:bg-dark-600'
            }`}
          >
            {/* Image/Media messages */}
            {message.messageType === 'image' && message.metadata?.url && (
              <img
                src={message.metadata.url as string}
                alt="Shared image"
                className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.metadata.url as string, '_blank')}
              />
            )}
            {message.messageType === 'video' && message.metadata?.url && (
              <video
                src={message.metadata.url as string}
                controls
                className="max-w-xs rounded-lg mb-2"
              />
            )}
            {message.messageType === 'file' && message.metadata?.url && (
              <a
                href={message.metadata.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-dark-600/50 rounded-lg mb-2 hover:bg-dark-600 transition-colors"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm truncate">{(message.metadata.filename as string) || 'File'}</span>
              </a>
            )}
            {/* Voice/Audio messages with Advanced Visualizer */}
            {(message.messageType === 'voice' || message.messageType === 'audio') && message.metadata?.url && (
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
                  duration={message.metadata.duration as number || 0}
                  waveformData={message.metadata.waveform as number[] | undefined}
                  className={isOwn ? 'voice-player-own' : ''}
                />
              </div>
            )}
            {/* Text content - hide for voice messages */}
            {message.content && message.messageType !== 'voice' && message.messageType !== 'audio' && (
              <>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {/* Rich Media Embeds - automatically detect and render URLs */}
                <RichMediaEmbed content={message.content} isOwnMessage={isOwn} />
              </>
            )}
            <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}>
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && <span>(edited)</span>}
            </div>
          </div>

          {/* Actions (for other messages, show on right) */}
          {!isOwn && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={onReply}
                className="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white"
                title="Reply"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button className="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white" title="React">
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
            className="flex items-center gap-1 mt-1 px-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex -space-x-1">
              {(message.metadata.readBy as Array<{ id: string; avatarUrl?: string; username?: string }>)
                .slice(0, 3)
                .map((reader, idx) => (
                  <motion.div
                    key={reader.id}
                    className="h-4 w-4 rounded-full border border-dark-900 overflow-hidden bg-gradient-to-br from-primary-500 to-purple-600"
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
                      <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-white">
                        {(reader.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
            {(message.metadata.readBy as any[]).length > 3 && (
              <span className="text-[10px] text-gray-500 font-medium">
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

// Helper to aggregate reactions by emoji
function aggregateReactions(reactions: Array<{ emoji: string; userId: string; username?: string }>) {
  const aggregated: Record<string, { emoji: string; count: number; users: Array<{ id: string; username: string }>; hasReacted: boolean }> = {};
  const currentUserId = useAuthStore.getState().user?.id || '';

  reactions.forEach((reaction) => {
    if (!aggregated[reaction.emoji]) {
      aggregated[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        hasReacted: false,
      };
    }
    aggregated[reaction.emoji].count++;
    aggregated[reaction.emoji].users.push({
      id: reaction.userId,
      username: reaction.username || 'User',
    });
    if (reaction.userId === currentUserId) {
      aggregated[reaction.emoji].hasReacted = true;
    }
  });

  return Object.values(aggregated);
}

// Reaction handlers - integrated with API
function handleAddReaction(messageId: string, emoji: string) {
  const conversationId = new URLSearchParams(window.location.search).get('id');
  if (!conversationId) return;

  // Optimistic update via socket
  socketManager.sendReaction(conversationId, messageId, emoji, 'add');

  // API call to persist
  api.post(`/api/v1/messages/${messageId}/reactions`, { emoji }).catch((error) => {
    console.error('Failed to add reaction:', error);
    // Rollback on error - would need store integration for proper rollback
  });
}

function handleRemoveReaction(messageId: string, emoji: string) {
  const conversationId = new URLSearchParams(window.location.search).get('id');
  if (!conversationId) return;

  // Optimistic update via socket
  socketManager.sendReaction(conversationId, messageId, emoji, 'remove');

  // API call to persist
  api.delete(`/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`).catch((error) => {
    console.error('Failed to remove reaction:', error);
  });
}
