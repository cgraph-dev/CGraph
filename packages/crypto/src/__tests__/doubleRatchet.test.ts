/**
 * Tests for the Double Ratchet Engine
 */
import { describe, it, expect } from 'vitest';
import { DoubleRatchetEngine, generateDHKeyPair, type KeyPair } from '../doubleRatchet';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Set up an Alice+Bob Double Ratchet session using a random shared secret.
 */
async function setupSession(): Promise<{
  alice: DoubleRatchetEngine;
  bob: DoubleRatchetEngine;
  bobKeyPair: KeyPair;
}> {
  const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
  const bobKeyPair = await generateDHKeyPair();

  const alice = new DoubleRatchetEngine({ enableAuditLog: false });
  const bob = new DoubleRatchetEngine({ enableAuditLog: false });

  await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
  await bob.initializeBob(sharedSecret, bobKeyPair);

  return { alice, bob, bobKeyPair };
}

// =============================================================================
// TESTS
// =============================================================================

describe('DH key generation', () => {
  it('generates P-256 key pairs', async () => {
    const kp = await generateDHKeyPair();
    expect(kp.publicKey).toBeTruthy();
    expect(kp.privateKey).toBeTruthy();
    expect(kp.rawPublicKey).toBeInstanceOf(Uint8Array);
    expect(kp.rawPublicKey.length).toBe(65); // P-256 uncompressed point
  });
});

describe('Double Ratchet initialization', () => {
  it('initializes Alice and Bob', async () => {
    const { alice, bob } = await setupSession();
    const aStats = alice.getStats();
    const bStats = bob.getStats();

    expect(aStats.sessionId).toBeTruthy();
    expect(bStats.sessionId).toBeTruthy();
    expect(aStats.dhRatchetCount).toBe(1); // Alice does initial DH ratchet
    expect(bStats.dhRatchetCount).toBe(0); // Bob hasn't ratcheted yet
  });
});

describe('Double Ratchet encrypt / decrypt', () => {
  it('Alice sends to Bob', async () => {
    const { alice, bob } = await setupSession();
    const plaintext = new TextEncoder().encode('Hello, Bob!');

    const encrypted = await alice.encryptMessage(plaintext);
    expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce.length).toBe(12);
    expect(encrypted.mac.length).toBe(32);

    const decrypted = await bob.decryptMessage(encrypted);
    expect(decrypted.plaintext).toEqual(plaintext);
  });

  it('bidirectional messaging', async () => {
    const { alice, bob } = await setupSession();
    const enc = new TextEncoder();

    // Alice → Bob
    const msg1 = await alice.encryptMessage(enc.encode('Alice says hi'));
    const dec1 = await bob.decryptMessage(msg1);
    expect(new TextDecoder().decode(dec1.plaintext)).toBe('Alice says hi');

    // Bob → Alice
    const msg2 = await bob.encryptMessage(enc.encode('Bob replies'));
    const dec2 = await alice.decryptMessage(msg2);
    expect(new TextDecoder().decode(dec2.plaintext)).toBe('Bob replies');

    // Alice → Bob again
    const msg3 = await alice.encryptMessage(enc.encode('Alice again'));
    const dec3 = await bob.decryptMessage(msg3);
    expect(new TextDecoder().decode(dec3.plaintext)).toBe('Alice again');
  });

  it('multiple messages in same chain', async () => {
    const { alice, bob } = await setupSession();
    const enc = new TextEncoder();

    const msgs = [];
    for (let i = 0; i < 5; i++) {
      msgs.push(await alice.encryptMessage(enc.encode(`Message ${i}`)));
    }

    for (let i = 0; i < 5; i++) {
      const dec = await bob.decryptMessage(msgs[i]!);
      expect(new TextDecoder().decode(dec.plaintext)).toBe(`Message ${i}`);
    }
  });

  it('out-of-order messages (skipped keys)', async () => {
    const { alice, bob } = await setupSession();
    const enc = new TextEncoder();

    const msg0 = await alice.encryptMessage(enc.encode('First'));
    const msg1 = await alice.encryptMessage(enc.encode('Second'));
    const msg2 = await alice.encryptMessage(enc.encode('Third'));

    // Deliver out of order: msg2 first, then msg0, then msg1
    const dec2 = await bob.decryptMessage(msg2);
    expect(new TextDecoder().decode(dec2.plaintext)).toBe('Third');
    expect(dec2.isOutOfOrder).toBe(true);

    const dec0 = await bob.decryptMessage(msg0);
    expect(new TextDecoder().decode(dec0.plaintext)).toBe('First');
    expect(dec0.wasSkipped).toBe(true);

    const dec1 = await bob.decryptMessage(msg1);
    expect(new TextDecoder().decode(dec1.plaintext)).toBe('Second');
    expect(dec1.wasSkipped).toBe(true);
  });

  it('rejects tampered ciphertext', async () => {
    const { alice, bob } = await setupSession();
    const msg = await alice.encryptMessage(new TextEncoder().encode('test'));

    // Corrupt ciphertext
    msg.ciphertext[0] ^= 0xff;

    await expect(bob.decryptMessage(msg)).rejects.toThrow();
  });

  it('rejects tampered MAC', async () => {
    const { alice, bob } = await setupSession();
    const msg = await alice.encryptMessage(new TextEncoder().encode('test'));

    // Corrupt MAC
    msg.mac[0] ^= 0xff;

    await expect(bob.decryptMessage(msg)).rejects.toThrow('authentication failed');
  });
});

describe('Double Ratchet ratchetSendKey / ratchetReceiveKey', () => {
  it('exposes raw message key + header without encrypting', async () => {
    const { alice } = await setupSession();

    const { messageKey, header } = await alice.ratchetSendKey();
    expect(messageKey).toBeInstanceOf(Uint8Array);
    expect(messageKey.length).toBe(32);
    expect(header.dh).toBeInstanceOf(Uint8Array);
    expect(header.n).toBe(0); // First message
    expect(header.version).toBe(3);
  });

  it('sequential sends increment message number', async () => {
    const { alice } = await setupSession();

    const r0 = await alice.ratchetSendKey();
    const r1 = await alice.ratchetSendKey();
    const r2 = await alice.ratchetSendKey();

    expect(r0.header.n).toBe(0);
    expect(r1.header.n).toBe(1);
    expect(r2.header.n).toBe(2);

    // Different message keys
    expect(r0.messageKey).not.toEqual(r1.messageKey);
    expect(r1.messageKey).not.toEqual(r2.messageKey);
  });

  it('ratchetReceiveKey produces matching message key', async () => {
    const { alice, bob } = await setupSession();

    const send = await alice.ratchetSendKey();
    const recv = await bob.ratchetReceiveKey(send.header);

    expect(recv.messageKey).toEqual(send.messageKey);
    expect(recv.isOutOfOrder).toBe(false);
  });

  it('handles DH ratchet step on receive', async () => {
    const { alice, bob } = await setupSession();

    // Alice sends
    const s0 = await alice.ratchetSendKey();
    const r0 = await bob.ratchetReceiveKey(s0.header);
    expect(r0.messageKey).toEqual(s0.messageKey);

    // Bob sends (triggers DH ratchet from Alice's perspective)
    const s1 = await bob.ratchetSendKey();
    const r1 = await alice.ratchetReceiveKey(s1.header);
    expect(r1.messageKey).toEqual(s1.messageKey);

    // Alice sends again (new DH key)
    const s2 = await alice.ratchetSendKey();
    const r2 = await bob.ratchetReceiveKey(s2.header);
    expect(r2.messageKey).toEqual(s2.messageKey);
  });
});

describe('Double Ratchet state management', () => {
  it('exports and imports state', async () => {
    const { alice, bob } = await setupSession();
    const enc = new TextEncoder();

    // Send a few messages
    const msg1 = await alice.encryptMessage(enc.encode('before export'));
    await bob.decryptMessage(msg1);

    // Export Alice's state
    const stateJson = await alice.exportState();
    expect(typeof stateJson).toBe('string');

    // Create new engine and import
    const alice2 = new DoubleRatchetEngine({ enableAuditLog: false });
    await alice2.importState(stateJson);

    // Continue session
    const msg2 = await alice2.encryptMessage(enc.encode('after import'));
    const dec2 = await bob.decryptMessage(msg2);
    expect(new TextDecoder().decode(dec2.plaintext)).toBe('after import');
  });

  it('destroys session and wipes keys', async () => {
    const { alice } = await setupSession();
    const stats = alice.getStats();
    expect(stats.sessionId).toBeTruthy();

    alice.destroy();

    // Stats should show reset state
    const postStats = alice.getStats();
    expect(postStats.messageCount).toBe(0);
  });
});

describe('Double Ratchet stats', () => {
  it('tracks message count', async () => {
    const { alice, bob } = await setupSession();
    const enc = new TextEncoder();

    for (let i = 0; i < 3; i++) {
      const msg = await alice.encryptMessage(enc.encode(`m${i}`));
      await bob.decryptMessage(msg);
    }

    expect(alice.getStats().messageCount).toBe(3);
    expect(bob.getStats().messageCount).toBe(3);
  });

  it('getPublicKey returns our ratchet key', async () => {
    const { alice } = await setupSession();
    const pk = alice.getPublicKey();
    expect(pk).toBeInstanceOf(Uint8Array);
    expect(pk!.length).toBe(65);
  });
});
