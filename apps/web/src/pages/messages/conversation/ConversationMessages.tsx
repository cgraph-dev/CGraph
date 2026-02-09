/**
 * Conversation Message List
 *
 * Renders grouped messages by date with animated message wrappers,
 * reaction bubbles, typing indicator, and load-more functionality.
 *
 * @module pages/messages/conversation/ConversationMessages
 */

import { type RefObject, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Message } from '@/modules/chat/store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateHeader } from '@/lib/chat/messageUtils';
import type { MessageGroup } from '@/lib/chat/messageUtils';
import { getMessageSenderId } from '@/lib/apiUtils';
import { handleAddReaction } from '@/lib/chat/reactionUtils';
import { createLogger } from '@/lib/logger';
import {
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  TypingIndicator,
} from '@/modules/chat/components';
import { GlassCard } from '@/shared/components/ui';
import { MessageBubble } from '@/modules/chat/components';
import { ScrollToBottomButton } from '@/modules/chat/components/ScrollToBottomButton';
import { MessageListSkeleton } from '@/components/ui/skeletons';
import type { UIPreferences } from './types';

// ---------------------------------------------------------------------------
// Virtualizer row types
// ---------------------------------------------------------------------------

type VirtualRow =
  | { type: 'date-header'; date: Date; key: string }
  | {
      type: 'message';
      message: Message;
      groupMessages: Message[];
      msgIndex: number;
      key: string;
    };

const logger = createLogger('ConversationMessages');

/** Props for the ConversationMessages component */
export interface ConversationMessagesProps {
  /** Messages grouped by date */
  groupedMessages: MessageGroup[];
  /** Whether more messages can be loaded */
  hasMore: boolean;
  /** Whether messages are currently loading */
  isLoading: boolean;
  /** Users currently typing */
  typing: string[];
  /** Current user for ownership detection */
  user: { id: string } | null;
  /** UI display preferences */
  uiPreferences: UIPreferences;
  /** Ref to the bottom of messages for auto-scroll */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** Ref to the messages scroll container */
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  /** Active message context menu ID */
  activeMessageMenu: string | null;
  /** Message currently being edited */
  editingMessageId: string | null;
  /** Current edit text content */
  editContent: string;
  /** Callbacks */
  onLoadMore: () => void;
  onReply: (message: Message) => void;
  onStartEdit: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onOpenForward: (message: Message) => void;
  onToggleMessageMenu: (messageId: string) => void;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

/**
 * Message list with date-group headers, animated wrappers,
 * reaction bubbles, and typing indicator.
 */
export function ConversationMessages({
  groupedMessages,
  hasMore,
  isLoading,
  typing,
  user,
  uiPreferences,
  messagesEndRef,
  messagesContainerRef,
  activeMessageMenu,
  editingMessageId,
  editContent,
  onLoadMore,
  onReply,
  onStartEdit,
  onDeleteMessage,
  onPinMessage,
  onOpenForward,
  onToggleMessageMenu,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}: ConversationMessagesProps) {
  const navigate = useNavigate();

  // Track message IDs we've already rendered so we can detect truly new ones
  const seenIdsRef = useRef<Set<string>>(new Set());
  const allCurrentIds = new Set(
    groupedMessages.flatMap((g) => g.messages.map((m) => m.id)),
  );
  // A message is "new" if we haven't seen it before in this component's lifetime
  const newIds = new Set<string>();
  allCurrentIds.forEach((id) => {
    if (!seenIdsRef.current.has(id)) newIds.add(id);
  });
  // Update the seen set (runs synchronously before render output)
  seenIdsRef.current = allCurrentIds;

  // Track whether user has scrolled up from bottom
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(distanceFromBottom > 150);
  }, [messagesContainerRef]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [messagesContainerRef, handleScroll]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesEndRef]);

  // ── Flatten groups into a single virtualizable list ─────────────────
  const flatRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];
    for (const group of groupedMessages) {
      rows.push({
        type: 'date-header',
        date: group.date,
        key: `dh-${group.date.toISOString()}`,
      });
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

  // ── Virtualizer ─────────────────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: (index) => {
      const row = flatRows[index];
      // Date headers are smaller; messages are taller on average
      return row?.type === 'date-header' ? 56 : 80;
    },
    overscan: 10,
    getItemKey: (index) => flatRows[index]?.key ?? String(index),
  });

  // Auto-scroll to bottom when new messages arrive (unless user scrolled up)
  const prevCountRef = useRef(flatRows.length);
  useEffect(() => {
    if (flatRows.length > prevCountRef.current && !isScrolledUp) {
      virtualizer.scrollToIndex(flatRows.length - 1, { align: 'end' });
    }
    prevCountRef.current = flatRows.length;
  }, [flatRows.length, isScrolledUp, virtualizer]);

  return (
    <div
      ref={messagesContainerRef}
      className="min-h-0 flex-1 overflow-y-auto p-4"
      style={{ scrollBehavior: 'smooth' }}
    >
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more messages'}
          </button>
        </div>
      )}

      {/* Skeleton loading state when no messages yet */}
      {isLoading && groupedMessages.length === 0 && (
        <MessageListSkeleton count={8} />
      )}

      {/* Virtualized message list */}
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

          if (row.type === 'date-header') {
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
              </div>
            );
          }

          // ── Message row ──────────────────────────────────────────
          const { message, groupMessages, msgIndex } = row;
          const messageSenderId =
            getMessageSenderId(message as unknown as Record<string, unknown>) || '';
          const currentUserId = user?.id || '';

          if (import.meta.env.DEV && msgIndex === 0) {
            logger.debug('Web] First message debug:', {
              messageId: message.id,
              messageSenderId,
              currentUserId,
              isEqual: messageSenderId === currentUserId,
            });
          }

          const isOwn =
            messageSenderId.length > 0 &&
            currentUserId.length > 0 &&
            messageSenderId === currentUserId;

          const prevMessage = groupMessages[msgIndex - 1];
          const prevSenderId = prevMessage
            ? getMessageSenderId(prevMessage as unknown as Record<string, unknown>) || ''
            : '';
          const showAvatar = !isOwn && (msgIndex === 0 || prevSenderId !== messageSenderId);

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
              <AnimatedMessageWrapper
                isOwnMessage={isOwn}
                index={msgIndex}
                isNew={newIds.has(message.id)}
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
                  onEdit={() => onStartEdit(message)}
                  onDelete={() => onDeleteMessage(message.id)}
                  onPin={() => onPinMessage(message.id)}
                  onForward={() => onOpenForward(message)}
                  isMenuOpen={activeMessageMenu === message.id}
                  onToggleMenu={() => onToggleMessageMenu(message.id)}
                  isEditing={editingMessageId === message.id}
                  editContent={editContent}
                  onEditContentChange={onEditContentChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
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
                        onPress={() => handleAddReaction(message.id, emoji)}
                      />
                    ))}
                  </div>
                )}
              </AnimatedMessageWrapper>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        <TypingIndicator
          typing={typing}
          enableGlow={uiPreferences.enableGlow}
          glassEffect="crystal"
        />
      </AnimatePresence>

      <div ref={messagesEndRef} />

      <ScrollToBottomButton
        visible={isScrolledUp}
        onClick={scrollToBottom}
      />
    </div>
  );
}
