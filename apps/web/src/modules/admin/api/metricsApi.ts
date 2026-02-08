/**
 * Admin Metrics API
 *
 * System metrics, realtime stats, and health check endpoints.
 */

import { api as apiClient } from '@/lib/api';
import type {
  SystemMetrics,
  RealtimeStats,
  ApiMetricsResponse,
  ApiRealtimeResponse,
} from './types';

// ============================================================================
// Response Transformers
// ============================================================================

function transformMetricsResponse(data: ApiMetricsResponse): SystemMetrics {
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

function transformRealtimeResponse(data: ApiRealtimeResponse): RealtimeStats {
  return {
    activeConnections: data.active_connections || 0,
    requestsPerMinute: data.requests_per_minute || 0,
    databaseLatencyMs: data.database_latency_ms || 0,
    cacheHitRate: data.cache_hit_rate || 0,
    memoryUsageMb: data.memory_usage_mb || 0,
    timestamp: data.timestamp,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const metricsApi = {
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
   * Get system health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: string; latencyMs?: number }>;
  }> {
    const response = await apiClient.get('/api/v1/admin/health');
    return response.data;
  },
};
