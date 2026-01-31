/**
 * Community Facade
 *
 * Unified interface for forums, groups, and community features.
 * Aggregates: forumStore, groupStore, moderationStore, forumHostingStore, announcementStore
 *
 * @module stores/facades/communityFacade
 */

import { useForumStore } from '../forumStore';
import { useGroupStore } from '../groupStore';
import { useModerationStore } from '../moderationStore';
import { useForumHostingStore } from '../forumHostingStore';
import { useAnnouncementStore } from '../announcementStore';

/**
 * Unified community and social facade
 * Provides a single hook for all community-related state and actions
 */
export function useCommunityFacade() {
  const forum = useForumStore();
  const groups = useGroupStore();
  const moderation = useModerationStore();
  const hosting = useForumHostingStore();
  const announcements = useAnnouncementStore();

  return {
    // === Forums State ===
    forums: forum.forums,
    currentForum: forum.currentForum,
    posts: forum.posts,
    currentPost: forum.currentPost,
    comments: forum.comments,
    subscribedForums: forum.subscribedForums,
    leaderboard: forum.leaderboard,
    isLoadingForums: forum.isLoadingForums,
    isLoadingPosts: forum.isLoadingPosts,

    // === Forums Actions ===
    fetchForums: forum.fetchForums,
    fetchForum: forum.fetchForum,
    fetchPosts: forum.fetchPosts,
    fetchPost: forum.fetchPost,
    createPost: forum.createPost,
    deletePost: forum.deletePost,
    createComment: forum.createComment,
    vote: forum.vote,
    voteForum: forum.voteForum,
    subscribe: forum.subscribe,
    unsubscribe: forum.unsubscribe,

    // === Groups State ===
    groups: groups.groups,
    groupsLoading: groups.isLoadingGroups,
    activeGroupId: groups.activeGroupId,

    // === Groups Actions ===
    fetchGroups: groups.fetchGroups,
    fetchGroup: groups.fetchGroup,
    createGroup: groups.createGroup,
    joinGroup: groups.joinGroup,
    leaveGroup: groups.leaveGroup,

    // === Moderation State ===
    moderationQueue: moderation.queue,
    moderationQueueCounts: moderation.queueCounts,
    bans: moderation.bans,
    isLoadingBans: moderation.isLoadingBans,

    // === Moderation Actions ===
    banUser: moderation.banUser,
    liftBan: moderation.liftBan,
    fetchBans: moderation.fetchBans,
    issueWarning: moderation.issueWarning,

    // === Hosting State ===
    hostedBoards: hosting.boards,
    hostedThreads: hosting.threads,

    // === Announcements State ===
    announcements: announcements.announcements,
    getUnreadCount: announcements.getUnreadCount,

    // === Announcements Actions ===
    fetchAnnouncements: announcements.fetchAnnouncements,
    markAnnouncementRead: announcements.markAsRead,

    // === Direct Store Access (for edge cases) ===
    _stores: { forum, groups, moderation, hosting, announcements },
  };
}

export type CommunityFacade = ReturnType<typeof useCommunityFacade>;
