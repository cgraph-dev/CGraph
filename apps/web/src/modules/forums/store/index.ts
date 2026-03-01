/**
 * Forums Module Store
 *
 * Consolidated forum state management.
 */

// Main forum store
export {
  useForumStore,
  type Forum,
  type ForumCategory,
  type ForumModerator,
  type ThreadPrefix,
  type ThreadRating,
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
  type ForumSearchResult,
  type ForumSearchFilters,
} from './forumStore';

// Forum hosting store
export * from './forumHostingStore.impl';

// Announcement store
export * from './announcementStore.impl';

// Forum theme store
export { useForumThemeStore } from './forumThemeStore';
