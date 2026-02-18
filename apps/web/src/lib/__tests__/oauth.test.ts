/**
 * OAuth Service Tests
 *
 * Tests for OAuth provider management, authorization flow,
 * callback handling, and account linking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOAuthProviders,
  startOAuthFlow,
  handleOAuthCallback,
  linkOAuthAccount,
  unlinkOAuthAccount,
  providerNames,
  providerColors,
} from '../oauth';

// ── Mock API ─────────────────────────────────────────────────────────────
vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../api';
const mockApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Provider Discovery
// ============================================================================

describe('getOAuthProviders', () => {
  it('should fetch providers from API', async () => {
    const providers = [
      { id: 'google', name: 'Google', enabled: true },
      { id: 'apple', name: 'Apple', enabled: true },
      { id: 'facebook', name: 'Facebook', enabled: false },
    ];
    mockApi.get.mockResolvedValue({ data: { providers } });

    const result = await getOAuthProviders();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/providers');
    expect(result).toEqual(providers);
  });
});

// ============================================================================
// Authorization Flow
// ============================================================================

describe('startOAuthFlow', () => {
  it('should request authorization URL for Google', async () => {
    const response = {
      authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      state: 'random-state-123',
      provider: 'google',
    };
    mockApi.get.mockResolvedValue({ data: response });

    const result = await startOAuthFlow('google');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/google');
    expect(result.authorization_url).toContain('accounts.google.com');
    expect(result.state).toBe('random-state-123');
  });

  it('should request authorization URL for Apple', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        authorization_url: 'https://appleid.apple.com/auth',
        state: 'apple-state',
        provider: 'apple',
      },
    });

    const result = await startOAuthFlow('apple');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/apple');
    expect(result.provider).toBe('apple');
  });
});

// ============================================================================
// Callback Handling
// ============================================================================

describe('handleOAuthCallback', () => {
  it('should exchange code for tokens', async () => {
    const tokenResponse = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        wallet_address: null,
        email_verified_at: '2024-01-01T00:00:00Z',
        totp_enabled: false,
        status: 'online' as const,
        custom_status: null,
        is_verified: true,
        is_premium: false,
        inserted_at: '2024-01-01T00:00:00Z',
      },
      tokens: {
        access_token: 'access-token-xyz',
        refresh_token: 'refresh-token-abc',
        expires_in: 3600,
      },
    };
    mockApi.get.mockResolvedValue({ data: tokenResponse });

    const result = await handleOAuthCallback('google', 'auth-code-123', 'state-456');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/oauth/google/callback', {
      params: { code: 'auth-code-123', state: 'state-456' },
    });
    expect(result.user.id).toBe('user-123');
    expect(result.tokens.access_token).toBe('access-token-xyz');
  });
});

// ============================================================================
// Account Linking
// ============================================================================

describe('linkOAuthAccount', () => {
  it('should link an OAuth provider to current user', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        message: 'Account linked successfully',
        user: { id: 'user-123', email: 'test@example.com' },
      },
    });

    const result = await linkOAuthAccount('facebook', 'fb-access-token');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/oauth/facebook/link', {
      access_token: 'fb-access-token',
      id_token: undefined,
    });
    expect(result.message).toBe('Account linked successfully');
  });

  it('should pass id_token when provided', async () => {
    mockApi.post.mockResolvedValue({
      data: { message: 'Linked', user: { id: '1' } },
    });

    await linkOAuthAccount('apple', 'token', 'id-token-apple');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/oauth/apple/link', {
      access_token: 'token',
      id_token: 'id-token-apple',
    });
  });
});

describe('unlinkOAuthAccount', () => {
  it('should unlink an OAuth provider', async () => {
    mockApi.delete.mockResolvedValue({ data: { message: 'Account unlinked' } });

    const result = await unlinkOAuthAccount('tiktok');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/auth/oauth/tiktok/link');
    expect(result.message).toBe('Account unlinked');
  });
});

// ============================================================================
// Static Data
// ============================================================================

describe('providerNames', () => {
  it('should have display names for all providers', () => {
    expect(providerNames.google).toBe('Google');
    expect(providerNames.apple).toBe('Apple');
    expect(providerNames.facebook).toBe('Facebook');
    expect(providerNames.tiktok).toBe('TikTok');
  });
});

describe('providerColors', () => {
  it('should have color configs for all providers', () => {
    for (const provider of ['google', 'apple', 'facebook', 'tiktok'] as const) {
      expect(providerColors[provider]).toHaveProperty('bg');
      expect(providerColors[provider]).toHaveProperty('text');
      expect(providerColors[provider]).toHaveProperty('hover');
    }
  });
});
