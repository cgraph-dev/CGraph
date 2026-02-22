import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { createLogger } from '@/lib/logger';
import { useForumHostingStore } from '@/modules/forums/store';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';

import type { ForumTab, MemberSortOption, Forum } from './types';

const logger = createLogger('ForumBoardView');

/**
 * Custom hook encapsulating all state and logic for ForumBoardView.
 *
 * Manages:
 * - Forum data fetching & loading state
 * - Tab navigation (boards / threads / members)
 * - Member search & sort state
 * - Subscribe / unsubscribe actions
 * - Forum voting
 */
export function useForumBoardView() {
  const { forumSlug } = useParams<{ forumSlug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { fetchForum, subscribe, unsubscribe, voteForum } = useForumStore();
  const {
    boards,
    threads,
    members,
    fetchBoards,
    fetchRecentThreads,
    fetchMembers,
    isLoadingBoards,
    isLoadingThreads,
    isLoadingMembers,
  } = useForumHostingStore();

  const [forum, setForum] = useState<Forum | null>(null);
  const [isLoadingForum, setIsLoadingForum] = useState(true);
  const [activeTab, setActiveTab] = useState<ForumTab>('boards');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState<MemberSortOption>('recent');

  useEffect(() => {
    if (forumSlug) {
      loadForum();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug]);

  // Load members when tab is selected or search/sort changes
  useEffect(() => {
    if (activeTab === 'members' && forum) {
      fetchMembers(forum.id, { sort: memberSort, search: memberSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, forum?.id, memberSort, memberSearch]);

  const loadForum = async () => {
    if (!forumSlug) return;

    setIsLoadingForum(true);
    try {
      const forumData = await fetchForum(forumSlug);
      setForum(forumData);
      await Promise.all([fetchBoards(forumData.id), fetchRecentThreads(forumData.id)]);
    } catch (error) {
      logger.error('Failed to load forum:', error);
    } finally {
      setIsLoadingForum(false);
    }
  };

  const handleSubscribe = async () => {
    if (!forum) return;
    if (forum.isSubscribed) {
      await unsubscribe(forum.id);
      setForum({ ...forum, isSubscribed: false, memberCount: (forum.memberCount ?? 0) - 1 });
    } else {
      await subscribe(forum.id);
      setForum({ ...forum, isSubscribed: true, memberCount: (forum.memberCount ?? 0) + 1 });
    }
  };

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated || !forum) return;
    await voteForum(forum.id, value);
    // Refetch forum to get updated scores
    const updated = await fetchForum(forumSlug!);
    setForum(updated);
  };

  const isOwner = !!(forum && user && forum.ownerId === user.id);

  return {
    // Data
    forum,
    boards,
    threads,
    members,

    // Loading states
    isLoadingForum,
    isLoadingBoards,
    isLoadingThreads,
    isLoadingMembers,

    // Tab / filter state
    activeTab,
    setActiveTab,
    memberSearch,
    setMemberSearch,
    memberSort,
    setMemberSort,

    // Derived
    isOwner,
    isAuthenticated,

    // Actions
    handleSubscribe,
    handleVote,
    navigate,
  };
}
