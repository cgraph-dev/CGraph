/**
 * Moderation Store — Log Actions
 * @module modules/moderation/store
 *
 * Moderation log fetching and action logging.
 */

import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { ModerationLogEntry, ModerationState } from './moderationStore.types';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;

const logger = createLogger('ModerationStore:Log');

/**
 * unknown for the moderation module.
 */
/**
 * Creates a new log actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createLogActions(set: Set) {
  return {
    fetchModerationLog: async (
      filters: {
        moderatorId?: string;
        action?: string;
        targetType?: string;
        page?: number;
      } = {}
    ) => {
      set({ isLoadingLog: true });
      try {
        const params: Record<string, string | number> = {};
        if (filters.moderatorId) params.moderator_id = filters.moderatorId;
        if (filters.action) params.action = filters.action;
        if (filters.targetType) params.target_type = filters.targetType;
        if (filters.page) params.page = filters.page;

        const response = await api.get('/api/v1/admin/moderation/log', { params });

         
        const entries = (ensureArray(response.data, 'entries') as Record<string, unknown>[]).map(
          // safe downcast – API response field
          (e) => ({
             
            id: e.id as string, // safe downcast – API response field

             
            action: e.action as string, // safe downcast – API response field

             
            targetType: e.target_type as ModerationLogEntry['targetType'], // safe downcast – API response field

             
            targetId: e.target_id as string, // safe downcast – API response field

             
            targetTitle: e.target_title as string | undefined, // safe downcast – API response field

             
            moderatorId: e.moderator_id as string, // safe downcast – API response field

             
            moderatorUsername: e.moderator_username as string, // safe downcast – API response field

             
            reason: e.reason as string | undefined, // safe downcast – API response field

             
            details: e.details as Record<string, unknown> | undefined, // safe downcast – API response field

             
            createdAt: (e.created_at as string) || (e.inserted_at as string), // safe downcast – API response field
          })
        );
        set({ moderationLog: entries, isLoadingLog: false });
      } catch (error) {
        logger.error(' Failed to fetch moderation log:', error);
        set({ isLoadingLog: false });
        throw error;
      }
    },

    logModAction: async (
      action: string,
      targetType: string,
      targetId: string,
      reason?: string,
      details?: Record<string, unknown>
    ) => {
      try {
        await api.post('/api/v1/admin/moderation/log', {
          action,
          target_type: targetType,
          target_id: targetId,
          reason,
          details,
        });
      } catch (error) {
        // Don't throw - logging failures shouldn't break the main action
        logger.error(' Failed to log moderation action:', error);
      }
    },
  };
}
