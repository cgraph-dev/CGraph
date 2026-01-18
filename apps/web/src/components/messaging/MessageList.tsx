import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowPathIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { ThemedChatBubble } from '@/components/theme/ThemedChatBubble';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import MessageReactions from '@/components/chat/MessageReactions';
import RichMediaEmbed from '@/components/chat/RichMediaEmbed';
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
import GlassCard from '@/components/ui/GlassCard';

/**
 * MessageList Component
 * 
 * Virtualized message list with rich features.
 * Features:
 * - Virtual scrolling for performance
 * - Date separators
 * - Message grouping by author
 * - Read receipts
 * - Reactions
 * - Reply threads
 * - Rich media embeds
 * - Typing indicators
 * - Unread message marker
 * - Scroll to bottom button
 * - Load more on scroll up
 */

interface Message {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'voice' | 'sticker' | 'gif' | 'system';
  metadata?: Record<string, unknown>;
  replyTo?: Message | null;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{ id: string; username: string }>;
  }>;
  isPinned?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  typingUsers?: string[];
  unreadFromId?: string;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReact,
  onReply,
  onEdit,
  onDelete,
  typingUsers = [],
  unreadFromId,
  className = '',
}: MessageListProps) {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  const parentRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Process messages with date separators
  const processedItems = useMemo(() => {
    const items: Array<
      | { type: 'date'; date: Date; id: string }
      | { type: 'message'; message: Message; isGrouped: boolean }
      | { type: 'unread'; id: string }
    > = [];

    let lastDate: Date | null = null;
    let lastAuthorId: string | null = null;
    let hasAddedUnreadMarker = false;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);

      // Add unread marker
      if (!hasAddedUnreadMarker && unreadFromId && message.id === unreadFromId) {
        items.push({ type: 'unread', id: 'unread-marker' });
        hasAddedUnreadMarker = true;
      }

      // Add date separator
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        items.push({
          type: 'date',
          date: messageDate,
          id: `date-${messageDate.toISOString()}`,
        });
        lastAuthorId = null; // Reset grouping on new day
      }

      // Check if message should be grouped with previous
      const isGrouped =
        lastAuthorId === message.authorId &&
        lastDate &&
        messageDate.getTime() - lastDate.getTime() < 5 * 60 * 1000; // 5 minutes

      items.push({ type: 'message', message, isGrouped });

      lastDate = messageDate;
      lastAuthorId = message.authorId;
    });

    return items;
  }, [messages, unreadFromId]);

  // Virtual list configuration
  const rowVirtualizer = useVirtualizer({
    count: processedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = processedItems[index];
      if (item.type === 'date') return 40;
      if (item.type === 'unread') return 32;
      return item.isGrouped ? 48 : 72;
    },
    overscan: 10,
  });

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setIsNearBottom(distanceFromBottom < 100);
    setShowScrollButton(distanceFromBottom > 300);

    // Load more when near top
    if (scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Format date for separator
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <ArrowPathIcon className="h-6 w-6 text-primary-400" />
          </motion.div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = processedItems[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.type === 'date' && (
                  <DateSeparator date={item.date} formatDate={formatDateSeparator} />
                )}
                {item.type === 'unread' && <UnreadMarker />}
                {item.type === 'message' && (
                  <MessageItem
                    message={item.message}
                    isGrouped={item.isGrouped}
                    isOwn={item.message.authorId === user?.id}
                    onReact={onReact}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2"
          >
            <TypingIndicator users={typingUsers} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 p-3 rounded-full bg-primary-600 text-white shadow-lg"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChatBubbleLeftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">No messages yet</h3>
            <p className="text-gray-500">Start the conversation!</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Date Separator Component
function DateSeparator({
  date,
  formatDate,
}: {
  date: Date;
  formatDate: (date: Date) => string;
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-gray-700/50" />
      <span className="text-xs font-medium text-gray-500">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-gray-700/50" />
    </div>
  );
}

// Unread Marker Component
function UnreadMarker() {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-red-500/50" />
      <span className="text-xs font-medium text-red-400">New Messages</span>
      <div className="flex-1 h-px bg-red-500/50" />
    </div>
  );
}

// Message Item Component
function MessageItem({
  message,
  isGrouped,
  isOwn,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: {
  message: Message;
  isGrouped: boolean;
  isOwn: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const displayName = message.author.displayName || message.author.username;
  const timestamp = format(new Date(message.createdAt), 'h:mm a');

  // Handle system messages
  if (message.messageType === 'system') {
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-xs text-gray-500 italic">{message.content}</span>
      </div>
    );
  }

  return (
    <AnimatedMessageWrapper delay={0}>
      <div
        className={`group relative flex gap-3 py-1 ${isGrouped ? 'pl-14' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar */}
        {!isGrouped && (
          <div className="flex-shrink-0 w-10">
            <ThemedAvatar
              src={message.author.avatarUrl}
              alt={displayName}
              size="medium"
            />
          </div>
        )}

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{displayName}</span>
              <span className="text-xs text-gray-500">{timestamp}</span>
              {message.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
          )}

          {/* Reply Preview */}
          {message.replyTo && (
            <div className="flex items-center gap-2 mb-1 pl-2 border-l-2 border-gray-600 text-sm text-gray-400">
              <span className="font-medium">
                {message.replyTo.author.displayName || message.replyTo.author.username}
              </span>
              <span className="truncate">{message.replyTo.content}</span>
            </div>
          )}

          {/* Message Bubble */}
          {message.messageType === 'text' && (
            <ThemedChatBubble
              message={message.content}
              timestamp={isGrouped ? timestamp : undefined}
              isOwn={isOwn}
              showAvatar={false}
              showTimestamp={isGrouped}
            />
          )}

          {/* Rich Media */}
          {message.metadata?.url && (
            <RichMediaEmbed url={message.metadata.url as string} />
          )}

          {/* Sticker */}
          {message.messageType === 'sticker' && message.metadata?.sticker && (
            <img
              src={(message.metadata.sticker as { url: string }).url}
              alt="Sticker"
              className="w-32 h-32 object-contain"
            />
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-1">
              <MessageReactions
                reactions={message.reactions}
                onReact={(emoji) => onReact?.(message.id, emoji)}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-0 flex gap-1 bg-dark-800 rounded-lg border border-gray-700 p-1"
            >
              <ActionButton
                emoji="😀"
                label="React"
                onClick={() => onReact?.(message.id, '👍')}
              />
              <ActionButton
                emoji="↩️"
                label="Reply"
                onClick={() => onReply?.(message)}
              />
              {isOwn && (
                <>
                  <ActionButton
                    emoji="✏️"
                    label="Edit"
                    onClick={() => onEdit?.(message.id, message.content)}
                  />
                  <ActionButton
                    emoji="🗑️"
                    label="Delete"
                    onClick={() => onDelete?.(message.id)}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedMessageWrapper>
  );
}

// Action Button Component
function ActionButton({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-dark-700 text-gray-400"
      title={label}
    >
      <span className="text-sm">{emoji}</span>
    </motion.button>
  );
}

// Typing Indicator Component
function TypingIndicator({ users }: { users: string[] }) {
  const text =
    users.length === 1
      ? `${users[0]} is typing...`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing...`
      : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gray-400"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span>{text}</span>
    </div>
  );
}

export default MessageList;
