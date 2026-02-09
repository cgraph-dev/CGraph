import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const mockAdminStore = vi.hoisted(() => ({
  // UI State
  activeTab: 'dashboard' as const,
  sidebarCollapsed: false,
  isLoading: false,
  error: null as string | null,

  // Dashboard
  stats: null as Record<string, number> | null,
  statsLastUpdated: null as Date | null,
  fetchStats: vi.fn(),
  refreshStats: vi.fn(),
  setActiveTab: vi.fn(),
  toggleSidebar: vi.fn(),
  setError: vi.fn(),

  // Events
  events: [] as Array<{
    id: string;
    name: string;
    status: string;
    participants: number;
  }>,
  eventFilters: { status: 'all' as const },
  fetchEvents: vi.fn(),
  setEventFilters: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  changeEventStatus: vi.fn(),

  // Users
  users: [] as Array<{
    id: string;
    username: string;
    status: string;
    role: string;
  }>,
  userFilters: { status: 'all' as const, role: 'all' as const },
  selectedUserIds: [] as string[],
  fetchUsers: vi.fn(),
  setUserFilters: vi.fn(),
  selectUser: vi.fn(),
  deselectUser: vi.fn(),
  selectAllUsers: vi.fn(),
  clearUserSelection: vi.fn(),
  banUser: vi.fn(),
  suspendUser: vi.fn(),
  warnUser: vi.fn(),
  unbanUser: vi.fn(),
  changeUserRole: vi.fn(),
  batchAction: vi.fn(),

  // Settings
  systemSettings: [] as Array<{
    key: string;
    value: string | number | boolean;
    category: string;
  }>,
  fetchSettings: vi.fn(),
  updateSetting: vi.fn(),

  // Moderation Queue
  moderationQueue: [] as Array<{
    id: string;
    status: string;
    riskLevel: string;
    type: string;
  }>,
  moderationFilters: {
    status: 'all' as const,
    riskLevel: 'all' as const,
    type: 'all' as const,
  },
  fetchModerationQueue: vi.fn(),
  setModerationFilters: vi.fn(),
  reviewModerationItem: vi.fn(),
  assignModerationItem: vi.fn(),
}));

vi.mock('../../store', () => ({
  useAdminStore: () => mockAdminStore,
}));

import { useAdminDashboard } from '../useAdminDashboard';
import { useAdminEvents } from '../useAdminEvents';
import { useAdminUsers } from '../useAdminUsers';
import { useAdminSettings } from '../useAdminSettings';
import { useModerationQueue } from '../useModerationQueue';

// ─── useAdminDashboard ───────────────────────────────────────────────────────

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminStore.stats = null;
    mockAdminStore.error = null;
    mockAdminStore.activeTab = 'dashboard';
    mockAdminStore.sidebarCollapsed = false;
    mockAdminStore.isLoading = false;
    mockAdminStore.statsLastUpdated = null;
  });

  it('fetches stats on mount when stats are null', () => {
    renderHook(() => useAdminDashboard());
    expect(mockAdminStore.fetchStats).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch stats when stats already exist', () => {
    mockAdminStore.stats = { activeUsers: 10, revenue24h: 500 };
    renderHook(() => useAdminDashboard());
    expect(mockAdminStore.fetchStats).not.toHaveBeenCalled();
  });

  it('returns dashboard state correctly', () => {
    mockAdminStore.activeTab = 'events' as any;
    mockAdminStore.sidebarCollapsed = true;
    mockAdminStore.isLoading = true;
    mockAdminStore.error = 'Network error';
    mockAdminStore.stats = { activeUsers: 42 };

    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.activeTab).toBe('events');
    expect(result.current.sidebarCollapsed).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Network error');
    expect(result.current.stats).toEqual({ activeUsers: 42 });
  });

  it('navigateToTab calls setActiveTab', () => {
    const { result } = renderHook(() => useAdminDashboard());
    act(() => {
      result.current.navigateToTab('users');
    });
    expect(mockAdminStore.setActiveTab).toHaveBeenCalledWith('users');
  });

  it('clearError calls setError with null', () => {
    const { result } = renderHook(() => useAdminDashboard());
    act(() => {
      result.current.clearError();
    });
    expect(mockAdminStore.setError).toHaveBeenCalledWith(null);
  });
});

// ─── useAdminEvents ──────────────────────────────────────────────────────────

describe('useAdminEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminStore.events = [
      { id: '1', name: 'Event A', status: 'active', participants: 10 },
      { id: '2', name: 'Event B', status: 'scheduled', participants: 5 },
      { id: '3', name: 'Event C', status: 'draft', participants: 0 },
      { id: '4', name: 'Event D', status: 'active', participants: 20 },
    ];
    mockAdminStore.eventFilters = { status: 'all' };
    mockAdminStore.isLoading = false;
    mockAdminStore.error = null;
  });

  it('returns all events when filter is "all"', () => {
    const { result } = renderHook(() => useAdminEvents());
    expect(result.current.events).toHaveLength(4);
  });

  it('filters events by status', () => {
    mockAdminStore.eventFilters = { status: 'active' as any };
    const { result } = renderHook(() => useAdminEvents());
    expect(result.current.events).toHaveLength(2);
    expect(result.current.events.every((e) => e.status === 'active')).toBe(true);
  });

  it('computes event stats correctly', () => {
    const { result } = renderHook(() => useAdminEvents());
    expect(result.current.stats.total).toBe(4);
    expect(result.current.stats.active).toBe(2);
    expect(result.current.stats.scheduled).toBe(1);
    expect(result.current.stats.draft).toBe(1);
    expect(result.current.stats.totalParticipants).toBe(35);
  });

  it('filterByStatus calls setEventFilters', () => {
    const { result } = renderHook(() => useAdminEvents());
    act(() => {
      result.current.filterByStatus('scheduled');
    });
    expect(mockAdminStore.setEventFilters).toHaveBeenCalledWith({ status: 'scheduled' });
  });

  it('start calls changeEventStatus with active', async () => {
    mockAdminStore.changeEventStatus.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminEvents());
    await act(async () => {
      await result.current.start('1');
    });
    expect(mockAdminStore.changeEventStatus).toHaveBeenCalledWith('1', 'active');
  });

  it('does not fetch events when events already exist', () => {
    renderHook(() => useAdminEvents());
    expect(mockAdminStore.fetchEvents).not.toHaveBeenCalled();
  });
});

// ─── useAdminUsers ───────────────────────────────────────────────────────────

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminStore.users = [
      { id: 'u1', username: 'alice', status: 'active', role: 'admin' },
      { id: 'u2', username: 'bob', status: 'suspended', role: 'user' },
      { id: 'u3', username: 'charlie', status: 'active', role: 'moderator' },
      { id: 'u4', username: 'dave', status: 'banned', role: 'user' },
    ];
    mockAdminStore.userFilters = { status: 'all', role: 'all' };
    mockAdminStore.selectedUserIds = [];
  });

  it('returns all users when no filters are applied', () => {
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.users).toHaveLength(4);
  });

  it('filters users by status', () => {
    mockAdminStore.userFilters = { status: 'active' as any, role: 'all' };
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.users).toHaveLength(2);
    expect(result.current.users.every((u) => u.status === 'active')).toBe(true);
  });

  it('filters users by role', () => {
    mockAdminStore.userFilters = { status: 'all', role: 'user' as any };
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.users).toHaveLength(2);
  });

  it('computes user stats correctly', () => {
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.stats.total).toBe(4);
    expect(result.current.stats.active).toBe(2);
    expect(result.current.stats.suspended).toBe(1);
    expect(result.current.stats.banned).toBe(1);
    expect(result.current.stats.moderators).toBe(1);
    expect(result.current.stats.admins).toBe(1);
  });

  it('toggleSelection selects and deselects users', () => {
    mockAdminStore.selectedUserIds = [];
    const { result } = renderHook(() => useAdminUsers());

    act(() => {
      result.current.toggleSelection('u1');
    });
    expect(mockAdminStore.selectUser).toHaveBeenCalledWith('u1');

    // Simulate user already selected
    mockAdminStore.selectedUserIds = ['u1'];
    const { result: result2 } = renderHook(() => useAdminUsers());
    act(() => {
      result2.current.toggleSelection('u1');
    });
    expect(mockAdminStore.deselectUser).toHaveBeenCalledWith('u1');
  });

  it('isAllSelected returns true when all users are selected', () => {
    mockAdminStore.selectedUserIds = ['u1', 'u2', 'u3', 'u4'];
    const { result } = renderHook(() => useAdminUsers());
    expect(result.current.isAllSelected).toBe(true);
  });

  it('ban calls banUser with correct arguments', async () => {
    mockAdminStore.banUser.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers());
    await act(async () => {
      await result.current.ban('u2', 'Spam', 7);
    });
    expect(mockAdminStore.banUser).toHaveBeenCalledWith('u2', 'Spam', 7);
  });

  it('batchBan calls batchAction with selected user ids', async () => {
    mockAdminStore.selectedUserIds = ['u2', 'u4'];
    mockAdminStore.batchAction.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers());
    await act(async () => {
      await result.current.batchBan('Spam bots');
    });
    expect(mockAdminStore.batchAction).toHaveBeenCalledWith('ban', ['u2', 'u4'], {
      reason: 'Spam bots',
    });
  });
});

// ─── useAdminSettings ────────────────────────────────────────────────────────

describe('useAdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminStore.systemSettings = [
      { key: 'site_name', value: 'CGraph', category: 'general' },
      { key: 'max_upload', value: 10, category: 'general' },
      { key: 'smtp_host', value: 'mail.example.com', category: 'email' },
      { key: 'maintenance_mode', value: false, category: 'system' },
    ];
  });

  it('groups settings by category', () => {
    const { result } = renderHook(() => useAdminSettings());
    expect(result.current.settingsByCategory).toHaveProperty('general');
    expect(result.current.settingsByCategory).toHaveProperty('email');
    expect(result.current.settingsByCategory).toHaveProperty('system');
    expect(result.current.settingsByCategory['general']).toHaveLength(2);
  });

  it('returns list of categories', () => {
    const { result } = renderHook(() => useAdminSettings());
    expect(result.current.categories).toEqual(
      expect.arrayContaining(['general', 'email', 'system'])
    );
  });

  it('getSetting retrieves a specific setting by key', () => {
    const { result } = renderHook(() => useAdminSettings());
    const setting = result.current.getSetting('smtp_host');
    expect(setting).toEqual({ key: 'smtp_host', value: 'mail.example.com', category: 'email' });
  });

  it('getSetting returns undefined for unknown key', () => {
    const { result } = renderHook(() => useAdminSettings());
    expect(result.current.getSetting('nonexistent')).toBeUndefined();
  });

  it('update calls updateSetting', async () => {
    mockAdminStore.updateSetting.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminSettings());
    await act(async () => {
      await result.current.update('maintenance_mode', true);
    });
    expect(mockAdminStore.updateSetting).toHaveBeenCalledWith('maintenance_mode', true);
  });

  it('does not fetch settings when settings already exist', () => {
    renderHook(() => useAdminSettings());
    expect(mockAdminStore.fetchSettings).not.toHaveBeenCalled();
  });
});

// ─── useModerationQueue (admin) ──────────────────────────────────────────────

describe('useModerationQueue (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminStore.moderationQueue = [
      { id: 'm1', status: 'pending', riskLevel: 'critical', type: 'report' },
      { id: 'm2', status: 'pending', riskLevel: 'low', type: 'listing' },
      { id: 'm3', status: 'escalated', riskLevel: 'high', type: 'user' },
    ];
    mockAdminStore.moderationFilters = { status: 'all', riskLevel: 'all', type: 'all' };
  });

  it('returns all items when filters are "all"', () => {
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.queue).toHaveLength(3);
  });

  it('filters by status', () => {
    mockAdminStore.moderationFilters = { status: 'pending' as any, riskLevel: 'all', type: 'all' };
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.queue).toHaveLength(2);
  });

  it('filters by risk level', () => {
    mockAdminStore.moderationFilters = { status: 'all', riskLevel: 'critical' as any, type: 'all' };
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.queue).toHaveLength(1);
  });

  it('computes queue stats correctly', () => {
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.pending).toBe(2);
    expect(result.current.stats.critical).toBe(1);
    expect(result.current.stats.escalated).toBe(1);
  });

  it('approveItem calls reviewModerationItem with approve', async () => {
    mockAdminStore.reviewModerationItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useModerationQueue());
    await act(async () => {
      await result.current.approveItem('m1', 'Looks good');
    });
    expect(mockAdminStore.reviewModerationItem).toHaveBeenCalledWith('m1', 'approve', 'Looks good');
  });

  it('rejectItem calls reviewModerationItem with reject', async () => {
    mockAdminStore.reviewModerationItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useModerationQueue());
    await act(async () => {
      await result.current.rejectItem('m1', 'Spam');
    });
    expect(mockAdminStore.reviewModerationItem).toHaveBeenCalledWith('m1', 'reject', 'Spam');
  });
});
