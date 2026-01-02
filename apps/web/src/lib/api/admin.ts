/**
 * Admin API Client
 * 
 * Provides type-safe API calls for the admin dashboard.
 * All endpoints require admin authentication.
 */

import { api as apiClient } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface SystemMetrics {
  users: {
    total: number;
    newToday: number;
    active24h: number;
    premium: number;
    banned: number;
  };
  messages: {
    total: number;
    today: number;
    voiceMessages: number;
  };
  groups: {
    total: number;
    public: number;
    private: number;
  };
  system: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    cpuUsagePercent: number;
    dbConnections: number;
  };
  jobs: {
    pending: number;
    executing: number;
    failed: number;
    completed24h: number;
  };
  collectedAt: string;
}

export interface RealtimeStats {
  activeConnections: number;
  requestsPerMinute: number;
  databaseLatencyMs: number;
  cacheHitRate: number;
  memoryUsageMb: number;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: 'active' | 'banned' | 'deleted';
  insertedAt: string;
  lastSeenAt: string | null;
  isPremium: boolean;
  bannedAt: string | null;
  banReason: string | null;
}

export interface UsersListResponse {
  users: AdminUser[];
  totalCount: number;
  page: number;
  perPage: number;
}

export interface Report {
  id: string;
  type: 'spam' | 'harassment' | 'hate_speech' | 'illegal' | 'other';
  status: 'pending' | 'resolved' | 'dismissed';
  contentType: 'message' | 'post' | 'user' | 'group';
  contentId: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  insertedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface ReportsListResponse {
  reports: Report[];
  totalCount: number;
}

export interface AuditEntry {
  id: string;
  category: string;
  action: string;
  actorId: string;
  actorUsername: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
  totalCount: number;
  page: number;
}

export interface SystemConfig {
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maintenanceMode: boolean;
  maxMessageLength: number;
  maxFileUploadMb: number;
  rateLimitEnabled: boolean;
  rateLimitRequestsPerMinute: number;
}

// ============================================================================
// API Functions
// ============================================================================

export const adminApi = {
  /**
   * Get comprehensive system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get('/api/v1/admin/metrics');
    return transformMetricsResponse(response.data);
  },

  /**
   * Get real-time system stats
   */
  async getRealtimeStats(): Promise<RealtimeStats> {
    const response = await apiClient.get('/api/v1/admin/realtime');
    return transformRealtimeResponse(response.data);
  },

  /**
   * List users with filtering and pagination
   */
  async listUsers(params: {
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
  }): Promise<UsersListResponse> {
    const response = await apiClient.get('/api/v1/admin/users', { params });
    return {
      users: response.data.data.map(transformUserResponse),
      totalCount: response.data.meta.total_count,
      page: response.data.meta.page,
      perPage: response.data.meta.per_page,
    };
  },

  /**
   * Get details for a specific user
   */
  async getUser(userId: string): Promise<AdminUser> {
    const response = await apiClient.get(`/api/v1/admin/users/${userId}`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, duration?: number): Promise<AdminUser> {
    const response = await apiClient.post(`/api/v1/admin/users/${userId}/ban`, {
      reason,
      duration,
    });
    return transformUserResponse(response.data.data);
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<AdminUser> {
    const response = await apiClient.delete(`/api/v1/admin/users/${userId}/ban`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/users/${userId}`);
  },

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

  /**
   * Get audit log entries
   */
  async getAuditLog(params: {
    category?: string;
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  }): Promise<AuditLogResponse> {
    const response = await apiClient.get('/api/v1/admin/audit', { params });
    return {
      entries: response.data.data.map(transformAuditResponse),
      totalCount: response.data.meta.total_count,
      page: response.data.meta.page,
    };
  },

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
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });
    
    const response = await apiClient.put('/api/v1/admin/config', payload);
    return transformConfigResponse(response.data.data);
  },

  /**
   * Get system health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: string; latencyMs?: number }>;
  }> {
    const response = await apiClient.get('/api/v1/admin/health');
    return response.data;
  },

  /**
   * Trigger a manual job (e.g., cleanup, cache clear)
   */
  async triggerJob(jobName: string, params?: Record<string, unknown>): Promise<{
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
  async getFailedJobs(params: {
    queue?: string;
    page?: number;
    perPage?: number;
  }): Promise<{
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
      jobs: response.data.data.map((job: any) => ({
        id: job.id,
        queue: job.queue,
        worker: job.worker,
        args: job.args,
        errors: job.errors,
        insertedAt: job.inserted_at,
        failedAt: job.failed_at,
      })),
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

// ============================================================================
// Response Transformers (snake_case to camelCase)
// ============================================================================

function transformMetricsResponse(data: any): SystemMetrics {
  return {
    users: {
      total: data.users?.total || 0,
      newToday: data.users?.new_today || 0,
      active24h: data.users?.active_24h || 0,
      premium: data.users?.premium || 0,
      banned: data.users?.banned || 0,
    },
    messages: {
      total: data.messages?.total || 0,
      today: data.messages?.today || 0,
      voiceMessages: data.messages?.voice_messages || 0,
    },
    groups: {
      total: data.groups?.total || 0,
      public: data.groups?.public || 0,
      private: data.groups?.private || 0,
    },
    system: {
      uptimeSeconds: data.system?.uptime_seconds || 0,
      memoryUsageMb: data.system?.memory_usage_mb || 0,
      cpuUsagePercent: data.system?.cpu_usage_percent || 0,
      dbConnections: data.system?.db_connections || 0,
    },
    jobs: {
      pending: data.jobs?.pending || 0,
      executing: data.jobs?.executing || 0,
      failed: data.jobs?.failed || 0,
      completed24h: data.jobs?.completed_24h || 0,
    },
    collectedAt: data.collected_at,
  };
}

function transformRealtimeResponse(data: any): RealtimeStats {
  return {
    activeConnections: data.active_connections || 0,
    requestsPerMinute: data.requests_per_minute || 0,
    databaseLatencyMs: data.database_latency_ms || 0,
    cacheHitRate: data.cache_hit_rate || 0,
    memoryUsageMb: data.memory_usage_mb || 0,
    timestamp: data.timestamp,
  };
}

function transformUserResponse(data: any): AdminUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    status: data.status,
    insertedAt: data.inserted_at,
    lastSeenAt: data.last_seen_at,
    isPremium: data.is_premium || false,
    bannedAt: data.banned_at,
    banReason: data.ban_reason,
  };
}

function transformReportResponse(data: any): Report {
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

function transformAuditResponse(data: any): AuditEntry {
  return {
    id: data.id,
    category: data.category,
    action: data.action,
    actorId: data.actor_id,
    actorUsername: data.actor_username,
    targetId: data.target_id,
    metadata: data.metadata || {},
    ipAddress: data.ip_address,
    timestamp: data.timestamp,
  };
}

function transformConfigResponse(data: any): SystemConfig {
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

export default adminApi;
