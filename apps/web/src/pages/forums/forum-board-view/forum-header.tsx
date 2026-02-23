/**
 * Forum board header with navigation and info.
 * @module
 */
import { Link } from 'react-router-dom';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';

import type { ForumHeaderProps, ForumTab } from './types';

/**
 * Forum header with banner, icon, stats, voting, and navigation tabs
 */
export function ForumHeader({
  forum,
  user,
  isOwner,
  onVote,
  onSubscribe,
  isSubscribed,
  activeTab,
  onTabChange,
}: ForumHeaderProps) {
  const tabs: Array<{
    id: ForumTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'boards', label: 'Boards', icon: FolderIcon },
    { id: 'threads', label: 'Recent Threads', icon: ChatBubbleLeftRightIcon },
    { id: 'members', label: 'Members', icon: UsersIcon },
  ];

  return (
    <>
      {/* Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 w-full bg-gradient-to-r from-primary-600 to-primary-800">
          {forum.bannerUrl && (
            <img
              src={forum.bannerUrl}
              alt={`${forum.name} banner`}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Forum Icon & Basic Info */}
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative -mt-16 flex items-end gap-6">
            {/* Forum Icon */}
            <div className="relative flex-shrink-0">
              {forum.iconUrl ? (
                <img
                  src={forum.iconUrl}
                  alt={forum.name}
                  className="h-32 w-32 rounded-xl border-4 border-dark-800 object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-xl border-4 border-dark-800 bg-gradient-to-br from-primary-500 to-primary-700">
                  <span className="text-4xl font-bold text-white">
                    {forum.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Forum Name & Actions */}
            <div className="flex flex-1 items-end justify-between pb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{forum.name}</h1>
                {forum.description && (
                  <p className="mt-1 max-w-2xl text-gray-400">{forum.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                  <span>{(forum.memberCount ?? 0).toLocaleString()} members</span>
                  <span>·</span>
                  <span>{(forum.threadCount ?? 0).toLocaleString()} threads</span>
                  <span>·</span>
                  <span>{(forum.postCount ?? 0).toLocaleString()} posts</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Voting */}
                {user && (
                  <div className="flex items-center gap-1 rounded-lg bg-dark-700 p-1">
                    <button
                      onClick={() => onVote('up')}
                      className="rounded p-2 transition-colors hover:bg-dark-600 hover:text-green-400"
                    >
                      <ArrowUpIcon className="h-5 w-5" />
                    </button>
                    <span className="min-w-[3ch] text-center text-sm font-medium">
                      {forum.score ?? 0}
                    </span>
                    <button
                      onClick={() => onVote('down')}
                      className="rounded p-2 transition-colors hover:bg-dark-600 hover:text-red-400"
                    >
                      <ArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Subscribe */}
                <button
                  onClick={onSubscribe}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    isSubscribed
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <BellIcon className="h-5 w-5" />
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>

                {/* Settings (Owner Only) */}
                {isOwner && (
                  <Link
                    to={`/forums/${forum.slug}/settings`}
                    className="rounded-lg bg-dark-700 p-2 transition-colors hover:bg-dark-600"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-dark-700 bg-dark-800">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
