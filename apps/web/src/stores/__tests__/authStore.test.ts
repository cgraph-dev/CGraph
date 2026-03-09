/**
 * authStore Unit Tests
 *
 * Tests for Zustand auth store state management.
 * These tests focus on synchronous state operations and the mapUserFromApi helper.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { useAuthStore, mapUserFromApi } from '@/modules/auth/store';

// Mock user data from API (snake_case as from backend)
const mockApiUser = {
  id: 'user-123',
  uid: '4829173650',
  user_id: 12345,
  user_id_display: '#4829173650',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  wallet_address: null,
  email_verified_at: '2026-01-01T00:00:00Z',
  totp_enabled: false,
  status: 'online',
  custom_status: 'Hello world',
  karma: 100,
  is_verified: true,
  is_premium: false,
  is_admin: false,
  can_change_username: true,
  username_next_change_at: null,
  inserted_at: '2025-01-01T00:00:00Z',
  level: 5,
  xp: 1500,
  coins: 200,
  title: 'Pioneer',
  streak: 7,
};

// Reset store state after each test
afterEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});

describe('authStore', () => {
  describe('mapUserFromApi', () => {
    it('should correctly map API user response to User type', () => {
      const user = mapUserFromApi(mockApiUser);

      expect(user.id).toBe('user-123');
      expect(user.uid).toBe('4829173650');
      expect(user.userId).toBe(12345);
      expect(user.userIdDisplay).toBe('#4829173650');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.status).toBe('online');
      expect(user.statusMessage).toBe('Hello world');
      expect(user.karma).toBe(100);
      expect(user.isVerified).toBe(true);
      expect(user.isPremium).toBe(false);
      expect(user.isAdmin).toBe(false);
      expect(user.level).toBe(5);
      expect(user.xp).toBe(1500);
      expect(user.coins).toBe(200);
      expect(user.streak).toBe(7);
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalApiUser = {
        id: 'user-456',
        email: 'minimal@test.com',
        inserted_at: '2025-01-01T00:00:00Z',
      };

      const user = mapUserFromApi(minimalApiUser);

      expect(user.id).toBe('user-456');
      expect(user.email).toBe('minimal@test.com');
      expect(user.uid).toBe('');
      expect(user.userId).toBe(0);
      expect(user.username).toBeNull();
      expect(user.displayName).toBeNull();
      expect(user.avatarUrl).toBeNull();
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.status).toBe('offline');
      expect(user.karma).toBe(0);
      expect(user.level).toBe(1);
      expect(user.xp).toBe(0);
      expect(user.coins).toBe(0);
    });

    it('should handle admin user correctly', () => {
      const adminUser = {
        ...mockApiUser,
        is_admin: true,
        is_verified: true,
      };

      const user = mapUserFromApi(adminUser);

      expect(user.isAdmin).toBe(true);
      expect(user.isVerified).toBe(true);
    });

    it('should handle premium user correctly', () => {
      const premiumUser = {
        ...mockApiUser,
        is_premium: true,
      };

      const user = mapUserFromApi(premiumUser);

      expect(user.isPremium).toBe(true);
    });
  });

  describe('state management', () => {
    it('should have initial unauthenticated state', () => {
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should update state when setting authenticated user', () => {
      const user = mapUserFromApi(mockApiUser);

      useAuthStore.setState({
        user,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('user-123');
      expect(state.token).toBe('test-token');
      expect(state.refreshToken).toBe('test-refresh-token');
    });

    it('should track loading state', () => {
      useAuthStore.setState({ isLoading: true });

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should track error state', () => {
      useAuthStore.setState({ error: 'Authentication failed' });

      expect(useAuthStore.getState().error).toBe('Authentication failed');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should not affect other state when clearing error', () => {
      const user = mapUserFromApi(mockApiUser);
      useAuthStore.setState({
        user,
        token: 'test-token',
        isAuthenticated: true,
        error: 'Some error',
      });

      useAuthStore.getState().clearError();

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.user?.id).toBe('user-123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const user = mapUserFromApi(mockApiUser);
      useAuthStore.setState({ user, isAuthenticated: true });

      useAuthStore.getState().updateUser({
        displayName: 'Updated Name',
        statusMessage: 'New status',
      });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Updated Name');
      expect(state.user?.statusMessage).toBe('New status');
    });

    it('should not throw when updating without user', () => {
      expect(() => {
        useAuthStore.getState().updateUser({
          displayName: 'Updated Name',
        });
      }).not.toThrow();
    });

    it('should preserve existing user fields when updating', () => {
      const user = mapUserFromApi(mockApiUser);
      useAuthStore.setState({ user, isAuthenticated: true });

      useAuthStore.getState().updateUser({
        displayName: 'Updated Name',
      });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Updated Name');
      expect(state.user?.email).toBe('test@example.com'); // Preserved
      expect(state.user?.username).toBe('testuser'); // Preserved
    });
  });

  describe('user status', () => {
    it('should handle different user statuses', () => {
      const onlineUser = { ...mockApiUser, status: 'online' };
      const offlineUser = { ...mockApiUser, status: 'offline' };
      const idleUser = { ...mockApiUser, status: 'idle' };
      const dndUser = { ...mockApiUser, status: 'dnd' };

      expect(mapUserFromApi(onlineUser).status).toBe('online');
      expect(mapUserFromApi(offlineUser).status).toBe('offline');
      expect(mapUserFromApi(idleUser).status).toBe('idle');
      expect(mapUserFromApi(dndUser).status).toBe('dnd');
    });
  });

  describe('core user stats fields', () => {
    it('should correctly map xp/coins/streak data', () => {
      const gamifiedUser = {
        ...mockApiUser,
        level: 10,
        xp: 5000,
        coins: 1000,
        streak: 30,
        karma: 500,
        title: 'Legend',
      };

      const user = mapUserFromApi(gamifiedUser);

      expect(user.level).toBe(10);
      expect(user.xp).toBe(5000);
      expect(user.coins).toBe(1000);
      expect(user.streak).toBe(30);
      expect(user.karma).toBe(500);
      expect(user.title).toBe('Legend');
    });

    it('should default stats fields to reasonable values', () => {
      const basicUser = {
        id: 'user-new',
        email: 'new@test.com',
        inserted_at: '2026-01-01T00:00:00Z',
      };

      const user = mapUserFromApi(basicUser);

      expect(user.level).toBe(1);
      expect(user.xp).toBe(0);
      expect(user.coins).toBe(0);
      expect(user.streak).toBe(0);
      expect(user.karma).toBe(0);
    });
  });
});
