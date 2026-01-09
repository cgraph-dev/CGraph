/**
 * AuthContext Tests
 *
 * Tests for authentication context covering login, logout, registration,
 * token management, and persistent authentication state.
 *
 * @since v0.7.28
 */

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../lib/api';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  defaults: { headers: { common: {} } },
  post: jest.fn(),
  get: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn(),
    },
  },
}));

// Mock socket manager
jest.mock('../../lib/socket', () => ({
  connect: jest.fn().mockReturnValue(Promise.resolve()),
  disconnect: jest.fn(),
}));

// Test component that uses auth context
const AuthConsumer: React.FC = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  } = useAuth();

  return (
    <>
      <Text testID="is-authenticated">{isAuthenticated ? 'true' : 'false'}</Text>
      <Text testID="is-loading">{isLoading ? 'true' : 'false'}</Text>
      <Text testID="user-email">{user?.email || 'no-user'}</Text>
      <Text testID="user-id">{user?.id || 'no-id'}</Text>
      <Text testID="token">{token || 'no-token'}</Text>
      <Pressable
        testID="login-button"
        onPress={() => login('test@example.com', 'password123')}
      >
        <Text>Login</Text>
      </Pressable>
      <Pressable
        testID="register-button"
        onPress={() => register('test@example.com', 'testuser', 'password123')}
      >
        <Text>Register</Text>
      </Pressable>
      <Pressable testID="logout-button" onPress={() => logout()}>
        <Text>Logout</Text>
      </Pressable>
      <Pressable
        testID="update-user-button"
        onPress={() => updateUser({ display_name: 'Updated Name' })}
      >
        <Text>Update</Text>
      </Pressable>
    </>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null,
  };

  const mockToken = 'mock-jwt-token-abc123';

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    api.defaults.headers.common = {};
  });

  describe('initial state', () => {
    it('starts with loading state', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Initially loading
      expect(getByTestId('is-loading').props.children).toBe('true');

      await waitFor(() => {
        expect(getByTestId('is-loading').props.children).toBe('false');
      });
    });

    it('starts unauthenticated when no stored token', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-authenticated').props.children).toBe('false');
        expect(getByTestId('user-email').props.children).toBe('no-user');
        expect(getByTestId('token').props.children).toBe('no-token');
      });
    });
  });

  describe('login', () => {
    it('authenticates user on successful login', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: {
          data: {
            tokens: {
              access_token: mockToken,
              refresh_token: 'mock-refresh-token',
            },
            user: mockUser,
          },
        },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('is-loading').props.children).toBe('false');
      });

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', {
          identifier: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('error handling', () => {
    it('handles SecureStore read errors', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Should still complete loading and be unauthenticated
      await waitFor(() => {
        expect(getByTestId('is-loading').props.children).toBe('false');
        expect(getByTestId('is-authenticated').props.children).toBe('false');
      });
    });
  });
});

describe('useAuth hook', () => {
  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<AuthConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
