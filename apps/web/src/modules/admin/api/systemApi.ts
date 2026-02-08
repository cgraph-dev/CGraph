/**
 * Admin System API
 *
 * System configuration, job management, and announcements endpoints.
 */

import { api as apiClient } from '@/lib/api';
import type { SystemConfig, ApiConfigResponse } from './types';

// ============================================================================
// Response Transformer
// ============================================================================

function transformConfigResponse(data: ApiConfigResponse): SystemConfig {
  return {
    registrationEnabled: data.registration_enabled ?? true,
    emailVerificationRequired: data.email_verification_required ?? true,
    maintenanceMode: data.maintenance_mode ?? false,
    maxMessageLength: data.max_message_length ?? 4000,
    maxFileUploadMb: data.max_file_upload_mb ?? 50,
    rateLimitEnabled: data.rate_limit_enabled ?? true,
    rateLimitRequestsPerMinute: data.rate_limit_requests_per_minute ?? 100,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const systemApi = {
  /**
   * Get system configuration
   */
  async getConfig(): Promise<SystemConfig> {
    const response = await apiClient.get('/api/v1/admin/config');
    return transformConfigResponse(response.data.data);
  },

  /**
   * Update system configuration
   */
  async updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    const payload = {
      registration_enabled: updates.registrationEnabled,
      email_verification_required: updates.emailVerificationRequired,
      maintenance_mode: updates.maintenanceMode,
      max_message_length: updates.maxMessageLength,
      max_file_upload_mb: updates.maxFileUploadMb,
      rate_limit_enabled: updates.rateLimitEnabled,
      rate_limit_requests_per_minute: updates.rateLimitRequestsPerMinute,
    };

    // Remove undefined values
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });

    const response = await apiClient.put('/api/v1/admin/config', payload);
    return transformConfigResponse(response.data.data);
  },

  /**
   * Trigger a manual job (e.g., cleanup, cache clear)
   */
  async triggerJob(
    jobName: string,
    params?: Record<string, unknown>
  ): Promise<{
    jobId: string;
    status: string;
  }> {
    const response = await apiClient.post('/api/v1/admin/jobs/trigger', {
      job_name: jobName,
      params,
    });
    return {
      jobId: response.data.job_id,
      status: response.data.status,
    };
  },

  /**
   * Get failed jobs
   */
  async getFailedJobs(params: { queue?: string; page?: number; perPage?: number }): Promise<{
    jobs: Array<{
      id: string;
      queue: string;
      worker: string;
      args: Record<string, unknown>;
      errors: string[];
      insertedAt: string;
      failedAt: string;
    }>;
    totalCount: number;
  }> {
    const response = await apiClient.get('/api/v1/admin/jobs/failed', { params });
    return {
      jobs: response.data.data.map(
        (job: {
          id: string;
          queue: string;
          worker: string;
          args: Record<string, unknown>;
          errors: string[];
          inserted_at: string;
          failed_at: string;
        }) => ({
          id: job.id,
          queue: job.queue,
          worker: job.worker,
          args: job.args,
          errors: job.errors,
          insertedAt: job.inserted_at,
          failedAt: job.failed_at,
        })
      ),
      totalCount: response.data.meta.total_count,
    };
  },

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: string): Promise<void> {
    await apiClient.post(`/api/v1/admin/jobs/${jobId}/retry`);
  },

  /**
   * Delete a failed job
   */
  async deleteFailedJob(jobId: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/jobs/${jobId}`);
  },

  /**
   * Broadcast a system announcement
   */
  async broadcastAnnouncement(params: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance';
    expiresAt?: string;
  }): Promise<{ id: string }> {
    const response = await apiClient.post('/api/v1/admin/announcements', {
      title: params.title,
      message: params.message,
      type: params.type,
      expires_at: params.expiresAt,
    });
    return { id: response.data.id };
  },
};
