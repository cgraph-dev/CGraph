/**
 * Forum Store — Permissions Slice
 *
 * Dedicated store for board permissions, permission templates, and forum permissions.
 * Wires to PermissionsController endpoints.
 *
 * @module modules/forums/store/forumStore.permissions
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStore:Permissions');

// ── Types ────────────────────────────────────────────────────────────────

export type PermLevel = 'inherit' | 'allow' | 'deny';

export interface BoardPermissionLocal {
  id: string;
  boardId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPermissionLocal {
  id: string;
  forumId: string;
  groupId: string;
  groupName: string;
  groupColor: string | null;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionTemplateLocal {
  id: string;
  forumId: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, PermLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface EffectivePermResult {
  permission: string;
  level: PermLevel;
  source: 'board' | 'forum' | 'group' | 'default';
  inheritedFrom?: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  permissions: Record<string, PermLevel>;
}

export interface PermissionsState {
  // State
  boardPermissions: BoardPermissionLocal[];
  forumPermissions: ForumPermissionLocal[];
  templates: PermissionTemplateLocal[];
  effectivePermissions: EffectivePermResult[];
  isLoadingBoardPerms: boolean;
  isLoadingTemplates: boolean;
  isLoadingForumPerms: boolean;

  // Board permissions
  fetchBoardPermissions: (boardId: string) => Promise<void>;
  updateBoardPermission: (
    boardId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => Promise<void>;
  resetBoardPermissions: (boardId: string) => Promise<void>;

  // Forum permissions
  fetchForumPermissions: (forumId: string) => Promise<void>;
  updateForumPermission: (
    forumId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => Promise<void>;

  // Templates
  fetchTemplates: (forumId: string) => Promise<void>;
  createTemplate: (forumId: string, data: CreateTemplateData) => Promise<PermissionTemplateLocal>;
  deleteTemplate: (forumId: string, templateId: string) => Promise<void>;
  applyTemplate: (boardId: string, templateId: string) => Promise<void>;
  duplicateTemplate: (
    forumId: string,
    templateId: string,
    newName: string
  ) => Promise<PermissionTemplateLocal>;

  // Check
  checkPermission: (
    boardId: string,
    groupId: string,
    permission: string
  ) => Promise<EffectivePermResult>;
  fetchEffectivePermissions: (boardId: string, groupId: string) => Promise<void>;

  reset: () => void;
}

// ── API helper ───────────────────────────────────────────────────────────

async function apiCall<T>(method: string, url: string, data?: unknown): Promise<T> {
  const { default: axios } = await import('axios');
  const response = await axios({ method, url, data });
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.data as T;
}

// ── Mappers ──────────────────────────────────────────────────────────────

function mapBoardPermission(raw: Record<string, unknown>): BoardPermissionLocal {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: raw.id as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    boardId: (raw.board_id as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupId: (raw.group_id as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupName: (raw.group_name as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupColor: (raw.group_color as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    permissions: (raw.permissions as Record<string, PermLevel>) || {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (raw.created_at as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    updatedAt: (raw.updated_at as string) || '',
  };
}

function mapForumPermission(raw: Record<string, unknown>): ForumPermissionLocal {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: raw.id as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    forumId: (raw.forum_id as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupId: (raw.group_id as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupName: (raw.group_name as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    groupColor: (raw.group_color as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    permissions: (raw.permissions as Record<string, PermLevel>) || {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (raw.created_at as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    updatedAt: (raw.updated_at as string) || '',
  };
}

function mapTemplate(raw: Record<string, unknown>): PermissionTemplateLocal {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: raw.id as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    forumId: (raw.forum_id as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    name: (raw.name as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    description: (raw.description as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isSystem: (raw.is_system as boolean) || false,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    permissions: (raw.permissions as Record<string, PermLevel>) || {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (raw.created_at as string) || '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    updatedAt: (raw.updated_at as string) || '',
  };
}

// ── Store ────────────────────────────────────────────────────────────────

const initialState = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  boardPermissions: [] as BoardPermissionLocal[],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  forumPermissions: [] as ForumPermissionLocal[],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  templates: [] as PermissionTemplateLocal[],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  effectivePermissions: [] as EffectivePermResult[],
  isLoadingBoardPerms: false,
  isLoadingTemplates: false,
  isLoadingForumPerms: false,
};

export const usePermissionsStore = create<PermissionsState>((set) => ({
  ...initialState,

  // ── Board Permissions ────────────────────────────────────────────────

  fetchBoardPermissions: async (boardId: string) => {
    set({ isLoadingBoardPerms: true });
    try {
      const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/boards/${boardId}/permissions`
      );
      set({
        boardPermissions: (res.permissions || []).map(mapBoardPermission),
        isLoadingBoardPerms: false,
      });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchBoardPermissions'
      );
      set({ isLoadingBoardPerms: false });
    }
  },

  updateBoardPermission: async (
    boardId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => {
    const res = await apiCall<{ permission: Record<string, unknown> }>(
      'put',
      `/api/v1/boards/${boardId}/permissions`,
      { group_id: groupId, permissions }
    );
    const perm = mapBoardPermission(res.permission);
    set((s) => ({
      boardPermissions: s.boardPermissions.some((p) => p.groupId === groupId)
        ? s.boardPermissions.map((p) => (p.groupId === groupId ? perm : p))
        : [...s.boardPermissions, perm],
    }));
  },

  resetBoardPermissions: async (boardId: string) => {
    await apiCall('delete', `/api/v1/boards/${boardId}/permissions/reset`);
    set({ boardPermissions: [] });
  },

  // ── Forum Permissions ────────────────────────────────────────────────

  fetchForumPermissions: async (forumId: string) => {
    set({ isLoadingForumPerms: true });
    try {
      const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/permissions`
      );
      set({
        forumPermissions: (res.permissions || []).map(mapForumPermission),
        isLoadingForumPerms: false,
      });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchForumPermissions'
      );
      set({ isLoadingForumPerms: false });
    }
  },

  updateForumPermission: async (
    forumId: string,
    groupId: string,
    permissions: Record<string, PermLevel>
  ) => {
    const res = await apiCall<{ permission: Record<string, unknown> }>(
      'put',
      `/api/v1/forums/${forumId}/permissions`,
      { group_id: groupId, permissions }
    );
    const perm = mapForumPermission(res.permission);
    set((s) => ({
      forumPermissions: s.forumPermissions.some((p) => p.groupId === groupId)
        ? s.forumPermissions.map((p) => (p.groupId === groupId ? perm : p))
        : [...s.forumPermissions, perm],
    }));
  },

  // ── Templates ────────────────────────────────────────────────────────

  fetchTemplates: async (forumId: string) => {
    set({ isLoadingTemplates: true });
    try {
      const res = await apiCall<{ templates: Record<string, unknown>[] }>(
        'get',
        `/api/v1/forums/${forumId}/permission-templates`
      );
      set({
        templates: (res.templates || []).map(mapTemplate),
        isLoadingTemplates: false,
      });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchTemplates');
      set({ isLoadingTemplates: false });
    }
  },

  createTemplate: async (forumId: string, data: CreateTemplateData) => {
    const res = await apiCall<{ template: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/permission-templates`,
      { template: data }
    );
    const tmpl = mapTemplate(res.template);
    set((s) => ({ templates: [...s.templates, tmpl] }));
    return tmpl;
  },

  deleteTemplate: async (forumId: string, templateId: string) => {
    await apiCall('delete', `/api/v1/forums/${forumId}/permission-templates/${templateId}`);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) }));
  },

  applyTemplate: async (boardId: string, templateId: string) => {
    await apiCall('post', `/api/v1/boards/${boardId}/permissions/apply-template`, {
      template_id: templateId,
    });
    // Re-fetch board permissions after applying
    const res = await apiCall<{ permissions: Record<string, unknown>[] }>(
      'get',
      `/api/v1/boards/${boardId}/permissions`
    );
    set({ boardPermissions: (res.permissions || []).map(mapBoardPermission) });
  },

  duplicateTemplate: async (forumId: string, templateId: string, newName: string) => {
    const res = await apiCall<{ template: Record<string, unknown> }>(
      'post',
      `/api/v1/forums/${forumId}/permission-templates/${templateId}/duplicate`,
      { name: newName }
    );
    const tmpl = mapTemplate(res.template);
    set((s) => ({ templates: [...s.templates, tmpl] }));
    return tmpl;
  },

  // ── Check ────────────────────────────────────────────────────────────

  checkPermission: async (boardId: string, groupId: string, permission: string) => {
    const res = await apiCall<{ effective: Record<string, unknown> }>(
      'get',
      `/api/v1/boards/${boardId}/permissions/check?group_id=${groupId}&permission=${permission}`
    );
    return {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      permission: (res.effective?.permission as string) || permission,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      level: (res.effective?.level as PermLevel) || 'inherit',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      source: (res.effective?.source as EffectivePermResult['source']) || 'default',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      inheritedFrom: (res.effective?.inherited_from as string) || undefined,
    };
  },

  fetchEffectivePermissions: async (boardId: string, groupId: string) => {
    try {
      const res = await apiCall<{ effective_permissions: Record<string, unknown>[] }>(
        'get',
        `/api/v1/boards/${boardId}/permissions/effective?group_id=${groupId}`
      );
      const perms: EffectivePermResult[] = (res.effective_permissions || []).map((e) => ({
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        permission: (e.permission as string) || '',
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        level: (e.level as PermLevel) || 'inherit',
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        source: (e.source as EffectivePermResult['source']) || 'default',
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        inheritedFrom: (e.inherited_from as string) || undefined,
      }));
      set({ effectivePermissions: perms });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchEffectivePermissions'
      );
    }
  },

  reset: () => set({ ...initialState }),
}));
