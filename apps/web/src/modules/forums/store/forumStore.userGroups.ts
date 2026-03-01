/**
 * Forum Store — User Groups Slice
 *
 * Dedicated store slice for user groups, secondary groups, and auto-rules.
 * Wires to SecondaryGroupsController and group endpoints.
 *
 * @module modules/forums/store/forumStore.userGroups
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStore:UserGroups');

// ── Types ────────────────────────────────────────────────────────────────

export interface ForumUserGroupLocal {
  id: string;
  forumId: string;
  name: string;
  description: string | null;
  color: string | null;
  type: 'system' | 'custom' | 'joinable';
  position: number;
  isDefault: boolean;
  isHidden: boolean;
  isStaff: boolean;
  isSuperMod: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  permissions: Record<string, boolean | number>;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecondaryGroupMember {
  id: string;
  userId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  assignedBy: string | null;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  reason: string | null;
  username?: string;
  displayName?: string;
}

export interface AutoRule {
  id: string;
  forumId: string;
  name: string;
  description: string | null;
  ruleType: 'milestone' | 'time_based' | 'subscription' | 'custom';
  threshold: number;
  targetGroupId: string;
  targetGroupName: string;
  isActive: boolean;
  lastEvaluatedAt: string | null;
  usersAssigned: number;
  criteria: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroupsState {
  // State
  groups: ForumUserGroupLocal[];
  secondaryMembers: SecondaryGroupMember[];
  autoRules: AutoRule[];
  isLoadingGroups: boolean;
  isLoadingMembers: boolean;
  isLoadingRules: boolean;
  selectedGroupId: string | null;

  // Group CRUD
  fetchGroups: (forumId: string) => Promise<void>;
  createGroup: (forumId: string, data: CreateGroupData) => Promise<ForumUserGroupLocal>;
  updateGroup: (forumId: string, groupId: string, data: Partial<CreateGroupData>) => Promise<ForumUserGroupLocal>;
  deleteGroup: (forumId: string, groupId: string) => Promise<void>;
  reorderGroups: (forumId: string, groupIds: string[]) => Promise<void>;
  setSelectedGroup: (groupId: string | null) => void;

  // Secondary groups
  fetchMembers: (forumId: string, groupId: string) => Promise<void>;
  assignSecondaryGroup: (forumId: string, data: AssignSecondaryData) => Promise<void>;
  removeSecondaryGroup: (forumId: string, membershipId: string) => Promise<void>;

  // Auto-rules
  fetchAutoRules: (forumId: string) => Promise<void>;
  createAutoRule: (forumId: string, data: CreateAutoRuleData) => Promise<AutoRule>;
  updateAutoRule: (forumId: string, ruleId: string, data: Partial<CreateAutoRuleData>) => Promise<AutoRule>;
  deleteAutoRule: (forumId: string, ruleId: string) => Promise<void>;
  evaluateRules: (forumId: string) => Promise<{ usersAssigned: number }>;

  reset: () => void;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
  type: 'system' | 'custom' | 'joinable';
  isStaff?: boolean;
  permissions?: Record<string, boolean | number>;
}

export interface AssignSecondaryData {
  userId: string;
  groupId: string;
  expiresAt?: string | null;
  reason?: string;
}

export interface CreateAutoRuleData {
  name: string;
  description?: string;
  ruleType: 'milestone' | 'time_based' | 'subscription' | 'custom';
  threshold: number;
  targetGroupId: string;
  isActive?: boolean;
  criteria?: Record<string, unknown>;
}

// ── API helper ───────────────────────────────────────────────────────────

async function apiCall<T>(method: string, url: string, data?: unknown): Promise<T> {
  const { default: axios } = await import('axios');
  const response = await axios({ method, url, data });
  return response.data as T;
}

// ── Mappers ──────────────────────────────────────────────────────────────

function mapGroup(raw: Record<string, unknown>): ForumUserGroupLocal {
  return {
    id: raw.id as string,
    forumId: (raw.forum_id as string) || '',
    name: raw.name as string,
    description: (raw.description as string) || null,
    color: (raw.color as string) || null,
    type: (raw.type as ForumUserGroupLocal['type']) || 'custom',
    position: (raw.position as number) || 0,
    isDefault: (raw.is_default as boolean) || false,
    isHidden: (raw.is_hidden as boolean) || false,
    isStaff: (raw.is_staff as boolean) || false,
    isSuperMod: (raw.is_super_mod as boolean) || false,
    canModerate: (raw.can_moderate as boolean) || false,
    canAdmin: (raw.can_admin as boolean) || false,
    permissions: (raw.permissions as Record<string, boolean | number>) || {},
    memberCount: (raw.member_count as number) || 0,
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

function mapSecondaryMember(raw: Record<string, unknown>): SecondaryGroupMember {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    groupId: raw.group_id as string,
    groupName: (raw.group_name as string) || '',
    groupColor: (raw.group_color as string) || null,
    assignedBy: (raw.assigned_by as string) || null,
    assignedAt: (raw.assigned_at as string) || '',
    expiresAt: (raw.expires_at as string) || null,
    isActive: (raw.is_active as boolean) ?? true,
    reason: (raw.reason as string) || null,
    username: (raw.username as string) || undefined,
    displayName: (raw.display_name as string) || undefined,
  };
}

function mapAutoRule(raw: Record<string, unknown>): AutoRule {
  return {
    id: raw.id as string,
    forumId: (raw.forum_id as string) || '',
    name: raw.name as string,
    description: (raw.description as string) || null,
    ruleType: (raw.rule_type as AutoRule['ruleType']) || 'milestone',
    threshold: (raw.threshold as number) || 0,
    targetGroupId: (raw.target_group_id as string) || '',
    targetGroupName: (raw.target_group_name as string) || '',
    isActive: (raw.is_active as boolean) ?? true,
    lastEvaluatedAt: (raw.last_evaluated_at as string) || null,
    usersAssigned: (raw.users_assigned as number) || 0,
    criteria: (raw.criteria as Record<string, unknown>) || {},
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

// ── Store ────────────────────────────────────────────────────────────────

const initialState = {
  groups: [] as ForumUserGroupLocal[],
  secondaryMembers: [] as SecondaryGroupMember[],
  autoRules: [] as AutoRule[],
  isLoadingGroups: false,
  isLoadingMembers: false,
  isLoadingRules: false,
  selectedGroupId: null as string | null,
};

export const useUserGroupsStore = create<UserGroupsState>((set) => ({
  ...initialState,

  // ── Group CRUD ───────────────────────────────────────────────────────

  fetchGroups: async (forumId: string) => {
    set({ isLoadingGroups: true });
    try {
      const res = await apiCall<{ user_groups: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/user-groups`,
      );
      const groups = (res.user_groups || []).map(mapGroup).sort((a, b) => a.position - b.position);
      set({ groups, isLoadingGroups: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchGroups');
      set({ isLoadingGroups: false });
    }
  },

  createGroup: async (forumId: string, data: CreateGroupData) => {
    const res = await apiCall<{ user_group: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/user-groups`,
      { user_group: data },
    );
    const group = mapGroup(res.user_group);
    set((s) => ({ groups: [...s.groups, group].sort((a, b) => a.position - b.position) }));
    return group;
  },

  updateGroup: async (forumId: string, groupId: string, data: Partial<CreateGroupData>) => {
    const res = await apiCall<{ user_group: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/user-groups/${groupId}`,
      { user_group: data },
    );
    const group = mapGroup(res.user_group);
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? group : g)),
    }));
    return group;
  },

  deleteGroup: async (forumId: string, groupId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/user-groups/${groupId}`);
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
  },

  reorderGroups: async (forumId: string, groupIds: string[]) => {
    await apiCall('put', `/api/v1/forums/${forumId}/user-groups/reorder`, {
      group_ids: groupIds,
    });
    set((s) => {
      const map = new Map(s.groups.map((g) => [g.id, g]));
      const ordered = groupIds
        .map((id, i) => {
          const g = map.get(id);
          return g ? { ...g, position: i } : null;
        })
        .filter(Boolean) as ForumUserGroupLocal[];
      return { groups: ordered };
    });
  },

  setSelectedGroup: (groupId: string | null) => set({ selectedGroupId: groupId }),

  // ── Secondary Groups ─────────────────────────────────────────────────

  fetchMembers: async (forumId: string, groupId: string) => {
    set({ isLoadingMembers: true });
    try {
      const res = await apiCall<{ members: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/user-groups/${groupId}/members`,
      );
      const members = (res.members || []).map(mapSecondaryMember);
      set({ secondaryMembers: members, isLoadingMembers: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchMembers');
      set({ isLoadingMembers: false });
    }
  },

  assignSecondaryGroup: async (forumId: string, data: AssignSecondaryData) => {
    const res = await apiCall<{ membership: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/secondary-groups`,
      { membership: data },
    );
    const member = mapSecondaryMember(res.membership);
    set((s) => ({ secondaryMembers: [...s.secondaryMembers, member] }));
  },

  removeSecondaryGroup: async (forumId: string, membershipId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/secondary-groups/${membershipId}`);
    set((s) => ({ secondaryMembers: s.secondaryMembers.filter((m) => m.id !== membershipId) }));
  },

  // ── Auto-Rules ──────────────────────────────────────────────────────

  fetchAutoRules: async (forumId: string) => {
    set({ isLoadingRules: true });
    try {
      const res = await apiCall<{ auto_rules: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/auto-rules`,
      );
      set({ autoRules: (res.auto_rules || []).map(mapAutoRule), isLoadingRules: false });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchAutoRules');
      set({ isLoadingRules: false });
    }
  },

  createAutoRule: async (forumId: string, data: CreateAutoRuleData) => {
    const res = await apiCall<{ auto_rule: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/auto-rules`,
      { auto_rule: data },
    );
    const rule = mapAutoRule(res.auto_rule);
    set((s) => ({ autoRules: [...s.autoRules, rule] }));
    return rule;
  },

  updateAutoRule: async (forumId: string, ruleId: string, data: Partial<CreateAutoRuleData>) => {
    const res = await apiCall<{ auto_rule: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/auto-rules/${ruleId}`,
      { auto_rule: data },
    );
    const rule = mapAutoRule(res.auto_rule);
    set((s) => ({
      autoRules: s.autoRules.map((r) => (r.id === ruleId ? rule : r)),
    }));
    return rule;
  },

  deleteAutoRule: async (forumId: string, ruleId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/auto-rules/${ruleId}`);
    set((s) => ({ autoRules: s.autoRules.filter((r) => r.id !== ruleId) }));
  },

  evaluateRules: async (forumId: string) => {
    const res = await apiCall<{ users_assigned: number }>(
      'post',
      `/api/v1/forums/${forumId}/auto-rules/evaluate`,
    );
    // Re-fetch rules to update counts
    const rulesRes = await apiCall<{ auto_rules: Record<string, unknown>[] }>(
      'get',
      `/api/v1/forums/${forumId}/auto-rules`,
    );
    set({ autoRules: (rulesRes.auto_rules || []).map(mapAutoRule) });
    return { usersAssigned: res.users_assigned || 0 };
  },

  reset: () => set({ ...initialState }),
}));
