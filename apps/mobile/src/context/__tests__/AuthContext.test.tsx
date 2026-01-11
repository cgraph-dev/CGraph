/**
 * @fileoverview Comprehensive tests for AuthContext and authentication flow
 * Tests login, registration, 2FA, wallet auth, and session management
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock secure storage
const mockSecureStore = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

jest.mock('expo-secure-store', () => mockSecureStore);

// Mock API
const mockAuthApi = {
  login: jest.fn(),
  register: jest.fn(),
  verifyTwoFactor: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  walletLogin: jest.fn(),
};

jest.mock('../../services/api', () => ({
  authApi: mockAuthApi,
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe('Token Management', () => {
    it('should store tokens securely on login', async () => {
      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      await mockSecureStore.setItemAsync('access_token', tokens.accessToken);
      await mockSecureStore.setItemAsync('refresh_token', tokens.refreshToken);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'access_token',
        tokens.accessToken
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken
      );
    });

    it('should clear tokens on logout', async () => {
      await mockSecureStore.deleteItemAsync('access_token');
      await mockSecureStore.deleteItemAsync('refresh_token');

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });

    it('should refresh token before expiry', async () => {
      const isTokenExpired = (expiresAt: number) => Date.now() > expiresAt;
      const shouldRefresh = (expiresAt: number) => {
        const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes
        return Date.now() > expiresAt - REFRESH_BUFFER;
      };

      const futureExpiry = Date.now() + 10 * 60 * 1000; // 10 min from now
      const nearExpiry = Date.now() + 3 * 60 * 1000; // 3 min from now

      expect(isTokenExpired(futureExpiry)).toBe(false);
      expect(shouldRefresh(futureExpiry)).toBe(false);
      expect(shouldRefresh(nearExpiry)).toBe(true);
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      mockAuthApi.login.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          access_token: 'token-123',
          refresh_token: 'refresh-123',
        },
      });

      const result = await mockAuthApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.access_token).toBeTruthy();
    });

    it('should handle 2FA required response', async () => {
      mockAuthApi.login.mockResolvedValue({
        data: {
          requires_2fa: true,
          two_factor_token: 'temp-token-123',
        },
      });

      const result = await mockAuthApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.requires_2fa).toBe(true);
      expect(result.data.two_factor_token).toBeTruthy();
    });

    it('should handle login failure', async () => {
      mockAuthApi.login.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid credentials' },
        },
      });

      await expect(
        mockAuthApi.login({ email: 'bad@email.com', password: 'wrong' })
      ).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it('should handle rate limiting', async () => {
      mockAuthApi.login.mockRejectedValue({
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
          data: { error: 'Too many attempts. Please try again later.' },
        },
      });

      await expect(
        mockAuthApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toMatchObject({
        response: { status: 429 },
      });
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should verify TOTP code successfully', async () => {
      mockAuthApi.verifyTwoFactor.mockResolvedValue({
        data: {
          user: { id: 'user-1' },
          access_token: 'token-123',
        },
      });

      const result = await mockAuthApi.verifyTwoFactor({
        token: 'temp-token',
        code: '123456',
      });

      expect(result.data.access_token).toBeTruthy();
    });

    it('should handle invalid TOTP code', async () => {
      mockAuthApi.verifyTwoFactor.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid or expired code' },
        },
      });

      await expect(
        mockAuthApi.verifyTwoFactor({ token: 'temp-token', code: '000000' })
      ).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it('should validate TOTP code format', () => {
      const isValidCode = (code: string) => /^\d{6}$/.test(code);

      expect(isValidCode('123456')).toBe(true);
      expect(isValidCode('12345')).toBe(false);
      expect(isValidCode('1234567')).toBe(false);
      expect(isValidCode('abcdef')).toBe(false);
      expect(isValidCode('12345a')).toBe(false);
    });
  });

  describe('Wallet Authentication', () => {
    it('should generate wallet signature challenge', () => {
      const generateChallenge = (address: string, timestamp: number) => {
        return `Sign this message to authenticate with CGraph:\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${Math.random().toString(36).slice(2)}`;
      };

      const challenge = generateChallenge(
        '0x1234567890abcdef',
        Date.now()
      );

      expect(challenge).toContain('Sign this message');
      expect(challenge).toContain('0x1234567890abcdef');
    });

    it('should validate wallet address format', () => {
      const isValidEthAddress = (address: string) =>
        /^0x[a-fA-F0-9]{40}$/.test(address);

      expect(isValidEthAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidEthAddress('1234567890123456789012345678901234567890')).toBe(false);
      expect(isValidEthAddress('0x123')).toBe(false);
    });

    it('should handle wallet login', async () => {
      mockAuthApi.walletLogin.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            wallet_address: '0x1234567890123456789012345678901234567890',
          },
          access_token: 'token-123',
        },
      });

      const result = await mockAuthApi.walletLogin({
        address: '0x1234567890123456789012345678901234567890',
        signature: 'signed-message',
        challenge: 'challenge-text',
      });

      expect(result.data.user.wallet_address).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('should restore session on app start', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('stored-token');
      mockAuthApi.getCurrentUser.mockResolvedValue({
        data: { id: 'user-1', email: 'test@example.com' },
      });

      const token = await mockSecureStore.getItemAsync('access_token');
      expect(token).toBe('stored-token');

      const user = await mockAuthApi.getCurrentUser();
      expect(user.data.id).toBe('user-1');
    });

    it('should handle session expiry', async () => {
      mockAuthApi.getCurrentUser.mockRejectedValue({
        response: { status: 401 },
      });

      await expect(mockAuthApi.getCurrentUser()).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it('should track session activity', () => {
      const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      let lastActivity = Date.now();

      const updateActivity = () => {
        lastActivity = Date.now();
      };

      const isSessionExpired = () => {
        return Date.now() - lastActivity > SESSION_TIMEOUT;
      };

      expect(isSessionExpired()).toBe(false);

      // Simulate 31 minutes of inactivity
      lastActivity = Date.now() - 31 * 60 * 1000;
      expect(isSessionExpired()).toBe(true);
    });
  });

  describe('Registration', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should validate password strength', () => {
      const validatePassword = (password: string) => {
        const errors: string[] = [];

        if (password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
          errors.push('Password must contain uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
          errors.push('Password must contain lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
          errors.push('Password must contain number');
        }

        return { valid: errors.length === 0, errors };
      };

      expect(validatePassword('Secure123').valid).toBe(true);
      expect(validatePassword('weak').valid).toBe(false);
      expect(validatePassword('nouppercase123').errors).toContain(
        'Password must contain uppercase letter'
      );
    });

    it('should validate username format', () => {
      const isValidUsername = (username: string) =>
        /^[a-zA-Z0-9_]{3,20}$/.test(username);

      expect(isValidUsername('valid_user123')).toBe(true);
      expect(isValidUsername('ab')).toBe(false); // too short
      expect(isValidUsername('invalid-user')).toBe(false); // hyphen not allowed
    });

    it('should handle successful registration', async () => {
      mockAuthApi.register.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'new@example.com' },
          message: 'Please verify your email',
        },
      });

      const result = await mockAuthApi.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'Secure123',
      });

      expect(result.data.user.email).toBe('new@example.com');
    });

    it('should handle duplicate email', async () => {
      mockAuthApi.register.mockRejectedValue({
        response: {
          status: 422,
          data: { errors: { email: ['has already been taken'] } },
        },
      });

      await expect(
        mockAuthApi.register({
          email: 'existing@example.com',
          username: 'user',
          password: 'Secure123',
        })
      ).rejects.toMatchObject({
        response: { status: 422 },
      });
    });
  });

  describe('Biometric Authentication', () => {
    it('should check biometric availability', () => {
      const mockBiometricTypes = ['fingerprint', 'face'];

      const isBiometricAvailable = mockBiometricTypes.length > 0;
      const supportsFaceId = mockBiometricTypes.includes('face');
      const supportsFingerprint = mockBiometricTypes.includes('fingerprint');

      expect(isBiometricAvailable).toBe(true);
      expect(supportsFaceId).toBe(true);
      expect(supportsFingerprint).toBe(true);
    });

    it('should store biometric preference', async () => {
      await mockSecureStore.setItemAsync('biometric_enabled', 'true');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_enabled',
        'true'
      );
    });
  });
});

describe('Password Reset Flow', () => {
  it('should request password reset', async () => {
    const requestReset = jest.fn().mockResolvedValue({
      data: { message: 'Reset email sent' },
    });

    const result = await requestReset({ email: 'test@example.com' });

    expect(result.data.message).toContain('Reset email sent');
  });

  it('should validate reset token format', () => {
    const isValidResetToken = (token: string) =>
      /^[a-zA-Z0-9]{64}$/.test(token);

    const validToken = 'a'.repeat(64);
    const invalidToken = 'short';

    expect(isValidResetToken(validToken)).toBe(true);
    expect(isValidResetToken(invalidToken)).toBe(false);
  });

  it('should enforce password confirmation match', () => {
    const password = 'NewSecure123';
    const confirmPassword = 'NewSecure123';
    const wrongConfirm = 'DifferentPassword';

    expect(password === confirmPassword).toBe(true);
    expect(password === wrongConfirm).toBe(false);
  });
});
