/**
 * Admin Event Actions
 *
 * Event fetch, filter, create, update, delete, and status change actions.
 *
 * @module modules/admin/store/admin-event-actions
 */

import type { AdminStore, AdminEvent, EventStatus } from './adminStore.types';

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;
type Get = () => AdminStore;

/**
 * unknown for the admin module.
 */
/**
 * Creates a new event actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createEventActions(set: Set, get: Get) {
  return {
    fetchEvents: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get('/api/v1/admin/events');
        set({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          events: (response.data as AdminEvent[]) /* safe downcast – API response */
            .map((event) => ({
              ...event,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              createdAt: new Date(event.createdAt),
              updatedAt: new Date(event.updatedAt),
            })),
          isLoading: false,
        });
      } catch {
        set({
          error: 'Failed to load events',
          isLoading: false,
        });
      }
    },

    setEventFilters: (filters: Parameters<AdminStore['setEventFilters']>[0]) =>
      set((state) => ({
        eventFilters: { ...state.eventFilters, ...filters },
      })),

    createEvent: async (event: Omit<AdminEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isLoading: true });
      try {
        const { api } = await import('@/lib/api');
        const response = await api.post('/api/v1/admin/events', event);

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const newEvent = response.data as AdminEvent; // safe downcast – API response
        set((state) => ({
          events: [
            ...state.events,
            {
              ...newEvent,
              startDate: new Date(newEvent.startDate),
              endDate: new Date(newEvent.endDate),
              createdAt: new Date(newEvent.createdAt),
              updatedAt: new Date(newEvent.updatedAt),
            },
          ],
          isLoading: false,
        }));
      } catch {
        set({ isLoading: false, error: 'Failed to create event' });
      }
    },

    updateEvent: async (id: string, updates: Partial<AdminEvent>) => {
      set({ isLoading: true });
      try {
        const { api } = await import('@/lib/api');
        await api.patch(`/api/v1/admin/events/${id}`, updates);
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
          ),
          isLoading: false,
        }));
      } catch {
        set({ isLoading: false, error: 'Failed to update event' });
      }
    },

    deleteEvent: async (id: string) => {
      set({ isLoading: true });
      try {
        const { api } = await import('@/lib/api');
        await api.delete(`/api/v1/admin/events/${id}`);
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
          isLoading: false,
        }));
      } catch {
        set({ isLoading: false, error: 'Failed to delete event' });
      }
    },

    changeEventStatus: async (id: string, status: EventStatus) => {
      await get().updateEvent(id, { status });
    },
  };
}
