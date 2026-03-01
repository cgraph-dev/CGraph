/**
 * ChannelMessageItem Component
 *
 * Displays a single message in the channel with avatar,
 * content, reactions, and action menu.
 */

import { useState } from 'react';
import { FaceSmileIcon, EllipsisVerticalIcon, ChatBubbleLeftRightIcon, FlagIcon } from '@heroicons/react/24/outline';
import type { ChannelMessageItemProps } from './types';
import { formatMessageTime, getAvatarInitial, getDisplayName } from './utils';

/**
 * unknown for the groups module.
 */
/**
 * Channel Message Item component.
 */
export function ChannelMessageItem({ message, showHeader, onReply, onOpenThread, onReport, currentUserId, threadReplyCount }: ChannelMessageItemProps) {
  const [showActions, setShowActions] = useState(false);

  const displayName = getDisplayName(message.author.username, message.author.displayName);
  const initial = getAvatarInitial(message.author.username, message.author.displayName);

  return (
    <div
      className={`group relative flex gap-4 px-4 py-0.5 hover:bg-dark-800/30 ${
        showHeader ? 'mt-4' : ''
      }`}
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
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                {initial}
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
              {displayName}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            <ReplyIcon />
            <span className="text-primary-400">
              {getDisplayName(message.replyTo.author.username, message.replyTo.author.displayName)}
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

        {/* Thread reply count badge */}
        {threadReplyCount != null && threadReplyCount > 0 && (
          <button
            onClick={onOpenThread}
            className="mt-1 flex items-center gap-1.5 rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
            <span>{threadReplyCount} {threadReplyCount === 1 ? 'reply' : 'replies'}</span>
          </button>
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
            <ReplyIcon />
          </button>
          <button
            onClick={onOpenThread}
            className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-white"
            title="Reply in Thread"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          {onReport && currentUserId && message.authorId !== currentUserId && (
            <button
              onClick={onReport}
              className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-red-400"
              title="Report"
            >
              <FlagIcon className="h-4 w-4" />
            </button>
          )}
          <button className="p-1.5 text-gray-400 hover:bg-dark-600 hover:text-white" title="More">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Reply icon SVG component
 */
function ReplyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}
