/**
 * Forum board banner display component.
 * @module
 */
import { useNavigate } from 'react-router-dom';
import { CogIcon } from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  LockClosedIcon,
  FireIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

import type { Forum } from './types';

export interface ForumBoardBannerProps {
  forum: Forum;
  isOwner: boolean;
  isAuthenticated: boolean;
  onSubscribe: () => void;
  onVote: (value: 1 | -1) => void;
}

/**
 * Forum banner, icon, info bar, stats, voting controls, and join/settings buttons.
 */
export function ForumBoardBanner({
  forum,
  isOwner,
  isAuthenticated,
  onSubscribe,
  onVote,
}: ForumBoardBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Banner */}
      <div
        className="h-48 bg-gradient-to-r from-primary-600 to-primary-800"
        style={
          forum.bannerUrl
            ? {
                backgroundImage: `url(${forum.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}
        }
      />

      {/* Forum Info Bar */}
      <div className="border-b border-dark-700 bg-dark-800">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-dark-800 bg-primary-600">
              {forum.iconUrl ? (
                <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {forum.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{forum.name}</h1>
                  <p className="text-gray-400">f/{forum.slug}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Voting */}
                  <div className="flex items-center gap-1 rounded-lg bg-dark-700 p-1">
                    <button
                      onClick={() => onVote(1)}
                      disabled={!isAuthenticated}
                      className={`rounded p-2 ${forum.userVote === 1 ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-dark-600'}`}
                    >
                      <ArrowUpIcon className="h-5 w-5" />
                    </button>
                    <span
                      className={`px-2 font-bold ${(forum.score ?? 0) > 0 ? 'text-orange-400' : 'text-gray-400'}`}
                    >
                      {forum.score}
                    </span>
                    <button
                      onClick={() => onVote(-1)}
                      disabled={!isAuthenticated}
                      className={`rounded p-2 ${forum.userVote === -1 ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-dark-600'}`}
                    >
                      <ArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Join/Settings */}
                  <button
                    onClick={onSubscribe}
                    className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                      forum.isSubscribed
                        ? 'bg-dark-700 text-white hover:bg-dark-600'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {forum.isSubscribed ? 'Joined' : 'Join'}
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => navigate(`/forums/${forum.slug}/admin`)}
                      className="rounded-lg bg-dark-700 p-2 text-gray-400 transition-colors hover:bg-dark-600"
                      title="Forum Admin Dashboard"
                    >
                      <CogIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {forum.description && <p className="mt-2 text-gray-300">{forum.description}</p>}

              {/* Stats & Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {!forum.isPublic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                    <LockClosedIcon className="h-3 w-3" />
                    Private
                  </span>
                )}

                <span className="flex items-center gap-1.5 text-gray-400">
                  <UserIcon className="h-4 w-4" />
                  <span className="font-medium text-white">
                    {(forum.memberCount ?? 0).toLocaleString()}
                  </span>
                  <span>members</span>
                </span>

                <span className="flex items-center gap-1.5 text-gray-400">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span className="font-medium text-white">
                    {(forum.threadCount ?? 0).toLocaleString()}
                  </span>
                  <span>threads</span>
                </span>

                <span className="flex items-center gap-1.5 text-gray-400">
                  <FireIcon className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-orange-400">{forum.score ?? 0}</span>
                  <span>score</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
