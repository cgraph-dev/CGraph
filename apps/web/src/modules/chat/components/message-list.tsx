/**
 * Converstion message list with virtualization.
 * @module
 */
import { useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/modules/chat/store';
import { createLogger } from '@/lib/logger';
import { getMessageSenderId } from '@/lib/apiUtils';
import { formatDateHeader, groupMessagesByDate } from '@/lib/chat/messageUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';
import { GlassCard } from '@/shared/components/ui';
import { AnimatedMessageWrapper } from './animated-message-wrapper';
import { AnimatedReactionBubble } from './animated-reaction-bubble';
import { TypingIndicator } from './typing-indicator';
import { MessageBubble, type UIPreferences } from './message-bubble';

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
  /** Scroll container ref for virtualizer. If omitted, a wrapper div is created. */
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

// Flat row type for virtualizer
type VirtualRow =
  | { type: 'date-header'; date: Date; key: string }
  | { type: 'message'; message: Message; groupMessages: Message[]; msgIndex: number; key: string };

// ============================================================================
// MessageList Component
// ============================================================================

/**
 *
 */
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
  scrollContainerRef,
}: MessageListProps) {
  const navigate = useNavigate();
  const fallbackRef = useRef<HTMLDivElement>(null);
  const containerRef = scrollContainerRef ?? fallbackRef;

  // Group messages by date
  const groupedMessages = useMemo<MessageGroup[]>(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Flatten groups into virtualizable rows
  const flatRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];
    for (const group of groupedMessages) {
      rows.push({ type: 'date-header', date: group.date, key: `dh-${group.date.toISOString()}` });
      group.messages.forEach((message, msgIndex) => {
        rows.push({
          type: 'message',
          message,
          groupMessages: group.messages,
          msgIndex,
          key: `msg-${message.id}`,
        });
      });
    }
    return rows;
  }, [groupedMessages]);

  // Virtualizer — only renders visible rows + overscan buffer
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (flatRows[index]?.type === 'date-header' ? 56 : 80),
    overscan: 10,
    getItemKey: (index) => flatRows[index]?.key ?? String(index),
  });

  const renderRow = useCallback(
    (row: VirtualRow) => {
      if (row.type === 'date-header') {
        return (
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
                {formatDateHeader(row.date)}
              </span>
            </GlassCard>
          </motion.div>
        );
      }

      const { message, groupMessages, msgIndex } = row;
      const messageSenderId =
        getMessageSenderId(message as unknown as Record<string, unknown>) || ''; // type assertion: narrowing for helper function
      const currentUserId = userId || '';

      if (import.meta.env.DEV && msgIndex === 0) {
        logger.debug('[Web] First message debug:', {
          messageId: message.id,
          messageSenderId,
          currentUserId,
          isEqual: messageSenderId === currentUserId,
        });
      }

      const isOwn =
        messageSenderId.length > 0 && currentUserId.length > 0 && messageSenderId === currentUserId;

      const prevMessage = groupMessages[msgIndex - 1];
      const prevSenderId = prevMessage
        ? getMessageSenderId(prevMessage as unknown as Record<string, unknown>) || '' // type assertion: narrowing for helper function
        : '';
      const showAvatar = !isOwn && (msgIndex === 0 || prevSenderId !== messageSenderId);

      return (
        <AnimatedMessageWrapper
          isOwnMessage={isOwn}
          index={msgIndex}
          messageId={message.id}
          isEditing={editingMessageId === message.id}
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
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(
                message.reactions.reduce<Record<string, { count: number; hasReacted: boolean }>>(
                  (acc, r) => {
                    const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
                    entry.count++;
                    if (userId && r.userId === userId) entry.hasReacted = true;
                    return acc;
                  },
                  {}
                )
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
    },
    [
      userId,
      uiPreferences,
      activeMessageMenu,
      editingMessageId,
      editContent,
      onReply,
      onEdit,
      onDelete,
      onPin,
      onForward,
      onToggleMenu,
      onEditContentChange,
      onSaveEdit,
      onCancelEdit,
      navigate,
    ]
  );

  return (
    <>
      {/* Virtualized message rows */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = flatRows[virtualRow.index];
          if (!row) return null;

          return (
            <div
              key={row.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderRow(row)}
            </div>
          );
        })}
      </div>

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
