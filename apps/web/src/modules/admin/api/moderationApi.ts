/**
 * Admin Moderation API
 *
 * Content reports listing and resolution endpoints.
 */

import { api as apiClient } from '@/lib/api';
import type { Report, ReportsListResponse, ApiReportResponse } from './types';

// ============================================================================
// Response Transformer
// ============================================================================

function transformReportResponse(data: ApiReportResponse): Report {
  return {
    id: data.id,
    type: data.type,
    status: data.status,
    contentType: data.content_type,
    contentId: data.content_id,
    reporterId: data.reporter_id,
    reporterUsername: data.reporter_username,
    reason: data.reason,
    insertedAt: data.inserted_at,
    resolvedAt: data.resolved_at,
    resolvedBy: data.resolved_by,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const moderationApi = {
  /**
   * List content reports
   */
  async listReports(params: {
    status?: string;
    type?: string;
    page?: number;
    perPage?: number;
  }): Promise<ReportsListResponse> {
    const response = await apiClient.get('/api/v1/admin/reports', { params });
    return {
      reports: response.data.data.map(transformReportResponse),
      totalCount: response.data.meta.total_count,
    };
  },

  /**
   * Resolve a report
   */
  async resolveReport(
    reportId: string,
    action: 'resolve' | 'dismiss',
    note?: string
  ): Promise<Report> {
    const response = await apiClient.post(`/api/v1/admin/reports/${reportId}/resolve`, {
      action,
      note,
    });
    return transformReportResponse(response.data.data);
  },
};
