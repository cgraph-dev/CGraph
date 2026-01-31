/**
 * Community Module
 *
 * Unified community features combining:
 * - Forums management (forumSlice)
 * - Groups/channels (groupSlice)
 * - Moderation tools (moderationSlice)
 * - Forum hosting/customization (forumHostingSlice)
 *
 * This module provides a single entry point for all community features
 * while maintaining backward compatibility with existing imports.
 */

// Re-export forum slice
export {
  useForumStore,
  type Forum,
  type Post,
  type Comment,
  type ThreadPrefix,
  type Subscription,
  type Poll,
  type PollOption,
  type PostAttachment,
} from './forumSlice';

// Re-export group slice
export {
  useGroupStore,
  type Group,
  type Channel,
  type Member,
  type ChannelMessage,
  type Role,
} from './groupSlice';

// Re-export moderation slice
export {
  useModerationStore,
  type ModerationQueueItem,
  type ModerationLogEntry,
  type UserWarning,
  type Ban,
  type WarningType,
} from './moderationSlice';

// Re-export forum hosting slice
export {
  useForumHostingStore,
  type Board,
  type Thread,
  type ThreadPost,
  type ForumMember,
} from './forumHostingSlice';

// Unified community state type
export interface CommunityData {
  // Forums
  forums: Forum[];
  currentForum: Forum | null;
  posts: Post[];
  currentPost: Post | null;

  // Groups
  groups: Group[];
  activeGroupId: string | null;
  activeChannelId: string | null;

  // Moderation
  moderationQueue: ModerationQueueItem[];
  queueCounts: Record<string, number>;
}

// Import types for the unified interface
import type { Forum, Post } from './forumSlice';
import type { Group } from './groupSlice';
import type { ModerationQueueItem } from './moderationSlice';
