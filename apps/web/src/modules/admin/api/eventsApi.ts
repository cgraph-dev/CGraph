/**
 * Admin Events API
 *
 * Event management endpoints for admin dashboard.
 */

import { api as apiClient } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface AdminEvent {
  id: number;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
  participants: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  insertedAt: string;
  updatedAt: string;
}

interface ApiEventResponse {
  id: number;
  name: string;
  status: string;
  participant_count: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  inserted_at: string;
  updated_at: string;
}

// ============================================================================
// Transformer
// ============================================================================

function transformEvent(data: ApiEventResponse): AdminEvent {
  return {
    id: data.id,
    name: data.name,
    // type assertion: API response field maps to known union type

     
    status: data.status as AdminEvent['status'],
    participants: data.participant_count || 0,
    startDate: data.start_date,
    endDate: data.end_date,
    description: data.description,
    insertedAt: data.inserted_at,
    updatedAt: data.updated_at,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const eventsApi = {
  /**
   * List all events
   */
  async listEvents(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ events: AdminEvent[]; totalCount: number }> {
    const response = await apiClient.get('/api/v1/admin/events', { params });
    return {
      events: (response.data.data || []).map(transformEvent),
      totalCount: response.data.meta?.total_count || response.data.data?.length || 0,
    };
  },

  /**
   * Get a single event
   */
  async getEvent(eventId: number): Promise<AdminEvent> {
    const response = await apiClient.get(`/api/v1/admin/events/${eventId}`);
    return transformEvent(response.data.data);
  },

  /**
   * Create a new event
   */
  async createEvent(params: {
    name: string;
    status?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AdminEvent> {
    const response = await apiClient.post('/api/v1/admin/events', { event: params });
    return transformEvent(response.data.data);
  },

  /**
   * Update an event
   */
  async updateEvent(
    eventId: number,
    params: Partial<{
      name: string;
      status: string;
      description: string;
    }>
  ): Promise<AdminEvent> {
    const response = await apiClient.put(`/api/v1/admin/events/${eventId}`, { event: params });
    return transformEvent(response.data.data);
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: number): Promise<void> {
    await apiClient.delete(`/api/v1/admin/events/${eventId}`);
  },

  /**
   * Start an event
   */
  async startEvent(eventId: number): Promise<AdminEvent> {
    const response = await apiClient.post(`/api/v1/admin/events/${eventId}/start`);
    return transformEvent(response.data.data);
  },

  /**
   * End an event
   */
  async endEvent(eventId: number): Promise<AdminEvent> {
    const response = await apiClient.post(`/api/v1/admin/events/${eventId}/end`);
    return transformEvent(response.data.data);
  },
};
