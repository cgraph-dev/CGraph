/**
 * Calendar RSVP — fetch, submit, and cancel RSVP actions
 */
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

import type { CalendarState, EventRSVP, RSVPStatus } from './calendarStore.types';

const logger = createLogger('calendarStore');

// ========================================
// Zustand slice creator
// ========================================

type SetState = (
  partial: Partial<CalendarState> | ((state: CalendarState) => Partial<CalendarState>)
) => void;
type GetState = () => CalendarState;

/**
 * unknown for the settings module.
 */
/**
 * Creates a new rsvp actions.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createRsvpActions(set: SetState, _get: GetState) {
  return {
    fetchRsvps: async (eventId: string) => {
      try {
        const response = await api.get(`/api/v1/calendar/events/${eventId}/rsvps`);

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const rsvps = (ensureArray(response.data, 'rsvps') as Record<string, unknown>[]).map(
          // safe downcast – API response field
          (r): EventRSVP => ({
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            id: r.id as string, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            eventId: r.event_id as string, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            userId: r.user_id as string, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            username: (r.username as string) || 'Unknown', // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            displayName: (r.display_name as string) || null, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            avatarUrl: (r.avatar_url as string) || null, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            status: (r.status as RSVPStatus) || 'no_response', // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            note: r.note as string | undefined, // safe downcast – API response field

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            respondedAt: (r.responded_at as string) || new Date().toISOString(), // safe downcast – API response field
          })
        );

        set((state) => {
          const updated = new Map(state.eventRsvps);
          updated.set(eventId, rsvps);
          return { eventRsvps: updated };
        });
        return rsvps;
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch RSVPs:', error);
        return [];
      }
    },

    rsvp: async (eventId: string, status: RSVPStatus, note?: string) => {
      try {
        await api.post(`/api/v1/calendar/events/${eventId}/rsvp`, {
          status,
          note,
        });

        // Update local event
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  myRsvp: status,
                  attendeeCount:
                    status === 'going' && e.myRsvp !== 'going'
                      ? e.attendeeCount + 1
                      : status !== 'going' && e.myRsvp === 'going'
                        ? e.attendeeCount - 1
                        : e.attendeeCount,
                }
              : e
          ),
          currentEvent:
            state.currentEvent?.id === eventId
              ? { ...state.currentEvent, myRsvp: status }
              : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to RSVP:', error);
        throw error;
      }
    },

    cancelRsvp: async (eventId: string) => {
      try {
        await api.delete(`/api/v1/calendar/events/${eventId}/rsvp`);

        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  myRsvp: 'no_response',
                  attendeeCount: e.myRsvp === 'going' ? e.attendeeCount - 1 : e.attendeeCount,
                }
              : e
          ),
          currentEvent:
            state.currentEvent?.id === eventId
              ? {
                  ...state.currentEvent,
                  myRsvp: 'no_response',
                }
              : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to cancel RSVP:', error);
        throw error;
      }
    },
  };
}
