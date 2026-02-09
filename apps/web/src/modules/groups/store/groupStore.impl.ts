/**
 * Group Store — thin orchestrator.
 * Types live in ./group-types.ts, actions in ./group-actions.ts.
 */
import { create } from 'zustand';
import { createGroupActions } from './group-actions';

// Re-export all types so existing consumers keep working
export type {
  Group,
  ChannelCategory,
  Channel,
  Role,
  Member,
  ChannelMessage,
  GroupState,
} from './group-types';

import type { GroupState } from './group-types';

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  justJoinedGroupName: null,
  clearJoinCelebration: () => set({ justJoinedGroupName: null }),
  ...createGroupActions(set, get),
}));
