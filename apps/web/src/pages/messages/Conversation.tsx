import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const typing = conversationId ? typingUsers[conversationId] || [] : [];

  // Get other participant for DM
  const otherParticipant = conversation?.participants.find((p) => p.userId !== user?.id);
  const conversationName =
    conversation?.name ||
    otherParticipant?.nickname ||
    otherParticipant?.user.displayName ||
    otherParticipant?.user.username ||
    'Unknown';

  // Join channel and fetch messages
  useEffect(() => {
    if (!conversationId) return;

    setActiveConversation(conversationId);
    socketManager.joinConversation(conversationId);
    fetchMessages(conversationId);
    markAsRead(conversationId);

    return () => {
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
    }, 3000);
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
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  let currentGroup: { date: Date; messages: Message[] } | null = null;

  conversationMessages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
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
    <div className="flex-1 flex flex-col bg-dark-900">
      {/* Header */}
      <header className="h-16 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-dark-600">
              {otherParticipant?.user.avatarUrl ? (
                <img
                  src={otherParticipant.user.avatarUrl}
                  alt={conversationName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-gray-400">
                  {conversationName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {otherParticipant?.user.status === 'online' && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-800" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-white">{conversationName}</h2>
            <p className="text-xs text-gray-400">
              {otherParticipant?.user.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <InformationCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
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
            {/* Date header */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-dark-700 rounded-full text-xs text-gray-400">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-1">
              {group.messages.map((message, msgIndex) => {
                const isOwn = message.senderId === user?.id;
                const showAvatar =
                  !isOwn &&
                  (msgIndex === 0 ||
                    group.messages[msgIndex - 1]?.senderId !== message.senderId);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onReply={() => setReplyTo(message)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing.length > 0 && (
          <div className="flex items-center gap-2 px-4">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-400">typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-dark-800 border-t border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-primary-500 rounded-full" />
            <div>
              <p className="text-xs text-primary-400">
                Replying to {replyTo.sender.displayName || replyTo.sender.username}
              </p>
              <p className="text-sm text-gray-400 truncate max-w-md">{replyTo.content}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-700 bg-dark-800">
        <div className="flex items-end gap-2">
          <button className="p-2.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <PaperClipIcon className="h-5 w-5" />
          </button>

          <div className="flex-1 bg-dark-700 rounded-xl">
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
              style={{ minHeight: '44px' }}
            />
          </div>

          <button className="p-2.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <FaceSmileIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
            className="p-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <div className="h-8 w-8 rounded-full overflow-hidden bg-dark-600">
              {message.sender.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-400">
                  {message.sender.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
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
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-dark-700 text-white rounded-bl-md'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}>
              <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
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

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                className="px-2 py-0.5 rounded-full bg-dark-700 text-xs hover:bg-dark-600 transition-colors"
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
