/**
 * GroupChannel Page Component
 *
 * Displays a group text channel with messages, members sidebar,
 * and input for sending new messages.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGroupStore } from '@/modules/groups/store';
import { useAuthStore } from '@/modules/auth/store';
import { socketManager } from '@/lib/socket';
import { createLogger } from '@/lib/logger';

import { ChannelHeader } from './ChannelHeader';
import { MessagesArea } from './MessagesArea';
import { MessageInput } from './MessageInput';
import { MembersSidebar } from './MembersSidebar';
import { PinnedMessagesPanel } from './PinnedMessagesPanel';
import { formatDateHeader, groupMessagesByDate } from './utils';
import type { ChannelMessage } from './types';

const logger = createLogger('GroupChannel');

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
  const [showPinned, setShowPinned] = useState(false);
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
      logger.error('Failed to send message:', error);
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

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    handleTyping();
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

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
        <ChannelHeader
          channelName={channel.name}
          channelTopic={channel.topic ?? undefined}
          showMembers={showMembers}
          onToggleMembers={() => setShowMembers(!showMembers)}
          showPinnedMessages={showPinned}
          onTogglePinnedMessages={() => setShowPinned(!showPinned)}
        />

        <MessagesArea
          groupedMessages={groupedMessages}
          hasMoreMessages={hasMoreMessages[channelId || ''] || false}
          isLoadingMessages={isLoadingMessages}
          channelName={channel.name}
          typing={typing}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          onLoadMore={handleLoadMore}
          onReply={setReplyTo}
          formatDateHeader={formatDateHeader}
        />

        <MessageInput
          channelName={channel.name}
          messageInput={messageInput}
          isSending={isSending}
          replyTo={replyTo}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onSend={handleSend}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <MembersSidebar onlineMembers={onlineMembers} offlineMembers={offlineMembers} />
      )}

      {/* Pinned messages panel */}
      <AnimatePresence>
        {showPinned && groupId && channelId && (
          <PinnedMessagesPanel
            groupId={groupId}
            channelId={channelId}
            channelMessages={messages}
            onClose={() => setShowPinned(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
