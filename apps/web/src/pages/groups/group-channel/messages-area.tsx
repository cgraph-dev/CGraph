/**
 * MessagesArea Component
 *
 * Displays the list of messages grouped by date.
 */

import { HashtagIcon } from '@heroicons/react/24/outline';
import { ChannelMessageItem } from './channel-message-item';
import type { MessagesAreaProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Messages Area component.
 */
export function MessagesArea({
  groupedMessages,
  hasMoreMessages,
  isLoadingMessages,
  channelName,
  typing,
  messagesEndRef,
  onLoadMore,
  onReply,
  onOpenThread,
  onReport,
  currentUserId,
  threadReplyCounts,
  formatDateHeader,
}: MessagesAreaProps) {
  const hasMessages = groupedMessages.some((g) => g.messages.length > 0);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {/* Welcome message */}
      {!hasMessages && !isLoadingMessages && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-700">
            <HashtagIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-xl font-bold text-white">Welcome to #{channelName}!</h3>
          <p className="text-gray-400">This is the start of the #{channelName} channel.</p>
        </div>
      )}

      {/* Load more */}
      {hasMoreMessages && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
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
                  onReply={() => onReply(message)}
                  onOpenThread={() => onOpenThread(message)}
                  onReport={onReport ? () => onReport(message) : undefined}
                  currentUserId={currentUserId}
                  threadReplyCount={threadReplyCounts[message.id]}
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
  );
}
