/**
 * API Integration Tests
 *
 * Tests for the API client configuration and exported methods.
 *
 * @since v0.7.28
 */

import api from '../api';

describe('API Client', () => {
  describe('configuration', () => {
    it('exports a valid axios instance', () => {
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.patch).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('has interceptors configured', () => {
      expect(api.interceptors.request).toBeDefined();
      expect(api.interceptors.response).toBeDefined();
    });

    it('has defaults object', () => {
      expect(api.defaults).toBeDefined();
      expect(api.defaults.headers).toBeDefined();
    });
  });

  describe('authentication headers', () => {
    const originalAuth = api.defaults.headers.common?.Authorization;

    afterEach(() => {
      // Restore original
      if (originalAuth) {
        api.defaults.headers.common.Authorization = originalAuth;
      } else if (api.defaults.headers.common) {
        delete api.defaults.headers.common.Authorization;
      }
    });

    it('can set authorization header', () => {
      if (!api.defaults.headers.common) {
        api.defaults.headers.common = {};
      }
      api.defaults.headers.common.Authorization = 'Bearer test-token';

      expect(api.defaults.headers.common.Authorization).toBe('Bearer test-token');
    });

    it('can clear authorization header', () => {
      if (!api.defaults.headers.common) {
        api.defaults.headers.common = {};
      }
      api.defaults.headers.common.Authorization = 'Bearer test-token';
      delete api.defaults.headers.common.Authorization;

      expect(api.defaults.headers.common.Authorization).toBeUndefined();
    });
  });
});
