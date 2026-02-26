/**
 * Moderation Store — User Actions
 * @module modules/moderation/store
 *
 * User moderation stats, warnings, bans, and warning types.
 */

import { api } from '@/lib/api';
import { ensureArray, ensureObject, isRecord } from '@/lib/apiUtils';
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

/**
 * unknown for the moderation module.
 */
/**
 * Creates a new user actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
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
        const warnings = ensureArray(response.data, 'warnings')
          .filter(isRecord)
          .map((w) => ({
            id: String(w.id),
            userId: String(w.user_id),
            username: String(w.username),
            warningTypeId: String(w.warning_type_id),
            warningTypeName: String(w.warning_type_name),
            points: Number(w.points),
            reason: String(w.reason),
            notes: typeof w.notes === 'string' ? w.notes : undefined,
            issuedById: String(w.issued_by_id),
            issuedByUsername: String(w.issued_by_username),
            issuedAt: String(w.issued_at),
            expiresAt: typeof w.expires_at === 'string' ? w.expires_at : null,
            isActive: Boolean(w.is_active),
            isRevoked: Boolean(w.is_revoked),
            revokedById: typeof w.revoked_by_id === 'string' ? w.revoked_by_id : undefined,
            revokedAt: typeof w.revoked_at === 'string' ? w.revoked_at : undefined,
            revokeReason: typeof w.revoke_reason === 'string' ? w.revoke_reason : undefined,
          }));
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
        const rawWarning = ensureObject(response.data, 'warning');
        const warning: Record<string, unknown> = isRecord(rawWarning) ? rawWarning : {};
        const newWarning: UserWarning = {
          id: String(warning.id),
          userId,
          username: String(warning.username),
          warningTypeId,
          warningTypeName: String(warning.warning_type_name),
          points: Number(warning.points),
          reason,
          notes,
          issuedById: String(warning.issued_by_id),
          issuedByUsername: String(warning.issued_by_username),
          issuedAt:
            typeof warning.issued_at === 'string' ? warning.issued_at : new Date().toISOString(),
          expiresAt: typeof warning.expires_at === 'string' ? warning.expires_at : null,
          isActive: true,
          isRevoked: false,
        };
        const MAX_WARNINGS = 200;
        set((state) => {
          const updated = [newWarning, ...state.currentUserWarnings];
          return {
            currentUserWarnings:
              updated.length > MAX_WARNINGS ? updated.slice(0, MAX_WARNINGS) : updated,
          };
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
        const bans = ensureArray(response.data, 'bans')
          .filter(isRecord)
          .map((b) => ({
            id: String(b.id),
            userId: typeof b.user_id === 'string' ? b.user_id : null,
            username: typeof b.username === 'string' ? b.username : null,
            email: typeof b.email === 'string' ? b.email : null,
            ipAddress: typeof b.ip_address === 'string' ? b.ip_address : null,
            reason: String(b.reason),
            notes: typeof b.notes === 'string' ? b.notes : undefined,
            bannedById: String(b.banned_by_id),
            bannedByUsername: String(b.banned_by_username),
            bannedAt: String(b.banned_at),
            expiresAt: typeof b.expires_at === 'string' ? b.expires_at : null,
            isActive: Boolean(b.is_active),
            isLifted: Boolean(b.is_lifted),
            liftedById: typeof b.lifted_by_id === 'string' ? b.lifted_by_id : undefined,
            liftedAt: typeof b.lifted_at === 'string' ? b.lifted_at : undefined,
            liftReason: typeof b.lift_reason === 'string' ? b.lift_reason : undefined,
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
        const rawBan = ensureObject(response.data, 'ban');
        const ban: Record<string, unknown> = isRecord(rawBan) ? rawBan : {};
        const newBan: Ban = {
          id: String(ban.id),
          userId: data.userId || null,
          username: data.username || null,
          email: data.email || null,
          ipAddress: data.ipAddress || null,
          reason: data.reason,
          notes: data.notes,
          bannedById: String(ban.banned_by_id),
          bannedByUsername: String(ban.banned_by_username),
          bannedAt: typeof ban.banned_at === 'string' ? ban.banned_at : new Date().toISOString(),
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
        const types = ensureArray(response.data, 'warning_types')
          .filter(isRecord)
          .map((t) => ({
            id: String(t.id),
            name: String(t.name),
            description: typeof t.description === 'string' ? t.description : '',
            points: Number(t.points),
            expiryDays: Number(t.expiry_days),
            action: t.action as WarningType['action'], // safe downcast – discriminated union from API
            actionThreshold:
              typeof t.action_threshold === 'number' ? t.action_threshold : undefined,
          }));
        set({ warningTypes: types });
      } catch (error) {
        logger.error(' Failed to fetch warning types:', error);
        throw error;
      }
    },
  };
}
