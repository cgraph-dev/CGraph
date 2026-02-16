/**
 * Protocol Store Interfaces
 *
 * Injectable storage abstraction following Signal's ProtocolStore trait pattern.
 * All crypto engines accept a store at construction; concrete implementations
 * (IndexedDB for web, AsyncStorage for mobile, SQLite for desktop) implement
 * these interfaces.
 *
 * @module @cgraph/crypto/stores
 */

// Store interfaces — no external dependencies

// =============================================================================
// ADDRESS
// =============================================================================

/**
 * Identifies a specific device of a user.
 * Equivalent to Signal's ProtocolAddress (name + deviceId).
 */
export interface ProtocolAddress {
  /** User identifier (e.g. UUID or username) */
  readonly name: string;
  /** Device identifier (integer ≥ 1) */
  readonly deviceId: number;
}

export function addressToString(addr: ProtocolAddress): string {
  return `${addr.name}.${addr.deviceId}`;
}

export function addressFromString(s: string): ProtocolAddress {
  const dot = s.lastIndexOf('.');
  if (dot === -1) throw new Error(`Invalid address: ${s}`);
  return { name: s.slice(0, dot), deviceId: parseInt(s.slice(dot + 1), 10) };
}

// =============================================================================
// KEY RECORDS
// =============================================================================

/** Serialized session record (opaque bytes) */
export interface SessionRecord {
  readonly address: ProtocolAddress;
  readonly data: Uint8Array;
  readonly version: number;
  readonly updatedAt: number;
}

/** Identity key (long-term, per user) */
export interface IdentityKeyRecord {
  readonly address: ProtocolAddress;
  readonly publicKey: Uint8Array;
  readonly trusted: boolean;
  readonly addedAt: number;
}

/** Signed pre-key record */
export interface SignedPreKeyRecord {
  readonly id: number;
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array;
  readonly signature: Uint8Array;
  readonly createdAt: number;
}

/** One-time pre-key record */
export interface PreKeyRecord {
  readonly id: number;
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array;
}

/** KEM (ML-KEM-768) pre-key record for PQXDH */
export interface KyberPreKeyRecord {
  readonly id: number;
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
  readonly signature: Uint8Array;
  readonly createdAt: number;
  /** Whether this is a last-resort key (never deleted) */
  readonly isLastResort: boolean;
}

// =============================================================================
// STORE INTERFACES
// =============================================================================

/**
 * Session store — manages encrypted session state per (user, device).
 */
export interface SessionStore {
  loadSession(address: ProtocolAddress): Promise<SessionRecord | null>;
  storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void>;
  removeSession(address: ProtocolAddress): Promise<void>;
  removeAllSessions(name: string): Promise<void>;
  getSubDeviceSessions(name: string): Promise<number[]>;
}

/**
 * Identity key store — manages our own identity and trusted remote identities.
 */
export interface IdentityKeyStore {
  getIdentityKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
  getLocalRegistrationId(): Promise<number>;
  saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;
  isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;
  getIdentity(address: ProtocolAddress): Promise<Uint8Array | null>;
}

/**
 * Pre-key store — manages one-time pre-keys.
 */
export interface PreKeyStore {
  loadPreKey(id: number): Promise<PreKeyRecord | null>;
  storePreKey(id: number, record: PreKeyRecord): Promise<void>;
  removePreKey(id: number): Promise<void>;
  getAllPreKeyIds(): Promise<number[]>;
}

/**
 * Signed pre-key store — manages signed pre-keys.
 */
export interface SignedPreKeyStore {
  loadSignedPreKey(id: number): Promise<SignedPreKeyRecord | null>;
  storeSignedPreKey(id: number, record: SignedPreKeyRecord): Promise<void>;
  removeSignedPreKey(id: number): Promise<void>;
}

/**
 * KEM pre-key store — manages ML-KEM-768 pre-keys for PQXDH.
 */
export interface KyberPreKeyStore {
  loadKyberPreKey(id: number): Promise<KyberPreKeyRecord | null>;
  storeKyberPreKey(id: number, record: KyberPreKeyRecord): Promise<void>;
  removeKyberPreKey(id: number): Promise<void>;
  markKyberPreKeyUsed(id: number): Promise<void>;
  getLastResortKyberPreKey(): Promise<KyberPreKeyRecord | null>;
}

/**
 * Composite protocol store — combines all stores.
 * Equivalent to Signal's ProtocolStore trait.
 */
export interface ProtocolStore
  extends SessionStore, IdentityKeyStore, PreKeyStore, SignedPreKeyStore, KyberPreKeyStore {}

// =============================================================================
// IN-MEMORY STORE — for testing and short-lived sessions
// =============================================================================

/**
 * Full in-memory implementation of ProtocolStore.
 * Suitable for tests, demos, and ephemeral sessions.
 * NOT suitable for production (no persistence).
 */
export class InMemoryProtocolStore implements ProtocolStore {
  private sessions = new Map<string, SessionRecord>();
  private identities = new Map<string, Uint8Array>();
  private preKeys = new Map<number, PreKeyRecord>();
  private signedPreKeys = new Map<number, SignedPreKeyRecord>();
  private kyberPreKeys = new Map<number, KyberPreKeyRecord>();

  private identityKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
  private registrationId: number;

  constructor(
    identityKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array },
    registrationId: number
  ) {
    this.identityKeyPair = identityKeyPair;
    this.registrationId = registrationId;
  }

  // --- IdentityKeyStore ---
  async getIdentityKeyPair() {
    return this.identityKeyPair;
  }
  async getLocalRegistrationId() {
    return this.registrationId;
  }
  async saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const key = addressToString(address);
    const existing = this.identities.get(key);
    this.identities.set(key, identityKey);
    if (existing && !this.bytesEqual(existing, identityKey)) {
      return true; // identity changed
    }
    return false;
  }
  async isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const key = addressToString(address);
    const existing = this.identities.get(key);
    if (!existing) return true; // Trust on first use (TOFU)
    return this.bytesEqual(existing, identityKey);
  }
  async getIdentity(address: ProtocolAddress): Promise<Uint8Array | null> {
    return this.identities.get(addressToString(address)) ?? null;
  }

  // --- SessionStore ---
  async loadSession(address: ProtocolAddress): Promise<SessionRecord | null> {
    return this.sessions.get(addressToString(address)) ?? null;
  }
  async storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
    this.sessions.set(addressToString(address), record);
  }
  async removeSession(address: ProtocolAddress): Promise<void> {
    this.sessions.delete(addressToString(address));
  }
  async removeAllSessions(name: string): Promise<void> {
    for (const key of this.sessions.keys()) {
      if (key.startsWith(`${name}.`)) {
        this.sessions.delete(key);
      }
    }
  }
  async getSubDeviceSessions(name: string): Promise<number[]> {
    const devices: number[] = [];
    for (const key of this.sessions.keys()) {
      if (key.startsWith(`${name}.`)) {
        const addr = addressFromString(key);
        if (addr.deviceId !== 1) devices.push(addr.deviceId);
      }
    }
    return devices;
  }

  // --- PreKeyStore ---
  async loadPreKey(id: number): Promise<PreKeyRecord | null> {
    return this.preKeys.get(id) ?? null;
  }
  async storePreKey(id: number, record: PreKeyRecord): Promise<void> {
    this.preKeys.set(id, record);
  }
  async removePreKey(id: number): Promise<void> {
    this.preKeys.delete(id);
  }
  async getAllPreKeyIds(): Promise<number[]> {
    return Array.from(this.preKeys.keys());
  }

  // --- SignedPreKeyStore ---
  async loadSignedPreKey(id: number): Promise<SignedPreKeyRecord | null> {
    return this.signedPreKeys.get(id) ?? null;
  }
  async storeSignedPreKey(id: number, record: SignedPreKeyRecord): Promise<void> {
    this.signedPreKeys.set(id, record);
  }
  async removeSignedPreKey(id: number): Promise<void> {
    this.signedPreKeys.delete(id);
  }

  // --- KyberPreKeyStore ---
  async loadKyberPreKey(id: number): Promise<KyberPreKeyRecord | null> {
    return this.kyberPreKeys.get(id) ?? null;
  }
  async storeKyberPreKey(id: number, record: KyberPreKeyRecord): Promise<void> {
    this.kyberPreKeys.set(id, record);
  }
  async removeKyberPreKey(id: number): Promise<void> {
    this.kyberPreKeys.delete(id);
  }
  async markKyberPreKeyUsed(id: number): Promise<void> {
    const record = this.kyberPreKeys.get(id);
    if (record && !record.isLastResort) {
      this.kyberPreKeys.delete(id);
    }
  }
  async getLastResortKyberPreKey(): Promise<KyberPreKeyRecord | null> {
    for (const record of this.kyberPreKeys.values()) {
      if (record.isLastResort) return record;
    }
    return null;
  }

  // --- Helpers ---
  private bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
    return d === 0;
  }

  /** Wipe all stored data */
  clear(): void {
    this.sessions.clear();
    this.identities.clear();
    this.preKeys.clear();
    this.signedPreKeys.clear();
    this.kyberPreKeys.clear();
  }
}
