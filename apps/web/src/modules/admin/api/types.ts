/**
 * Admin API Types
 *
 * Shared type definitions for the admin API modules.
 */

// ============================================================================
// Public Types (camelCase)
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
// API Response Types (snake_case from backend)
// ============================================================================

/** Raw API response for system metrics (snake_case) */
export interface ApiMetricsResponse {
  users?: {
    total?: number;
    new_today?: number;
    active_24h?: number;
    premium?: number;
    banned?: number;
  };
  messages?: {
    total?: number;
    today?: number;
    voice_messages?: number;
  };
  groups?: {
    total?: number;
    public?: number;
    private?: number;
  };
  system?: {
    uptime_seconds?: number;
    memory_usage_mb?: number;
    cpu_usage_percent?: number;
    db_connections?: number;
  };
  jobs?: {
    pending?: number;
    executing?: number;
    failed?: number;
    completed_24h?: number;
  };
  collected_at: string;
}

/** Raw API response for realtime stats (snake_case) */
export interface ApiRealtimeResponse {
  active_connections?: number;
  requests_per_minute?: number;
  database_latency_ms?: number;
  cache_hit_rate?: number;
  memory_usage_mb?: number;
  timestamp: string;
}

/** Raw API response for user data (snake_case) */
export interface ApiUserResponse {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: 'active' | 'banned' | 'deleted';
  inserted_at: string;
  last_seen_at: string | null;
  is_premium?: boolean;
  banned_at: string | null;
  ban_reason: string | null;
}

/** Raw API response for report data (snake_case) */
export interface ApiReportResponse {
  id: string;
  type: 'spam' | 'harassment' | 'hate_speech' | 'illegal' | 'other';
  status: 'pending' | 'resolved' | 'dismissed';
  content_type: 'message' | 'post' | 'user' | 'group';
  content_id: string;
  reporter_id: string;
  reporter_username: string;
  reason: string;
  inserted_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/** Raw API response for audit entry (snake_case) */
export interface ApiAuditResponse {
  id: string;
  category: string;
  action: string;
  actor_id: string;
  actor_username: string;
  target_id: string | null;
  metadata?: Record<string, unknown>;
  ip_address: string;
  timestamp: string;
}

/** Raw API response for system config (snake_case) */
export interface ApiConfigResponse {
  registration_enabled?: boolean;
  email_verification_required?: boolean;
  maintenance_mode?: boolean;
  max_message_length?: number;
  max_file_upload_mb?: number;
  rate_limit_enabled?: boolean;
  rate_limit_requests_per_minute?: number;
}
