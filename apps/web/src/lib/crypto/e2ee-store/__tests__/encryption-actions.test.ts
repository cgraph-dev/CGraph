/**
 * Tests for e2ee-store/encryption-actions.ts
 *
 * Zustand action creators for E2EE encrypt/decrypt (X3DH + Double Ratchet),
 * key management (prekeys, safety numbers, devices, revocation).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted
// ---------------------------------------------------------------------------
const {
  mockEncryptForRecipient,
  mockDecryptFromSender,
  mockLoadIdentityKeyPair,
  mockClearE2EEData,
  mockGenerateSafetyNumber,
  mockExportPublicKey,
  mockBase64ToArrayBuffer,
  mockE2eeDefault,
  mockSessionManager,
  mockApi,
} = vi.hoisted(() => ({
  mockEncryptForRecipient: vi.fn(),
  mockDecryptFromSender: vi.fn(),
  mockLoadIdentityKeyPair: vi.fn(),
  mockClearE2EEData: vi.fn(),
  mockGenerateSafetyNumber: vi.fn(),
  mockExportPublicKey: vi.fn(),
  mockBase64ToArrayBuffer: vi.fn((s: string) => new ArrayBuffer(s.length)),
  mockE2eeDefault: {
    arrayBufferToHex: vi.fn(() => 'abcd1234'),
    arrayBufferToBase64: vi.fn(() => 'base64key'),
    randomBytes: vi.fn(() => new Uint8Array(8)),
  },
  mockSessionManager: {
    hasSession: vi.fn(),
    encryptMessage: vi.fn(),
    decryptMessage: vi.fn(),
    destroySession: vi.fn(),
    getSessionStats: vi.fn(),
  },
  mockApi: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

vi.mock('../../e2ee', () => ({
  default: mockE2eeDefault,
  encryptForRecipient: mockEncryptForRecipient,
  decryptFromSender: mockDecryptFromSender,
  loadIdentityKeyPair: mockLoadIdentityKeyPair,
  clearE2EEData: mockClearE2EEData,
  generateSafetyNumber: mockGenerateSafetyNumber,
  exportPublicKey: mockExportPublicKey,
  base64ToArrayBuffer: mockBase64ToArrayBuffer,
}));

vi.mock('../../sessionManager', () => ({ sessionManager: mockSessionManager }));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import {
  createEncryptMessage,
  createDecryptMessage,
  createEncryptWithRatchet,
  createDecryptWithRatchet,
  createHasRatchetSession,
  createUploadMorePrekeys,
  createGetPrekeyCount,
  createGetSafetyNumber,
  createGetDevices,
  createRevokeDevice,
} from '../encryption-actions';

// ---------------------------------------------------------------------------
// Helper — fake get/set
// ---------------------------------------------------------------------------
function makeMockStore(overrides?: Partial<Record<string, unknown>>) {
  const state: Record<string, unknown> = {
    isInitialized: true,
    prekeyCount: 50,
    deviceId: 'dev-123',
    bundleCache: new Map(),
    getRecipientBundle: vi.fn(async () => ({
      identity_key: 'identity-base64',
      signed_prekey: 'spk-base64',
      signed_prekey_signature: 'sig-base64',
      one_time_prekey: 'otpk-base64',
    })),
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
describe('createEncryptMessage (X3DH)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const encryptMessage = createEncryptMessage(set as never, get as never);
    await expect(encryptMessage('u1', 'hello')).rejects.toThrow('E2EE not initialized');
  });

  it('fetches bundle and encrypts', async () => {
    const { get, set, state } = makeMockStore();
    mockEncryptForRecipient.mockResolvedValue({ ciphertext: 'enc', iv: 'iv' });

    const encryptMessage = createEncryptMessage(set as never, get as never);
    const result = await encryptMessage('u1', 'hello');

    expect(state.getRecipientBundle).toHaveBeenCalledWith('u1');
    expect(mockEncryptForRecipient).toHaveBeenCalledWith('hello', expect.any(Object));
    expect(result).toEqual({ ciphertext: 'enc', iv: 'iv' });
  });
});

describe('createDecryptMessage (X3DH)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const decryptMessage = createDecryptMessage(set as never, get as never);
    await expect(decryptMessage('u1', 'key', {} as never)).rejects.toThrow('E2EE not initialized');
  });

  it('decrypts with sender identity key', async () => {
    const { get, set } = makeMockStore();
    mockDecryptFromSender.mockResolvedValue('plaintext');

    const decryptMessage = createDecryptMessage(set as never, get as never);
    const result = await decryptMessage('u1', 'sender-key-b64', { ciphertext: 'c' } as never);

    expect(mockBase64ToArrayBuffer).toHaveBeenCalledWith('sender-key-b64');
    expect(mockDecryptFromSender).toHaveBeenCalled();
    expect(result).toBe('plaintext');
  });
});

describe('createEncryptWithRatchet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const fn = createEncryptWithRatchet(set as never, get as never);
    await expect(fn('u1', 'text')).rejects.toThrow('E2EE not initialized');
  });

  it('fetches bundle when no session exists', async () => {
    const { get, set, state } = makeMockStore();
    mockSessionManager.hasSession.mockReturnValue(false);
    mockSessionManager.encryptMessage.mockResolvedValue({ body: 'enc' });
    mockApi.get.mockResolvedValue({ data: { data: { id: 'our-id' } } });

    const fn = createEncryptWithRatchet(set as never, get as never);
    const result = await fn('recipient1', 'secret');

    expect(state.getRecipientBundle).toHaveBeenCalledWith('recipient1');
    expect(mockSessionManager.encryptMessage).toHaveBeenCalledWith(
      'our-id',
      'recipient1',
      'secret',
      expect.any(Object)
    );
    expect(result).toEqual({ body: 'enc' });
  });

  it('skips bundle fetch when session exists', async () => {
    const { get, set, state } = makeMockStore();
    mockSessionManager.hasSession.mockReturnValue(true);
    mockSessionManager.encryptMessage.mockResolvedValue({ body: 'enc2' });
    mockApi.get.mockResolvedValue({ data: { id: 'our-id-2' } });

    const fn = createEncryptWithRatchet(set as never, get as never);
    await fn('recipient2', 'text');

    expect(state.getRecipientBundle).not.toHaveBeenCalled();
    expect(mockSessionManager.encryptMessage).toHaveBeenCalledWith(
      'our-id-2',
      'recipient2',
      'text',
      undefined
    );
  });
});

describe('createDecryptWithRatchet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const fn = createDecryptWithRatchet(set as never, get as never);
    await expect(fn({} as never)).rejects.toThrow('E2EE not initialized');
  });

  it('decrypts using session manager', async () => {
    const { get, set } = makeMockStore();
    mockSessionManager.decryptMessage.mockResolvedValue('decrypted-text');

    const fn = createDecryptWithRatchet(set as never, get as never);
    const result = await fn({ body: 'enc' } as never, 'sender-key-b64');

    expect(mockBase64ToArrayBuffer).toHaveBeenCalledWith('sender-key-b64');
    expect(mockSessionManager.decryptMessage).toHaveBeenCalled();
    expect(result).toBe('decrypted-text');
  });
});

describe('createHasRatchetSession', () => {
  it('delegates to sessionManager', () => {
    mockSessionManager.hasSession.mockReturnValue(true);
    const fn = createHasRatchetSession();
    expect(fn('u1')).toBe(true);
    expect(mockSessionManager.hasSession).toHaveBeenCalledWith('u1');
  });
});

describe('createUploadMorePrekeys', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const fn = createUploadMorePrekeys(set as never, get as never);
    await expect(fn(10)).rejects.toThrow('E2EE not initialized');
  });

  it('generates and uploads prekeys', async () => {
    const { get, set, state } = makeMockStore({ prekeyCount: 20 });
    mockApi.post.mockResolvedValue({ data: { data: { count: 25 } } });

    const fn = createUploadMorePrekeys(set as never, get as never);
    const result = await fn(25);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/e2ee/keys/prekeys', expect.any(Object));
    expect(result).toBe(25);
    expect(state.prekeyCount).toBe(45); // 20 + 25
  });
});

describe('createGetPrekeyCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches count from server', async () => {
    const { set, state } = makeMockStore();
    mockApi.get.mockResolvedValue({ data: { data: { count: 42 } } });

    const fn = createGetPrekeyCount(set as never);
    const count = await fn();

    expect(count).toBe(42);
    expect(state.prekeyCount).toBe(42);
  });

  it('returns 0 on error', async () => {
    const { set } = makeMockStore();
    mockApi.get.mockRejectedValue(new Error('network'));

    const fn = createGetPrekeyCount(set as never);
    expect(await fn()).toBe(0);
  });
});

describe('createGetSafetyNumber', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when not initialized', async () => {
    const { get, set } = makeMockStore({ isInitialized: false });
    const fn = createGetSafetyNumber(set as never, get as never);
    await expect(fn('u1')).rejects.toThrow('E2EE not initialized');
  });

  it('generates safety number from both key pairs', async () => {
    const { get, set } = makeMockStore();
    const fakeKeyPair = { keyPair: { publicKey: {} } };
    mockLoadIdentityKeyPair.mockResolvedValue(fakeKeyPair);
    mockExportPublicKey.mockResolvedValue(new ArrayBuffer(32));
    mockApi.get.mockResolvedValue({ data: { data: { id: 'our-id' } } });
    mockGenerateSafetyNumber.mockResolvedValue('12345-67890');

    const fn = createGetSafetyNumber(set as never, get as never);
    const result = await fn('recipient-user');

    expect(mockLoadIdentityKeyPair).toHaveBeenCalled();
    expect(mockExportPublicKey).toHaveBeenCalledWith(fakeKeyPair.keyPair.publicKey);
    expect(mockGenerateSafetyNumber).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      'our-id',
      expect.any(ArrayBuffer),
      'recipient-user'
    );
    expect(result).toBe('12345-67890');
  });
});

describe('createGetDevices', () => {
  it('returns devices list from API', async () => {
    const devices = [{ device_id: 'd1', created_at: '2024-01-01' }];
    mockApi.get.mockResolvedValue({ data: { data: devices } });

    const fn = createGetDevices();
    expect(await fn()).toEqual(devices);
  });
});

describe('createRevokeDevice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revokes device and resets state when revoking own device', async () => {
    const { get, set, state } = makeMockStore({ deviceId: 'dev-123' });
    mockApi.delete.mockResolvedValue({});

    const fn = createRevokeDevice(set as never, get as never);
    await fn('dev-123');

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/e2ee/devices/dev-123');
    expect(mockClearE2EEData).toHaveBeenCalled();
    expect(state.isInitialized).toBe(false);
    expect(state.deviceId).toBeNull();
  });

  it('revokes other device without resetting own state', async () => {
    const { get, set, state } = makeMockStore({ deviceId: 'dev-123' });
    mockApi.delete.mockResolvedValue({});

    const fn = createRevokeDevice(set as never, get as never);
    await fn('other-device');

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/e2ee/devices/other-device');
    expect(mockClearE2EEData).not.toHaveBeenCalled();
    expect(state.isInitialized).toBe(true);
    expect(state.deviceId).toBe('dev-123');
  });
});
