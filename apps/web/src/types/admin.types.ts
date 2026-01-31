/**
 * Admin Dashboard Types
 * Shared type definitions for admin components
 */

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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  status: 'active' | 'banned' | 'deleted';
  insertedAt: string;
  lastSeenAt: string | null;
  isPremium: boolean;
  bannedAt: string | null;
  banReason: string | null;
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

export type TabId = 'overview' | 'users' | 'reports' | 'audit' | 'settings';

// Stats card stat item
export interface StatItem {
  label: string;
  value: number | string;
  highlight?: 'green' | 'red' | 'yellow';
}

// Realtime stats item
export interface RealtimeStatsItem {
  activeUsers: number;
  messagesToday: number;
  cpuUsage: number;
  memoryUsage: number;
  wsConnections: number;
}
