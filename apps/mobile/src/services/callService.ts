/**
 * Call Service
 *
 * Backend API integration for call history and call management.
 * Connects to the backend REST endpoints for call history CRUD.
 *
 * @module services/callService
 * @since v0.9.47
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface CallHistoryRecord {
  id: string;
  room_id: string;
  type: 'audio' | 'video' | 'screen_share';
  creator_id: string;
  group_id: string | null;
  state: string;
  participant_ids: string[];
  max_participants: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number | null;
  inserted_at: string;
}

export interface CallHistoryResponse {
  data: CallHistoryRecord[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface CallDetailResponse {
  data: CallHistoryRecord;
}

// ==================== API FUNCTIONS ====================

/**
 * Fetch paginated call history for the current user.
 */
export async function getCallHistory(
  cursor?: string,
  limit: number = 50
): Promise<CallHistoryResponse> {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await api.get('/api/v1/calls', { params });
  return response.data;
}

/**
 * Fetch a single call record by ID.
 */
export async function getCall(callId: string): Promise<CallDetailResponse> {
  const response = await api.get(`/api/v1/calls/${callId}`);
  return response.data;
}

const callService = {
  getCallHistory,
  getCall,
};

export default callService;
