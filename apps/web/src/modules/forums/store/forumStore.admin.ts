/**
 * Forum Store — Admin Actions
 *
 * User groups, warnings, bans, moderation queue, and reports.
 *
 * @module modules/forums/store/forumStore.admin
 */

import { createLogger } from '@/lib/logger';
import { api, ensureArray, ensureObject } from './forumStore.utils';
import type {
  UserGroup,
  UserWarning,
  Ban,
  ModerationQueueItem,
  Report,
  CreateUserGroupData,
  UpdateUserGroupData,
  CreateBanData,
  CreateReportData,
  ForumState,
} from './forumStore.types';

const logger = createLogger('ForumStore:Admin');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create admin actions (user groups, warnings, bans, queue, reports). */
export function createAdminActions(set: Set, _get: Get) {
  return {
    // ── User Groups ──────────────────────────────────────────────────

    fetchUserGroups: async () => {
      try {
        const response = await api.get('/api/v1/user-groups');
        set({ userGroups: ensureArray<UserGroup>(response.data, 'user_groups') });
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchUserGroups');
      }
    },

    createUserGroup: async (data: CreateUserGroupData) => {
      try {
        const response = await api.post('/api/v1/admin/user-groups', {
          name: data.name,
          description: data.description,
          color: data.color,
          type: data.type,
          permissions: data.permissions,
        });

         
        const group = response.data.user_group as UserGroup; // safe downcast – API response
        const MAX_USER_GROUPS = 50;
        set((state) => ({ userGroups: [...state.userGroups, group].slice(-MAX_USER_GROUPS) }));
        return group;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'createUserGroup');
        throw error;
      }
    },

    updateUserGroup: async (groupId: string, data: UpdateUserGroupData) => {
      try {
        const response = await api.put(`/api/v1/admin/user-groups/${groupId}`, {
          name: data.name,
          description: data.description,
          color: data.color,
          permissions: data.permissions,
        });

         
        const group = response.data.user_group as UserGroup; // safe downcast – API response
        set((state) => ({
          userGroups: state.userGroups.map((g) => (g.id === groupId ? group : g)),
        }));
        return group;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'updateUserGroup');
        throw error;
      }
    },

    deleteUserGroup: async (groupId: string) => {
      try {
        await api.delete(`/api/v1/admin/user-groups/${groupId}`);
        set((state) => ({ userGroups: state.userGroups.filter((g) => g.id !== groupId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteUserGroup');
        throw error;
      }
    },

    // ── Warnings & Bans ──────────────────────────────────────────────

    warnUser: async (userId: string, warningTypeId: string, reason: string) => {
      try {
        const response = await api.post(`/api/v1/admin/users/${userId}/warnings`, {
          warning_type_id: warningTypeId,
          reason,
        });

         
        return response.data.warning as UserWarning; // safe downcast – API response
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'warnUser');
        throw error;
      }
    },

    fetchUserWarnings: async (userId: string) => {
      try {
        const response = await api.get(`/api/v1/admin/users/${userId}/warnings`);
        return ensureArray<UserWarning>(response.data, 'warnings');
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchUserWarnings'
        );
        return [];
      }
    },

    banUser: async (data: CreateBanData) => {
      try {
        const response = await api.post('/api/v1/admin/bans', {
          user_id: data.userId,
          username: data.username,
          ip_address: data.ipAddress,
          email: data.email,
          reason: data.reason,
          expires_at: data.expiresAt,
          notes: data.notes,
        });

         
        return response.data.ban as Ban; // safe downcast – API response
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'banUser');
        throw error;
      }
    },

    unbanUser: async (banId: string) => {
      try {
        await api.delete(`/api/v1/admin/bans/${banId}`);
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'unbanUser');
        throw error;
      }
    },

    fetchBans: async () => {
      try {
        const response = await api.get('/api/v1/admin/bans');
        return ensureArray<Ban>(response.data, 'bans');
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchBans');
        return [];
      }
    },

    // ── Moderation Queue ─────────────────────────────────────────────

    fetchModerationQueue: async () => {
      try {
        const response = await api.get('/api/v1/admin/moderation/queue');
        set({
          moderationQueue: ensureArray<ModerationQueueItem>(response.data, 'items'),
        });
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchModerationQueue'
        );
      }
    },

    approveQueueItem: async (itemId: string) => {
      try {
        await api.post(`/api/v1/admin/moderation/queue/${itemId}/approve`);
        set((state) => ({
          moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId),
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'approveQueueItem');
        throw error;
      }
    },

    rejectQueueItem: async (itemId: string, reason?: string) => {
      try {
        await api.post(`/api/v1/admin/moderation/queue/${itemId}/reject`, { reason });
        set((state) => ({
          moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId),
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'rejectQueueItem');
        throw error;
      }
    },

    // ── Reports ──────────────────────────────────────────────────────

    reportItem: async (data: CreateReportData) => {
      const payload: Record<string, unknown> = {
        reason: data.reason,
        details: data.details,
        report_type: data.reportType,
        item_id: data.itemId,
      };
      const response = await api.post('/api/v1/reports', { report: payload });
      const report = ensureObject<Report>(response.data, 'report');
      if (report) {
        const MAX_REPORTS = 200;
        set((state) => {
          const updated = [...state.reports, report];
          return {
            reports:
              updated.length > MAX_REPORTS ? updated.slice(updated.length - MAX_REPORTS) : updated,
          };
        });
        return report;
      }
      throw new Error('Failed to submit report');
    },

    fetchReports: async (status?: Report['status']) => {
      try {
        const params = status ? { status } : {};
        const response = await api.get('/api/v1/admin/reports', { params });
        return ensureArray<Report>(response.data, 'reports');
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchReports');
        return [];
      }
    },

    assignReport: async (reportId: string, moderatorId: string) => {
      try {
        await api.post(`/api/v1/admin/reports/${reportId}/assign`, {
          moderator_id: moderatorId,
        });
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'assignReport');
        throw error;
      }
    },

    resolveReport: async (reportId: string, resolution: string) => {
      try {
        await api.post(`/api/v1/admin/reports/${reportId}/resolve`, { resolution });
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'resolveReport');
        throw error;
      }
    },
  };
}
