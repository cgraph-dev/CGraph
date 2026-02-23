/**
 * Main forum board view page component.
 * @module
 */
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, FolderIcon, UserIcon } from '@heroicons/react/24/outline';

import { useForumBoardView } from './useForumBoardView';
import { ForumBoardBanner } from './forum-board-banner';
import { BoardsList } from './boards-list';
import { ThreadsList } from './threads-list';
import { MembersList } from './members-list';
import type { ForumTab } from './types';

const TABS: ReadonlyArray<{
  key: ForumTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'boards', label: 'Boards', icon: FolderIcon },
  { key: 'threads', label: 'Recent Threads', icon: ChatBubbleLeftRightIcon },
  { key: 'members', label: 'Members', icon: UserIcon },
];

/**
 * ForumBoardView - MyBB-style board and thread listing
 *
 * Shows:
 * - Forum header with banner/icon/stats
 * - List of boards (categories/sections)
 * - Recent threads across all boards
 * - Member directory
 */
export function ForumBoardView() {
  const {
    forum,
    boards,
    threads,
    members,
    isLoadingForum,
    isLoadingBoards,
    isLoadingThreads,
    isLoadingMembers,
    activeTab,
    setActiveTab,
    memberSearch,
    setMemberSearch,
    memberSort,
    setMemberSort,
    isOwner,
    isAuthenticated,
    handleSubscribe,
    handleVote,
  } = useForumBoardView();

  if (isLoadingForum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Forum Not Found</h2>
          <p className="mb-4 text-gray-400">The forum you're looking for doesn't exist.</p>
          <Link to="/forums" className="text-primary-400 hover:underline">
            Browse all forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Forum Header */}
      <ForumBoardBanner
        forum={forum}
        isOwner={isOwner}
        isAuthenticated={isAuthenticated}
        onSubscribe={handleSubscribe}
        onVote={handleVote}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-dark-700 bg-dark-800">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary-400 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === 'boards' && (
          <BoardsList
            boards={boards}
            forumSlug={forum.slug}
            isLoading={isLoadingBoards}
            isOwner={isOwner}
          />
        )}

        {activeTab === 'threads' && (
          <ThreadsList threads={threads} forumSlug={forum.slug} isLoading={isLoadingThreads} />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members}
            isLoading={isLoadingMembers}
            search={memberSearch}
            onSearchChange={setMemberSearch}
            sort={memberSort}
            onSortChange={setMemberSort}
          />
        )}
      </div>
    </div>
  );
}
