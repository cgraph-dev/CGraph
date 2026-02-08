import { describe, it, expect, vi, beforeEach } from 'vitest';

// We must reset the module state between tests since tokenService uses module-level state
let tokenService: typeof import('../tokenService');

beforeEach(async () => {
  vi.resetModules();
  tokenService = await import('../tokenService');
});

describe('Token Service', () => {
  describe('before registration', () => {
    it('should return false for isRegistered()', () => {
      expect(tokenService.isRegistered()).toBe(false);
    });

    it('should return null for getAccessToken()', () => {
      expect(tokenService.getAccessToken()).toBeNull();
    });

    it('should return null for getRefreshToken()', () => {
      expect(tokenService.getRefreshToken()).toBeNull();
    });

    it('should no-op for setTokens() when not registered', () => {
      // Should not throw
      expect(() =>
        tokenService.setTokens({ accessToken: 'tok', refreshToken: 'ref' })
      ).not.toThrow();
    });

    it('should no-op for triggerLogout() when not registered', async () => {
      await expect(tokenService.triggerLogout()).resolves.toBeUndefined();
    });
  });

  describe('registerTokenHandlers', () => {
    it('should mark as registered after calling registerTokenHandlers', () => {
      tokenService.registerTokenHandlers({
        getAccessToken: () => 'access',
        getRefreshToken: () => 'refresh',
        setTokens: vi.fn(),
        onLogout: vi.fn(),
      });
      expect(tokenService.isRegistered()).toBe(true);
    });

    it('should resolve pending waitForRegistration promises', async () => {
      const promise = tokenService.waitForRegistration();

      const config = {
        getAccessToken: () => 'a',
        getRefreshToken: () => 'r',
        setTokens: vi.fn(),
        onLogout: vi.fn(),
      };
      tokenService.registerTokenHandlers(config);

      const result = await promise;
      expect(result.getAccessToken()).toBe('a');
    });
  });

  describe('after registration', () => {
    const mockSetTokens = vi.fn();
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockSetTokens.mockClear();
      mockLogout.mockClear();
      tokenService.registerTokenHandlers({
        getAccessToken: () => 'my-access-token',
        getRefreshToken: () => 'my-refresh-token',
        setTokens: mockSetTokens,
        onLogout: mockLogout,
      });
    });

    it('should return the access token from the registered getter', () => {
      expect(tokenService.getAccessToken()).toBe('my-access-token');
    });

    it('should return the refresh token from the registered getter', () => {
      expect(tokenService.getRefreshToken()).toBe('my-refresh-token');
    });

    it('should forward setTokens to the registered handler', () => {
      const tokens = { accessToken: 'new-a', refreshToken: 'new-r' };
      tokenService.setTokens(tokens);
      expect(mockSetTokens).toHaveBeenCalledWith(tokens);
    });

    it('should forward triggerLogout to the registered handler', async () => {
      await tokenService.triggerLogout();
      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });

  describe('waitForRegistration', () => {
    it('should resolve immediately if already registered', async () => {
      tokenService.registerTokenHandlers({
        getAccessToken: () => 'x',
        getRefreshToken: () => 'y',
        setTokens: vi.fn(),
        onLogout: vi.fn(),
      });

      const config = await tokenService.waitForRegistration();
      expect(config.getAccessToken()).toBe('x');
    });
  });

  describe('createTokenAccessor', () => {
    it('should return an object with all four methods', () => {
      const accessor = tokenService.createTokenAccessor();
      expect(accessor).toHaveProperty('getAccessToken');
      expect(accessor).toHaveProperty('getRefreshToken');
      expect(accessor).toHaveProperty('setTokens');
      expect(accessor).toHaveProperty('onLogout');
    });

    it('should delegate to the registered handlers when called', () => {
      const mockSet = vi.fn();
      tokenService.registerTokenHandlers({
        getAccessToken: () => 'accessor-tok',
        getRefreshToken: () => 'accessor-ref',
        setTokens: mockSet,
        onLogout: vi.fn(),
      });

      const accessor = tokenService.createTokenAccessor();
      expect(accessor.getAccessToken()).toBe('accessor-tok');
      expect(accessor.getRefreshToken()).toBe('accessor-ref');
    });
  });

  describe('edge cases', () => {
    it('should coerce undefined token to null', () => {
      tokenService.registerTokenHandlers({
        getAccessToken: () => undefined,
        getRefreshToken: () => undefined,
        setTokens: vi.fn(),
        onLogout: vi.fn(),
      });
      expect(tokenService.getAccessToken()).toBeNull();
      expect(tokenService.getRefreshToken()).toBeNull();
    });
  });
});
