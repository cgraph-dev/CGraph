import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mocks (hoisted so vi.mock factories can reference them) ─────────────────

const { mockFriendStore, mockAuthStore, mockApi, mockUnsubscribe } = vi.hoisted(() => ({
  mockFriendStore: {
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    removeFriend: vi.fn(),
  },
  mockAuthStore: {
    isAuthenticated: false,
    user: null as { id: string; username: string } | null,
  },
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  mockUnsubscribe: vi.fn(),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: vi.fn(() => mockFriendStore),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    joinPresenceLobby: vi.fn(() => ({ on: vi.fn(() => ({})), off: vi.fn() })),
    getOnlineFriends: vi.fn(() => []),
    isFriendOnline: vi.fn(() => false),
    isUserOnline: vi.fn(() => false),
    onStatusChange: vi.fn(() => mockUnsubscribe),
  },
}));

vi.mock('@/components/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), light: vi.fn() },
}));

vi.mock('@/data/achievements', () => ({
  ACHIEVEMENT_DEFINITIONS: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
}));

import { useProfileActions } from '../useProfileActions';
import { useProfileData } from '../useProfileData';
import { useProfileEdit } from '../useProfileEdit';
import { usePresence, useUserOnline } from '../usePresence';
import type { UserProfileData } from '@/types/profile.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    bannerUrl: null,
    bio: 'Hello world',
    status: 'online',
    statusMessage: null,
    isVerified: false,
    isPremium: false,
    karma: 10,
    createdAt: '2025-01-01',
    ...overrides,
  };
}

// ─── useProfileActions ───────────────────────────────────────────────────────

describe('useProfileActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial isActioning as false', () => {
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    expect(result.current.isActioning).toBe(false);
    expect(typeof result.current.handleSendRequest).toBe('function');
    expect(typeof result.current.handleAcceptRequest).toBe('function');
    expect(typeof result.current.handleRemoveFriend).toBe('function');
  });

  it('handleSendRequest should call sendRequest and set status to pending_sent', async () => {
    mockFriendStore.sendRequest.mockResolvedValueOnce(undefined);
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(mockFriendStore.sendRequest).toHaveBeenCalledWith('testuser');
    expect(setStatus).toHaveBeenCalledWith('pending_sent');
    expect(result.current.isActioning).toBe(false);
  });

  it('handleSendRequest should not call sendRequest if profile is null', async () => {
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(null, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    expect(mockFriendStore.sendRequest).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('handleAcceptRequest should call acceptRequest and set status to friends', async () => {
    mockFriendStore.acceptRequest.mockResolvedValueOnce(undefined);
    const profile = makeProfile({ id: 'friend-42' });
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleAcceptRequest();
    });

    expect(mockFriendStore.acceptRequest).toHaveBeenCalledWith('friend-42');
    expect(setStatus).toHaveBeenCalledWith('friends');
  });

  it('handleRemoveFriend should call removeFriend and set status to none', async () => {
    mockFriendStore.removeFriend.mockResolvedValueOnce(undefined);
    const profile = makeProfile({ id: 'friend-42' });
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleRemoveFriend();
    });

    expect(mockFriendStore.removeFriend).toHaveBeenCalledWith('friend-42');
    expect(setStatus).toHaveBeenCalledWith('none');
  });

  it('handleSendRequest should handle errors gracefully', async () => {
    mockFriendStore.sendRequest.mockRejectedValueOnce(new Error('Network error'));
    const profile = makeProfile();
    const setStatus = vi.fn();
    const { result } = renderHook(() => useProfileActions(profile, setStatus));

    await act(async () => {
      await result.current.handleSendRequest();
    });

    // Should not set status on error, and isActioning should be reset
    expect(setStatus).not.toHaveBeenCalled();
    expect(result.current.isActioning).toBe(false);
  });
});

// ─── useProfileData ──────────────────────────────────────────────────────────

describe('useProfileData', () => {
  const ownStats = { level: 5, totalXP: 500, loginStreak: 3, totalUnlocked: 2 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load profile data from API', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          username: 'bob',
          display_name: 'Bob',
          avatar_url: null,
          banner_url: null,
          bio: 'Hi',
          status: 'online',
          custom_status: null,
          is_verified: true,
          is_premium: false,
          karma: 42,
          inserted_at: '2025-01-01',
          friendship_status: 'friends',
        },
      },
    });

    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile!.username).toBe('bob');
    expect(result.current.profile!.isVerified).toBe(true);
    expect(result.current.friendshipStatus).toBe('friends');
  });

  it('should set error when API fails', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useProfileData('user-1', false, ownStats));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load user profile');
    expect(result.current.profile).toBeNull();
  });

  it('should not fetch if userId is undefined', () => {
    const { result: _result } = renderHook(() => useProfileData(undefined, false, ownStats));

    // fetchProfile early-returns without calling the API
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});

// ─── useProfileEdit ──────────────────────────────────────────────────────────

describe('useProfileEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial edit mode as false', () => {
    const profile = makeProfile();
    const setProfile = vi.fn();
    const { result } = renderHook(() => useProfileEdit(profile, setProfile, true));

    expect(result.current.editMode).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isUploadingAvatar).toBe(false);
    expect(result.current.isUploadingBanner).toBe(false);
  });

  it('should initialise editedBio from profile', () => {
    const profile = makeProfile({ bio: 'My awesome bio' });
    const setProfile = vi.fn();
    const { result } = renderHook(() => useProfileEdit(profile, setProfile, true));

    expect(result.current.editedBio).toBe('My awesome bio');
  });

  it('handleCancelEdit should reset bio and exit edit mode', () => {
    const profile = makeProfile({ bio: 'Original bio' });
    const setProfile = vi.fn();
    const { result } = renderHook(() => useProfileEdit(profile, setProfile, true));

    // Enter edit mode and change bio
    act(() => {
      result.current.setEditMode(true);
      result.current.setEditedBio('Changed bio');
    });

    expect(result.current.editMode).toBe(true);
    expect(result.current.editedBio).toBe('Changed bio');

    // Cancel
    act(() => {
      result.current.handleCancelEdit();
    });

    expect(result.current.editMode).toBe(false);
    expect(result.current.editedBio).toBe('Original bio');
  });

  it('handleSaveProfile should save bio via API and update profile', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: {} });
    const profile = makeProfile({ id: 'user-99', bio: 'Old bio' });
    const setProfile = vi.fn();
    const { result } = renderHook(() => useProfileEdit(profile, setProfile, true));

    act(() => {
      result.current.setEditMode(true);
      result.current.setEditedBio('New bio');
    });

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/users/user-99', { bio: 'New bio' });
    expect(setProfile).toHaveBeenCalled();
    expect(result.current.editMode).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });
});

// ─── usePresence ─────────────────────────────────────────────────────────────

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
  });

  it('should return disconnected state when not authenticated', () => {
    const { result } = renderHook(() => usePresence());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.onlineCount).toBe(0);
  });

  it('should connect and return online count when authenticated', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'me', username: 'me' };

    const { result } = renderHook(() => usePresence());

    expect(result.current.isConnected).toBe(true);
  });

  it('isUserOnline should return false for empty string', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'me', username: 'me' };

    const { result } = renderHook(() => usePresence());

    expect(result.current.isUserOnline('')).toBe(false);
  });
});

// ─── useUserOnline ───────────────────────────────────────────────────────────

describe('useUserOnline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
  });

  it('should return false when not authenticated', () => {
    const { result } = renderHook(() => useUserOnline('user-1'));

    expect(result.current).toBe(false);
  });

  it('should return false when userId is undefined', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'me', username: 'me' };

    const { result } = renderHook(() => useUserOnline(undefined));

    expect(result.current).toBe(false);
  });
});
