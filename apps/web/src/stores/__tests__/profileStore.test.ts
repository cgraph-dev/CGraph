/**
 * profileStore Unit Tests
 *
 * Tests for Zustand profile store state management.
 * These tests cover user profiles, signatures, badges, titles,
 * blocked users, and all async API operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useProfileStore } from '../profileStore';
import type { ExtendedProfile, UserSignature, BlockedUser } from '../profileStore';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import the mocked api with proper typing
import { api } from '@/lib/api';

// Type the mocked API properly
const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock profile data
const mockSignature: UserSignature = {
  enabled: true,
  content: '[b]Test Signature[/b]',
  maxLength: 500,
};

const mockProfile: ExtendedProfile = {
  id: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  bannerUrl: 'https://example.com/banner.png',
  bio: 'This is my bio',
  signature: mockSignature,

  location: 'New York',
  website: 'https://example.com',
  occupation: 'Developer',
  interests: 'Gaming, Coding',
  birthDate: '1990-01-15',
  showBirthDate: true,
  gender: 'Male',
  socialLinks: {
    twitter: '@testuser',
    github: 'testuser',
    discord: 'testuser#1234',
  },
  customFields: [],

  currentTitle: {
    id: 'title-1',
    name: 'Elite Member',
    color: '#FFD700',
    type: 'earned',
  },
  availableTitles: [
    { id: 'title-1', name: 'Elite Member', color: '#FFD700', type: 'earned' },
    { id: 'title-2', name: 'Moderator', color: '#00FF00', type: 'system' },
  ],
  badges: [
    {
      id: 'badge-1',
      name: 'First Post',
      description: 'Made your first post',
      iconUrl: '/badges/first-post.png',
      color: '#6366f1',
      rarity: 'common',
      earnedAt: '2026-01-01T00:00:00Z',
      isEquipped: false,
    },
    {
      id: 'badge-2',
      name: 'Pioneer',
      description: 'Early adopter',
      iconUrl: '/badges/pioneer.png',
      color: '#FFD700',
      rarity: 'rare',
      earnedAt: '2026-01-02T00:00:00Z',
      isEquipped: true,
    },
  ],
  equippedBadges: [
    {
      id: 'badge-2',
      name: 'Pioneer',
      description: 'Early adopter',
      iconUrl: '/badges/pioneer.png',
      color: '#FFD700',
      rarity: 'rare',
      earnedAt: '2026-01-02T00:00:00Z',
      isEquipped: true,
    },
  ],
  stars: { count: 3, color: '#fbbf24' },

  isProfilePrivate: false,
  showOnlineStatus: true,
  showLastActive: true,
  showEmail: false,
  showLocation: true,

  postCount: 250,
  topicCount: 15,
  commentCount: 120,
  reputation: 500,
  reputationPositive: 550,
  reputationNegative: 50,
  warnLevel: 0,

  registeredAt: '2025-06-01T00:00:00Z',
  lastActive: '2026-01-31T10:00:00Z',
  lastPostAt: '2026-01-30T15:00:00Z',

  isOnline: true,
  status: 'online',
  statusMessage: 'Working on a project',

  isFriend: true,
  isBlocked: false,
  friendshipStatus: 'friends',
};

const mockBlockedUser: BlockedUser = {
  id: 'blocked-1',
  username: 'blockeduser',
  displayName: 'Blocked User',
  avatarUrl: null,
  blockedAt: '2026-01-15T00:00:00Z',
  reason: 'Spam',
};

// Mock API response format (snake_case)
const mockApiProfileResponse = {
  data: {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
    banner_url: 'https://example.com/banner.png',
    bio: 'This is my bio',
    signature_enabled: true,
    signature: '[b]Test Signature[/b]',
    signature_max_length: 500,
    location: 'New York',
    website: 'https://example.com',
    occupation: 'Developer',
    interests: 'Gaming, Coding',
    birth_date: '1990-01-15',
    show_birth_date: true,
    gender: 'Male',
    twitter: '@testuser',
    github: 'testuser',
    discord: 'testuser#1234',
    custom_fields: [],
    current_title: { id: 'title-1', name: 'Elite Member', color: '#FFD700', type: 'earned' },
    available_titles: [
      { id: 'title-1', name: 'Elite Member', color: '#FFD700', type: 'earned' },
      { id: 'title-2', name: 'Moderator', color: '#00FF00', type: 'system' },
    ],
    badges: [
      {
        id: 'badge-1',
        name: 'First Post',
        description: 'Made your first post',
        icon_url: '/badges/first-post.png',
        color: '#6366f1',
        rarity: 'common',
        earned_at: '2026-01-01T00:00:00Z',
        is_equipped: false,
      },
    ],
    equipped_badges: [],
    post_count: 250,
    topic_count: 15,
    comment_count: 120,
    karma: 500,
    reputation_positive: 550,
    reputation_negative: 50,
    warn_level: 0,
    inserted_at: '2025-06-01T00:00:00Z',
    last_active_at: '2026-01-31T10:00:00Z',
    last_post_at: '2026-01-30T15:00:00Z',
    is_online: true,
    status: 'online',
    status_message: 'Working on a project',
    is_friend: true,
    is_blocked: false,
    friendship_status: 'friends',
    is_profile_private: false,
    show_online_status: true,
    show_last_active: true,
    show_email: false,
    show_location: true,
  },
};

// Get initial state for reset
const getInitialState = () => ({
  currentProfile: null,
  isLoadingProfile: false,
  profileError: null,
  myProfile: null,
  mySignature: null,
  blockedUsers: [],
  isLoadingBlocked: false,
  availableFields: [],
});

// Reset store state after each test
afterEach(() => {
  useProfileStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('profileStore', () => {
  describe('initial state', () => {
    beforeEach(() => {
      useProfileStore.setState(getInitialState());
    });

    it('should have null currentProfile initially', () => {
      const state = useProfileStore.getState();
      expect(state.currentProfile).toBeNull();
    });

    it('should not be loading initially', () => {
      const state = useProfileStore.getState();
      expect(state.isLoadingProfile).toBe(false);
    });

    it('should have no profile error initially', () => {
      const state = useProfileStore.getState();
      expect(state.profileError).toBeNull();
    });

    it('should have null myProfile initially', () => {
      const state = useProfileStore.getState();
      expect(state.myProfile).toBeNull();
    });

    it('should have null mySignature initially', () => {
      const state = useProfileStore.getState();
      expect(state.mySignature).toBeNull();
    });

    it('should have empty blockedUsers list initially', () => {
      const state = useProfileStore.getState();
      expect(state.blockedUsers).toHaveLength(0);
    });

    it('should not be loading blocked users initially', () => {
      const state = useProfileStore.getState();
      expect(state.isLoadingBlocked).toBe(false);
    });

    it('should have empty availableFields initially', () => {
      const state = useProfileStore.getState();
      expect(state.availableFields).toHaveLength(0);
    });
  });

  describe('fetchProfile action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApiProfileResponse), 100);
          })
      );

      const fetchPromise = useProfileStore.getState().fetchProfile('user-123');

      expect(useProfileStore.getState().isLoadingProfile).toBe(true);

      await fetchPromise;

      expect(useProfileStore.getState().isLoadingProfile).toBe(false);
    });

    it('should fetch and set profile data', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchProfile('user-123');

      const state = useProfileStore.getState();
      expect(state.currentProfile).not.toBeNull();
      expect(state.currentProfile?.id).toBe('user-123');
      expect(state.currentProfile?.username).toBe('testuser');
      expect(state.currentProfile?.displayName).toBe('Test User');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchProfile('user-456');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/user-456');
    });

    it('should return the fetched profile', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      const result = await useProfileStore.getState().fetchProfile('user-123');

      expect(result.id).toBe('user-123');
      expect(result.username).toBe('testuser');
    });

    it('should set error state on failure', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useProfileStore.getState().fetchProfile('user-123')).rejects.toThrow(
        'Network error'
      );

      const state = useProfileStore.getState();
      expect(state.profileError).toBe('Network error');
      expect(state.isLoadingProfile).toBe(false);
    });

    it('should clear previous error before fetching', async () => {
      useProfileStore.setState({ profileError: 'Previous error' });

      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchProfile('user-123');

      expect(useProfileStore.getState().profileError).toBeNull();
    });
  });

  describe('fetchMyProfile action', () => {
    it('should fetch and set own profile', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchMyProfile();

      const state = useProfileStore.getState();
      expect(state.myProfile).not.toBeNull();
      expect(state.myProfile?.id).toBe('user-123');
    });

    it('should also set mySignature from profile', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchMyProfile();

      const state = useProfileStore.getState();
      expect(state.mySignature).not.toBeNull();
      expect(state.mySignature?.enabled).toBe(true);
      expect(state.mySignature?.content).toBe('[b]Test Signature[/b]');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchMyProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me');
    });

    it('should throw error on failure', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(useProfileStore.getState().fetchMyProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateProfile action', () => {
    beforeEach(() => {
      useProfileStore.setState({
        myProfile: mockProfile,
      });
    });

    it('should update profile with new data', async () => {
      const updatedResponse = {
        data: {
          ...mockApiProfileResponse.data,
          display_name: 'Updated Name',
          bio: 'Updated bio',
        },
      };
      mockedApi.put.mockResolvedValue(updatedResponse);

      await useProfileStore.getState().updateProfile({
        displayName: 'Updated Name',
        bio: 'Updated bio',
      });

      const state = useProfileStore.getState();
      expect(state.myProfile?.displayName).toBe('Updated Name');
      expect(state.myProfile?.bio).toBe('Updated bio');
    });

    it('should call API with correct payload format', async () => {
      mockedApi.put.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().updateProfile({
        displayName: 'New Name',
        location: 'London',
        website: 'https://newsite.com',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', {
        user: {
          display_name: 'New Name',
          location: 'London',
          website: 'https://newsite.com',
        },
      });
    });

    it('should update social links correctly', async () => {
      mockedApi.put.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().updateProfile({
        socialLinks: {
          twitter: '@newhandle',
          github: 'newgithub',
        },
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', {
        user: {
          twitter: '@newhandle',
          github: 'newgithub',
          discord: undefined,
          youtube: undefined,
          twitch: undefined,
          instagram: undefined,
          linkedin: undefined,
        },
      });
    });

    it('should throw error on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Update failed'));

      await expect(
        useProfileStore.getState().updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updateSignature action', () => {
    beforeEach(() => {
      useProfileStore.setState({
        myProfile: mockProfile,
        mySignature: mockSignature,
      });
    });

    it('should update signature', async () => {
      mockedApi.put.mockResolvedValue({
        data: {
          enabled: true,
          content: 'New signature content',
          max_length: 500,
        },
      });

      await useProfileStore.getState().updateSignature({
        enabled: true,
        content: 'New signature content',
      });

      const state = useProfileStore.getState();
      expect(state.mySignature?.content).toBe('New signature content');
    });

    it('should call API with correct endpoint and payload', async () => {
      mockedApi.put.mockResolvedValue({
        data: { enabled: false, content: '', max_length: 500 },
      });

      await useProfileStore.getState().updateSignature({
        enabled: false,
        content: '',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/signature', {
        signature: {
          enabled: false,
          content: '',
        },
      });
    });

    it('should update myProfile signature as well', async () => {
      mockedApi.put.mockResolvedValue({
        data: {
          enabled: true,
          content: 'Updated!',
          max_length: 500,
        },
      });

      await useProfileStore.getState().updateSignature({
        enabled: true,
        content: 'Updated!',
      });

      const state = useProfileStore.getState();
      expect(state.myProfile?.signature.content).toBe('Updated!');
    });
  });

  describe('equipTitle action', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should equip a new title', async () => {
      const updatedResponse = {
        data: {
          ...mockApiProfileResponse.data,
          current_title: { id: 'title-2', name: 'Moderator', color: '#00FF00', type: 'system' },
        },
      };
      mockedApi.put.mockResolvedValue(updatedResponse);

      await useProfileStore.getState().equipTitle('title-2');

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/title', {
        title_id: 'title-2',
      });
    });

    it('should allow unequipping title by passing null', async () => {
      const updatedResponse = {
        data: {
          ...mockApiProfileResponse.data,
          current_title: null,
        },
      };
      mockedApi.put.mockResolvedValue(updatedResponse);

      await useProfileStore.getState().equipTitle(null);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/title', {
        title_id: null,
      });
    });

    it('should throw error on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Title not found'));

      await expect(useProfileStore.getState().equipTitle('invalid-title')).rejects.toThrow(
        'Title not found'
      );
    });
  });

  describe('equipBadge and unequipBadge actions', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should equip a badge', async () => {
      mockedApi.post.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().equipBadge('badge-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/users/me/badges/equip', {
        badge_id: 'badge-1',
      });
    });

    it('should unequip a badge', async () => {
      mockedApi.delete.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().unequipBadge('badge-2');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/users/me/badges/equip/badge-2');
    });

    it('should throw error when equipping non-owned badge', async () => {
      mockedApi.post.mockRejectedValue(new Error('Badge not owned'));

      await expect(useProfileStore.getState().equipBadge('unknown-badge')).rejects.toThrow(
        'Badge not owned'
      );
    });

    it('should throw error when unequipping fails', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Failed to unequip'));

      await expect(useProfileStore.getState().unequipBadge('badge-1')).rejects.toThrow(
        'Failed to unequip'
      );
    });
  });

  describe('blockUser and unblockUser actions', () => {
    beforeEach(() => {
      useProfileStore.setState({
        blockedUsers: [mockBlockedUser],
      });
      // Mock fetchBlockedUsers for blockUser
      mockedApi.get.mockResolvedValue({
        data: [
          {
            id: 'blocked-1',
            username: 'blockeduser',
            display_name: 'Blocked User',
            avatar_url: null,
            blocked_at: '2026-01-15T00:00:00Z',
            reason: 'Spam',
          },
          {
            id: 'blocked-2',
            username: 'newblocked',
            display_name: 'New Blocked',
            avatar_url: null,
            blocked_at: '2026-01-31T00:00:00Z',
            reason: 'Harassment',
          },
        ],
      });
    });

    it('should block a user', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useProfileStore.getState().blockUser('user-999', 'Harassment');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/users/me/blocked', {
        user_id: 'user-999',
        reason: 'Harassment',
      });
    });

    it('should refresh blocked list after blocking', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useProfileStore.getState().blockUser('user-999');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me/blocked');
    });

    it('should update currentProfile.isBlocked when blocking viewed user', async () => {
      useProfileStore.setState({
        currentProfile: { ...mockProfile, id: 'user-999', isBlocked: false },
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useProfileStore.getState().blockUser('user-999');

      expect(useProfileStore.getState().currentProfile?.isBlocked).toBe(true);
    });

    it('should unblock a user', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useProfileStore.getState().unblockUser('blocked-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/users/me/blocked/blocked-1');
    });

    it('should remove user from blocked list after unblocking', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useProfileStore.getState().unblockUser('blocked-1');

      const state = useProfileStore.getState();
      expect(state.blockedUsers.find((u) => u.id === 'blocked-1')).toBeUndefined();
    });

    it('should update currentProfile.isBlocked when unblocking viewed user', async () => {
      useProfileStore.setState({
        currentProfile: { ...mockProfile, id: 'blocked-1', isBlocked: true },
        blockedUsers: [mockBlockedUser],
      });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useProfileStore.getState().unblockUser('blocked-1');

      expect(useProfileStore.getState().currentProfile?.isBlocked).toBe(false);
    });
  });

  describe('fetchBlockedUsers action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: [] }), 100);
          })
      );

      const fetchPromise = useProfileStore.getState().fetchBlockedUsers();

      expect(useProfileStore.getState().isLoadingBlocked).toBe(true);

      await fetchPromise;

      expect(useProfileStore.getState().isLoadingBlocked).toBe(false);
    });

    it('should fetch and set blocked users', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          {
            id: 'blocked-1',
            username: 'blockeduser',
            display_name: 'Blocked User',
            avatar_url: null,
            blocked_at: '2026-01-15T00:00:00Z',
            reason: 'Spam',
          },
        ],
      });

      await useProfileStore.getState().fetchBlockedUsers();

      const state = useProfileStore.getState();
      expect(state.blockedUsers).toHaveLength(1);
      expect(state.blockedUsers[0]?.username).toBe('blockeduser');
      expect(state.blockedUsers[0]?.reason).toBe('Spam');
    });

    it('should call correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      await useProfileStore.getState().fetchBlockedUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me/blocked');
    });

    it('should set loading to false on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Failed to fetch'));

      await expect(useProfileStore.getState().fetchBlockedUsers()).rejects.toThrow(
        'Failed to fetch'
      );

      expect(useProfileStore.getState().isLoadingBlocked).toBe(false);
    });
  });

  describe('isUserBlocked helper', () => {
    it('should return true if user is blocked', () => {
      useProfileStore.setState({
        blockedUsers: [mockBlockedUser],
      });

      expect(useProfileStore.getState().isUserBlocked('blocked-1')).toBe(true);
    });

    it('should return false if user is not blocked', () => {
      useProfileStore.setState({
        blockedUsers: [mockBlockedUser],
      });

      expect(useProfileStore.getState().isUserBlocked('other-user')).toBe(false);
    });

    it('should return false when blocked list is empty', () => {
      useProfileStore.setState({ blockedUsers: [] });

      expect(useProfileStore.getState().isUserBlocked('any-user')).toBe(false);
    });
  });

  describe('clearProfile action', () => {
    it('should clear currentProfile', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        profileError: 'Some error',
      });

      useProfileStore.getState().clearProfile();

      const state = useProfileStore.getState();
      expect(state.currentProfile).toBeNull();
      expect(state.profileError).toBeNull();
    });

    it('should not affect myProfile when clearing', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        myProfile: mockProfile,
      });

      useProfileStore.getState().clearProfile();

      const state = useProfileStore.getState();
      expect(state.currentProfile).toBeNull();
      expect(state.myProfile).not.toBeNull();
    });
  });

  describe('loading states', () => {
    it('should track profile loading state', () => {
      useProfileStore.setState({ isLoadingProfile: true });

      expect(useProfileStore.getState().isLoadingProfile).toBe(true);
    });

    it('should track blocked users loading state', () => {
      useProfileStore.setState({ isLoadingBlocked: true });

      expect(useProfileStore.getState().isLoadingBlocked).toBe(true);
    });

    it('should reset loading state after successful profile fetch', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchProfile('user-123');

      expect(useProfileStore.getState().isLoadingProfile).toBe(false);
    });

    it('should reset loading state after failed profile fetch', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      try {
        await useProfileStore.getState().fetchProfile('user-123');
      } catch {
        // Expected
      }

      expect(useProfileStore.getState().isLoadingProfile).toBe(false);
    });
  });

  describe('profile data mapping', () => {
    it('should correctly map snake_case API response to camelCase', async () => {
      mockedApi.get.mockResolvedValue(mockApiProfileResponse);

      await useProfileStore.getState().fetchProfile('user-123');

      const profile = useProfileStore.getState().currentProfile;
      expect(profile?.displayName).toBe('Test User');
      expect(profile?.avatarUrl).toBe('https://example.com/avatar.png');
      expect(profile?.bannerUrl).toBe('https://example.com/banner.png');
      expect(profile?.showBirthDate).toBe(true);
      expect(profile?.showOnlineStatus).toBe(true);
      expect(profile?.postCount).toBe(250);
      expect(profile?.reputationPositive).toBe(550);
    });

    it('should handle missing optional fields', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          id: 'user-minimal',
          username: 'minimal',
        },
      });

      await useProfileStore.getState().fetchProfile('user-minimal');

      const profile = useProfileStore.getState().currentProfile;
      expect(profile?.displayName).toBeNull();
      expect(profile?.bio).toBeNull();
      expect(profile?.location).toBeNull();
      expect(profile?.badges).toHaveLength(0);
      expect(profile?.customFields).toHaveLength(0);
    });

    it('should calculate star count from post count', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          id: 'user-stars',
          username: 'staruser',
          post_count: 450, // Should give 5 stars (max)
        },
      });

      await useProfileStore.getState().fetchProfile('user-stars');

      const profile = useProfileStore.getState().currentProfile;
      expect(profile?.stars.count).toBe(5);
    });
  });

  describe('state isolation', () => {
    it('should update currentProfile without affecting myProfile', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        myProfile: { ...mockProfile, id: 'my-user', username: 'myuser' },
      });

      useProfileStore.setState({
        currentProfile: null,
      });

      expect(useProfileStore.getState().currentProfile).toBeNull();
      expect(useProfileStore.getState().myProfile?.username).toBe('myuser');
    });

    it('should update blocked users without affecting profile', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        blockedUsers: [],
      });

      useProfileStore.setState({
        blockedUsers: [mockBlockedUser],
      });

      expect(useProfileStore.getState().currentProfile).not.toBeNull();
      expect(useProfileStore.getState().blockedUsers).toHaveLength(1);
    });
  });
});
