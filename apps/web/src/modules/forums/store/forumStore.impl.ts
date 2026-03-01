/**
 * Forum Store — Implementation (Orchestrator)
 *
 * Composes all forum store action slices into a single Zustand store.
 * Each domain (core, forumCrud, moderation, features, admin) lives
 * in its own file for maintainability.
 *
 * @module modules/forums/store/forumStore.impl
 */

import { create } from 'zustand';
import type { ForumState } from './forumStore.types';
import { forumInitialState, createCoreActions } from './forumStore.core';
import { createForumCrudActions } from './forumStore.forumCrud';
import { createModerationActions } from './forumStore.moderation';
import { createFeatureActions } from './forumStore.features';
import { createAdminActions } from './forumStore.admin';

// Re-export all types for backward compatibility
export type {
  Forum,
  ForumCategory,
  ForumModerator,
  Post,
  Comment,
  ThreadPrefix,
  ThreadRating,
  PostAttachment,
  PostEditHistory,
  Poll,
  PollOption,
  Subscription,
  UserGroup,
  GroupPermissions,
  UserWarning,
  WarningType,
  Ban,
  ModerationQueueItem,
  Report,
  SortOption,
  LeaderboardSort,
  TimeRange,
  LeaderboardMeta,
  CreatePostData,
  CreateForumData,
  UpdateForumData,
  CreateThreadPrefixData,
  CreatePollData,
  CreateUserGroupData,
  UpdateUserGroupData,
  CreateBanData,
  CreateReportData,
  ForumState,
  ForumSearchResult,
  ForumSearchFilters,
} from './forumStore.types';

// ── Store Creation ─────────────────────────────────────────────────────

export const useForumStore = create<ForumState>((set, get) => ({
  ...forumInitialState,
  ...createCoreActions(set, get),
  ...createForumCrudActions(set, get),
  ...createModerationActions(set, get),
  ...createFeatureActions(set, get),
  ...createAdminActions(set, get),

  reset: () => set({ ...forumInitialState }),
}));
