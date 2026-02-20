/**
 * Tests for e2ee-store/core-actions.ts
 *
 * Zustand action creators for E2EE initialization, setup, reset,
 * recipient bundle caching, key revocation handling, and settings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockApi,
  mockLogger,
  mockIsE2EESetUp,
  mockGenerateKeyBundle,
  mockStoreKeyBundle,
  mockFormatKeysForRegistration,
  mockLoadIdentityKeyPair,
  mockGetDeviceId,
  mockGenerateDeviceId,
  mockClearE2EEData,
  mockExportPublicKey,
  mockFingerprint,
  mockSessionManager,
} = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  mockLogger: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  mockIsE2EESetUp: vi.fn(),
  mockGenerateKeyBundle: vi.fn(),
  mockStoreKeyBundle: vi.fn(),
  mockFormatKeysForRegistration: vi.fn(),
  mockLoadIdentityKeyPair: vi.fn(),
  mockGetDeviceId: vi.fn(),
  mockGenerateDeviceId: vi.fn(),
  mockClearE2EEData: vi.fn(),
  mockExportPublicKey: vi.fn(),
  mockFingerprint: vi.fn(),
  mockSessionManager: {
    initialize: vi.fn(),
    destroySession: vi.fn(() => Promise.resolve()),
    destroyAllSessions: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));
vi.mock('../../../logger', () => ({
  e2eeLogger: mockLogger,
  createLogger: () => mockLogger,
  logger: mockLogger,
}));
vi.mock('@/lib/logger', () => ({
  e2eeLogger: mockLogger,
  createLogger: () => mockLogger,
  logger: mockLogger,
}));
vi.mock('../../e2ee', () => ({
  isE2EESetUp: mockIsE2EESetUp,
  generateKeyBundle: mockGenerateKeyBundle,
  storeKeyBundle: mockStoreKeyBundle,
  formatKeysForRegistration: mockFormatKeysForRegistration,
  loadIdentityKeyPair: mockLoadIdentityKeyPair,
  getDeviceId: mockGetDeviceId,
  generateDeviceId: mockGenerateDeviceId,
  clearE2EEData: mockClearE2EEData,
  exportPublicKey: mockExportPublicKey,
  fingerprint: mockFingerprint,
}));
vi.mock('../../sessionManager', () => ({ sessionManager: mockSessionManager }));
vi.mock('../../e2ee-secure/key-storage', () => ({
  storeKEMPreKey: vi.fn().mockResolvedValue(undefined),
  storeOPKPrivateKeys: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import {
  createInitialize,
  createSetupE2EE,
  createResetE2EE,
  createGetRecipientBundle,
  createHandleKeyRevoked,
  createSetUseDoubleRatchet,
  createClearError,
} from '../core-actions';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeMockStore(overrides?: Record<string, unknown>) {
  const state: Record<string, unknown> = {
    isInitialized: false,
    isLoading: false,
    error: null,
    deviceId: null,
    fingerprint: null,
    prekeyCount: 0,
    bundleCache: new Map(),
    useDoubleRatchet: false,
    getPrekeyCount: vi.fn(async () => 0),
    ...overrides,
  };

  const get = vi.fn(() => state);
  const set = vi.fn(
    (
      partial: Record<string, unknown> | ((s: Record<string, unknown>) => Record<string, unknown>)
    ) => {
      if (typeof partial === 'function') {
        Object.assign(state, partial(state));
      } else {
        Object.assign(state, partial);
      }
    }
  );
  return { get, set, state };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('createInitialize', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes when E2EE is already set up', async () => {
    const { get, set, state } = makeMockStore();
    mockIsE2EESetUp.mockResolvedValue(true);
    mockGetDeviceId.mockReturnValue('dev-1');
    mockLoadIdentityKeyPair.mockResolvedValue({ keyPair: { publicKey: {} } });
    mockExportPublicKey.mockResolvedValue(new ArrayBuffer(32));
    mockFingerprint.mockResolvedValue('fp-abc');
    mockSessionManager.initialize.mockResolvedValue(undefined);

    const init = createInitialize(set as never, get as never);
    await init();

    expect(state.isInitialized).toBe(true);
    expect(state.deviceId).toBe('dev-1');
    expect(state.fingerprint).toBe('fp-abc');
    expect(state.isLoading).toBe(false);
    expect(mockSessionManager.initialize).toHaveBeenCalled();
  });

  it('sets isInitialized to false when not set up', async () => {
    const { get, set, state } = makeMockStore();
    mockIsE2EESetUp.mockResolvedValue(false);
    mockGetDeviceId.mockReturnValue(null);

    const init = createInitialize(set as never, get as never);
    await init();

    expect(state.isInitialized).toBe(false);
  });

  it('sets error on failure', async () => {
    const { get, set, state } = makeMockStore();
    mockIsE2EESetUp.mockRejectedValue(new Error('db error'));

    const init = createInitialize(set as never, get as never);
    await init();

    expect(state.error).toBe('db error');
    expect(state.isLoading).toBe(false);
  });
});

describe('createSetupE2EE', () => {
  beforeEach(() => vi.clearAllMocks());

  it('generates bundle, stores keys, and registers with server', async () => {
    const { set, state } = makeMockStore();
    const fakeBundle = {
      identityKey: { keyPair: { publicKey: {} } },
      deviceId: 'new-dev',
      oneTimePreKeys: [
        { keyId: 1, keyPair: { publicKey: {}, privateKey: {} } },
      ],
      signedPreKey: { keyPair: { publicKey: {}, privateKey: {} }, signature: new ArrayBuffer(64) },
    };
    mockGenerateDeviceId.mockReturnValue('new-dev');
    mockGenerateKeyBundle.mockResolvedValue(fakeBundle);
    mockStoreKeyBundle.mockResolvedValue(undefined);
    mockFormatKeysForRegistration.mockResolvedValue({ keys: 'data' });
    mockApi.post.mockResolvedValue({});
    mockExportPublicKey.mockResolvedValue(new ArrayBuffer(32));
    mockFingerprint.mockResolvedValue('fp-new');

    const setup = createSetupE2EE(set as never, (() => ({})) as never);
    await setup();

    expect(mockStoreKeyBundle).toHaveBeenCalledWith(fakeBundle);
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/e2ee/keys', { keys: 'data' });
    expect(state.isInitialized).toBe(true);
    expect(state.prekeyCount).toBe(100);
  });

  it('throws and sets error on failure', async () => {
    const { set, state } = makeMockStore();
    mockGenerateDeviceId.mockReturnValue('x');
    mockGenerateKeyBundle.mockRejectedValue(new Error('crypto fail'));

    const setup = createSetupE2EE(set as never, (() => ({})) as never);
    await expect(setup()).rejects.toThrow('crypto fail');
    expect(state.error).toBe('crypto fail');
  });
});

describe('createResetE2EE', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revokes device, clears data, and resets state', async () => {
    const { get, set, state } = makeMockStore({ deviceId: 'dev-old', isInitialized: true });
    mockApi.delete.mockResolvedValue({});
    mockSessionManager.destroyAllSessions.mockResolvedValue(undefined);

    const reset = createResetE2EE(set as never, get as never);
    await reset();

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/e2ee/keys/dev-old');
    expect(mockClearE2EEData).toHaveBeenCalled();
    expect(mockSessionManager.destroyAllSessions).toHaveBeenCalled();
    expect(state.isInitialized).toBe(false);
    expect(state.deviceId).toBeNull();
    expect(state.fingerprint).toBeNull();
  });
});

describe('createGetRecipientBundle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns cached bundle when not expired', async () => {
    const bundle = { identity_key: 'ik' };
    const cache = new Map([['u1', { bundle, expiresAt: Date.now() + 60000 }]]);
    const { get, set } = makeMockStore({ bundleCache: cache });

    const getBundle = createGetRecipientBundle(set as never, get as never);
    const result = await getBundle('u1');

    expect(result).toBe(bundle);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('fetches from server when cache expired', async () => {
    const cache = new Map([['u1', { bundle: {}, expiresAt: Date.now() - 1000 }]]);
    const { get, set } = makeMockStore({ bundleCache: cache });
    const freshBundle = { identity_key: 'fresh' };
    mockApi.get.mockResolvedValue({ data: { data: freshBundle } });

    const getBundle = createGetRecipientBundle(set as never, get as never);
    const result = await getBundle('u1');

    expect(result).toEqual(freshBundle);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/e2ee/bundle/u1');
  });

  it('fetches from server when not in cache', async () => {
    const { get, set } = makeMockStore({ bundleCache: new Map() });
    mockApi.get.mockResolvedValue({ data: { data: { identity_key: 'new' } } });

    const getBundle = createGetRecipientBundle(set as never, get as never);
    await getBundle('u-new');

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/e2ee/bundle/u-new');
  });
});

describe('createHandleKeyRevoked', () => {
  it('clears bundle cache and destroys session', () => {
    const cache = new Map([['user1', { bundle: {}, expiresAt: 99999 }]]);
    const { get, set } = makeMockStore({ bundleCache: cache });

    const handleRevoked = createHandleKeyRevoked(set as never, get as never);
    handleRevoked('user1', 'key-id-1');

    expect(cache.has('user1')).toBe(false);
    expect(mockSessionManager.destroySession).toHaveBeenCalledWith('user1');
  });
});

describe('createSetUseDoubleRatchet', () => {
  it('toggles double ratchet mode', () => {
    const { set, state } = makeMockStore();
    const setDR = createSetUseDoubleRatchet(set as never);

    setDR(true);
    expect(state.useDoubleRatchet).toBe(true);

    setDR(false);
    expect(state.useDoubleRatchet).toBe(false);
  });
});

describe('createClearError', () => {
  it('clears error state', () => {
    const { set, state } = makeMockStore({ error: 'some error' });
    const clearError = createClearError(set as never);
    clearError();
    expect(state.error).toBeNull();
  });
});
