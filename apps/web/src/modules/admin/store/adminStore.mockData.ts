/**
 * Admin Store Mock Data
 *
 * Fallback/mock data objects used in catch blocks
 * when API calls fail during development.
 *
 * @module modules/admin/store/mockData
 * @version 1.0.0
 */

import type {
  AdminStats,
  ModerationItem,
  AdminEvent,
  AdminUser,
  SystemSetting,
} from './adminStore.types';

export const MOCK_ADMIN_STATS: AdminStats = {
  activeUsers: 12847,
  activeEvents: 3,
  pendingModeration: 47,
  revenue24h: 284750,
  transactionsToday: 1893,
  disputeRate: 0.8,
  newUsersToday: 234,
  totalForums: 156,
  totalGroups: 89,
  serverLoad: 42,
};

export const MOCK_MODERATION_QUEUE: ModerationItem[] = [
  {
    id: '1',
    type: 'listing',
    status: 'pending',
    riskLevel: 'high',
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: 'Suspicious pricing on rare item',
    details: 'User listed a common item at 100x market price',
    notes: [],
  },
  {
    id: '2',
    type: 'transaction',
    status: 'escalated',
    riskLevel: 'critical',
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: 'Potential fraud detection',
    details: 'Multiple rapid transactions from same IP',
    notes: ['Auto-flagged by system'],
  },
  {
    id: '3',
    type: 'report',
    status: 'pending',
    riskLevel: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: 'User report: harassment',
    details: 'User reported receiving inappropriate messages',
    reportedBy: 'user123',
    notes: [],
  },
];

export const MOCK_ADMIN_EVENTS: AdminEvent[] = [
  {
    id: '1',
    name: 'Winter Wonderland 2026',
    description: 'Annual winter celebration event',
    status: 'active',
    participants: 4521,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-02-15'),
    rewards: [
      { id: 'r1', type: 'xp', value: 500, condition: 'Participate in event' },
      {
        id: 'r2',
        type: 'badge',
        value: 'winter_hero',
        condition: 'Complete all challenges',
      },
    ],
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: "Valentine's Day Special",
    description: 'Love is in the air',
    status: 'scheduled',
    participants: 0,
    startDate: new Date('2026-02-10'),
    endDate: new Date('2026-02-16'),
    rewards: [],
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: '1',
    username: 'power_user',
    email: 'power@example.com',
    status: 'active',
    role: 'user',
    createdAt: new Date('2025-06-15'),
    lastActive: new Date(),
    warningCount: 0,
    xp: 15000,
    level: 42,
  },
  {
    id: '2',
    username: 'troublemaker',
    email: 'trouble@example.com',
    status: 'suspended',
    role: 'user',
    createdAt: new Date('2025-10-20'),
    lastActive: new Date('2026-01-30'),
    warningCount: 3,
    xp: 2500,
    level: 8,
  },
  {
    id: '3',
    username: 'mod_helper',
    email: 'mod@example.com',
    status: 'active',
    role: 'moderator',
    createdAt: new Date('2025-03-10'),
    lastActive: new Date(),
    warningCount: 0,
    xp: 45000,
    level: 67,
  },
];

export const MOCK_ADMIN_SETTINGS: SystemSetting[] = [
  {
    key: 'max_file_upload_size',
    value: 10485760,
    type: 'number',
    category: 'uploads',
    description: 'Maximum file upload size in bytes',
    isEditable: true,
  },
  {
    key: 'maintenance_mode',
    value: false,
    type: 'boolean',
    category: 'system',
    description: 'Enable maintenance mode',
    isEditable: true,
  },
  {
    key: 'registration_enabled',
    value: true,
    type: 'boolean',
    category: 'auth',
    description: 'Allow new user registrations',
    isEditable: true,
  },
  {
    key: 'rate_limit_requests',
    value: 100,
    type: 'number',
    category: 'security',
    description: 'Rate limit requests per minute',
    isEditable: true,
  },
];
