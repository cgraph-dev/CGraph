/**
 * Community Module
 *
 * Unified community features combining:
 * - Forums management (forumStore)
 * - Groups/channels (groupStore)
 * - Moderation tools (moderationStore)
 * - Forum hosting/customization (forumHostingStore)
 *
 * This module provides a single entry point for all community features
 * while maintaining backward compatibility with existing imports.
 */

// Re-export forum store from root
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
} from '@/modules/forums/store';

// Re-export group store
export {
  useGroupStore,
  type Group,
  type Channel,
  type Member,
  type ChannelMessage,
  type Role,
} from '@/modules/groups/store';

// Re-export moderation store
export {
  useModerationStore,
  type ModerationQueueItem,
  type ModerationLogEntry,
  type UserWarning,
  type Ban,
  type WarningType,
} from '@/modules/moderation/store';

// Re-export forum hosting store from root
export {
  useForumHostingStore,
  type Board,
  type Thread,
  type ThreadPost,
  type ForumMember,
} from '@/modules/forums/store';

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
import type { Forum, Post } from '@/modules/forums/store';
import type { Group } from '@/modules/groups/store';
import type { ModerationQueueItem } from '@/modules/moderation/store';
