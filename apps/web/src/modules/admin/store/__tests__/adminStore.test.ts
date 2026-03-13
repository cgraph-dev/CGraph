/**
 * adminStore Unit Tests
 *
 * Tests for Zustand admin store state management.
 * Covers UI actions, stats fetching, moderation, events, users, and settings.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdminStore } from '@/modules/admin/store';
import type {
  AdminStats,
  ModerationItem,
  AdminEvent,
  AdminUser,
  SystemSetting,
} from '@/modules/admin/store';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api after mocking
import { api } from '@/lib/api';

// ==================== MOCK DATA ====================

const mockStats: AdminStats = {
  activeUsers: 500,
  activeEvents: 5,
  pendingModeration: 12,
  revenue24h: 10000,
  transactionsToday: 200,
  disputeRate: 1.2,
  newUsersToday: 30,
  totalForums: 10,
  totalGroups: 5,
  serverLoad: 35,
};

const mockModerationItem: ModerationItem = {
  id: 'mod-1',
  type: 'listing',
  status: 'pending',
  riskLevel: 'high',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  summary: 'Suspicious listing',
  details: 'Item flagged for review',
  notes: [],
};

const mockModerationItem2: ModerationItem = {
  id: 'mod-2',
  type: 'report',
  status: 'escalated',
  riskLevel: 'critical',
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
  summary: 'User report',
  details: 'Harassment reported',
  reportedBy: 'user-100',
  notes: ['Initial review done'],
};

const mockUser: AdminUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  status: 'active',
  role: 'user',
  createdAt: new Date('2025-06-01'),
  lastActive: new Date('2026-01-15'),
  warningCount: 0,
  xp: 1200,
  level: 5,
};

const mockUser2: AdminUser = {
  id: 'user-2',
  username: 'admin_user',
  email: 'admin@example.com',
  status: 'active',
  role: 'admin',
  createdAt: new Date('2025-01-01'),
  lastActive: new Date('2026-01-20'),
  warningCount: 0,
  xp: 5000,
  level: 15,
};

const mockEvent: AdminEvent = {
  id: 'event-1',
  name: 'Test Event',
  description: 'A test event',
  status: 'active',
  participants: 100,
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-07'),
  rewards: [{ id: 'r1', type: 'xp', value: 500, condition: 'participate' }],
  createdBy: 'admin-1',
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const mockSetting: SystemSetting = {
  key: 'max_upload_size',
  value: 10,
  type: 'number',
  category: 'uploads',
  description: 'Maximum upload size in MB',
  isEditable: true,
};

// ==================== INITIAL STATE RESET ====================

const initialState = {
  activeTab: 'dashboard' as const,
  sidebarCollapsed: false,
  isLoading: false,
  error: null,
  stats: null,
  statsLastUpdated: null,
  moderationQueue: [],
  moderationFilters: { status: 'all' as const, riskLevel: 'all' as const, type: 'all' as const },
  events: [],
  eventFilters: { status: 'all' as const },
  users: [],
  userFilters: { status: 'all' as const, role: 'all' },
  selectedUserIds: [],
  systemSettings: [],
};

describe('adminStore', () => {
  beforeEach(() => {
    useAdminStore.setState(initialState);
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useAdminStore.getState();
      expect(state.activeTab).toBe('dashboard');
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.stats).toBeNull();
      expect(state.statsLastUpdated).toBeNull();
      expect(state.moderationQueue).toEqual([]);
      expect(state.events).toEqual([]);
      expect(state.users).toEqual([]);
      expect(state.selectedUserIds).toEqual([]);
      expect(state.systemSettings).toEqual([]);
    });

    it('should have default moderation filters', () => {
      const state = useAdminStore.getState();
      expect(state.moderationFilters).toEqual({
        status: 'all',
        riskLevel: 'all',
        type: 'all',
      });
    });

    it('should have default event and user filters', () => {
      const state = useAdminStore.getState();
      expect(state.eventFilters).toEqual({ status: 'all' });
      expect(state.userFilters).toEqual({ status: 'all', role: 'all' });
    });
  });

  // ==================== UI ACTIONS ====================

  describe('UI actions', () => {
    it('should set active tab', () => {
      useAdminStore.getState().setActiveTab('users');
      expect(useAdminStore.getState().activeTab).toBe('users');

      useAdminStore.getState().setActiveTab('settings');
      expect(useAdminStore.getState().activeTab).toBe('settings');
    });

    it('should toggle sidebar', () => {
      expect(useAdminStore.getState().sidebarCollapsed).toBe(false);

      useAdminStore.getState().toggleSidebar();
      expect(useAdminStore.getState().sidebarCollapsed).toBe(true);

      useAdminStore.getState().toggleSidebar();
      expect(useAdminStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set and clear error', () => {
      useAdminStore.getState().setError('Something went wrong');
      expect(useAdminStore.getState().error).toBe('Something went wrong');

      useAdminStore.getState().setError(null);
      expect(useAdminStore.getState().error).toBeNull();
    });
  });

  // ==================== FETCH STATS ====================

  describe('fetchStats', () => {
    it('should fetch stats successfully from API', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockStats });

      await useAdminStore.getState().fetchStats();

      const state = useAdminStore.getState();
      expect(state.stats).toEqual(mockStats);
      expect(state.statsLastUpdated).toBeInstanceOf(Date);
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/stats');
    });

    it('should fall back to mock data when API fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      await useAdminStore.getState().fetchStats();

      const state = useAdminStore.getState();
      // API failure sets error, stats remain null
      expect(state.stats).toBeNull();
      expect(state.error).toBe('Failed to load dashboard stats');
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading while fetching', async () => {
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(api.get).mockReturnValueOnce(fetchPromise as never);

      const promise = useAdminStore.getState().fetchStats();
      expect(useAdminStore.getState().isLoading).toBe(true);

      resolveFetch!({ data: mockStats });
      await promise;
      expect(useAdminStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== MODERATION ACTIONS ====================

  describe('moderation actions', () => {
    it('should fetch moderation queue from API', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [mockModerationItem, mockModerationItem2],
      });

      await useAdminStore.getState().fetchModerationQueue();

      const state = useAdminStore.getState();
      expect(state.moderationQueue).toHaveLength(2);
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/moderation');
    });

    it('should fall back to mock moderation data on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API error'));

      await useAdminStore.getState().fetchModerationQueue();

      const state = useAdminStore.getState();
      // API failure sets error, moderationQueue stays empty
      expect(state.moderationQueue).toHaveLength(0);
      expect(state.error).toBe('Failed to load moderation queue');
      expect(state.isLoading).toBe(false);
    });

    it('should set moderation filters', () => {
      useAdminStore.getState().setModerationFilters({ status: 'pending', riskLevel: 'high' });

      const state = useAdminStore.getState();
      expect(state.moderationFilters.status).toBe('pending');
      expect(state.moderationFilters.riskLevel).toBe('high');
      expect(state.moderationFilters.type).toBe('all'); // unchanged
    });

    it('should review moderation item (approve)', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().reviewModerationItem('mod-1', 'approve', 'Looks fine');

      const item = useAdminStore.getState().moderationQueue.find((i) => i.id === 'mod-1');
      expect(item?.status).toBe('resolved');
      expect(item?.notes).toContain('Looks fine');
      expect(api.post).toHaveBeenCalledWith('/api/v1/admin/moderation/mod-1/review', {
        action: 'approve',
        notes: 'Looks fine',
      });
    });

    it('should review moderation item (reject)', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().reviewModerationItem('mod-1', 'reject');

      const item = useAdminStore.getState().moderationQueue.find((i) => i.id === 'mod-1');
      expect(item?.status).toBe('dismissed');
    });

    it('should review moderation item (escalate)', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().reviewModerationItem('mod-1', 'escalate');

      const item = useAdminStore.getState().moderationQueue.find((i) => i.id === 'mod-1');
      expect(item?.status).toBe('escalated');
    });

    it('should set error when review fails', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Server error'));

      await useAdminStore.getState().reviewModerationItem('mod-1', 'approve');

      expect(useAdminStore.getState().error).toBe('Failed to review moderation item');
      expect(useAdminStore.getState().isLoading).toBe(false);
    });

    it('should assign moderation item', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().assignModerationItem('mod-1', 'admin-99');

      const item = useAdminStore.getState().moderationQueue.find((i) => i.id === 'mod-1');
      expect(item?.assignedTo).toBe('admin-99');
      expect(api.post).toHaveBeenCalledWith('/api/v1/admin/moderation/mod-1/assign', {
        assignee_id: 'admin-99',
      });
    });

    it('should set error when assign fails', async () => {
      useAdminStore.setState({ moderationQueue: [mockModerationItem] });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().assignModerationItem('mod-1', 'admin-99');

      expect(useAdminStore.getState().error).toBe('Failed to assign moderation item');
    });
  });

  // ==================== EVENT ACTIONS ====================

  describe('event actions', () => {
    it('should fetch events from API', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockEvent] });

      await useAdminStore.getState().fetchEvents();

      const state = useAdminStore.getState();
      expect(state.events).toHaveLength(1);
      expect(state.events[0]!.name).toBe('Test Event');
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/events');
    });

    it('should fall back to mock events on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API error'));

      await useAdminStore.getState().fetchEvents();

      const state = useAdminStore.getState();
      // API failure sets error, events stays empty
      expect(state.events).toHaveLength(0);
      expect(state.error).toBe('Failed to load events');
      expect(state.isLoading).toBe(false);
    });

    it('should set event filters', () => {
      useAdminStore.getState().setEventFilters({ status: 'active' });

      expect(useAdminStore.getState().eventFilters.status).toBe('active');
    });

    it('should create event via API', async () => {
      const newEvent = {
        name: 'New Event',
        description: 'A brand new event',
        status: 'draft' as const,
        participants: 0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-07'),
        rewards: [],
        createdBy: 'admin-1',
      };

      vi.mocked(api.post).mockResolvedValueOnce({
        data: { ...newEvent, id: 'event-new', createdAt: new Date(), updatedAt: new Date() },
      });

      await useAdminStore.getState().createEvent(newEvent);

      const state = useAdminStore.getState();
      expect(state.events).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });

    it('should create event locally when API fails', async () => {
      const newEvent = {
        name: 'Local Event',
        description: 'Created locally',
        status: 'draft' as const,
        participants: 0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-07'),
        rewards: [],
        createdBy: 'admin-1',
      };

      vi.mocked(api.post).mockRejectedValueOnce(new Error('API down'));

      await useAdminStore.getState().createEvent(newEvent);

      const state = useAdminStore.getState();
      // API failure sets error, no local event created
      expect(state.events).toHaveLength(0);
      expect(state.error).toBe('Failed to create event');
      expect(state.isLoading).toBe(false);
    });

    it('should update event via API', async () => {
      useAdminStore.setState({ events: [mockEvent] });
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().updateEvent('event-1', { name: 'Updated Event' });

      const updated = useAdminStore.getState().events.find((e) => e.id === 'event-1');
      expect(updated?.name).toBe('Updated Event');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
      expect(useAdminStore.getState().isLoading).toBe(false);
    });

    it('should set error when update event fails', async () => {
      useAdminStore.setState({ events: [mockEvent] });
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().updateEvent('event-1', { name: 'Fail' });

      expect(useAdminStore.getState().error).toBe('Failed to update event');
    });

    it('should delete event via API', async () => {
      useAdminStore.setState({ events: [mockEvent] });
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().deleteEvent('event-1');

      expect(useAdminStore.getState().events).toHaveLength(0);
      expect(useAdminStore.getState().isLoading).toBe(false);
    });

    it('should set error when delete event fails', async () => {
      useAdminStore.setState({ events: [mockEvent] });
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().deleteEvent('event-1');

      expect(useAdminStore.getState().error).toBe('Failed to delete event');
    });

    it('should change event status via updateEvent', async () => {
      useAdminStore.setState({ events: [mockEvent] });
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().changeEventStatus('event-1', 'paused');

      const updated = useAdminStore.getState().events.find((e) => e.id === 'event-1');
      expect(updated?.status).toBe('paused');
    });
  });

  // ==================== USER ACTIONS ====================

  describe('user actions', () => {
    it('should fetch users from API', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockUser, mockUser2] });

      await useAdminStore.getState().fetchUsers();

      const state = useAdminStore.getState();
      expect(state.users).toHaveLength(2);
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users', {
        params: { page: 1, limit: 50 },
      });
    });

    it('should fall back to mock users on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API error'));

      await useAdminStore.getState().fetchUsers();

      const state = useAdminStore.getState();
      // API failure sets error, users stays empty
      expect(state.users).toHaveLength(0);
      expect(state.error).toBe('Failed to load users');
      expect(state.isLoading).toBe(false);
    });

    it('should set user filters', () => {
      useAdminStore.getState().setUserFilters({ status: 'banned', role: 'moderator' });

      const state = useAdminStore.getState();
      expect(state.userFilters.status).toBe('banned');
      expect(state.userFilters.role).toBe('moderator');
    });

    it('should select and deselect users', () => {
      useAdminStore.getState().selectUser('user-1');
      expect(useAdminStore.getState().selectedUserIds).toEqual(['user-1']);

      useAdminStore.getState().selectUser('user-2');
      expect(useAdminStore.getState().selectedUserIds).toEqual(['user-1', 'user-2']);

      useAdminStore.getState().deselectUser('user-1');
      expect(useAdminStore.getState().selectedUserIds).toEqual(['user-2']);
    });

    it('should not duplicate user selection', () => {
      useAdminStore.getState().selectUser('user-1');
      useAdminStore.getState().selectUser('user-1');
      expect(useAdminStore.getState().selectedUserIds).toEqual(['user-1']);
    });

    it('should select all users and clear selection', () => {
      useAdminStore.setState({ users: [mockUser, mockUser2] });

      useAdminStore.getState().selectAllUsers();
      expect(useAdminStore.getState().selectedUserIds).toEqual(['user-1', 'user-2']);

      useAdminStore.getState().clearUserSelection();
      expect(useAdminStore.getState().selectedUserIds).toEqual([]);
    });

    it('should ban user', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().banUser('user-1', 'Violating TOS', 30);

      const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(user?.status).toBe('banned');
      expect(api.post).toHaveBeenCalledWith('/api/v1/admin/users/user-1/ban', {
        reason: 'Violating TOS',
        duration: 30,
      });
    });

    it('should set error when ban fails', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().banUser('user-1', 'reason');

      expect(useAdminStore.getState().error).toBe('Failed to ban user');
    });

    it('should suspend user', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().suspendUser('user-1', 'Spam', 7);

      const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(user?.status).toBe('suspended');
    });

    it('should warn user and increment warning count', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().warnUser('user-1', 'Language warning');

      const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(user?.warningCount).toBe(1);
    });

    it('should unban user', async () => {
      const bannedUser = { ...mockUser, status: 'banned' as const };
      useAdminStore.setState({ users: [bannedUser] });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().unbanUser('user-1');

      const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(user?.status).toBe('active');
    });

    it('should set error when unban fails', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().unbanUser('user-1');

      expect(useAdminStore.getState().error).toBe('Failed to unban user');
    });

    it('should change user role', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().changeUserRole('user-1', 'moderator');

      const user = useAdminStore.getState().users.find((u) => u.id === 'user-1');
      expect(user?.role).toBe('moderator');
    });

    it('should set error when role change fails', async () => {
      useAdminStore.setState({ users: [mockUser] });
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().changeUserRole('user-1', 'admin');

      expect(useAdminStore.getState().error).toBe('Failed to change user role');
    });
  });

  // ==================== BATCH ACTIONS ====================

  describe('batchAction', () => {
    it('should execute batch action and refresh users', async () => {
      useAdminStore.setState({
        users: [mockUser, mockUser2],
        selectedUserIds: ['user-1', 'user-2'],
      });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} }); // batch call
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockUser, mockUser2] }); // fetchUsers

      await useAdminStore.getState().batchAction('suspend', ['user-1', 'user-2'], { duration: 7 });

      const state = useAdminStore.getState();
      expect(state.selectedUserIds).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(api.post).toHaveBeenCalledWith('/api/v1/admin/batch', {
        action: 'suspend',
        user_ids: ['user-1', 'user-2'],
        duration: 7,
      });
    });

    it('should set error when batch action fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().batchAction('ban', ['user-1']);

      expect(useAdminStore.getState().error).toBe('Failed to execute batch ban');
      expect(useAdminStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== SETTINGS ACTIONS ====================

  describe('settings actions', () => {
    it('should fetch settings from API', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockSetting] });

      await useAdminStore.getState().fetchSettings();

      const state = useAdminStore.getState();
      expect(state.systemSettings).toHaveLength(1);
      expect(state.systemSettings[0]!.key).toBe('max_upload_size');
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/settings');
    });

    it('should fall back to mock settings on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API error'));

      await useAdminStore.getState().fetchSettings();

      const state = useAdminStore.getState();
      // API failure sets error, settings stays empty
      expect(state.systemSettings).toHaveLength(0);
      expect(state.error).toBe('Failed to load system settings');
      expect(state.isLoading).toBe(false);
    });

    it('should update a setting', async () => {
      useAdminStore.setState({ systemSettings: [mockSetting] });
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

      await useAdminStore.getState().updateSetting('max_upload_size', 25);

      const setting = useAdminStore
        .getState()
        .systemSettings.find((s) => s.key === 'max_upload_size');
      expect(setting?.value).toBe(25);
      expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/settings/max_upload_size', {
        value: 25,
      });
    });

    it('should set error when update setting fails', async () => {
      useAdminStore.setState({ systemSettings: [mockSetting] });
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('fail'));

      await useAdminStore.getState().updateSetting('max_upload_size', 25);

      expect(useAdminStore.getState().error).toBe('Failed to update setting');
    });
  });

  // ==================== REFRESH STATS ====================

  describe('refreshStats', () => {
    it('should call fetchStats internally', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockStats });

      await useAdminStore.getState().refreshStats();

      const state = useAdminStore.getState();
      expect(state.stats).toEqual(mockStats);
      expect(api.get).toHaveBeenCalledWith('/api/v1/admin/stats');
    });
  });
});
