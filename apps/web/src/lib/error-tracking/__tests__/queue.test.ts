/**
 * Error Queue & Backend Transport Tests
 *
 * Tests for the error capture pipeline: rate limiting,
 * queue processing with retry, PII stripping integration,
 * user context management, and backend submission.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock dependencies ────────────────────────────────────────────────────
const { mockApiPost, mockStripPii, mockStripPiiFromString, mockGetBreadcrumbs, mockConfig } =
  vi.hoisted(() => ({
    mockApiPost: vi.fn().mockResolvedValue({}),
    mockStripPii: vi.fn((obj: unknown) => obj),
    mockStripPiiFromString: vi.fn((s: string) => s),
    mockGetBreadcrumbs: vi.fn(() => []),
    mockConfig: {
      enabled: true,
      debug: false,
      maxErrorsPerMinute: 10,
      maxRetries: 3,
      errorEndpoint: '/api/v1/telemetry/errors',
      maxBreadcrumbs: 50,
      retryInterval: 60000,
    },
  }));

vi.mock('@/lib/api', () => ({
  api: { post: mockApiPost },
}));

vi.mock('../pii', () => ({
  stripPii: mockStripPii,
  stripPiiFromString: mockStripPiiFromString,
}));

vi.mock('../breadcrumbs', () => ({
  getBreadcrumbs: mockGetBreadcrumbs,
}));

vi.mock('../config', () => ({
  CONFIG: mockConfig,
}));

// Import AFTER mocks
import {
  captureError,
  captureMessage,
  captureFatal,
  processQueue,
  setUser,
  clearUser,
} from '../queue';

describe('Error Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set high rate limit to avoid exhaustion across tests
    mockConfig.maxErrorsPerMinute = 1000;
    mockConfig.enabled = true;
    mockConfig.debug = false;
    clearUser();
  });

  // ── User Context ─────────────────────────────────────────────────────

  describe('setUser / clearUser', () => {
    it('should attach user context to captured errors', async () => {
      setUser({ id: 'user-42', email: 'test@example.com' });

      captureError('test error');

      // Wait for processQueue
      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload.user_id).toBe('user-42');
    });

    it('should clear user context on clearUser', async () => {
      setUser({ id: 'user-42' });
      clearUser();

      captureError('test error');

      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload.user_id).toBeUndefined();
    });
  });

  // ── captureError ─────────────────────────────────────────────────────

  describe('captureError', () => {
    it('should return an error ID on success', () => {
      const id = captureError('Something broke');
      expect(id).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should return null when disabled and not debug', () => {
      mockConfig.enabled = false;
      mockConfig.debug = false;
      expect(captureError('error')).toBeNull();
    });

    it('should strip PII from error message', () => {
      captureError('User user@email.com had an error');
      expect(mockStripPiiFromString).toHaveBeenCalledWith('User user@email.com had an error');
    });

    it('should extract message and stack from Error objects', () => {
      const err = new Error('Boom');
      captureError(err);
      expect(mockStripPiiFromString).toHaveBeenCalledWith('Boom');
      // Stack is also PII-stripped
      expect(mockStripPiiFromString).toHaveBeenCalledWith(expect.stringContaining('Error: Boom'));
    });

    it('should attach breadcrumbs from getBreadcrumbs()', async () => {
      const mockCrumbs = [{ timestamp: 1, category: 'navigation', message: 'page load' }];
      mockGetBreadcrumbs.mockReturnValue(mockCrumbs);

      captureError('test');

      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload.breadcrumbs).toEqual(mockCrumbs);
    });

    it('should include URL and user agent', async () => {
      captureError('test');

      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload).toHaveProperty('url');
      expect(payload).toHaveProperty('user_agent');
    });

    it('should pass context through to backend', async () => {
      captureError('test', {
        component: 'Billing',
        action: 'checkout',
        level: 'warning',
        tags: { env: 'test' },
      });

      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload.component).toBe('Billing');
      expect(payload.action).toBe('checkout');
      expect(payload.level).toBe('warning');
      expect(payload.tags).toEqual({ env: 'test' });
    });

    it('should default level to error', async () => {
      captureError('test');

      await vi.waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });

      const payload = mockApiPost.mock.calls[0][1];
      expect(payload.level).toBe('error');
    });

    it('should send to debug console in debug mode without queuing', () => {
      mockConfig.debug = true;
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const id = captureError('debug error');

      expect(id).toMatch(/^err_/);
      expect(spy).toHaveBeenCalled();
      // Should NOT call API in debug mode
      expect(mockApiPost).not.toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  // ── Rate Limiting ────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('should rate limit after maxErrorsPerMinute', () => {
      mockConfig.maxErrorsPerMinute = 3;

      captureError('err1'); // 1
      captureError('err2'); // 2
      captureError('err3'); // 3
      const id = captureError('err4'); // should be rate limited

      expect(id).toBeNull();
    });
  });

  // ── captureMessage ───────────────────────────────────────────────────

  describe('captureMessage', () => {
    it('should return a valid error ID', () => {
      const id = captureMessage('User signed up');
      expect(id).toMatch(/^err_/);
    });

    it('should pass info level through to PII-stripped message', () => {
      captureMessage('Quota low', 'warning', { component: 'quota' });
      // Verify it called through to the underlying captureError
      expect(mockStripPiiFromString).toHaveBeenCalledWith('Quota low');
    });
  });

  // ── captureFatal ─────────────────────────────────────────────────────

  describe('captureFatal', () => {
    it('should return a valid error ID', () => {
      const id = captureFatal(new Error('App crashed'));
      expect(id).toMatch(/^err_/);
    });

    it('should strip PII from fatal error message', () => {
      captureFatal(new Error('user@test.com crashed'));
      expect(mockStripPiiFromString).toHaveBeenCalledWith('user@test.com crashed');
    });
  });

  // ── processQueue ─────────────────────────────────────────────────────

  describe('processQueue', () => {
    it('should be a no-op when queue is empty', async () => {
      await processQueue();
      // Should not crash or call API for queue processing alone
    });

    it('should handle backend send failures gracefully', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));

      captureError('will-fail');

      // Should not throw
      await processQueue();
    });
  });
});
