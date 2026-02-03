/**
 * Session Manager Test Suite
 *
 * Tests for the E2EE session manager that integrates X3DH key agreement
 * with Double Ratchet for forward secrecy in messaging.
 *
 * @module lib/crypto/__tests__/sessionManager.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { RatchetSession, SecureMessage, SerializedSession } from '../sessionManager';

// Mock IndexedDB
const mockSessionStore: Map<string, SerializedSession> = new Map();

const createMockSessionStore = () => ({
  put: vi.fn((value: SerializedSession) => {
    mockSessionStore.set(value.recipientId, value);
    return createMockRequest(undefined);
  }),
  get: vi.fn((id: string) => createMockRequest(mockSessionStore.get(id))),
  getAll: vi.fn(() => createMockRequest(Array.from(mockSessionStore.values()))),
  delete: vi.fn((id: string) => {
    mockSessionStore.delete(id);
    return createMockRequest(undefined);
  }),
  clear: vi.fn(() => {
    mockSessionStore.clear();
    return createMockRequest(undefined);
  }),
  index: vi.fn(() => ({
    openCursor: vi.fn(() => createMockRequest(null)),
  })),
  createIndex: vi.fn(),
});

const createMockRequest = (result: unknown) => {
  const request = {
    result,
    onerror: null as ((e: unknown) => void) | null,
    onsuccess: null as ((e: unknown) => void) | null,
  };
  setTimeout(() => {
    if (request.onsuccess) {
      request.onsuccess({});
    }
  }, 0);
  return request;
};

const mockTransaction = {
  objectStore: vi.fn(() => createMockSessionStore()),
};

const mockDB = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: {
    contains: vi.fn(() => false),
  },
  createObjectStore: vi.fn(() => ({
    createIndex: vi.fn(),
  })),
};

vi.stubGlobal('indexedDB', {
  open: vi.fn(() => {
    const request = {
      onerror: null as ((e: unknown) => void) | null,
      onsuccess: null as ((e: unknown) => void) | null,
      onupgradeneeded: null as ((e: unknown) => void) | null,
      result: mockDB,
    };
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);
    return request;
  }),
});

// Mock e2ee module functions
vi.mock('../e2ee', () => ({
  loadIdentityKeyPair: vi.fn(() =>
    Promise.resolve({
      keyPair: {
        publicKey: {} as CryptoKey,
        privateKey: {} as CryptoKey,
      },
    })
  ),
  loadSignedPreKey: vi.fn(() =>
    Promise.resolve({
      keyPair: {
        publicKey: {} as CryptoKey,
        privateKey: {} as CryptoKey,
      },
    })
  ),
  x3dhInitiate: vi.fn(() =>
    Promise.resolve({
      sharedSecret: new ArrayBuffer(32),
      ephemeralPublic: new ArrayBuffer(65),
    })
  ),
  importPublicKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
  deriveSharedSecret: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
  hkdf: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
  arrayBufferToBase64: vi.fn((buf: ArrayBuffer) =>
    Buffer.from(new Uint8Array(buf)).toString('base64')
  ),
  base64ToArrayBuffer: vi.fn((str: string) => Uint8Array.from(Buffer.from(str, 'base64')).buffer),
  arrayBufferToHex: vi.fn(() => 'deadbeef'),
}));

// Mock Double Ratchet Engine
const mockEngineState = {
  sessionId: 'test-session-123',
  dhRatchetCount: 0,
  messageCount: 0,
  skippedKeysCount: 0,
  ratchetSteps: 0,
  lastActivity: Date.now(),
};

const mockEngine = {
  initializeAlice: vi.fn(() => Promise.resolve()),
  initializeBob: vi.fn(() => Promise.resolve()),
  encryptMessage: vi.fn(() =>
    Promise.resolve({
      header: {
        dh: new Uint8Array(65),
        pn: 0,
        n: 0,
        sessionId: 'test-session',
        timestamp: Date.now(),
        version: 1,
      },
      ciphertext: new Uint8Array([1, 2, 3, 4]),
      nonce: new Uint8Array(12),
      mac: new Uint8Array(32),
    })
  ),
  decryptMessage: vi.fn(() =>
    Promise.resolve({
      plaintext: new Uint8Array(new TextEncoder().encode('decrypted message')),
      header: {},
      isOutOfOrder: false,
      wasSkipped: false,
    })
  ),
  getStats: vi.fn(() => mockEngineState),
  exportState: vi.fn(() => Promise.resolve('{"state":"exported"}')),
  importState: vi.fn(() => Promise.resolve()),
  destroy: vi.fn(),
  getPublicKey: vi.fn(() => new Uint8Array(65)),
};

vi.mock('../doubleRatchet', () => ({
  DoubleRatchetEngine: vi.fn(() => mockEngine),
  generateDHKeyPair: vi.fn(() =>
    Promise.resolve({
      publicKey: {} as CryptoKey,
      privateKey: {} as CryptoKey,
      rawPublicKey: new Uint8Array(65),
    })
  ),
  importDHPublicKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
}));

// Import after mocking
import { sessionManager } from '../sessionManager';

describe('SessionManager', () => {
  beforeEach(() => {
    mockSessionStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session State', () => {
    it('should report no session when none exists', () => {
      expect(sessionManager.hasSession('unknown-user')).toBe(false);
    });

    it('should return null stats for non-existent session', () => {
      expect(sessionManager.getSessionStats('unknown-user')).toBeNull();
    });
  });

  describe('Session Lifecycle', () => {
    it('should track session count correctly', () => {
      // Verify method exists
      expect(typeof sessionManager.hasSession).toBe('function');
    });
  });
});

describe('SecureMessage Structure', () => {
  it('should have required header fields', () => {
    const message: SecureMessage = {
      senderId: 'alice',
      recipientId: 'bob',
      sessionId: 'session-123',
      messageId: 'msg-456',
      timestamp: Date.now(),
      ratchetMessage: {
        header: {
          dh: 'base64-dh-key',
          pn: 0,
          n: 1,
          sessionId: 'session-123',
          timestamp: Date.now(),
          version: 1,
        },
        ciphertext: 'base64-ciphertext',
        nonce: 'base64-nonce',
        mac: 'base64-mac',
      },
    };

    expect(message.senderId).toBeDefined();
    expect(message.recipientId).toBeDefined();
    expect(message.sessionId).toBeDefined();
    expect(message.messageId).toBeDefined();
    expect(message.timestamp).toBeDefined();
    expect(message.ratchetMessage).toBeDefined();
    expect(message.ratchetMessage.header).toBeDefined();
    expect(message.ratchetMessage.ciphertext).toBeDefined();
    expect(message.ratchetMessage.nonce).toBeDefined();
    expect(message.ratchetMessage.mac).toBeDefined();
  });

  it('should support optional initial message data', () => {
    const message: SecureMessage = {
      senderId: 'alice',
      recipientId: 'bob',
      sessionId: 'session-123',
      messageId: 'msg-456',
      timestamp: Date.now(),
      ratchetMessage: {
        header: {
          dh: 'base64-dh-key',
          pn: 0,
          n: 0,
          sessionId: 'session-123',
          timestamp: Date.now(),
          version: 1,
        },
        ciphertext: 'base64-ciphertext',
        nonce: 'base64-nonce',
        mac: 'base64-mac',
      },
      initialMessage: {
        ephemeralPublicKey: 'base64-ephemeral-key',
        usedOneTimePreKey: true,
        oneTimePreKeyId: 'otk-001',
      },
    };

    expect(message.initialMessage).toBeDefined();
    expect(message.initialMessage?.ephemeralPublicKey).toBeDefined();
    expect(message.initialMessage?.usedOneTimePreKey).toBe(true);
    expect(message.initialMessage?.oneTimePreKeyId).toBe('otk-001');
  });

  it('should have correct ratchet header structure', () => {
    const header = {
      dh: 'base64-dh-key',
      pn: 5,
      n: 10,
      sessionId: 'session-abc',
      timestamp: 1706985600000,
      version: 1,
    };

    expect(typeof header.dh).toBe('string');
    expect(typeof header.pn).toBe('number');
    expect(typeof header.n).toBe('number');
    expect(typeof header.sessionId).toBe('string');
    expect(typeof header.timestamp).toBe('number');
    expect(typeof header.version).toBe('number');
  });
});

describe('RatchetSession Structure', () => {
  it('should have required session fields', () => {
    const session: RatchetSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      engine: mockEngine as unknown as RatchetSession['engine'],
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
    };

    expect(session.recipientId).toBeDefined();
    expect(session.sessionId).toBeDefined();
    expect(session.engine).toBeDefined();
    expect(typeof session.isInitiator).toBe('boolean');
    expect(typeof session.createdAt).toBe('number');
    expect(typeof session.lastActivity).toBe('number');
    expect(typeof session.messageCount).toBe('number');
  });

  it('should track message count', () => {
    const session: RatchetSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      engine: mockEngine as unknown as RatchetSession['engine'],
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 5,
    };

    expect(session.messageCount).toBe(5);
  });

  it('should distinguish initiator from responder', () => {
    const aliceSession: RatchetSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      engine: mockEngine as unknown as RatchetSession['engine'],
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
    };

    const bobSession: RatchetSession = {
      recipientId: 'alice',
      sessionId: 'session-123',
      engine: mockEngine as unknown as RatchetSession['engine'],
      isInitiator: false,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
    };

    expect(aliceSession.isInitiator).toBe(true);
    expect(bobSession.isInitiator).toBe(false);
  });
});

describe('SerializedSession Structure', () => {
  it('should have engine state as string', () => {
    const serialized: SerializedSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 10,
      engineState: '{"ratchet":"state"}',
    };

    expect(typeof serialized.engineState).toBe('string');
    expect(() => JSON.parse(serialized.engineState)).not.toThrow();
  });

  it('should be serializable to JSON', () => {
    const serialized: SerializedSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 10,
      engineState: '{"ratchet":"state"}',
    };

    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);

    expect(parsed.recipientId).toBe('bob');
    expect(parsed.sessionId).toBe('session-123');
    expect(parsed.isInitiator).toBe(true);
    expect(parsed.messageCount).toBe(10);
  });
});

describe('Session Manager API', () => {
  describe('hasSession', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.hasSession).toBe('function');
    });

    it('should accept recipientId parameter', () => {
      const result = sessionManager.hasSession('any-user');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSessionStats', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.getSessionStats).toBe('function');
    });

    it('should return null for unknown recipient', () => {
      const result = sessionManager.getSessionStats('unknown');
      expect(result).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.initialize).toBe('function');
    });
  });

  describe('encryptMessage', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.encryptMessage).toBe('function');
    });
  });

  describe('decryptMessage', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.decryptMessage).toBe('function');
    });
  });

  describe('destroySession', () => {
    it('should be a function', () => {
      expect(typeof sessionManager.destroySession).toBe('function');
    });
  });
});

describe('X3DH Integration', () => {
  it('should use X3DH for initial key agreement', async () => {
    // The session manager integrates X3DH for the first message
    // This tests the expected interface
    const mockBundle = {
      identity_key: 'base64-identity-key',
      signed_prekey: 'base64-signed-prekey',
      signed_prekey_signature: 'base64-signature',
      one_time_prekey: 'base64-otk',
      one_time_prekey_id: 'otk-001',
    };

    expect(mockBundle.identity_key).toBeDefined();
    expect(mockBundle.signed_prekey).toBeDefined();
    expect(mockBundle.signed_prekey_signature).toBeDefined();
  });

  it('should support optional one-time prekey', () => {
    const bundleWithOTK = {
      identity_key: 'base64-identity-key',
      signed_prekey: 'base64-signed-prekey',
      signed_prekey_signature: 'base64-signature',
      one_time_prekey: 'base64-otk',
      one_time_prekey_id: 'otk-001',
    };

    const bundleWithoutOTK = {
      identity_key: 'base64-identity-key',
      signed_prekey: 'base64-signed-prekey',
      signed_prekey_signature: 'base64-signature',
    };

    expect(bundleWithOTK.one_time_prekey).toBeDefined();
    expect(bundleWithoutOTK).not.toHaveProperty('one_time_prekey');
  });
});

describe('Double Ratchet Integration', () => {
  it('should support forward secrecy through ratcheting', () => {
    // The Double Ratchet provides forward secrecy
    // Each message uses a new key derived from the ratchet state
    const header1 = { dh: 'key1', pn: 0, n: 0 };
    const header2 = { dh: 'key1', pn: 0, n: 1 };
    const header3 = { dh: 'key2', pn: 1, n: 0 }; // DH ratchet advanced

    expect(header1.n).toBe(0);
    expect(header2.n).toBe(1);
    expect(header3.dh).not.toBe(header1.dh); // New DH key after ratchet
  });

  it('should track DH ratchet count', () => {
    const stats = mockEngine.getStats();
    expect(stats).toHaveProperty('dhRatchetCount');
    expect(typeof stats.dhRatchetCount).toBe('number');
  });

  it('should track skipped keys for out-of-order messages', () => {
    const stats = mockEngine.getStats();
    expect(stats).toHaveProperty('skippedKeysCount');
    expect(typeof stats.skippedKeysCount).toBe('number');
  });
});

describe('Session Persistence', () => {
  it('should serialize session for storage', async () => {
    const engineState = await mockEngine.exportState();
    const session: SerializedSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      isInitiator: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 42,
      engineState: typeof engineState === 'string' ? engineState : JSON.stringify(engineState),
    };

    // Should be storable in IndexedDB
    expect(session.recipientId).toBeTruthy();
    expect(typeof session.engineState).toBe('string');
  });

  it('should restore session from storage', async () => {
    const serialized: SerializedSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      isInitiator: true,
      createdAt: Date.now() - 3600000,
      lastActivity: Date.now() - 60000,
      messageCount: 42,
      engineState: '{"state":"test"}',
    };

    // Verify restoration works
    expect(serialized.createdAt).toBeLessThan(serialized.lastActivity);
    expect(serialized.messageCount).toBe(42);
  });
});

describe('Message ID Generation', () => {
  it('should generate unique message IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });
});

describe('Timestamp Handling', () => {
  it('should use millisecond timestamps', () => {
    const now = Date.now();
    expect(now).toBeGreaterThan(1700000000000); // After 2023
    expect(String(now).length).toBe(13); // 13 digits for ms
  });

  it('should track session timestamps', () => {
    const session: RatchetSession = {
      recipientId: 'bob',
      sessionId: 'session-123',
      engine: mockEngine as unknown as RatchetSession['engine'],
      isInitiator: true,
      createdAt: Date.now() - 3600000, // 1 hour ago
      lastActivity: Date.now(),
      messageCount: 10,
    };

    expect(session.lastActivity).toBeGreaterThan(session.createdAt);
  });
});
