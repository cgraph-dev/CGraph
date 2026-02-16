/**
 * Tests for ProtocolStore interfaces and InMemoryProtocolStore
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryProtocolStore,
  addressToString,
  addressFromString,
  type ProtocolAddress,
} from '../stores';

describe('ProtocolAddress', () => {
  it('serializes to string', () => {
    expect(addressToString({ name: 'alice', deviceId: 1 })).toBe('alice.1');
    expect(addressToString({ name: 'bob', deviceId: 42 })).toBe('bob.42');
  });

  it('deserializes from string', () => {
    const addr = addressFromString('alice.1');
    expect(addr.name).toBe('alice');
    expect(addr.deviceId).toBe(1);
  });

  it('handles names with dots', () => {
    const addr = addressFromString('user.name.2');
    expect(addr.name).toBe('user.name');
    expect(addr.deviceId).toBe(2);
  });

  it('throws on invalid format', () => {
    expect(() => addressFromString('noDot')).toThrow('Invalid address');
  });
});

describe('InMemoryProtocolStore', () => {
  let store: InMemoryProtocolStore;
  const identityKP = {
    publicKey: crypto.getRandomValues(new Uint8Array(32)),
    privateKey: crypto.getRandomValues(new Uint8Array(32)),
  };
  const addr: ProtocolAddress = { name: 'alice', deviceId: 1 };

  beforeEach(() => {
    store = new InMemoryProtocolStore(identityKP, 12345);
  });

  // --- Identity ---
  it('returns our identity key pair', async () => {
    const kp = await store.getIdentityKeyPair();
    expect(kp.publicKey).toBe(identityKP.publicKey);
  });

  it('returns registration id', async () => {
    expect(await store.getLocalRegistrationId()).toBe(12345);
  });

  it('saves and retrieves identity', async () => {
    const key = crypto.getRandomValues(new Uint8Array(33));
    const changed = await store.saveIdentity(addr, key);
    expect(changed).toBe(false); // First time → not changed

    const got = await store.getIdentity(addr);
    expect(got).toEqual(key);
  });

  it('detects identity change', async () => {
    const key1 = crypto.getRandomValues(new Uint8Array(33));
    const key2 = crypto.getRandomValues(new Uint8Array(33));
    await store.saveIdentity(addr, key1);
    const changed = await store.saveIdentity(addr, key2);
    expect(changed).toBe(true); // Different key
  });

  it('trusts on first use', async () => {
    const key = crypto.getRandomValues(new Uint8Array(33));
    expect(await store.isTrustedIdentity(addr, key)).toBe(true);
  });

  it('rejects changed identity', async () => {
    const key1 = crypto.getRandomValues(new Uint8Array(33));
    const key2 = crypto.getRandomValues(new Uint8Array(33));
    await store.saveIdentity(addr, key1);
    expect(await store.isTrustedIdentity(addr, key2)).toBe(false);
  });

  // --- Sessions ---
  it('stores and loads sessions', async () => {
    const record = {
      address: addr,
      data: new Uint8Array([1, 2, 3]),
      version: 1,
      updatedAt: Date.now(),
    };
    await store.storeSession(addr, record);
    const loaded = await store.loadSession(addr);
    expect(loaded).toEqual(record);
  });

  it('returns null for missing session', async () => {
    expect(await store.loadSession(addr)).toBeNull();
  });

  it('removes sessions', async () => {
    const record = { address: addr, data: new Uint8Array([1]), version: 1, updatedAt: Date.now() };
    await store.storeSession(addr, record);
    await store.removeSession(addr);
    expect(await store.loadSession(addr)).toBeNull();
  });

  it('removes all sessions for a user', async () => {
    const addr1: ProtocolAddress = { name: 'bob', deviceId: 1 };
    const addr2: ProtocolAddress = { name: 'bob', deviceId: 2 };
    const record = { address: addr1, data: new Uint8Array([1]), version: 1, updatedAt: Date.now() };
    await store.storeSession(addr1, { ...record, address: addr1 });
    await store.storeSession(addr2, { ...record, address: addr2 });
    await store.removeAllSessions('bob');
    expect(await store.loadSession(addr1)).toBeNull();
    expect(await store.loadSession(addr2)).toBeNull();
  });

  // --- PreKeys ---
  it('stores and loads pre-keys', async () => {
    const pk = { id: 1, publicKey: new Uint8Array(33), privateKey: new Uint8Array(32) };
    await store.storePreKey(1, pk);
    expect(await store.loadPreKey(1)).toEqual(pk);
    expect(await store.getAllPreKeyIds()).toEqual([1]);
  });

  it('removes pre-keys', async () => {
    const pk = { id: 1, publicKey: new Uint8Array(33), privateKey: new Uint8Array(32) };
    await store.storePreKey(1, pk);
    await store.removePreKey(1);
    expect(await store.loadPreKey(1)).toBeNull();
  });

  // --- Signed PreKeys ---
  it('stores and loads signed pre-keys', async () => {
    const spk = {
      id: 1,
      publicKey: new Uint8Array(33),
      privateKey: new Uint8Array(32),
      signature: new Uint8Array(64),
      createdAt: Date.now(),
    };
    await store.storeSignedPreKey(1, spk);
    expect(await store.loadSignedPreKey(1)).toEqual(spk);
  });

  // --- Kyber PreKeys ---
  it('stores and loads kyber pre-keys', async () => {
    const kpk = {
      id: 1,
      publicKey: new Uint8Array(1184),
      secretKey: new Uint8Array(2400),
      signature: new Uint8Array(64),
      createdAt: Date.now(),
      isLastResort: false,
    };
    await store.storeKyberPreKey(1, kpk);
    expect(await store.loadKyberPreKey(1)).toEqual(kpk);
  });

  it('marks non-last-resort kyber key as used (deletes it)', async () => {
    const kpk = {
      id: 1,
      publicKey: new Uint8Array(1184),
      secretKey: new Uint8Array(2400),
      signature: new Uint8Array(64),
      createdAt: Date.now(),
      isLastResort: false,
    };
    await store.storeKyberPreKey(1, kpk);
    await store.markKyberPreKeyUsed(1);
    expect(await store.loadKyberPreKey(1)).toBeNull();
  });

  it('keeps last-resort kyber key after marking used', async () => {
    const kpk = {
      id: 1,
      publicKey: new Uint8Array(1184),
      secretKey: new Uint8Array(2400),
      signature: new Uint8Array(64),
      createdAt: Date.now(),
      isLastResort: true,
    };
    await store.storeKyberPreKey(1, kpk);
    await store.markKyberPreKeyUsed(1);
    expect(await store.loadKyberPreKey(1)).toEqual(kpk);
  });

  it('finds last-resort kyber key', async () => {
    const normal = {
      id: 1,
      publicKey: new Uint8Array(1184),
      secretKey: new Uint8Array(2400),
      signature: new Uint8Array(64),
      createdAt: Date.now(),
      isLastResort: false,
    };
    const lastResort = { ...normal, id: 2, isLastResort: true };
    await store.storeKyberPreKey(1, normal);
    await store.storeKyberPreKey(2, lastResort);
    const found = await store.getLastResortKyberPreKey();
    expect(found?.id).toBe(2);
    expect(found?.isLastResort).toBe(true);
  });

  // --- Clear ---
  it('clears all data', async () => {
    const pk = { id: 1, publicKey: new Uint8Array(33), privateKey: new Uint8Array(32) };
    await store.storePreKey(1, pk);
    store.clear();
    expect(await store.loadPreKey(1)).toBeNull();
  });
});
