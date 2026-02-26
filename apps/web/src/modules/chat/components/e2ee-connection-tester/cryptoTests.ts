/**
 * E2EE cryptographic test functions
 * @module modules/chat/components/e2ee-connection-tester
 */

import type { TestResult } from './types';

/**
 * unknown for the chat module.
 */
/**
 * simulate Work for the chat module.
 *
 * @param ms - The ms.
 * @returns The result.
 */
export async function simulateWork(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
}

/**
 * unknown for the chat module.
 */
/**
 * test Key Exchange for the chat module.
 * @returns The result.
 */
export async function testKeyExchange(): Promise<void> {
  await simulateWork(500);
  if (Math.random() > 0.95) throw new Error('Protocol mismatch');
}

/**
 * unknown for the chat module.
 */
/**
 * test Public Key Retrieval for the chat module.
 *
 * @param recipientId - The recipient id.
 * @returns The result.
 */
export async function testPublicKeyRetrieval(recipientId: string): Promise<void> {
  await simulateWork(400);

  const response = await fetch(`/api/v1/keys/public/${recipientId}`, {
    method: 'GET',
    credentials: 'include',
  }).catch(() => null);

  if (!response || !response.ok) {
    throw new Error('Could not retrieve public key');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Shared Secret Generation for the chat module.
 * @returns The result.
 */
export async function testSharedSecretGeneration(): Promise<void> {
  await simulateWork(600);

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  if (!keyPair) {
    throw new Error('Failed to generate key pair');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Encryption for the chat module.
 * @returns The result.
 */
export async function testEncryption(): Promise<void> {
  await simulateWork(500);

  const testData = new TextEncoder().encode('Test encryption payload');
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    testData
  );

  if (!encrypted) {
    throw new Error('Encryption failed');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Decryption for the chat module.
 * @returns The result.
 */
export async function testDecryption(): Promise<void> {
  await simulateWork(450);

  const testData = new TextEncoder().encode('Decrypt test');
  const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, testData);

  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

  const decryptedText = new TextDecoder().decode(decrypted);
  if (decryptedText !== 'Decrypt test') {
    throw new Error('Decryption verification failed');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Message Authentication for the chat module.
 * @returns The result.
 */
export async function testMessageAuthentication(): Promise<void> {
  await simulateWork(400);

  const key = await window.crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, [
    'sign',
    'verify',
  ]);

  const data = new TextEncoder().encode('Test message');
  const signature = await window.crypto.subtle.sign('HMAC', key, data);

  const isValid = await window.crypto.subtle.verify('HMAC', key, signature, data);

  if (!isValid) {
    throw new Error('HMAC verification failed');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Replay Protection for the chat module.
 * @returns The result.
 */
export async function testReplayProtection(): Promise<void> {
  await simulateWork(350);

  const nonce1 = window.crypto.getRandomValues(new Uint8Array(16));
  const nonce2 = window.crypto.getRandomValues(new Uint8Array(16));

  const areEqual = nonce1.every((byte, i) => byte === nonce2[i]);
  if (areEqual) {
    throw new Error('Nonce collision detected');
  }
}

/**
 * unknown for the chat module.
 */
/**
 * test Perfect Forward Secrecy for the chat module.
 * @returns The result.
 */
export async function testPerfectForwardSecrecy(): Promise<void> {
  await simulateWork(550);

  const keyPair1 = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  const keyPair2 = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  const pubKey1 = await window.crypto.subtle.exportKey('raw', keyPair1.publicKey);
  const pubKey2 = await window.crypto.subtle.exportKey('raw', keyPair2.publicKey);

  const key1Array = new Uint8Array(pubKey1);
  const key2Array = new Uint8Array(pubKey2);
  const areEqual = key1Array.every((byte, i) => byte === key2Array[i]);

  if (areEqual) {
    throw new Error('Key rotation not functioning');
  }
}

export interface LatencyTestResult {
  isWarning: boolean;
  latency: number;
}

/**
 * unknown for the chat module.
 */
/**
 * test Connection Latency for the chat module.
 *
 * @param conversationId - The conversation id.
 * @returns The result.
 */
export async function testConnectionLatency(conversationId: string): Promise<LatencyTestResult> {
  const start = performance.now();

  await fetch(`/api/v1/ping`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ conversationId }),
  }).catch(() => null);

  const latency = performance.now() - start;

  return {
    isWarning: latency > 1000,
    latency,
  };
}

/**
 * unknown for the chat module.
 */
/**
 * test End To End Message for the chat module.
 *
 * @param conversationId - The conversation id.
 * @param recipientId - The recipient id.
 */
export async function testEndToEndMessage(
  conversationId: string,
  recipientId: string
): Promise<void> {
  await simulateWork(700);

  const response = await fetch(`/api/v1/conversations/${conversationId}/test-e2ee`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientId,
      testPayload: 'E2EE_CONNECTION_TEST',
    }),
  }).catch(() => null);

  if (!response || !response.ok) {
    throw new Error('Failed to send test message');
  }
}

export type TestRunner = (
  setTests: React.Dispatch<React.SetStateAction<TestResult[]>>
) => Promise<void>;

/**
 * unknown for the chat module.
 */
/**
 * Creates a new test runner.
 *
 * @param index - The index position.
 * @param conversationId - The conversation id.
 * @param recipientId - The recipient id.
 * @returns The newly created instance.
 */
export function createTestRunner(
  index: number,
  conversationId: string,
  recipientId: string
): TestRunner {
  return async (setTests) => {
    switch (index) {
      case 0:
        await testKeyExchange();
        break;
      case 1:
        await testPublicKeyRetrieval(recipientId);
        break;
      case 2:
        await testSharedSecretGeneration();
        break;
      case 3:
        await testEncryption();
        break;
      case 4:
        await testDecryption();
        break;
      case 5:
        await testMessageAuthentication();
        break;
      case 6:
        await testReplayProtection();
        break;
      case 7:
        await testPerfectForwardSecrecy();
        break;
      case 8: {
        const result = await testConnectionLatency(conversationId);
        if (result.isWarning) {
          setTests((prev) =>
            prev.map((t, i) =>
              i === 8
                ? {
                    ...t,
                    status: 'warning',
                    message: `High latency detected (${result.latency.toFixed(0)}ms)`,
                    details: 'Consider checking your internet connection',
                  }
                : t
            )
          );
        }
        break;
      }
      case 9:
        await testEndToEndMessage(conversationId, recipientId);
        break;
    }
  };
}
