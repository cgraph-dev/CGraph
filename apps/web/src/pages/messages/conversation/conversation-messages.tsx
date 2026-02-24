/** Conversation message list with virtualized rendering, date headers, and typing indicator. */

import { type RefObject, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Message } from '@/modules/chat/store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateHeader } from '@/lib/chat/messageUtils';
import type { MessageGroup } from '@/lib/chat/messageUtils';
import { TypingIndicator } from '@/modules/chat/components';
import { GlassCard } from '@/shared/components/ui';
import { ScrollToBottomButton } from '@/modules/chat/components/scroll-to-bottom-button';
import { MessageListSkeleton } from '@/components/ui/skeletons';
import { MessageRow } from './message-row';
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

export interface ConversationMessagesProps {
  groupedMessages: MessageGroup[];
  hasMore: boolean;
  isLoading: boolean;
  typing: string[];
  user: { id: string } | null;
  uiPreferences: UIPreferences;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  activeMessageMenu: string | null;
  editingMessageId: string | null;
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
  // Track message IDs we've already rendered so we can detect truly new ones
  const seenIdsRef = useRef<Set<string>>(new Set());
  const allCurrentIds = new Set(groupedMessages.flatMap((g) => g.messages.map((m) => m.id)));
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
      {isLoading && groupedMessages.length === 0 && <MessageListSkeleton count={8} />}

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
                  transition={springs.gentle}
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
              <MessageRow
                message={message}
                groupMessages={groupMessages}
                msgIndex={msgIndex}
                user={user}
                uiPreferences={uiPreferences}
                isNew={newIds.has(message.id)}
                activeMessageMenu={activeMessageMenu}
                editingMessageId={editingMessageId}
                editContent={editContent}
                onReply={onReply}
                onStartEdit={onStartEdit}
                onDeleteMessage={onDeleteMessage}
                onPinMessage={onPinMessage}
                onOpenForward={onOpenForward}
                onToggleMessageMenu={onToggleMessageMenu}
                onEditContentChange={onEditContentChange}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
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

      <ScrollToBottomButton visible={isScrolledUp} onClick={scrollToBottom} />
    </div>
  );
}
