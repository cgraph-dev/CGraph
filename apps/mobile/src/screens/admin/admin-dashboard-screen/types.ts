/**
 * AdminDashboard Types and Fallback Data
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// Types
// ============================================================================

export type AdminTab = 'overview' | 'users' | 'reports' | 'audit' | 'settings';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalPosts: number;
  postsToday: number;
  totalThreads: number;
  pendingReports: number;
  bannedUsers: number;
}

export interface RecentUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  status: 'active' | 'pending' | 'banned';
}

export interface Report {
  id: string;
  type: 'post' | 'user' | 'thread';
  reason: string;
  reportedBy: string;
  targetId: string;
  targetName: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface TabConfig {
  id: AdminTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'users', label: 'Users', icon: 'people' },
  { id: 'reports', label: 'Reports', icon: 'flag' },
  { id: 'audit', label: 'Audit', icon: 'time' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

// ============================================================================
// Fallback Data
// ============================================================================

export const FALLBACK_STATS: DashboardStats = {
  totalUsers: 1234,
  activeUsers: 456,
  newUsersToday: 12,
  totalPosts: 45678,
  postsToday: 89,
  totalThreads: 2345,
  pendingReports: 5,
  bannedUsers: 23,
};

export const FALLBACK_RECENT_USERS: RecentUser[] = [
  {
    id: '1',
    username: 'newuser1',
    email: 'new1@example.com',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
  {
    id: '2',
    username: 'newuser2',
    email: 'new2@example.com',
    createdAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: '3',
    username: 'newuser3',
    email: 'new3@example.com',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

export const FALLBACK_REPORTS: Report[] = [
  {
    id: '1',
    type: 'post',
    reason: 'Spam content',
    reportedBy: 'user1',
    targetId: 'p1',
    targetName: 'Suspicious post',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'user',
    reason: 'Harassment',
    reportedBy: 'user2',
    targetId: 'u1',
    targetName: 'BadUser',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export const FALLBACK_AUDIT: AuditLog[] = [
  {
    id: '1',
    action: 'user.ban',
    actor: 'admin',
    target: 'spammer123',
    details: 'Banned for spam',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'post.delete',
    actor: 'moderator',
    target: 'Post #123',
    details: 'Removed inappropriate content',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    action: 'settings.update',
    actor: 'admin',
    target: 'Registration',
    details: 'Enabled email verification',
    timestamp: new Date().toISOString(),
  },
];
