import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/modules/chat/store';
import { createLogger } from '@/lib/logger';
import { getMessageSenderId } from '@/lib/apiUtils';
import { formatDateHeader, groupMessagesByDate } from '@/lib/chat/messageUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';
import { GlassCard } from '@/shared/components/ui';
import { AnimatedMessageWrapper } from './AnimatedMessageWrapper';
import { AnimatedReactionBubble } from './AnimatedReactionBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageBubble, type UIPreferences } from './MessageBubble';

const logger = createLogger('MessageList');

// ============================================================================
// Types
// ============================================================================

interface MessageGroup {
  date: Date;
  messages: Message[];
}

interface MessageListProps {
  messages: Message[];
  userId: string | undefined;
  uiPreferences: UIPreferences;
  typing: string[];
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onForward: (message: Message) => void;
  activeMessageMenu: string | null;
  onToggleMenu: (messageId: string) => void;
  editingMessageId: string | null;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// ============================================================================
// MessageList Component
// ============================================================================

export function MessageList({
  messages,
  userId,
  uiPreferences,
  typing,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
  activeMessageMenu,
  onToggleMenu,
  editingMessageId,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  messagesEndRef,
}: MessageListProps) {
  const navigate = useNavigate();

  // Group messages by date
  const groupedMessages = useMemo<MessageGroup[]>(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  return (
    <>
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
              const currentUserId = userId || '';

              // Debug logging for alignment issues
              if (import.meta.env.DEV && msgIndex === 0) {
                logger.debug('[Web] First message debug:', {
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
                  onSwipeReply={() => onReply(message)}
                  enableGestures={true}
                >
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onReply={() => onReply(message)}
                    uiPreferences={uiPreferences}
                    onAvatarClick={(avatarUserId) => navigate(`/user/${avatarUserId}`)}
                    onEdit={() => onEdit(message)}
                    onDelete={() => onDelete(message.id)}
                    onPin={() => onPin(message.id)}
                    onForward={() => onForward(message)}
                    isMenuOpen={activeMessageMenu === message.id}
                    onToggleMenu={() => onToggleMenu(message.id)}
                    isEditing={editingMessageId === message.id}
                    editContent={editContent}
                    onEditContentChange={onEditContentChange}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
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
                          if (userId && r.userId === userId) entry.hasReacted = true;
                          return acc;
                        }, {})
                      ).map(([emoji, { count, hasReacted }]) => (
                        <AnimatedReactionBubble
                          key={emoji}
                          reaction={{ emoji, count, hasReacted }}
                          isOwnMessage={isOwn}
                          onPress={() => handleAddReaction(message.id, emoji)}
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
    </>
  );
}
