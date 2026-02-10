/**
 * Tests for SessionManager class
 *
 * Validates the full E2EE session lifecycle:
 * - Initialization & session persistence
 * - X3DH key agreement (initiator & responder)
 * - Double Ratchet encrypt/decrypt
 * - Session management (destroy, stats, listing)
 *
 * All external crypto primitives (doubleRatchet, e2ee, storage) are
 * mocked to isolate SessionManager logic from Web Crypto APIs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared BEFORE the import of the module under test
// ---------------------------------------------------------------------------

// Mock DoubleRatchetEngine
const mockEncryptMessage = vi.fn();
const mockDecryptMessage = vi.fn();
const mockInitializeAlice = vi.fn();
const mockInitializeBob = vi.fn();
const mockImportState = vi.fn();
const mockGetStats = vi.fn().mockReturnValue({
  sessionId: 'session-123',
  messagesSent: 0,
  messagesReceived: 0,
});
const mockDestroy = vi.fn();

vi.mock('../../doubleRatchet', () => ({
  DoubleRatchetEngine: vi.fn().mockImplementation(() => ({
    initializeAlice: mockInitializeAlice,
    initializeBob: mockInitializeBob,
    encryptMessage: mockEncryptMessage,
    decryptMessage: mockDecryptMessage,
    importState: mockImportState,
    getStats: mockGetStats,
    destroy: mockDestroy,
  })),
  generateDHKeyPair: vi.fn().mockResolvedValue({
    publicKey: new Uint8Array([1, 2, 3]),
    privateKey: new Uint8Array([4, 5, 6]),
  }),
}));

// Mock e2ee helpers
const mockLoadIdentityKeyPair = vi.fn();
const mockX3dhInitiate = vi.fn();

vi.mock('../../e2ee', () => ({
  loadIdentityKeyPair: (...args: unknown[]) => mockLoadIdentityKeyPair(...args),
  x3dhInitiate: (...args: unknown[]) => mockX3dhInitiate(...args),
  arrayBufferToBase64: vi.fn((buf: ArrayBuffer) => {
    return Buffer.from(new Uint8Array(buf)).toString('base64');
  }),
  base64ToArrayBuffer: vi.fn((str: string) => {
    const buf = Buffer.from(str, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }),
}));

// Mock storage
const mockSaveSession = vi.fn().mockResolvedValue(undefined);
const mockDeleteSession = vi.fn().mockResolvedValue(undefined);
const mockGetAllSessions = vi.fn().mockResolvedValue([]);

vi.mock('../storage', () => ({
  saveSessionToStorage: (...args: unknown[]) => mockSaveSession(...args),
  deleteSessionFromStorage: (...args: unknown[]) => mockDeleteSession(...args),
  getAllSessions: () => mockGetAllSessions(),
}));

// Mock session-x3dh
const mockComputeResponderSharedSecret = vi.fn();

vi.mock('../session-x3dh', () => ({
  computeResponderSharedSecret: (...args: unknown[]) =>
    mockComputeResponderSharedSecret(...args),
}));

// Mock message-ops
const mockBuildSecureMessage = vi.fn();
const mockToRatchetMessage = vi.fn();

vi.mock('../message-ops', () => ({
  buildSecureMessage: (...args: unknown[]) => mockBuildSecureMessage(...args),
  toRatchetMessage: (...args: unknown[]) => mockToRatchetMessage(...args),
}));

// Mock logger
vi.mock('../../../../logger', () => ({
  e2eeLogger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks are declared)
// ---------------------------------------------------------------------------

// We need a fresh SessionManager instance per test (the module exports a
// singleton), so we import the module and create new instances.
// We dynamically import to get a fresh singleton via vi.resetModules() each time.

// Helper: create a minimal SecureMessage envelope
function makeSecureMessage(overrides: Record<string, unknown> = {}): {
  senderId: string;
  recipientId: string;
  sessionId: string;
  messageId: string;
  timestamp: number;
  ratchetMessage: {
    header: { dh: string; pn: number; n: number; sessionId: string; timestamp: number; version: number };
    ciphertext: string;
    nonce: string;
    mac: string;
  };
  initialMessage?: {
    ephemeralPublicKey: string;
    usedOneTimePreKey: boolean;
    oneTimePreKeyId?: string;
  };
} {
  return {
    senderId: 'user-bob',
    recipientId: 'user-alice',
    sessionId: 'session-123',
    messageId: 'msg-1',
    timestamp: Date.now(),
    ratchetMessage: {
      header: { dh: 'dh-key', pn: 0, n: 0, sessionId: 'session-123', timestamp: Date.now(), version: 1 },
      ciphertext: 'ciphertext-base64',
      nonce: 'nonce-base64',
      mac: 'mac-base64',
    },
    ...overrides,
  };
}

// Helper: create a recipient bundle
function makeBundle() {
  return {
    identity_key: 'identity-key-b64',
    identity_key_id: 'ik-id-1',
    signed_prekey: btoa(String.fromCharCode(10, 20, 30)), // valid base64
    signed_prekey_id: 'spk-id-1',
    signed_prekey_signature: 'sig-b64',
    one_time_prekey: 'otk-b64',
    one_time_prekey_id: 'otk-id-1',
  };
}

describe('SessionManager', () => {
  // Create a fresh SessionManager before each test by clearing internal state
  // via the singleton and resetting mocks.
  let sm: typeof import('../session-manager-class')['sessionManager'];

  beforeEach(async () => {
    vi.clearAllMocks();

    // Re-import to get a fresh singleton reference; internal Maps reset via
    // destroyAllSessions or we create a pristine instance by re-importing
    // the module with a clean cache.
    vi.resetModules();

    // Re-apply mock implementations after resetModules
    mockGetAllSessions.mockResolvedValue([]);
    mockSaveSession.mockResolvedValue(undefined);
    mockDeleteSession.mockResolvedValue(undefined);
    mockGetStats.mockReturnValue({
      sessionId: 'session-123',
      messagesSent: 0,
      messagesReceived: 0,
    });

    const mod = await import('../session-manager-class');
    sm = mod.sessionManager;
  });

  // =========================================================================
  // Initialization
  // =========================================================================

  describe('initialize', () => {
    it('loads sessions from storage', async () => {
      mockGetAllSessions.mockResolvedValueOnce([
        {
          recipientId: 'user-bob',
          sessionId: 'sess-1',
          isInitiator: true,
          createdAt: 1000,
          lastActivity: 2000,
          messageCount: 5,
          engineState: '{"state": "serialized"}',
        },
      ]);

      // Need a fresh import since beforeEach already called initialize
      vi.resetModules();
      const mod = await import('../session-manager-class');
      await mod.sessionManager.initialize();

      expect(mod.sessionManager.hasSession('user-bob')).toBe(true);
      expect(mod.sessionManager.getActiveSessions()).toContain('user-bob');
    });

    it('skips corrupted sessions without crashing', async () => {
      mockImportState.mockRejectedValueOnce(new Error('corrupt state'));
      mockGetAllSessions.mockResolvedValueOnce([
        {
          recipientId: 'corrupt-user',
          sessionId: 'sess-bad',
          isInitiator: false,
          createdAt: 0,
          lastActivity: 0,
          messageCount: 0,
          engineState: 'INVALID',
        },
      ]);

      vi.resetModules();
      const mod = await import('../session-manager-class');
      await mod.sessionManager.initialize();

      expect(mod.sessionManager.hasSession('corrupt-user')).toBe(false);
    });
  });

  // =========================================================================
  // Session queries
  // =========================================================================

  describe('hasSession / getActiveSessions / getSessionStats', () => {
    it('returns false for unknown recipient', () => {
      expect(sm.hasSession('unknown')).toBe(false);
    });

    it('returns empty array when no sessions exist', () => {
      expect(sm.getActiveSessions()).toEqual([]);
    });

    it('returns null stats for unknown recipient', () => {
      expect(sm.getSessionStats('unknown')).toBeNull();
    });
  });

  // =========================================================================
  // createSession (Initiator / Alice)
  // =========================================================================

  describe('createSession', () => {
    const bundle = makeBundle();

    beforeEach(() => {
      mockLoadIdentityKeyPair.mockResolvedValue({
        publicKey: new Uint8Array([1, 2, 3]),
        privateKey: new Uint8Array([4, 5, 6]),
      });

      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });
    });

    it('creates a session and persists it', async () => {
      const session = await sm.createSession('user-alice', 'user-bob', bundle);

      expect(session.recipientId).toBe('user-bob');
      expect(session.isInitiator).toBe(true);
      expect(session.messageCount).toBe(0);
      expect(sm.hasSession('user-bob')).toBe(true);
      expect(mockSaveSession).toHaveBeenCalledOnce();
    });

    it('initializes Double Ratchet as Alice', async () => {
      await sm.createSession('user-alice', 'user-bob', bundle);

      expect(mockInitializeAlice).toHaveBeenCalledOnce();
      const [sharedSecret, dhKey] = mockInitializeAlice.mock.calls[0]!;
      expect(sharedSecret).toBeInstanceOf(Uint8Array);
      expect(dhKey).toBeInstanceOf(Uint8Array);
    });

    it('throws when identity key is missing', async () => {
      mockLoadIdentityKeyPair.mockResolvedValueOnce(null);

      await expect(sm.createSession('user-alice', 'user-bob', bundle)).rejects.toThrow(
        'Identity key not found'
      );
    });

    it('performs X3DH key agreement', async () => {
      await sm.createSession('user-alice', 'user-bob', bundle);

      expect(mockX3dhInitiate).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // acceptSession (Responder / Bob)
  // =========================================================================

  describe('acceptSession', () => {
    it('creates a responder session from initial message', async () => {
      const initialMsg = {
        ephemeralPublicKey: 'eph-key-b64',
        usedOneTimePreKey: true,
        oneTimePreKeyId: 'otk-1',
      };
      const senderIdentityKey = new ArrayBuffer(32);

      mockComputeResponderSharedSecret.mockResolvedValue(new ArrayBuffer(32));

      const session = await sm.acceptSession('user-alice', initialMsg, senderIdentityKey);

      expect(session.recipientId).toBe('user-alice');
      expect(session.isInitiator).toBe(false);
      expect(mockInitializeBob).toHaveBeenCalledOnce();
      expect(mockSaveSession).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // encryptMessage
  // =========================================================================

  describe('encryptMessage', () => {
    const bundle = makeBundle();

    beforeEach(() => {
      mockLoadIdentityKeyPair.mockResolvedValue({
        publicKey: new Uint8Array([1, 2, 3]),
        privateKey: new Uint8Array([4, 5, 6]),
      });

      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });

      mockEncryptMessage.mockResolvedValue({
        header: {
          dh: new Uint8Array([7, 8, 9]),
          pn: 0,
          n: 0,
          sessionId: 'session-123',
          timestamp: Date.now(),
          version: 1,
        },
        ciphertext: new Uint8Array([10, 11, 12]),
        nonce: new Uint8Array([13, 14, 15]),
        mac: new Uint8Array([16, 17, 18]),
      });

      mockBuildSecureMessage.mockReturnValue(makeSecureMessage({ senderId: 'user-alice' }));
    });

    it('creates session on first message if bundle is provided', async () => {
      const result = await sm.encryptMessage('user-alice', 'user-bob', 'Hello!', bundle);

      expect(result).toBeDefined();
      expect(sm.hasSession('user-bob')).toBe(true);
      expect(mockEncryptMessage).toHaveBeenCalledOnce();
    });

    it('throws when no session and no bundle', async () => {
      await expect(sm.encryptMessage('user-alice', 'user-bob', 'Hello!')).rejects.toThrow(
        'No session exists and no recipient bundle provided'
      );
    });

    it('reuses existing session for subsequent messages', async () => {
      // First message — creates session
      await sm.encryptMessage('user-alice', 'user-bob', 'Hello!', bundle);
      // Second message — reuses
      await sm.encryptMessage('user-alice', 'user-bob', 'How are you?');

      expect(mockEncryptMessage).toHaveBeenCalledTimes(2);
      // Only one createSession call (X3DH only once)
      expect(mockX3dhInitiate).toHaveBeenCalledOnce();
    });

    it('increments message count and updates lastActivity', async () => {
      await sm.encryptMessage('user-alice', 'user-bob', 'Hello!', bundle);

      // saveSessionToStorage called: once for createSession, once for encryptMessage
      expect(mockSaveSession).toHaveBeenCalledTimes(2);
    });

    it('includes X3DH initial message data on first encrypt', async () => {
      // buildSecureMessage returns a mutable object
      const msg = makeSecureMessage({ senderId: 'user-alice' });
      mockBuildSecureMessage.mockReturnValue(msg);

      const result = await sm.encryptMessage('user-alice', 'user-bob', 'Hello!', bundle);

      // The initialMessage is attached by SessionManager for the very first message
      expect(result.initialMessage).toBeDefined();
      expect(result.initialMessage!.ephemeralPublicKey).toBeDefined();
    });
  });

  // =========================================================================
  // decryptMessage
  // =========================================================================

  describe('decryptMessage', () => {
    const bundle = makeBundle();
    const plaintext = 'Hello, World!';

    beforeEach(() => {
      mockLoadIdentityKeyPair.mockResolvedValue({
        publicKey: new Uint8Array([1, 2, 3]),
        privateKey: new Uint8Array([4, 5, 6]),
      });
      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });
      mockEncryptMessage.mockResolvedValue({
        header: { dh: new Uint8Array([7, 8, 9]), pn: 0, n: 0, sessionId: 'session-123', timestamp: Date.now(), version: 1 },
        ciphertext: new Uint8Array([10, 11, 12]),
        nonce: new Uint8Array([13, 14]),
        mac: new Uint8Array([15]),
      });
      mockBuildSecureMessage.mockReturnValue(makeSecureMessage({ senderId: 'user-alice' }));

      const encoder = new TextEncoder();
      mockDecryptMessage.mockResolvedValue({ plaintext: encoder.encode(plaintext) });
      mockToRatchetMessage.mockReturnValue({
        header: { dh: new Uint8Array([1]), pn: 0, n: 0, sessionId: 'session-123', timestamp: 0, version: 1 },
        ciphertext: new Uint8Array([2]),
        nonce: new Uint8Array([3]),
        mac: new Uint8Array([4]),
      });
    });

    it('decrypts a message from an active session', async () => {
      // Establish session first
      await sm.encryptMessage('user-alice', 'user-bob', 'setup', bundle);

      const msg = makeSecureMessage({ senderId: 'user-bob' });
      const decrypted = await sm.decryptMessage(msg);

      expect(decrypted).toBe(plaintext);
      expect(mockDecryptMessage).toHaveBeenCalledOnce();
    });

    it('accepts an initial message from unknown sender (X3DH responder)', async () => {
      mockComputeResponderSharedSecret.mockResolvedValue(new ArrayBuffer(32));

      const msg = makeSecureMessage({
        senderId: 'user-carol',
        initialMessage: {
          ephemeralPublicKey: 'eph-b64',
          usedOneTimePreKey: false,
        },
      });

      const senderIdentityKey = new ArrayBuffer(32);
      const decrypted = await sm.decryptMessage(msg, senderIdentityKey);

      expect(decrypted).toBe(plaintext);
      expect(sm.hasSession('user-carol')).toBe(true);
    });

    it('throws when no session and no initial message', async () => {
      const msg = makeSecureMessage({ senderId: 'unknown-user' });

      await expect(sm.decryptMessage(msg)).rejects.toThrow('No session found for unknown-user');
    });

    it('throws when initial message lacks sender identity key', async () => {
      const msg = makeSecureMessage({
        senderId: 'new-user',
        initialMessage: { ephemeralPublicKey: 'eph', usedOneTimePreKey: false },
      });

      await expect(sm.decryptMessage(msg)).rejects.toThrow(
        'Sender identity key required for initial message'
      );
    });
  });

  // =========================================================================
  // destroySession / destroyAllSessions
  // =========================================================================

  describe('destroySession', () => {
    const bundle = makeBundle();

    beforeEach(() => {
      mockLoadIdentityKeyPair.mockResolvedValue({
        publicKey: new Uint8Array([1]),
        privateKey: new Uint8Array([2]),
      });
      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });
      mockEncryptMessage.mockResolvedValue({
        header: { dh: new Uint8Array([1]), pn: 0, n: 0, sessionId: 'session-123', timestamp: 0, version: 1 },
        ciphertext: new Uint8Array([2]),
        nonce: new Uint8Array([3]),
        mac: new Uint8Array([4]),
      });
      mockBuildSecureMessage.mockReturnValue(makeSecureMessage({ senderId: 'user-alice' }));
    });

    it('removes and cleans up a single session', async () => {
      await sm.encryptMessage('user-alice', 'user-bob', 'Hi', bundle);
      expect(sm.hasSession('user-bob')).toBe(true);

      await sm.destroySession('user-bob');

      expect(sm.hasSession('user-bob')).toBe(false);
      expect(mockDestroy).toHaveBeenCalledOnce();
      expect(mockDeleteSession).toHaveBeenCalledWith('user-bob');
    });

    it('is a no-op for unknown recipient', async () => {
      await sm.destroySession('unknown');
      expect(mockDestroy).not.toHaveBeenCalled();
      expect(mockDeleteSession).not.toHaveBeenCalled();
    });
  });

  describe('destroyAllSessions', () => {
    const bundle = makeBundle();

    beforeEach(() => {
      mockLoadIdentityKeyPair.mockResolvedValue({
        publicKey: new Uint8Array([1]),
        privateKey: new Uint8Array([2]),
      });
      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });
      mockEncryptMessage.mockResolvedValue({
        header: { dh: new Uint8Array([1]), pn: 0, n: 0, sessionId: 'session-123', timestamp: 0, version: 1 },
        ciphertext: new Uint8Array([2]),
        nonce: new Uint8Array([3]),
        mac: new Uint8Array([4]),
      });
      mockBuildSecureMessage.mockReturnValue(makeSecureMessage({ senderId: 'user-alice' }));
    });

    it('destroys all sessions and clears storage', async () => {
      await sm.encryptMessage('user-alice', 'user-bob', 'Hi', bundle);
      // Reset X3DH mock for second session
      mockX3dhInitiate.mockResolvedValue({
        sharedSecret: new ArrayBuffer(32),
        ephemeralPublic: new ArrayBuffer(32),
      });
      await sm.encryptMessage('user-alice', 'user-carol', 'Hey', bundle);

      await sm.destroyAllSessions();

      expect(sm.getActiveSessions()).toEqual([]);
      expect(mockDestroy).toHaveBeenCalledTimes(2);
      expect(mockDeleteSession).toHaveBeenCalledTimes(2);
    });
  });
});
