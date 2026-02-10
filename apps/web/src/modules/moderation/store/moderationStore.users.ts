/**
 * Moderation Store — User Actions
 * @module modules/moderation/store
 *
 * User moderation stats, warnings, bans, and warning types.
 */

import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type {
  Ban,
  ModerationState,
  UserModerationStats,
  UserWarning,
  WarningType,
} from './moderationStore.types';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;

const logger = createLogger('ModerationStore:Users');

export function createUserActions(set: Set) {
  return {
    fetchUserModerationStats: async (userId: string) => {
      try {
        const response = await api.get(`/api/v1/admin/users/${userId}/moderation`);
        const data = response.data;
        const stats: UserModerationStats = {
          userId,
          totalWarnings: data.total_warnings || 0,
          activeWarnings: data.active_warnings || 0,
          warningPoints: data.warning_points || 0,
          isBanned: data.is_banned || false,
          isSuspended: data.is_suspended || false,
          suspendedUntil: data.suspended_until || null,
          postCount: data.post_count || 0,
          reportedCount: data.reported_count || 0,
          approvalRate: data.approval_rate || 100,
        };
        set({ currentUserStats: stats });
        return stats;
      } catch (error) {
        logger.error(' Failed to fetch user moderation stats:', error);
        throw error;
      }
    },

    fetchUserWarnings: async (userId: string) => {
      try {
        const response = await api.get(`/api/v1/admin/users/${userId}/warnings`);
        const warnings = (ensureArray(response.data, 'warnings') as Record<string, unknown>[]).map(
          (w) => ({
            id: w.id as string,
            userId: w.user_id as string,
            username: w.username as string,
            warningTypeId: w.warning_type_id as string,
            warningTypeName: w.warning_type_name as string,
            points: w.points as number,
            reason: w.reason as string,
            notes: w.notes as string | undefined,
            issuedById: w.issued_by_id as string,
            issuedByUsername: w.issued_by_username as string,
            issuedAt: w.issued_at as string,
            expiresAt: w.expires_at as string | null,
            isActive: w.is_active as boolean,
            isRevoked: w.is_revoked as boolean,
            revokedById: w.revoked_by_id as string | undefined,
            revokedAt: w.revoked_at as string | undefined,
            revokeReason: w.revoke_reason as string | undefined,
          })
        );
        set({ currentUserWarnings: warnings });
        return warnings;
      } catch (error) {
        logger.error(' Failed to fetch user warnings:', error);
        throw error;
      }
    },

    issueWarning: async (userId: string, warningTypeId: string, reason: string, notes?: string) => {
      try {
        const response = await api.post(`/api/v1/admin/users/${userId}/warnings`, {
          warning_type_id: warningTypeId,
          reason,
          notes,
        });
        const warning = ensureObject(response.data, 'warning') as Record<string, unknown>;
        const newWarning: UserWarning = {
          id: warning.id as string,
          userId,
          username: warning.username as string,
          warningTypeId,
          warningTypeName: warning.warning_type_name as string,
          points: warning.points as number,
          reason,
          notes,
          issuedById: warning.issued_by_id as string,
          issuedByUsername: warning.issued_by_username as string,
          issuedAt: (warning.issued_at as string) || new Date().toISOString(),
          expiresAt: warning.expires_at as string | null,
          isActive: true,
          isRevoked: false,
        };
        const MAX_WARNINGS = 200;
        set((state) => {
          const updated = [newWarning, ...state.currentUserWarnings];
          return { currentUserWarnings: updated.length > MAX_WARNINGS ? updated.slice(0, MAX_WARNINGS) : updated };
        });
        return newWarning;
      } catch (error) {
        logger.error(' Failed to issue warning:', error);
        throw error;
      }
    },

    revokeWarning: async (warningId: string, reason: string) => {
      try {
        await api.post(`/api/v1/admin/warnings/${warningId}/revoke`, { reason });
        set((state) => ({
          currentUserWarnings: state.currentUserWarnings.map((w) =>
            w.id === warningId
              ? { ...w, isActive: false, isRevoked: true, revokeReason: reason }
              : w
          ),
        }));
      } catch (error) {
        logger.error(' Failed to revoke warning:', error);
        throw error;
      }
    },

    // ========================================
    // BANS
    // ========================================

    fetchBans: async (filters: { active?: boolean } = {}) => {
      set({ isLoadingBans: true });
      try {
        const params: Record<string, string> = {};
        if (filters.active !== undefined) params.active = String(filters.active);

        const response = await api.get('/api/v1/admin/bans', { params });
        const bans = (ensureArray(response.data, 'bans') as Record<string, unknown>[]).map((b) => ({
          id: b.id as string,
          userId: b.user_id as string | null,
          username: b.username as string | null,
          email: b.email as string | null,
          ipAddress: b.ip_address as string | null,
          reason: b.reason as string,
          notes: b.notes as string | undefined,
          bannedById: b.banned_by_id as string,
          bannedByUsername: b.banned_by_username as string,
          bannedAt: b.banned_at as string,
          expiresAt: b.expires_at as string | null,
          isActive: b.is_active as boolean,
          isLifted: b.is_lifted as boolean,
          liftedById: b.lifted_by_id as string | undefined,
          liftedAt: b.lifted_at as string | undefined,
          liftReason: b.lift_reason as string | undefined,
        }));
        set({ bans, isLoadingBans: false });
      } catch (error) {
        logger.error(' Failed to fetch bans:', error);
        set({ isLoadingBans: false });
        throw error;
      }
    },

    banUser: async (data: {
      userId?: string;
      username?: string;
      email?: string;
      ipAddress?: string;
      reason: string;
      expiresAt?: string | null;
      notes?: string;
    }) => {
      try {
        const response = await api.post('/api/v1/admin/bans', {
          user_id: data.userId,
          username: data.username,
          email: data.email,
          ip_address: data.ipAddress,
          reason: data.reason,
          expires_at: data.expiresAt,
          notes: data.notes,
        });
        const ban = ensureObject(response.data, 'ban') as Record<string, unknown>;
        const newBan: Ban = {
          id: ban.id as string,
          userId: data.userId || null,
          username: data.username || null,
          email: data.email || null,
          ipAddress: data.ipAddress || null,
          reason: data.reason,
          notes: data.notes,
          bannedById: ban.banned_by_id as string,
          bannedByUsername: ban.banned_by_username as string,
          bannedAt: (ban.banned_at as string) || new Date().toISOString(),
          expiresAt: data.expiresAt || null,
          isActive: true,
          isLifted: false,
        };
        const MAX_BANS = 200;
        set((state) => {
          const updated = [newBan, ...state.bans];
          return { bans: updated.length > MAX_BANS ? updated.slice(0, MAX_BANS) : updated };
        });
        return newBan;
      } catch (error) {
        logger.error(' Failed to ban user:', error);
        throw error;
      }
    },

    liftBan: async (banId: string, reason: string) => {
      try {
        await api.post(`/api/v1/admin/bans/${banId}/lift`, { reason });
        set((state) => ({
          bans: state.bans.map((b) =>
            b.id === banId ? { ...b, isActive: false, isLifted: true, liftReason: reason } : b
          ),
        }));
      } catch (error) {
        logger.error(' Failed to lift ban:', error);
        throw error;
      }
    },

    // ========================================
    // WARNING TYPES
    // ========================================

    fetchWarningTypes: async () => {
      try {
        const response = await api.get('/api/v1/admin/warning-types');
        const types = (
          ensureArray(response.data, 'warning_types') as Record<string, unknown>[]
        ).map((t) => ({
          id: t.id as string,
          name: t.name as string,
          description: (t.description as string) || '',
          points: t.points as number,
          expiryDays: t.expiry_days as number,
          action: t.action as WarningType['action'],
          actionThreshold: t.action_threshold as number | undefined,
        }));
        set({ warningTypes: types });
      } catch (error) {
        logger.error(' Failed to fetch warning types:', error);
        throw error;
      }
    },
  };
}
