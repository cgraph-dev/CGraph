/**
 * Community Facade Hook
 *
 * Composition hook that aggregates forums, groups,
 * and announcements into a single community interface.
 *
 * @example
 * ```tsx
 * const {
 *   forums, posts,
 *   groups, activeGroupId,
 *   fetchForums, fetchGroups,
 * } = useCommunityFacade();
 * ```
 *
 * @module hooks/facades/useCommunityFacade
 */

import { useMemo } from 'react';
import { useForumStore, useAnnouncementStore } from '@/modules/forums/store';
import { useGroupStore } from '@/modules/groups/store';
import type { Forum, Post, Announcement } from '@/modules/forums/store';
import type { Group } from '@/modules/groups/store';

export interface CommunityFacade {
  // Forums
  forums: Forum[];
  currentForum: Forum | null;
  posts: Post[];
  currentPost: Post | null;
  isLoadingForums: boolean;
  isLoadingPosts: boolean;
  fetchForums: () => Promise<void>;
  fetchPosts: (forumSlug?: string, page?: number) => Promise<void>;

  // Groups
  groups: Group[];
  activeGroupId: string | null;
  activeChannelId: string | null;
  isLoadingGroups: boolean;
  fetchGroups: () => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;

  // Announcements
  announcements: Announcement[];
  fetchAnnouncements: () => Promise<void>;
}

/**
 * Composes forums, groups, and announcements state.
 */
export function useCommunityFacade(): CommunityFacade {
  // Forums store
  const forums = useForumStore((s) => s.forums);
  const currentForum = useForumStore((s) => s.currentForum);
  const posts = useForumStore((s) => s.posts);
  const currentPost = useForumStore((s) => s.currentPost);
  const isLoadingForums = useForumStore((s) => s.isLoadingForums);
  const isLoadingPosts = useForumStore((s) => s.isLoadingPosts);
  const fetchForums = useForumStore((s) => s.fetchForums);
  const fetchPosts = useForumStore((s) => s.fetchPosts);

  // Groups store
  const groups = useGroupStore((s) => s.groups);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const activeChannelId = useGroupStore((s) => s.activeChannelId);
  const isLoadingGroups = useGroupStore((s) => s.isLoadingGroups);
  const fetchGroups = useGroupStore((s) => s.fetchGroups);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);
  const setActiveChannel = useGroupStore((s) => s.setActiveChannel);

  // Announcements store
  const announcements = useAnnouncementStore((s) => s.announcements);
  const fetchAnnouncements = useAnnouncementStore((s) => s.fetchAnnouncements);

  return useMemo(
    () => ({
      forums,
      currentForum,
      posts,
      currentPost,
      isLoadingForums,
      isLoadingPosts,
      fetchForums,
      fetchPosts,
      groups,
      activeGroupId,
      activeChannelId,
      isLoadingGroups,
      fetchGroups,
      setActiveGroup,
      setActiveChannel,
      announcements,
      fetchAnnouncements,
    }),
    [
      forums,
      currentForum,
      posts,
      currentPost,
      isLoadingForums,
      isLoadingPosts,
      fetchForums,
      fetchPosts,
      groups,
      activeGroupId,
      activeChannelId,
      isLoadingGroups,
      fetchGroups,
      setActiveGroup,
      setActiveChannel,
      announcements,
      fetchAnnouncements,
    ]
  );
}
