/**
 * EnhancedMessageBubble - individual message display with reactions
 */

import { useState, useRef, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useChatStore } from '@/modules/chat/store';
import type { Reaction } from '@/modules/chat/store/chatStore.types';
import { useAuthStore } from '@/modules/auth/store';
import { AnimatedMessageWrapper } from '@/modules/chat/components/animated-message-wrapper';
import { springs } from '@/lib/animation-presets';
import {
  AnimatedReactionBubble,
  ReactionPicker,
} from '@/modules/chat/components/animated-reaction-bubble';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/advanced-voice-visualizer';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { InlineTitle } from '@/modules/gamification/components/title-badge';
import type { EnhancedMessageBubbleProps } from './types';

const logger = createLogger('EnhancedMessageBubble');

/**
 * unknown for the messages module.
 */
/**
 * Enhanced Message Bubble component.
 */
export function EnhancedMessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  index,
  onAvatarClick,
}: EnhancedMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const { addReaction } = useChatStore();
  const { user } = useAuthStore();
  const [isReacting, setIsReacting] = useState(false);

  // React 19 useOptimistic: show new reactions immediately before the API responds.
  // When the parent re-renders with updated message.reactions from the store,
  // the optimistic overlay is automatically discarded.
  const [optimisticReactions, addOptimisticReaction] = useOptimistic(
    message.reactions,
    (state: Reaction[], newReaction: { emoji: string; userId: string; username: string }) => [
      ...state,
      {
        id: `optimistic-${Date.now()}`,
        emoji: newReaction.emoji,
        userId: newReaction.userId,
        user: { id: newReaction.userId, username: newReaction.username },
      },
    ]
  );

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

  const handleAddReaction = async (emoji: string) => {
    if (isReacting) return;
    setIsReacting(true);
    HapticFeedback.medium();
    // Optimistic: show the reaction immediately
    addOptimisticReaction({ emoji, userId: user?.id ?? '', username: user?.username ?? '' });
    try {
      await addReaction(message.id, emoji);
      setShowReactionPicker(false);
    } catch (err) {
      logger.error('Failed to add reaction:', err);
      HapticFeedback.error();
    } finally {
      setIsReacting(false);
    }
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
        className={`group flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
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
                className="h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-dark-600 ring-2 ring-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={springs.snappy}
                title={`View ${message.sender?.displayName || message.sender?.username || 'user'}'s profile`}
              >
                {message.sender?.avatarUrl ? (
                  <ThemedAvatar
                    src={message.sender.avatarUrl}
                    alt={message.sender?.displayName || 'User'}
                    size="small"
                    className="h-8 w-8"
                    avatarBorderId={getAvatarBorderId(message.sender)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary-400">
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
                  transition={springs.snappy}
                >
                  <motion.button
                    onClick={onReply}
                    className="rounded-full border border-white/10 bg-dark-700/80 p-2 text-gray-400 backdrop-blur-sm hover:text-white"
                    whileHover={{ scale: 1.1, rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
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
                  </motion.button>

                  <motion.button
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className="rounded-full border border-white/10 bg-dark-700/80 p-2 text-gray-400 backdrop-blur-sm hover:text-primary-400"
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
              {/* Sender name + equipped title (for received messages) */}
              {!isOwn && showAvatar && message.sender && (
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary-300">
                    {message.sender.displayName || message.sender.username}
                  </span>
                  {(message.sender as Record<string, unknown>).equippedTitleId && (
                    <InlineTitle
                      title={(message.sender as Record<string, unknown>).equippedTitleId as string}
                      size="xs"
                    />
                  )}
                </div>
              )}
              {/* Text content */}
              {message.content &&
                message.messageType !== 'voice' &&
                message.messageType !== 'audio' && (
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
              {(message.messageType === 'voice' || message.messageType === 'audio') &&
                message.metadata?.url && (
                  <AdvancedVoiceVisualizer
                    // type assertion: message metadata URL field is string for voice/media messages
                     
                    audioUrl={message.metadata.url as string}
                    variant="spectrum"
                    theme="matrix-green"
                    height={80}
                    width={250}
                    className="my-2"
                  />
                )}

              {/* Timestamp and status */}
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}
              >
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
            {optimisticReactions.length > 0 && (
              <motion.div
                className="mt-2 flex flex-wrap gap-1.5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                {Object.entries(
                  optimisticReactions.reduce<Record<string, { count: number; hasReacted: boolean }>>(
                    (acc, r) => {
                      const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                      entry.count++;
                      if (user && r.userId === user.id) entry.hasReacted = true;
                      return acc;
                    },
                    {}
                  )
                ).map(([emoji, { count, hasReacted }]) => (
                  <AnimatedReactionBubble
                    key={emoji}
                    reaction={{
                      emoji,
                      count,
                      hasReacted,
                    }}
                    isOwnMessage={isOwn}
                    onPress={() => handleAddReaction(emoji)}
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
