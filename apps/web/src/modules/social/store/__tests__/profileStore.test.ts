/**
 * Social Profile Store Unit Tests
 *
 * Tests for the modular Zustand profile store (modules/social/store).
 * Covers profile fetching, updates, signatures, badges, titles,
 * blocked users, avatar/banner uploads, profile fields, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useProfileStore } from '@/modules/social/store';
import type { ExtendedProfile, UserSignature, BlockedUser } from '@/modules/social/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSignature: UserSignature = {
  enabled: true,
  content: '[b]My Sig[/b]',
  maxLength: 500,
};

const mockProfile: ExtendedProfile = {
  id: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: 'https://cdn.example.com/alice.png',
  bannerUrl: 'https://cdn.example.com/banner.png',
  bio: 'Hello world',
  signature: mockSignature,
  location: 'Berlin',
  website: 'https://alice.dev',
  occupation: 'Engineer',
  interests: 'Music, Code',
  birthDate: '1995-03-20',
  showBirthDate: true,
  gender: 'Female',
  socialLinks: { twitter: '@alice', github: 'alice' },
  customFields: [],
  currentTitle: { id: 't1', name: 'Veteran', color: '#FF0', type: 'earned' },
  availableTitles: [
    { id: 't1', name: 'Veteran', color: '#FF0', type: 'earned' },
    { id: 't2', name: 'Admin', color: '#F00', type: 'system' },
  ],
  badges: [
    {
      id: 'b1',
      name: 'Trailblazer',
      description: 'First to join',
      iconUrl: '/badges/trail.png',
      color: '#6366f1',
      rarity: 'rare',
      earnedAt: '2025-12-01T00:00:00Z',
      isEquipped: true,
    },
  ],
  equippedBadges: [
    {
      id: 'b1',
      name: 'Trailblazer',
      description: 'First to join',
      iconUrl: '/badges/trail.png',
      color: '#6366f1',
      rarity: 'rare',
      earnedAt: '2025-12-01T00:00:00Z',
      isEquipped: true,
    },
  ],
  stars: { count: 3, color: '#fbbf24' },
  isProfilePrivate: false,
  showOnlineStatus: true,
  showLastActive: true,
  showEmail: false,
  showLocation: true,
  postCount: 200,
  topicCount: 10,
  commentCount: 80,
  reputation: 420,
  reputationPositive: 450,
  reputationNegative: 30,
  warnLevel: 0,
  registeredAt: '2025-06-01T00:00:00Z',
  lastActive: '2026-02-07T12:00:00Z',
  lastPostAt: '2026-02-06T09:00:00Z',
  isOnline: true,
  status: 'online',
  statusMessage: 'Coding away',
  isFriend: false,
  isBlocked: false,
  friendshipStatus: 'none',
};

const mockBlockedUser: BlockedUser = {
  id: 'blocked-1',
  username: 'spammer',
  displayName: 'Spammer',
  avatarUrl: null,
  blockedAt: '2026-01-10T00:00:00Z',
  reason: 'Spam',
};

/** Snake-case API response matching the mapper expectations. */
const mockApiResponse = {
  data: {
    id: 'user-1',
    username: 'alice',
    display_name: 'Alice',
    avatar_url: 'https://cdn.example.com/alice.png',
    banner_url: 'https://cdn.example.com/banner.png',
    bio: 'Hello world',
    signature_enabled: true,
    signature: '[b]My Sig[/b]',
    signature_max_length: 500,
    location: 'Berlin',
    website: 'https://alice.dev',
    occupation: 'Engineer',
    interests: 'Music, Code',
    birth_date: '1995-03-20',
    show_birth_date: true,
    gender: 'Female',
    twitter: '@alice',
    github: 'alice',
    custom_fields: [],
    current_title: { id: 't1', name: 'Veteran', color: '#FF0', type: 'earned' },
    available_titles: [
      { id: 't1', name: 'Veteran', color: '#FF0', type: 'earned' },
      { id: 't2', name: 'Admin', color: '#F00', type: 'system' },
    ],
    badges: [
      {
        id: 'b1',
        name: 'Trailblazer',
        description: 'First to join',
        icon_url: '/badges/trail.png',
        color: '#6366f1',
        rarity: 'rare',
        earned_at: '2025-12-01T00:00:00Z',
        is_equipped: true,
      },
    ],
    equipped_badges: [
      {
        id: 'b1',
        name: 'Trailblazer',
        description: 'First to join',
        icon_url: '/badges/trail.png',
        color: '#6366f1',
        rarity: 'rare',
        earned_at: '2025-12-01T00:00:00Z',
        is_equipped: true,
      },
    ],
    post_count: 200,
    topic_count: 10,
    comment_count: 80,
    pulse: 420,
    reputation_positive: 450,
    reputation_negative: 30,
    warn_level: 0,
    inserted_at: '2025-06-01T00:00:00Z',
    last_active_at: '2026-02-07T12:00:00Z',
    last_post_at: '2026-02-06T09:00:00Z',
    is_online: true,
    status: 'online',
    status_message: 'Coding away',
    is_friend: false,
    is_blocked: false,
    friendship_status: 'none',
    is_profile_private: false,
    show_online_status: true,
    show_last_active: true,
    show_email: false,
    show_location: true,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  useProfileStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('Social profileStore', () => {
  // -----------------------------------------------------------------------
  // 1. Initial state
  // -----------------------------------------------------------------------
  describe('initial state', () => {
    beforeEach(() => {
      useProfileStore.setState(getInitialState());
    });

    it('should have null currentProfile', () => {
      expect(useProfileStore.getState().currentProfile).toBeNull();
    });

    it('should not be loading', () => {
      expect(useProfileStore.getState().isLoadingProfile).toBe(false);
    });

    it('should have no profileError', () => {
      expect(useProfileStore.getState().profileError).toBeNull();
    });

    it('should have null myProfile and mySignature', () => {
      const s = useProfileStore.getState();
      expect(s.myProfile).toBeNull();
      expect(s.mySignature).toBeNull();
    });

    it('should have empty blockedUsers and availableFields', () => {
      const s = useProfileStore.getState();
      expect(s.blockedUsers).toEqual([]);
      expect(s.availableFields).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // 2. fetchProfile
  // -----------------------------------------------------------------------
  describe('fetchProfile', () => {
    it('should set isLoadingProfile while fetching', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockApiResponse), 50))
      );

      const p = useProfileStore.getState().fetchProfile('user-1');
      expect(useProfileStore.getState().isLoadingProfile).toBe(true);
      await p;
      expect(useProfileStore.getState().isLoadingProfile).toBe(false);
    });

    it('should populate currentProfile from API response', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().fetchProfile('user-1');

      const profile = useProfileStore.getState().currentProfile;
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('user-1');
      expect(profile?.username).toBe('alice');
      expect(profile?.displayName).toBe('Alice');
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().fetchProfile('abc-789');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/abc-789');
    });

    it('should return the mapped profile', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);
      const result = await useProfileStore.getState().fetchProfile('user-1');
      expect(result.id).toBe('user-1');
    });

    it('should set profileError on failure and stop loading', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));

      await expect(useProfileStore.getState().fetchProfile('bad')).rejects.toThrow('Not found');

      const s = useProfileStore.getState();
      expect(s.profileError).toBe('Not found');
      expect(s.isLoadingProfile).toBe(false);
    });

    it('should clear previous error before fetching', async () => {
      useProfileStore.setState({ profileError: 'old error' });
      mockedApi.get.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().fetchProfile('user-1');
      expect(useProfileStore.getState().profileError).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 3. fetchMyProfile
  // -----------------------------------------------------------------------
  describe('fetchMyProfile', () => {
    it('should set myProfile and mySignature', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().fetchMyProfile();

      const s = useProfileStore.getState();
      expect(s.myProfile?.id).toBe('user-1');
      expect(s.mySignature?.enabled).toBe(true);
      expect(s.mySignature?.content).toBe('[b]My Sig[/b]');
    });

    it('should call /api/v1/users/me', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().fetchMyProfile();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me');
    });

    it('should throw on failure', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(useProfileStore.getState().fetchMyProfile()).rejects.toThrow('Unauthorized');
    });
  });

  // -----------------------------------------------------------------------
  // 4. updateProfile
  // -----------------------------------------------------------------------
  describe('updateProfile', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should send correctly-shaped payload', async () => {
      mockedApi.put.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().updateProfile({
        displayName: 'New Name',
        bio: 'New bio',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', {
        user: { display_name: 'New Name', bio: 'New bio' },
      });
    });

    it('should update myProfile from API response', async () => {
      const updated = {
        data: { ...mockApiResponse.data, display_name: 'Updated' },
      };
      mockedApi.put.mockResolvedValue(updated);

      await useProfileStore.getState().updateProfile({ displayName: 'Updated' });
      expect(useProfileStore.getState().myProfile?.displayName).toBe('Updated');
    });

    it('should map socialLinks into flat payload keys', async () => {
      mockedApi.put.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().updateProfile({
        socialLinks: { twitter: '@new', github: 'gh' },
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', {
        user: expect.objectContaining({
          twitter: '@new',
          github: 'gh',
        }),
      });
    });

    it('should throw on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Forbidden'));
      await expect(useProfileStore.getState().updateProfile({ displayName: 'X' })).rejects.toThrow(
        'Forbidden'
      );
    });
  });

  // -----------------------------------------------------------------------
  // 5. updateSignature
  // -----------------------------------------------------------------------
  describe('updateSignature', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile, mySignature: mockSignature });
    });

    it('should update mySignature state', async () => {
      mockedApi.put.mockResolvedValue({
        data: { enabled: false, content: '', max_length: 500 },
      });

      await useProfileStore.getState().updateSignature({ enabled: false, content: '' });

      const s = useProfileStore.getState();
      expect(s.mySignature?.enabled).toBe(false);
      expect(s.mySignature?.content).toBe('');
    });

    it('should also update signature inside myProfile', async () => {
      mockedApi.put.mockResolvedValue({
        data: { enabled: true, content: 'New!', max_length: 500 },
      });

      await useProfileStore.getState().updateSignature({ enabled: true, content: 'New!' });
      expect(useProfileStore.getState().myProfile?.signature.content).toBe('New!');
    });

    it('should call the correct endpoint', async () => {
      mockedApi.put.mockResolvedValue({ data: { enabled: true, content: 'x', max_length: 500 } });
      await useProfileStore.getState().updateSignature({ enabled: true, content: 'x' });
      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/signature', {
        signature: { enabled: true, content: 'x' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // 6. updatePrivacySettings
  // -----------------------------------------------------------------------
  describe('updatePrivacySettings', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should send snake_case privacy payload', async () => {
      mockedApi.put.mockResolvedValue(mockApiResponse);

      await useProfileStore.getState().updatePrivacySettings({
        isProfilePrivate: true,
        showEmail: true,
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/privacy', {
        privacy: { is_profile_private: true, show_email: true },
      });
    });

    it('should throw on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Server error'));
      await expect(
        useProfileStore.getState().updatePrivacySettings({ showEmail: true })
      ).rejects.toThrow('Server error');
    });
  });

  // -----------------------------------------------------------------------
  // 7. equipTitle / equipBadge / unequipBadge
  // -----------------------------------------------------------------------
  describe('equipTitle', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should call PUT with title_id', async () => {
      mockedApi.put.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().equipTitle('t2');
      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/title', { title_id: 't2' });
    });

    it('should allow null to unequip', async () => {
      mockedApi.put.mockResolvedValue({
        data: { ...mockApiResponse.data, current_title: null },
      });
      await useProfileStore.getState().equipTitle(null);
      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me/title', { title_id: null });
    });

    it('should throw on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Not found'));
      await expect(useProfileStore.getState().equipTitle('bad')).rejects.toThrow('Not found');
    });
  });

  describe('equipBadge / unequipBadge', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should POST to equip a badge', async () => {
      mockedApi.post.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().equipBadge('b1');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/users/me/badges/equip', {
        badge_id: 'b1',
      });
    });

    it('should DELETE to unequip a badge', async () => {
      mockedApi.delete.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().unequipBadge('b1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/users/me/badges/equip/b1');
    });

    it('should throw when equip fails', async () => {
      mockedApi.post.mockRejectedValue(new Error('Badge not owned'));
      await expect(useProfileStore.getState().equipBadge('zzz')).rejects.toThrow('Badge not owned');
    });

    it('should throw when unequip fails', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Unequip error'));
      await expect(useProfileStore.getState().unequipBadge('b1')).rejects.toThrow('Unequip error');
    });
  });

  // -----------------------------------------------------------------------
  // 8. fetchBlockedUsers
  // -----------------------------------------------------------------------
  describe('fetchBlockedUsers', () => {
    it('should set isLoadingBlocked while fetching', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 50))
      );

      const p = useProfileStore.getState().fetchBlockedUsers();
      expect(useProfileStore.getState().isLoadingBlocked).toBe(true);
      await p;
      expect(useProfileStore.getState().isLoadingBlocked).toBe(false);
    });

    it('should populate blockedUsers from API', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          {
            id: 'blocked-1',
            username: 'spammer',
            display_name: 'Spammer',
            avatar_url: null,
            blocked_at: '2026-01-10T00:00:00Z',
            reason: 'Spam',
          },
        ],
      });

      await useProfileStore.getState().fetchBlockedUsers();
      const list = useProfileStore.getState().blockedUsers;
      expect(list).toHaveLength(1);
      expect(list[0]?.username).toBe('spammer');
      expect(list[0]?.reason).toBe('Spam');
    });

    it('should call the correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      await useProfileStore.getState().fetchBlockedUsers();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me/blocked');
    });

    it('should stop loading on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Fail'));
      await expect(useProfileStore.getState().fetchBlockedUsers()).rejects.toThrow('Fail');
      expect(useProfileStore.getState().isLoadingBlocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 9. blockUser / unblockUser
  // -----------------------------------------------------------------------
  describe('blockUser', () => {
    beforeEach(() => {
      // fetchBlockedUsers is called internally after blocking
      mockedApi.get.mockResolvedValue({
        data: [
          {
            id: 'blocked-1',
            username: 'spammer',
            display_name: 'Spammer',
            avatar_url: null,
            blocked_at: '2026-01-10T00:00:00Z',
            reason: 'Spam',
          },
        ],
      });
    });

    it('should POST to block endpoint with reason', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      await useProfileStore.getState().blockUser('u-99', 'Harassment');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/users/me/blocked', {
        user_id: 'u-99',
        reason: 'Harassment',
      });
    });

    it('should refresh blocked list after blocking', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      await useProfileStore.getState().blockUser('u-99');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me/blocked');
    });

    it('should set currentProfile.isBlocked when blocking viewed user', async () => {
      useProfileStore.setState({
        currentProfile: { ...mockProfile, id: 'u-99', isBlocked: false },
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useProfileStore.getState().blockUser('u-99');
      expect(useProfileStore.getState().currentProfile?.isBlocked).toBe(true);
    });
  });

  describe('unblockUser', () => {
    beforeEach(() => {
      useProfileStore.setState({ blockedUsers: [mockBlockedUser] });
    });

    it('should DELETE to unblock endpoint', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      await useProfileStore.getState().unblockUser('blocked-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/users/me/blocked/blocked-1');
    });

    it('should remove user from blockedUsers list', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      await useProfileStore.getState().unblockUser('blocked-1');
      expect(
        useProfileStore.getState().blockedUsers.find((u) => u.id === 'blocked-1')
      ).toBeUndefined();
    });

    it('should set currentProfile.isBlocked to false when unblocking viewed user', async () => {
      useProfileStore.setState({
        currentProfile: { ...mockProfile, id: 'blocked-1', isBlocked: true },
        blockedUsers: [mockBlockedUser],
      });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useProfileStore.getState().unblockUser('blocked-1');
      expect(useProfileStore.getState().currentProfile?.isBlocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 10. isUserBlocked
  // -----------------------------------------------------------------------
  describe('isUserBlocked', () => {
    it('should return true for a blocked user', () => {
      useProfileStore.setState({ blockedUsers: [mockBlockedUser] });
      expect(useProfileStore.getState().isUserBlocked('blocked-1')).toBe(true);
    });

    it('should return false for a non-blocked user', () => {
      useProfileStore.setState({ blockedUsers: [mockBlockedUser] });
      expect(useProfileStore.getState().isUserBlocked('unknown')).toBe(false);
    });

    it('should return false when list is empty', () => {
      useProfileStore.setState({ blockedUsers: [] });
      expect(useProfileStore.getState().isUserBlocked('anyone')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 11. uploadAvatar / uploadBanner
  // -----------------------------------------------------------------------
  describe('uploadAvatar', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should POST FormData and update myProfile.avatarUrl', async () => {
      mockedApi.post.mockResolvedValue({ data: { avatar_url: 'https://cdn.example.com/new.png' } });

      const file = new File(['img'], 'avatar.png', { type: 'image/png' });
      const url = await useProfileStore.getState().uploadAvatar(file);

      expect(url).toBe('https://cdn.example.com/new.png');
      expect(useProfileStore.getState().myProfile?.avatarUrl).toBe(
        'https://cdn.example.com/new.png'
      );
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/users/me/avatar', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });

  describe('uploadBanner', () => {
    beforeEach(() => {
      useProfileStore.setState({ myProfile: mockProfile });
    });

    it('should POST FormData and update myProfile.bannerUrl', async () => {
      mockedApi.post.mockResolvedValue({
        data: { banner_url: 'https://cdn.example.com/bann.png' },
      });

      const file = new File(['img'], 'banner.png', { type: 'image/png' });
      const url = await useProfileStore.getState().uploadBanner(file);

      expect(url).toBe('https://cdn.example.com/bann.png');
      expect(useProfileStore.getState().myProfile?.bannerUrl).toBe(
        'https://cdn.example.com/bann.png'
      );
    });
  });

  // -----------------------------------------------------------------------
  // 12. fetchProfileFields
  // -----------------------------------------------------------------------
  describe('fetchProfileFields', () => {
    it('should populate availableFields from API', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          {
            id: 'f1',
            name: 'Website',
            type: 'url',
            required: false,
            editable: true,
            visible: true,
          },
          {
            id: 'f2',
            name: 'Bio',
            type: 'textarea',
            required: true,
            editable: true,
            visible: true,
          },
        ],
      });

      await useProfileStore.getState().fetchProfileFields();
      const fields = useProfileStore.getState().availableFields;
      expect(fields).toHaveLength(2);
      expect(fields[0]?.name).toBe('Website');
      expect(fields[1]?.required).toBe(true);
    });

    it('should call the correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      await useProfileStore.getState().fetchProfileFields();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/profile-fields');
    });
  });

  // -----------------------------------------------------------------------
  // 13. clearProfile
  // -----------------------------------------------------------------------
  describe('clearProfile', () => {
    it('should clear currentProfile and profileError', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        profileError: 'Something went wrong',
      });

      useProfileStore.getState().clearProfile();

      const s = useProfileStore.getState();
      expect(s.currentProfile).toBeNull();
      expect(s.profileError).toBeNull();
    });

    it('should not affect myProfile', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        myProfile: { ...mockProfile, id: 'me' },
      });

      useProfileStore.getState().clearProfile();

      expect(useProfileStore.getState().myProfile?.id).toBe('me');
    });
  });

  // -----------------------------------------------------------------------
  // 14. Data mapping edge cases
  // -----------------------------------------------------------------------
  describe('profile data mapping', () => {
    it('should map snake_case to camelCase correctly', async () => {
      mockedApi.get.mockResolvedValue(mockApiResponse);
      await useProfileStore.getState().fetchProfile('user-1');

      const p = useProfileStore.getState().currentProfile;
      expect(p?.displayName).toBe('Alice');
      expect(p?.avatarUrl).toBe('https://cdn.example.com/alice.png');
      expect(p?.showBirthDate).toBe(true);
      expect(p?.postCount).toBe(200);
      expect(p?.reputationPositive).toBe(450);
    });

    it('should handle minimal API response with missing optional fields', async () => {
      mockedApi.get.mockResolvedValue({
        data: { id: 'min-user', username: 'minimal' },
      });

      await useProfileStore.getState().fetchProfile('min-user');

      const p = useProfileStore.getState().currentProfile;
      expect(p?.displayName).toBeNull();
      expect(p?.bio).toBeNull();
      expect(p?.badges).toHaveLength(0);
      expect(p?.customFields).toHaveLength(0);
      expect(p?.currentTitle).toBeNull();
    });

    it('should cap star count at 5', async () => {
      mockedApi.get.mockResolvedValue({
        data: { id: 'star-user', username: 'staruser', post_count: 9999 },
      });

      await useProfileStore.getState().fetchProfile('star-user');
      expect(useProfileStore.getState().currentProfile?.stars.count).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // 15. State isolation
  // -----------------------------------------------------------------------
  describe('state isolation', () => {
    it('should update currentProfile without affecting myProfile', () => {
      useProfileStore.setState({
        currentProfile: mockProfile,
        myProfile: { ...mockProfile, id: 'my-id', username: 'me' },
      });

      useProfileStore.setState({ currentProfile: null });

      expect(useProfileStore.getState().currentProfile).toBeNull();
      expect(useProfileStore.getState().myProfile?.username).toBe('me');
    });

    it('should update blockedUsers without affecting profile data', () => {
      useProfileStore.setState({ currentProfile: mockProfile, blockedUsers: [] });
      useProfileStore.setState({ blockedUsers: [mockBlockedUser] });

      expect(useProfileStore.getState().currentProfile).not.toBeNull();
      expect(useProfileStore.getState().blockedUsers).toHaveLength(1);
    });
  });
});
