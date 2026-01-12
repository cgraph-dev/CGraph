/**
 * Enhanced Conversation Component
 *
 * Next-generation messaging UI with advanced animations, 3D effects,
 * AI-powered themes, and mobile-inspired interactions.
 *
 * Features:
 * - Glassmorphic UI with particle effects
 * - Mobile-style message animations
 * - Advanced reaction system
 * - Voice visualization
 * - WebGL shader backgrounds
 * - Gesture-based interactions
 * - AI-adaptive theming
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { format } from 'date-fns';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MicrophoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Import our new components
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
import { AnimatedReactionBubble, ReactionPicker } from '@/components/conversation/AnimatedReactionBubble';
import GlassCard, { GlassCardNeon } from '@/components/ui/GlassCard';
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';
import ShaderBackground from '@/components/shaders/ShaderBackground';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { themeEngine } from '@/lib/ai/ThemeEngine';

// Sticker system integration
import { StickerPicker, StickerButton } from '@/components/chat/StickerPicker';
import type { Sticker } from '@/data/stickers';

// =============================================================================
// ENHANCED MESSAGE BUBBLE
// =============================================================================

function EnhancedMessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  index,
  onAvatarClick,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  index: number;
  onAvatarClick?: (userId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

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

  // Handle reaction add
  const handleAddReaction = (emoji: string) => {
    HapticFeedback.medium();
    // TODO: Implement API call to add reaction
    console.log('Add reaction:', emoji, 'to message:', message.id);
  };

  return (
    <AnimatedMessageWrapper
      isOwnMessage={isOwn}
      index={index}
      isNew={false}
      messageId={message.id}
      onSwipeReply={onReply}
      onLongPress={() => setShowReactionPicker(true)}
      enableGestures
    >
      <motion.div
        ref={bubbleRef}
        className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        layout
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 flex-shrink-0">
            {showAvatar && (
              <motion.button
                onClick={() => message.sender?.id && onAvatarClick?.(message.sender.id)}
                className="h-8 w-8 rounded-full overflow-hidden bg-dark-600 ring-2 ring-primary-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                title={`View ${message.sender?.displayName || message.sender?.username || 'user'}'s profile`}
              >
                {message.sender?.avatarUrl ? (
                  <img
                    src={message.sender.avatarUrl}
                    alt={message.sender?.displayName || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-bold text-primary-400">
                    {(message.sender?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.button>
            )}
          </div>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
          {/* Message bubble with glassmorphism */}
          <div className="relative">
            {/* Actions (floating on hover) */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1`}
                  initial={{ opacity: 0, scale: 0.8, x: isOwn ? 10 : -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <motion.button
                    onClick={onReply}
                    className="p-2 rounded-full bg-dark-700/80 backdrop-blur-sm text-gray-400 hover:text-white border border-white/10"
                    whileHover={{ scale: 1.1, rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Reply"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className="p-2 rounded-full bg-dark-700/80 backdrop-blur-sm text-gray-400 hover:text-primary-400 border border-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="React"
                  >
                    <FaceSmileIcon className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glassmorphic bubble */}
            <GlassCard
              variant={isOwn ? 'neon' : 'frosted'}
              intensity="medium"
              glow={isOwn}
              glowColor={isOwn ? 'rgba(16, 185, 129, 0.4)' : undefined}
              hover3D
              className={`px-4 py-3 ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            >
              {/* Text content */}
              {message.content && message.messageType !== 'voice' && message.messageType !== 'audio' && (
                <motion.p
                  className="whitespace-pre-wrap break-words text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {message.content}
                </motion.p>
              )}

              {/* Voice message visualization */}
              {(message.messageType === 'voice' || message.messageType === 'audio') && message.metadata?.url && (
                <AdvancedVoiceVisualizer
                  audioUrl={message.metadata.url as string}
                  variant="spectrum"
                  theme="matrix-green"
                  height={80}
                  width={250}
                  className="my-2"
                />
              )}

              {/* Timestamp and status */}
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {formatMessageTime(message.createdAt)}
                </motion.span>
                {message.isEdited && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    (edited)
                  </motion.span>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Reactions */}
          <AnimatePresence>
            {message.reactions.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-1.5 mt-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                {message.reactions.map((reaction, i) => (
                  <AnimatedReactionBubble
                    key={i}
                    reaction={{
                      emoji: reaction.emoji,
                      count: 1, // TODO: Aggregate count from backend
                      hasReacted: false, // TODO: Check if current user reacted
                    }}
                    isOwnMessage={isOwn}
                    onPress={() => handleAddReaction(reaction.emoji)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div className="mt-2">
                <ReactionPicker
                  onSelect={handleAddReaction}
                  onClose={() => setShowReactionPicker(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatedMessageWrapper>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EnhancedConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    typingUsers,
    sendMessage,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId
    ? (typingUsers[conversationId] || []).filter((userId) => userId !== user?.id)
    : [];

  // Apply AI theme on mount
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length]);

  // Handle send message
  const handleSend = async () => {
    if (!conversationId || !messageInput.trim() || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);

    try {
      await sendMessage(conversationId, messageInput.trim(), replyTo?.id);
      setMessageInput('');
      setReplyTo(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      console.error('Failed to send message:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  // Handle sticker selection - sends sticker as a special message format
  const handleStickerSelect = async (sticker: Sticker) => {
    if (!conversationId || isSending) return;

    HapticFeedback.medium();
    setIsSending(true);
    setShowStickerPicker(false);

    try {
      // Send sticker as a special formatted message: [sticker:id:emoji:name]
      const stickerMessage = `[sticker:${sticker.id}:${sticker.emoji}:${sticker.name}]`;
      await sendMessage(conversationId, stickerMessage, replyTo?.id);
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send sticker:', error);
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <motion.div
          className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <>
      {/* WebGL Shader Background */}
      <ShaderBackground
        variant="fluid"
        color1="#00ff41"
        color2="#003b00"
        color3="#39ff14"
        speed={0.4}
        intensity={0.8}
        interactive
      />

      {/* Main Container */}
      <motion.div
        className="flex-1 flex flex-col h-full max-h-screen overflow-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with glassmorphism */}
        <GlassCardNeon className="h-16 px-4 flex items-center justify-between flex-shrink-0 rounded-none border-b border-primary-500/20">
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <motion.div
                className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 ring-2 ring-primary-500/50"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {/* Avatar content */}
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-white">
                  {(conversation.name || 'U').charAt(0).toUpperCase()}
                </div>
              </motion.div>
              <motion.div
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-900"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">{conversation.name || 'Conversation'}</h2>
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3 w-3 text-green-400" />
                <p className="text-xs text-gray-400">
                  {typing.length > 0 ? (
                    <motion.span
                      className="text-primary-400"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      typing...
                    </motion.span>
                  ) : (
                    'Online'
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* AI Theme Button */}
            <motion.button
              onClick={() => {
                const theme = themeEngine.generateTheme();
                themeEngine.applyTheme(theme);
                HapticFeedback.light();
              }}
              className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-colors"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              title="Generate AI Theme"
            >
              <SparklesIcon className="h-5 w-5" />
            </motion.button>

            <motion.button
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <PhoneIcon className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </GlassCardNeon>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {conversationMessages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const prevMessage = conversationMessages[index - 1];
            const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onReply={() => setReplyTo(message)}
                index={index}
                onAvatarClick={(userId) => navigate(`/user/${userId}`)}
              />
            );
          })}

          {/* Typing indicator */}
          {typing.length > 0 && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 bg-primary-400 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <GlassCard
          variant="frosted"
          intensity="strong"
          className="p-4 flex-shrink-0 rounded-none border-t border-white/10"
        >
          {/* Sticker Picker - positioned above input */}
          <div className="relative" ref={inputContainerRef}>
            <StickerPicker
              isOpen={showStickerPicker}
              onClose={() => setShowStickerPicker(false)}
              onSelect={handleStickerSelect}
            />
          </div>

          <div className="flex items-end gap-2">
            <motion.button
              className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <PaperClipIcon className="h-5 w-5" />
            </motion.button>

            {/* Sticker Button */}
            <StickerButton
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              isActive={showStickerPicker}
            />

            <div className="flex-1 bg-dark-700/50 backdrop-blur-sm rounded-xl border border-white/10">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
              />
            </div>

            {messageInput.trim() ? (
              <motion.button
                onClick={handleSend}
                disabled={isSending}
                className="p-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isSending ? { rotate: 360 } : {}}
                transition={{ duration: 0.5 }}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-primary-400 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MicrophoneIcon className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
}
