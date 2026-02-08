/**
 * Moderation Store — Orchestrator
 * @module modules/moderation/store
 *
 * Composes queue, thread/post, user, and log action slices into a single store.
 * 715L → ~40L orchestrator + 4 slices.
 */

import { create } from 'zustand';
import type { ModerationState } from './moderationStore.types';
import { createQueueActions } from './moderationStore.queue';
import { createThreadActions } from './moderationStore.threads';
import { createUserActions } from './moderationStore.users';
import { createLogActions } from './moderationStore.log';

export * from './moderationStore.types';

export const useModerationStore = create<ModerationState>((set, get) => ({
  // Initial state
  queue: [],
  queueCounts: { pending: 0, flagged: 0, reported: 0 },
  isLoadingQueue: false,
  warningTypes: [],
  currentUserWarnings: [],
  currentUserStats: null,
  bans: [],
  isLoadingBans: false,
  moderationLog: [],
  isLoadingLog: false,
  bulkSelection: { threads: [], posts: [], comments: [] },

  // Compose slices
  ...createQueueActions(set),
  ...createThreadActions(set, get),
  ...createUserActions(set),
  ...createLogActions(set),
}));

export default useModerationStore;
