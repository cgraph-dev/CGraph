/**
 * Calendar Categories — CRUD actions
 */
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { asString, asNumber, asBool, asOptionalString } from '@/lib/api-utils';

import type { CalendarState, EventCategory } from './calendarStore.types';

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
 * Creates a new category actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createCategoryActions(set: SetState, get: GetState) {
  return {
    fetchCategories: async () => {
      try {
        const response = await api.get('/api/v1/calendar/categories');
        // type assertion: ensureArray returns unknown[], narrowing to Record
        const categories = (
           
          ensureArray(response.data, 'categories') as Record<string, unknown>[]
        ).map((c) => ({
          id: asString(c.id),
          name: asString(c.name, 'Uncategorized'),
          color: asString(c.color, '#6366f1'),
          icon: asOptionalString(c.icon),
          description: asOptionalString(c.description),
          isDefault: asBool(c.is_default),
          order: asNumber(c.order),
        }));
        set({ categories });
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch categories:', error);
      }
    },

    createCategory: async (data: Partial<EventCategory>) => {
      try {
        const response = await api.post('/api/v1/calendar/categories', {
          name: data.name,
          color: data.color,
          icon: data.icon,
          description: data.description,
        });

        const category = {
          id: response.data.category?.id || response.data.id,
          name: response.data.category?.name || response.data.name,
          color: response.data.category?.color || response.data.color || '#6366f1',
          icon: response.data.category?.icon || response.data.icon,
          description: response.data.category?.description || response.data.description,
          isDefault: false,
          order: get().categories.length,
        };

        const MAX_CATEGORIES = 100;
        set((state) => ({
          categories: [...state.categories, category].slice(-MAX_CATEGORIES),
        }));
        return category;
      } catch (error) {
        logger.error('[calendarStore] Failed to create category:', error);
        throw error;
      }
    },

    updateCategory: async (id: string, data: Partial<EventCategory>) => {
      try {
        await api.put(`/api/v1/calendar/categories/${id}`, {
          name: data.name,
          color: data.color,
          icon: data.icon,
          description: data.description,
        });

        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to update category:', error);
        throw error;
      }
    },

    deleteCategory: async (id: string) => {
      try {
        await api.delete(`/api/v1/calendar/categories/${id}`);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to delete category:', error);
        throw error;
      }
    },
  };
}
