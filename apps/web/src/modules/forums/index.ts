/**
 * Forums Module
 *
 * Consolidated forum functionality including:
 * - Components (27 components)
 * - Store (forumStore, forumHostingStore, announcementStore, forumThemeStore)
 * - Hooks (forum/thread socket hooks)
 * - Types
 * - API
 */

export * from './components';
export * from './hooks';

// Re-export store with renamed conflicting types
export {
  useForumStore,
  type Forum,
  type ForumCategory,
  type ForumModerator,
  type ThreadPrefix as ThreadPrefixType,
  type ThreadRating as ThreadRatingType,
  type PostAttachment,
  type PostEditHistory,
  type Poll,
  type PollOption,
  type Post,
  type Subscription,
  type UserGroup,
  type GroupPermissions,
  type UserWarning,
  type WarningType,
  type Ban,
  type ModerationQueueItem,
  type Report,
  type Comment,
  type ForumState,
  type CreatePostData,
  useForumHostingStore,
  useAnnouncementStore,
  useForumThemeStore,
} from './store';
// export * from './types';  // Will add when types are consolidated
// export * from './api';  // Uncomment when API is migrated
