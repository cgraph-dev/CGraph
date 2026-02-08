/**
 * Calendar Categories — CRUD actions
 */
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

import type { CalendarState, EventCategory } from './calendarStore.types';

const logger = createLogger('calendarStore');

// ========================================
// Zustand slice creator
// ========================================

type SetState = (
  partial: Partial<CalendarState> | ((state: CalendarState) => Partial<CalendarState>)
) => void;
type GetState = () => CalendarState;

export function createCategoryActions(set: SetState, get: GetState) {
  return {
    fetchCategories: async () => {
      try {
        const response = await api.get('/api/v1/calendar/categories');
        const categories = (
          ensureArray(response.data, 'categories') as Record<string, unknown>[]
        ).map((c) => ({
          id: c.id as string,
          name: (c.name as string) || 'Uncategorized',
          color: (c.color as string) || '#6366f1',
          icon: c.icon as string | undefined,
          description: c.description as string | undefined,
          isDefault: (c.is_default as boolean) || false,
          order: (c.order as number) || 0,
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

        set((state) => ({
          categories: [...state.categories, category],
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
