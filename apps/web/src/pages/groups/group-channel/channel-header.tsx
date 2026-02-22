/**
 * ChannelHeader Component
 *
 * Header bar with channel info and actions.
 */

import {
  HashtagIcon,
  BellIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { ChannelHeaderProps } from './types';

export function ChannelHeader({
  channelName,
  channelTopic,
  showMembers,
  onToggleMembers,
  showPinnedMessages,
  onTogglePinnedMessages,
  pinnedCount,
}: ChannelHeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-dark-700 bg-dark-800 px-4">
      <div className="flex items-center gap-2">
        <HashtagIcon className="h-5 w-5 text-gray-400" />
        <span className="font-semibold text-white">{channelName}</span>
        {channelTopic && (
          <>
            <div className="mx-2 h-5 w-px bg-dark-600" />
            <span className="max-w-md truncate text-sm text-gray-400">{channelTopic}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button className="rounded p-1.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white">
          <BellIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onTogglePinnedMessages}
          className={`relative rounded p-1.5 transition-colors ${
            showPinnedMessages
              ? 'bg-dark-600 text-white'
              : 'text-gray-400 hover:bg-dark-700 hover:text-white'
          }`}
          title="Pinned Messages"
        >
          <BookmarkIcon className="h-5 w-5" />
          {(pinnedCount ?? 0) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
              {pinnedCount}
            </span>
          )}
        </button>
        <button
          onClick={onToggleMembers}
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
  );
}
