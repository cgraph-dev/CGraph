import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupStore, ChannelMessage, Member } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { socketManager } from '@/lib/socket';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  HashtagIcon,
  BellIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

export default function GroupChannel() {
  const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
  const { user: _user } = useAuthStore();
  const {
    groups,
    channelMessages,
    members,
    isLoadingMessages,
    typingUsers,
    hasMoreMessages,
    fetchChannelMessages,
    fetchMembers,
    sendChannelMessage,
    setActiveChannel,
  } = useGroupStore();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChannelMessage | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const group = groups.find((g) => g.id === groupId);
  const channel = group?.channels?.find((c) => c.id === channelId);
  const messages = channelId ? channelMessages[channelId] || [] : [];
  const typing = channelId ? typingUsers[channelId] || [] : [];
  const groupMembers = groupId ? members[groupId] || [] : [];

  // Join channel and fetch data
  useEffect(() => {
    if (!channelId || !groupId) return;

    setActiveChannel(channelId);
    socketManager.joinGroupChannel(channelId);
    fetchChannelMessages(channelId);
    fetchMembers(groupId);

    return () => {
      setActiveChannel(null);
      socketManager.leaveGroupChannel(channelId);
    };
  }, [channelId, groupId, setActiveChannel, fetchChannelMessages, fetchMembers]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!channelId) return;

    const topic = `channel:${channelId}`;
    socketManager.sendTyping(topic, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(topic, false);
    }, 3000);
  }, [channelId]);

  // Send message
  const handleSend = async () => {
    if (!channelId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendChannelMessage(channelId, messageInput.trim(), replyTo?.id);
      setMessageInput('');
      setReplyTo(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`channel:${channelId}`, false);
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
    if (!channelId || !hasMoreMessages[channelId]) return;
    const oldestMessage = messages[0];
    if (oldestMessage) {
      fetchChannelMessages(channelId, oldestMessage.id);
    }
  };

  // Format date header
  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: ChannelMessage[] }[] = [];
  let currentGroup: { date: Date; messages: ChannelMessage[] } | null = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
      currentGroup = { date: msgDate, messages: [msg] };
      groupedMessages.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  // Group members by status
  const onlineMembers = groupMembers.filter((m) => m.user.status === 'online');
  const offlineMembers = groupMembers.filter((m) => m.user.status !== 'online');

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-800">
          <div className="flex items-center gap-2">
            <HashtagIcon className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-white">{channel.name}</span>
            {channel.topic && (
              <>
                <div className="w-px h-5 bg-dark-600 mx-2" />
                <span className="text-sm text-gray-400 truncate max-w-md">{channel.topic}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-1.5 rounded hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
              <BookmarkIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-1.5 rounded transition-colors ${
                showMembers ? 'bg-dark-600 text-white' : 'hover:bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              <UserGroupIcon className="h-5 w-5" />
            </button>
            <div className="relative mx-2">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-36 pl-8 pr-2 py-1 bg-dark-900 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && !isLoadingMessages && (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                <HashtagIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Welcome to #{channel.name}!</h3>
              <p className="text-gray-400">This is the start of the #{channel.name} channel.</p>
            </div>
          )}

          {/* Load more */}
          {hasMoreMessages[channelId || ''] && (
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
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-dark-700" />
                <span className="text-xs text-gray-500 font-medium">{formatDateHeader(group.date)}</span>
                <div className="flex-1 h-px bg-dark-700" />
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {group.messages.map((message, msgIndex) => {
                  const showHeader =
                    msgIndex === 0 ||
                    group.messages[msgIndex - 1]?.authorId !== message.authorId;

                  return (
                    <ChannelMessageItem
                      key={message.id}
                      message={message}
                      showHeader={showHeader}
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
              <span className="text-sm text-gray-400">
                {typing.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
              </span>
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
                  Replying to {replyTo.author.displayName || replyTo.author.username}
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
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-end gap-2 bg-dark-700 rounded-lg px-4 py-2">
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <PaperClipIcon className="h-5 w-5" />
            </button>

            <textarea
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${channel.name}`}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none max-h-32"
              style={{ minHeight: '24px' }}
            />

            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <FaceSmileIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!messageInput.trim() || isSending}
              className="p-1 text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <div className="w-60 bg-dark-800 border-l border-dark-700 overflow-y-auto">
          {/* Online members */}
          {onlineMembers.length > 0 && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Online — {onlineMembers.length}
              </h3>
              <div className="space-y-0.5">
                {onlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {/* Offline members */}
          {offlineMembers.length > 0 && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Offline — {offlineMembers.length}
              </h3>
              <div className="space-y-0.5">
                {offlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} isOffline />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Channel message item
function ChannelMessageItem({
  message,
  showHeader,
  onReply,
}: {
  message: ChannelMessage;
  showHeader: boolean;
  onReply: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group relative flex gap-4 px-4 py-0.5 hover:bg-dark-800/30 ${showHeader ? 'mt-4' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar or spacer */}
      <div className="w-10 flex-shrink-0">
        {showHeader && (
          <div className="h-10 w-10 rounded-full overflow-hidden bg-dark-600">
            {message.author.avatarUrl ? (
              <img
                src={message.author.avatarUrl}
                alt={message.author.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg font-bold text-gray-400">
                {message.author.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span
              className="font-medium hover:underline cursor-pointer"
              style={{ color: message.author.member?.roles?.[0]?.color || '#ffffff' }}
            >
              {message.author.displayName || message.author.username}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.createdAt), 'MM/dd/yyyy h:mm a')}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-primary-400">{message.replyTo.author.username}</span>
            <span className="truncate max-w-xs">{message.replyTo.content}</span>
          </div>
        )}

        <p className="text-gray-100 whitespace-pre-wrap break-words">{message.content}</p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  reaction.hasReacted
                    ? 'bg-primary-600/30 border border-primary-500/50'
                    : 'bg-dark-700 hover:bg-dark-600'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className={reaction.hasReacted ? 'text-primary-300' : 'text-gray-400'}>
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute right-4 -top-4 flex items-center gap-0.5 bg-dark-700 rounded border border-dark-600 shadow-lg">
          <button className="p-1.5 hover:bg-dark-600 text-gray-400 hover:text-white" title="React">
            <FaceSmileIcon className="h-4 w-4" />
          </button>
          <button onClick={onReply} className="p-1.5 hover:bg-dark-600 text-gray-400 hover:text-white" title="Reply">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-dark-600 text-gray-400 hover:text-white" title="More">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Member item
function MemberItem({ member, isOffline = false }: { member: Member; isOffline?: boolean }) {
  const roleColor = member.roles?.[0]?.color;

  return (
    <div className={`flex items-center gap-2 p-1.5 rounded hover:bg-dark-700 cursor-pointer ${isOffline ? 'opacity-60' : ''}`}>
      <div className="relative">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-dark-600">
          {member.user.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={member.user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-400">
              {member.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {!isOffline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-800" />
        )}
      </div>
      <span
        className="text-sm truncate"
        style={{ color: roleColor || (isOffline ? '#6b7280' : '#ffffff') }}
      >
        {member.nickname || member.user.displayName || member.user.username}
      </span>
    </div>
  );
}
