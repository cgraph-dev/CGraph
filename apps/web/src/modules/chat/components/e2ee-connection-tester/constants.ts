/**
 * E2EEConnectionTester constants
 * @module modules/chat/components/e2ee-connection-tester
 */

import type { TestResult } from './types';

export const INITIAL_TESTS: TestResult[] = [
  {
    name: 'Key Exchange Protocol',
    status: 'pending',
    message: 'Verifying X25519 key exchange...',
  },
  {
    name: 'Public Key Retrieval',
    status: 'pending',
    message: "Fetching recipient's public key...",
  },
  {
    name: 'Shared Secret Generation',
    status: 'pending',
    message: 'Computing Diffie-Hellman shared secret...',
  },
  {
    name: 'Encryption Test',
    status: 'pending',
    message: 'Encrypting test payload with AES-256-GCM...',
  },
  {
    name: 'Decryption Verification',
    status: 'pending',
    message: 'Verifying decrypt capability...',
  },
  {
    name: 'Message Authentication',
    status: 'pending',
    message: 'Checking HMAC-SHA256 signatures...',
  },
  {
    name: 'Replay Attack Protection',
    status: 'pending',
    message: 'Testing nonce uniqueness and sequence...',
  },
  {
    name: 'Perfect Forward Secrecy',
    status: 'pending',
    message: 'Verifying ephemeral key rotation...',
  },
  {
    name: 'Connection Latency',
    status: 'pending',
    message: 'Measuring round-trip time...',
  },
  {
    name: 'End-to-End Test Message',
    status: 'pending',
    message: 'Sending encrypted test message...',
  },
];

export const SUCCESS_MESSAGES: Record<number, string> = {
  0: 'X25519 protocol verified ✓',
  1: 'Public key retrieved successfully',
  2: 'Shared secret computed securely',
  3: 'AES-256-GCM encryption working',
  4: 'Decryption verified successfully',
  5: 'HMAC-SHA256 signatures valid',
  6: 'Nonce uniqueness confirmed',
  7: 'Ephemeral keys rotating properly',
  8: 'Connection latency acceptable',
  9: 'Test message delivered securely',
};
