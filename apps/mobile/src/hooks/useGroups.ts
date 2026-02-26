/**
 * useGroups Hook
 *
 * React hook for group management functionality.
 * Provides group list, member management, and group actions.
 *
 * @module hooks/useGroups
 * @since v0.9.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as groupsService from '../services/groupsService';
import {
  Group,
  GroupMember,
  GroupChannel,
  GroupCategory,
  GroupInvite,
  GroupRole,
  CreateGroupRequest,
  UpdateGroupRequest,
} from '../services/groupsService';

const CACHE_DURATION = 60000; // 1 minute

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  channels: GroupCategory[];
  invites: GroupInvite[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseGroupsOptions {
  autoLoad?: boolean;
  groupId?: string;
}

interface UseGroupsReturn extends GroupsState {
  // Group list functions
  refreshGroups: () => Promise<void>;
  getPublicGroups: (options?: { category?: string; search?: string }) => Promise<Group[]>;
  getFeaturedGroups: () => Promise<Group[]>;

  // Single group functions
  loadGroup: (groupId: string) => Promise<void>;
  createGroup: (data: CreateGroupRequest) => Promise<Group | null>;
  updateGroup: (groupId: string, data: UpdateGroupRequest) => Promise<Group | null>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;

  // Member functions
  loadMembers: (
    groupId: string,
    options?: { role?: GroupRole; status?: 'online' | 'offline' | 'all' }
  ) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: GroupRole) => Promise<boolean>;
  kickMember: (groupId: string, userId: string, reason?: string) => Promise<boolean>;
  banMember: (
    groupId: string,
    userId: string,
    options?: { reason?: string; duration?: number }
  ) => Promise<boolean>;

  // Channel functions
  loadChannels: (groupId: string) => Promise<void>;
  createChannel: (
    groupId: string,
    data: { name: string; type: 'text' | 'voice' | 'announcement' | 'forum'; categoryId?: string }
  ) => Promise<GroupChannel | null>;

  // Invite functions
  loadInvites: (groupId: string) => Promise<void>;
  createInvite: (
    groupId: string,
    options?: { maxUses?: number; expiresIn?: number }
  ) => Promise<GroupInvite | null>;
  deleteInvite: (groupId: string, inviteId: string) => Promise<boolean>;
  joinByInvite: (code: string) => Promise<Group | null>;
}

/**
 *
 */
export function useGroups(options: UseGroupsOptions = {}): UseGroupsReturn {
  const { autoLoad = true, groupId } = options;

  const [state, setState] = useState<GroupsState>({
    groups: [],
    currentGroup: null,
    members: [],
    channels: [],
    invites: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
  });

  const cacheRef = useRef<{
    groups?: CacheEntry<Group[]>;
    group?: Map<string, CacheEntry<Group>>;
  }>({ group: new Map() });

  const isCacheValid = useCallback(<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // ==================== GROUP LIST FUNCTIONS ====================

  const refreshGroups = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    try {
      const groups = await groupsService.getMyGroups();
      cacheRef.current.groups = { data: groups, timestamp: Date.now() };
      setState((prev) => ({ ...prev, groups, isRefreshing: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load groups',
      }));
    }
  }, []);

  const getPublicGroups = useCallback(
    async (options?: { category?: string; search?: string }): Promise<Group[]> => {
      try {
        return await groupsService.getPublicGroups({
          category: options?.category,
          search: options?.search,
        });
      } catch (error) {
        console.error('Failed to get public groups:', error);
        return [];
      }
    },
    []
  );

  const getFeaturedGroups = useCallback(async (): Promise<Group[]> => {
    try {
      return await groupsService.getFeaturedGroups();
    } catch (error) {
      console.error('Failed to get featured groups:', error);
      return [];
    }
  }, []);

  // ==================== SINGLE GROUP FUNCTIONS ====================

  const loadGroup = useCallback(
    async (groupId: string) => {
      const cached = cacheRef.current.group?.get(groupId);
      if (isCacheValid(cached)) {
        setState((prev) => ({ ...prev, currentGroup: cached.data }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const group = await groupsService.getGroup(groupId);
        cacheRef.current.group?.set(groupId, { data: group, timestamp: Date.now() });
        setState((prev) => ({ ...prev, currentGroup: group, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load group',
        }));
      }
    },
    [isCacheValid]
  );

  const createGroup = useCallback(async (data: CreateGroupRequest): Promise<Group | null> => {
    try {
      const group = await groupsService.createGroup(data);
      setState((prev) => ({ ...prev, groups: [group, ...prev.groups] }));
      return group;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create group',
      }));
      return null;
    }
  }, []);

  const updateGroup = useCallback(
    async (groupId: string, data: UpdateGroupRequest): Promise<Group | null> => {
      try {
        const group = await groupsService.updateGroup(groupId, data);
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((g) => (g.id === groupId ? group : g)),
          currentGroup: prev.currentGroup?.id === groupId ? group : prev.currentGroup,
        }));
        cacheRef.current.group?.set(groupId, { data: group, timestamp: Date.now() });
        return group;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update group',
        }));
        return null;
      }
    },
    []
  );

  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      await groupsService.deleteGroup(groupId);
      setState((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== groupId),
        currentGroup: prev.currentGroup?.id === groupId ? null : prev.currentGroup,
      }));
      cacheRef.current.group?.delete(groupId);
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete group',
      }));
      return false;
    }
  }, []);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      const group = await groupsService.joinGroup(groupId);
      setState((prev) => ({
        ...prev,
        groups: [group, ...prev.groups.filter((g) => g.id !== groupId)],
        currentGroup: prev.currentGroup?.id === groupId ? group : prev.currentGroup,
      }));
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join group',
      }));
      return false;
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      await groupsService.leaveGroup(groupId);
      setState((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== groupId),
        currentGroup: prev.currentGroup?.id === groupId ? null : prev.currentGroup,
      }));
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to leave group',
      }));
      return false;
    }
  }, []);

  // ==================== MEMBER FUNCTIONS ====================

  const loadMembers = useCallback(
    async (
      groupId: string,
      options?: { role?: GroupRole; status?: 'online' | 'offline' | 'all' }
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const members = await groupsService.getGroupMembers(groupId, options);
        setState((prev) => ({ ...prev, members, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load members',
        }));
      }
    },
    []
  );

  const updateMemberRole = useCallback(
    async (groupId: string, userId: string, role: GroupRole): Promise<boolean> => {
      try {
        const member = await groupsService.updateMemberRole(groupId, userId, role);
        setState((prev) => ({
          ...prev,
          members: prev.members.map((m) => (m.userId === userId ? member : m)),
        }));
        return true;
      } catch (error) {
        console.error('Failed to update member role:', error);
        return false;
      }
    },
    []
  );

  const kickMember = useCallback(
    async (groupId: string, userId: string, reason?: string): Promise<boolean> => {
      try {
        await groupsService.kickMember(groupId, userId, reason);
        setState((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.userId !== userId),
        }));
        return true;
      } catch (error) {
        console.error('Failed to kick member:', error);
        return false;
      }
    },
    []
  );

  const banMember = useCallback(
    async (
      groupId: string,
      userId: string,
      options?: { reason?: string; duration?: number }
    ): Promise<boolean> => {
      try {
        await groupsService.banMember(groupId, userId, options);
        setState((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.userId !== userId),
        }));
        return true;
      } catch (error) {
        console.error('Failed to ban member:', error);
        return false;
      }
    },
    []
  );

  // ==================== CHANNEL FUNCTIONS ====================

  const loadChannels = useCallback(async (groupId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const channels = await groupsService.getGroupChannels(groupId);
      setState((prev) => ({ ...prev, channels, isLoading: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load channels',
      }));
    }
  }, []);

  const createChannel = useCallback(
    async (
      groupId: string,
      data: { name: string; type: 'text' | 'voice' | 'announcement' | 'forum'; categoryId?: string }
    ): Promise<GroupChannel | null> => {
      try {
        const channel = await groupsService.createChannel(groupId, data);
        // Refresh channels to update state
        await loadChannels(groupId);
        return channel;
      } catch (error) {
        console.error('Failed to create channel:', error);
        return null;
      }
    },
    [loadChannels]
  );

  // ==================== INVITE FUNCTIONS ====================

  const loadInvites = useCallback(async (groupId: string) => {
    try {
      const invites = await groupsService.getGroupInvites(groupId);
      setState((prev) => ({ ...prev, invites }));
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  }, []);

  const createInvite = useCallback(
    async (
      groupId: string,
      options?: { maxUses?: number; expiresIn?: number }
    ): Promise<GroupInvite | null> => {
      try {
        const invite = await groupsService.createGroupInvite(groupId, options);
        setState((prev) => ({ ...prev, invites: [invite, ...prev.invites] }));
        return invite;
      } catch (error) {
        console.error('Failed to create invite:', error);
        return null;
      }
    },
    []
  );

  const deleteInvite = useCallback(async (groupId: string, inviteId: string): Promise<boolean> => {
    try {
      await groupsService.deleteGroupInvite(groupId, inviteId);
      setState((prev) => ({
        ...prev,
        invites: prev.invites.filter((i) => i.id !== inviteId),
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete invite:', error);
      return false;
    }
  }, []);

  const joinByInvite = useCallback(async (code: string): Promise<Group | null> => {
    try {
      const group = await groupsService.joinGroupByInvite(code);
      setState((prev) => ({
        ...prev,
        groups: [group, ...prev.groups.filter((g) => g.id !== group.id)],
      }));
      return group;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join group',
      }));
      return null;
    }
  }, []);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoLoad) {
      if (isCacheValid(cacheRef.current.groups)) {
        setState((prev) => ({ ...prev, groups: cacheRef.current.groups!.data }));
      } else {
        refreshGroups();
      }
    }
  }, [autoLoad, refreshGroups, isCacheValid]);

  useEffect(() => {
    if (groupId) {
      loadGroup(groupId);
    }
  }, [groupId, loadGroup]);

  return {
    ...state,
    refreshGroups,
    getPublicGroups,
    getFeaturedGroups,
    loadGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
    loadMembers,
    updateMemberRole,
    kickMember,
    banMember,
    loadChannels,
    createChannel,
    loadInvites,
    createInvite,
    deleteInvite,
    joinByInvite,
  };
}

export default useGroups;
