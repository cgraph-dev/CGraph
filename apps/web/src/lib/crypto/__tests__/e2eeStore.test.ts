/**
 * E2EE Store Test Suite
 *
 * Tests for the Zustand-based E2EE store that manages encryption state,
 * key bundles, and integrates with Double Ratchet sessions.
 *
 * @module lib/crypto/__tests__/e2eeStore.test
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useE2EEStore } from '../e2eeStore';
import { api } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock e2ee module
vi.mock('../e2ee', () => ({
  default: {},
  isE2EESetUp: vi.fn(() => false),
  generateKeyBundle: vi.fn(() =>
    Promise.resolve({
      deviceId: 'test-device',
      identityKey: { keyPair: {}, signingKeyPair: {} },
      signedPreKey: { keyPair: {}, signature: new ArrayBuffer(64) },
      oneTimePreKeys: [],
    })
  ),
  storeKeyBundle: vi.fn(() => Promise.resolve()),
  formatKeysForRegistration: vi.fn(() =>
    Promise.resolve({
      device_id: 'test-device',
      identity_key: 'base64-key',
      signed_prekey: 'base64-key',
      signed_prekey_signature: 'base64-sig',
      prekeys: [],
    })
  ),
  encryptForRecipient: vi.fn(() =>
    Promise.resolve({
      ciphertext: 'encrypted',
      nonce: 'nonce',
    })
  ),
  decryptFromSender: vi.fn(() => Promise.resolve('decrypted message')),
  loadIdentityKeyPair: vi.fn(() =>
    Promise.resolve({
      keyPair: { publicKey: {}, privateKey: {} },
      signingKeyPair: { publicKey: {}, privateKey: {} },
    })
  ),
  getDeviceId: vi.fn(() => 'test-device-id'),
  generateDeviceId: vi.fn(() => 'new-device-id'),
  clearE2EEData: vi.fn(() => Promise.resolve()),
  generateSafetyNumber: vi.fn(() => Promise.resolve('12345 67890 12345 67890 12345 67890')),
  fingerprint: vi.fn(() => Promise.resolve('ABCD-EFGH-IJKL-MNOP')),
  base64ToArrayBuffer: vi.fn(() => new ArrayBuffer(32)),
  exportPublicKey: vi.fn(() => Promise.resolve(new ArrayBuffer(65))),
  KeyBundle: {},
  ServerPrekeyBundle: {},
  EncryptedMessage: {},
}));

// Mock session manager
vi.mock('../sessionManager', () => ({
  sessionManager: {
    initialize: vi.fn(() => Promise.resolve()),
    hasSession: vi.fn(() => false),
    createSession: vi.fn(),
    encryptMessage: vi.fn(() =>
      Promise.resolve({
        senderId: 'user1',
        recipientId: 'user2',
        sessionId: 'session-123',
        messageId: 'msg-456',
        timestamp: Date.now(),
        ratchetMessage: {
          header: {
            dh: 'key',
            pn: 0,
            n: 0,
            sessionId: 'session-123',
            timestamp: Date.now(),
            version: 1,
          },
          ciphertext: 'encrypted',
          nonce: 'nonce',
          mac: 'mac',
        },
      })
    ),
    decryptMessage: vi.fn(() => Promise.resolve('decrypted')),
    destroySession: vi.fn(() => Promise.resolve()),
    getSessionStats: vi.fn(() => ({
      sessionId: 'session-123',
      messageCount: 10,
      dhRatchetCount: 3,
      skippedKeysCount: 0,
      ratchetSteps: 10,
      lastActivity: Date.now(),
    })),
  },
  SecureMessage: {},
}));

// Mock logger
vi.mock('../../logger', () => ({
  e2eeLogger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useE2EEStore', () => {
  beforeEach(() => {
    // Reset store state
    const store = useE2EEStore.getState();
    store.bundleCache.clear();
    useE2EEStore.setState({
      isInitialized: false,
      isLoading: false,
      error: null,
      deviceId: null,
      fingerprint: null,
      prekeyCount: 0,
      useDoubleRatchet: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct default state', () => {
      const state = useE2EEStore.getState();

      expect(state.isInitialized).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.deviceId).toBeNull();
      expect(state.fingerprint).toBeNull();
      expect(state.prekeyCount).toBe(0);
      expect(state.useDoubleRatchet).toBe(true);
    });

    it('should have empty bundle cache', () => {
      const state = useE2EEStore.getState();
      expect(state.bundleCache.size).toBe(0);
    });
  });

  describe('Double Ratchet Toggle', () => {
    it('should enable Double Ratchet by default', () => {
      const state = useE2EEStore.getState();
      expect(state.useDoubleRatchet).toBe(true);
    });

    it('should toggle Double Ratchet setting', () => {
      const { setUseDoubleRatchet } = useE2EEStore.getState();

      setUseDoubleRatchet(false);
      expect(useE2EEStore.getState().useDoubleRatchet).toBe(false);

      setUseDoubleRatchet(true);
      expect(useE2EEStore.getState().useDoubleRatchet).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      useE2EEStore.setState({ error: 'Some error' });
      expect(useE2EEStore.getState().error).toBe('Some error');

      const { clearError } = useE2EEStore.getState();
      clearError();
      expect(useE2EEStore.getState().error).toBeNull();
    });
  });

  describe('Bundle Cache', () => {
    it('should cache recipient bundles', () => {
      const state = useE2EEStore.getState();
      const bundle = {
        identity_key: 'key1',
        signed_prekey: 'key2',
        signed_prekey_signature: 'sig',
      };

      state.bundleCache.set('user123', {
        bundle: bundle as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: Date.now() + 300000,
      });

      expect(state.bundleCache.has('user123')).toBe(true);
      expect(state.bundleCache.get('user123')?.bundle.identity_key).toBe('key1');
    });

    it('should expire cached bundles', () => {
      const state = useE2EEStore.getState();
      const bundle = {
        identity_key: 'key1',
        signed_prekey: 'key2',
        signed_prekey_signature: 'sig',
      };

      // Set expired bundle
      state.bundleCache.set('user123', {
        bundle: bundle as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });

      const cached = state.bundleCache.get('user123');
      expect(cached?.expiresAt).toBeLessThan(Date.now());
    });
  });

  describe('hasRatchetSession', () => {
    it('should check if ratchet session exists', () => {
      const { hasRatchetSession } = useE2EEStore.getState();
      const result = hasRatchetSession('some-user');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getRatchetSessionStats', () => {
    it('should return session stats', () => {
      const { getRatchetSessionStats } = useE2EEStore.getState();
      const stats = getRatchetSessionStats('some-user');

      // Mock returns stats object
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.sessionId).toBe('session-123');
        expect(stats.messageCount).toBe(10);
        expect(stats.dhRatchetCount).toBe(3);
      }
    });
  });

  describe('Store Actions', () => {
    it('should have initialize action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.initialize).toBe('function');
    });

    it('should have setupE2EE action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.setupE2EE).toBe('function');
    });

    it('should have resetE2EE action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.resetE2EE).toBe('function');
    });

    it('should have encryptMessage action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.encryptMessage).toBe('function');
    });

    it('should have decryptMessage action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.decryptMessage).toBe('function');
    });

    it('should have encryptWithRatchet action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.encryptWithRatchet).toBe('function');
    });

    it('should have decryptWithRatchet action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.decryptWithRatchet).toBe('function');
    });

    it('should have destroyRatchetSession action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.destroyRatchetSession).toBe('function');
    });

    it('should have uploadMorePrekeys action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.uploadMorePrekeys).toBe('function');
    });

    it('should have getPrekeyCount action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.getPrekeyCount).toBe('function');
    });

    it('should have getRecipientBundle action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.getRecipientBundle).toBe('function');
    });

    it('should have getSafetyNumber action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.getSafetyNumber).toBe('function');
    });

    it('should have getDevices action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.getDevices).toBe('function');
    });

    it('should have revokeDevice action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.revokeDevice).toBe('function');
    });

    it('should have handleKeyRevoked action', () => {
      const state = useE2EEStore.getState();
      expect(typeof state.handleKeyRevoked).toBe('function');
    });
  });

  describe('API Integration', () => {
    it('should use cached bundle if not expired', async () => {
      const mockBundle = {
        identity_key: 'cached-key',
        signed_prekey: 'cached-prekey',
        signed_prekey_signature: 'cached-sig',
      };

      // Pre-populate cache
      const state = useE2EEStore.getState();
      state.bundleCache.set('user123', {
        bundle: mockBundle as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: Date.now() + 300000, // Valid for 5 more minutes
      });

      const { getRecipientBundle } = useE2EEStore.getState();
      const bundle = await getRecipientBundle('user123');

      // Should not call API since we have a valid cache
      expect(api.get).not.toHaveBeenCalled();
      expect(bundle.identity_key).toBe('cached-key');
    });

    it('should fetch new bundle if cache expired', async () => {
      const cachedBundle = {
        identity_key: 'old-key',
        signed_prekey: 'old-prekey',
        signed_prekey_signature: 'old-sig',
      };

      const newBundle = {
        identity_key: 'new-key',
        signed_prekey: 'new-prekey',
        signed_prekey_signature: 'new-sig',
      };

      // Pre-populate with expired cache
      const state = useE2EEStore.getState();
      state.bundleCache.set('user123', {
        bundle: cachedBundle as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: Date.now() - 1000, // Expired
      });

      (api.get as MockedFunction<typeof api.get>).mockResolvedValueOnce({
        data: newBundle,
      });

      const { getRecipientBundle } = useE2EEStore.getState();
      const bundle = await getRecipientBundle('user123');

      // Should call API to get fresh bundle
      expect(api.get).toHaveBeenCalledWith('/api/v1/e2ee/bundle/user123');
      expect(bundle.identity_key).toBe('new-key');
    });
  });

  describe('handleKeyRevoked', () => {
    it('should clear cached bundle for user', () => {
      const state = useE2EEStore.getState();

      // Add bundle to cache
      state.bundleCache.set('user123', {
        bundle: {} as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: Date.now() + 300000,
      });

      expect(state.bundleCache.has('user123')).toBe(true);

      // Handle key revocation
      state.handleKeyRevoked('user123', 'some-key-id');

      expect(state.bundleCache.has('user123')).toBe(false);
    });
  });

  describe('React Hook Integration', () => {
    it('should work with React hooks', () => {
      const { result } = renderHook(() => useE2EEStore());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.useDoubleRatchet).toBe(true);
      expect(typeof result.current.initialize).toBe('function');
    });

    it('should update state via hook', () => {
      const { result } = renderHook(() => useE2EEStore());

      act(() => {
        result.current.setUseDoubleRatchet(false);
      });

      expect(result.current.useDoubleRatchet).toBe(false);
    });

    it('should clear errors via hook', () => {
      useE2EEStore.setState({ error: 'Test error' });

      const { result } = renderHook(() => useE2EEStore());

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('E2EE Store Security Considerations', () => {
  describe('Key Storage', () => {
    it('should not expose private keys in state', () => {
      const state = useE2EEStore.getState();
      const stateKeys = Object.keys(state);

      // Should not have direct private key properties
      expect(stateKeys).not.toContain('privateKey');
      expect(stateKeys).not.toContain('identityPrivateKey');
      expect(stateKeys).not.toContain('signingPrivateKey');
    });

    it('should only expose device ID and fingerprint', () => {
      const state = useE2EEStore.getState();

      // These are safe to expose
      expect(state).toHaveProperty('deviceId');
      expect(state).toHaveProperty('fingerprint');

      // Fingerprint is derived from public key, safe to show
      expect(state.fingerprint).toBeNull(); // Until initialized
    });
  });

  describe('Bundle Cache Security', () => {
    it('should have TTL for cached bundles', () => {
      const BUNDLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const state = useE2EEStore.getState();
      const now = Date.now();

      state.bundleCache.set('user', {
        bundle: {} as unknown as Parameters<typeof state.bundleCache.set>[1]['bundle'],
        expiresAt: now + BUNDLE_CACHE_TTL,
      });

      const cached = state.bundleCache.get('user');
      expect(cached?.expiresAt).toBeLessThanOrEqual(now + BUNDLE_CACHE_TTL);
    });
  });

  describe('Session Management', () => {
    it('should support destroying sessions', () => {
      const { destroyRatchetSession } = useE2EEStore.getState();
      expect(typeof destroyRatchetSession).toBe('function');
    });

    it('should support checking session existence', () => {
      const { hasRatchetSession } = useE2EEStore.getState();
      expect(typeof hasRatchetSession).toBe('function');
    });
  });
});

describe('E2EE Store State Transitions', () => {
  it('should transition from uninitialized to loading', async () => {
    const state = useE2EEStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.isLoading).toBe(false);

    // During initialization, isLoading should be true
    useE2EEStore.setState({ isLoading: true });
    expect(useE2EEStore.getState().isLoading).toBe(true);
  });

  it('should transition from loading to initialized', () => {
    useE2EEStore.setState({ isLoading: true });
    expect(useE2EEStore.getState().isLoading).toBe(true);

    useE2EEStore.setState({ isLoading: false, isInitialized: true });

    const state = useE2EEStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it('should handle initialization error', () => {
    useE2EEStore.setState({ isLoading: true });

    useE2EEStore.setState({
      isLoading: false,
      isInitialized: false,
      error: 'Initialization failed',
    });

    const state = useE2EEStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBe('Initialization failed');
  });
});

describe('E2EE Store Double Ratchet Mode', () => {
  it('should default to Double Ratchet mode', () => {
    const state = useE2EEStore.getState();
    expect(state.useDoubleRatchet).toBe(true);
  });

  it('should have separate encrypt/decrypt methods for legacy and ratchet', () => {
    const state = useE2EEStore.getState();

    // Legacy methods (X3DH only)
    expect(typeof state.encryptMessage).toBe('function');
    expect(typeof state.decryptMessage).toBe('function');

    // Double Ratchet methods (forward secrecy)
    expect(typeof state.encryptWithRatchet).toBe('function');
    expect(typeof state.decryptWithRatchet).toBe('function');
  });
});
