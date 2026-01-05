import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore, Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { api } from '@/lib/api';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
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
} from '@heroicons/react/24/outline';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!conversationId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchMessages(conversationId, true);
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
      const response = await api.post('/api/v1/voice-messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // The backend should return a message object
      const voiceMessage = response.data.data || response.data.message || response.data;
      
      // Refetch messages to show the new voice message
      // (alternatively, we could add the message directly to the store)
      await fetchMessages(conversationId, true);
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
    <div className="flex-1 flex flex-col bg-dark-900 h-full max-h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-dark-600">
              {otherParticipant?.user?.avatarUrl ? (
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
            {isOtherUserOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-800" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-white">{conversationName}</h2>
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-3 w-3 text-green-400" title="End-to-end encrypted" />
              <p className="text-xs text-gray-400">
                {typing.length > 0 ? (
                  <span className="text-primary-400">typing...</span>
                ) : isOtherUserOnline ? (
                  'Online'
                ) : (
                  formatLastSeen(otherParticipant?.user?.lastSeenAt)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* E2EE Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20" title="Messages are end-to-end encrypted">
            <LockClosedIcon className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">E2EE</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh messages"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
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
            {/* Date header */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-dark-700 rounded-full text-xs text-gray-400">
                {formatDateHeader(group.date)}
              </div>
            </div>

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
      <div className="p-4 border-t border-dark-700 bg-dark-800 flex-shrink-0">
        {isVoiceMode ? (
          /* Voice Recorder UI */
          <VoiceMessageRecorder
            onComplete={handleVoiceComplete}
            onCancel={() => setIsVoiceMode(false)}
            maxDuration={120}
            className="w-full"
          />
        ) : (
          /* Normal Input UI */
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

            {/* Toggle between mic and send based on input text */}
            {messageInput.trim() ? (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="p-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white transition-all duration-200"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsVoiceMode(true)}
                disabled={isSending}
                className="p-2.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-primary-400 transition-colors"
                title="Record voice message"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
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
            <div className="h-8 w-8 rounded-full overflow-hidden bg-dark-600">
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
            {/* Voice/Audio messages */}
            {(message.messageType === 'voice' || message.messageType === 'audio') && message.metadata?.url && (
              <div className="min-w-[200px]">
                <VoiceMessagePlayer
                  messageId={message.id}
                  audioUrl={message.metadata.url as string}
                  duration={message.metadata.duration as number || 0}
                  waveformData={message.metadata.waveform as number[] | undefined}
                  className={isOwn ? 'voice-player-own' : ''}
                />
              </div>
            )}
            {/* Text content */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
