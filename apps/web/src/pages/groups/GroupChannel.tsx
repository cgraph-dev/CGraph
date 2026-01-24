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
  // useAuthStore available for future permission checks
  const authStore = useAuthStore();
  void authStore; // Reserved for future permission checks
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, groupId]);

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
    }, 5000);
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
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-12 items-center justify-between border-b border-dark-700 bg-dark-800 px-4">
          <div className="flex items-center gap-2">
            <HashtagIcon className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-white">{channel.name}</span>
            {channel.topic && (
              <>
                <div className="mx-2 h-5 w-px bg-dark-600" />
                <span className="max-w-md truncate text-sm text-gray-400">{channel.topic}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button className="rounded p-1.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="rounded p-1.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white">
              <BookmarkIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`rounded p-1.5 transition-colors ${
                showMembers
                  ? 'bg-dark-600 text-white'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <UserGroupIcon className="h-5 w-5" />
            </button>
            <div className="relative mx-2">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-36 rounded bg-dark-900 py-1 pl-8 pr-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Welcome message */}
          {messages.length === 0 && !isLoadingMessages && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-700">
                <HashtagIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-white">Welcome to #{channel.name}!</h3>
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
              <div className="my-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-dark-700" />
                <span className="text-xs font-medium text-gray-500">
                  {formatDateHeader(group.date)}
                </span>
                <div className="h-px flex-1 bg-dark-700" />
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {group.messages.map((message, msgIndex) => {
                  const showHeader =
                    msgIndex === 0 || group.messages[msgIndex - 1]?.authorId !== message.authorId;

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
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: '300ms' }}
                />
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
          <div className="flex items-center justify-between border-t border-dark-700 bg-dark-800 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-primary-500" />
              <div>
                <p className="text-xs text-primary-400">
                  Replying to {replyTo.author.displayName || replyTo.author.username || 'Unknown'}
                </p>
                <p className="max-w-md truncate text-sm text-gray-400">{replyTo.content}</p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="rounded p-1 text-gray-400 hover:bg-dark-700 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-dark-700 p-4">
          <div className="flex items-end gap-2 rounded-lg bg-dark-700 px-4 py-2">
            <button className="p-1 text-gray-400 transition-colors hover:text-white">
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
              className="max-h-32 flex-1 resize-none bg-transparent text-white placeholder-gray-500 focus:outline-none"
              style={{ minHeight: '24px' }}
            />

            <button className="p-1 text-gray-400 transition-colors hover:text-white">
              <FaceSmileIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!messageInput.trim() || isSending}
              className="p-1 text-primary-400 transition-colors hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <div className="w-60 overflow-y-auto border-l border-dark-700 bg-dark-800">
          {/* Online members */}
          {onlineMembers.length > 0 && (
            <div className="p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
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
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
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
          <div className="h-10 w-10 overflow-hidden rounded-full bg-dark-600">
            {message.author.avatarUrl ? (
              <img
                src={message.author.avatarUrl}
                alt={message.author.username || message.author.displayName || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                {(message.author.username || message.author.displayName || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span
              className="cursor-pointer font-medium hover:underline"
              style={{ color: message.author.member?.roles?.[0]?.color || '#ffffff' }}
            >
              {message.author.displayName || message.author.username || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.createdAt), 'MM/dd/yyyy h:mm a')}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="text-primary-400">
              {message.replyTo.author.username || message.replyTo.author.displayName || 'Unknown'}
            </span>
            <span className="max-w-xs truncate">{message.replyTo.content}</span>
          </div>
        )}

        <p className="whitespace-pre-wrap break-words text-gray-100">{message.content}</p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors ${
                  reaction.hasReacted
                    ? 'border border-primary-500/50 bg-primary-600/30'
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
        <div className="absolute -top-4 right-4 flex items-center gap-0.5 rounded border border-dark-600 bg-dark-700 shadow-lg">
          <button className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-white" title="React">
            <FaceSmileIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onReply}
            className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-white"
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
          </button>
          <button className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-white" title="More">
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
    <div
      className={`flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-dark-700 ${isOffline ? 'opacity-60' : ''}`}
    >
      <div className="relative">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-dark-600">
          {member.user.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={member.user.username || member.user.displayName || 'User'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
              {(member.user.username || member.user.displayName || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {!isOffline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-green-500" />
        )}
      </div>
      <span
        className="truncate text-sm"
        style={{ color: roleColor || (isOffline ? '#6b7280' : '#ffffff') }}
      >
        {member.nickname || member.user.displayName || member.user.username || 'Unknown User'}
      </span>
    </div>
  );
}
