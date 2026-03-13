/**
 * useE2EE Hook Tests
 *
 * Tests for the end-to-end encryption hook functionality.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useE2EE } from '../useE2EE';
import * as e2ee from '../../lib/crypto/e2ee';
import api from '../../lib/api';

// Mock the e2ee module
jest.mock('../../lib/crypto/e2ee');

// Mock the api - default export
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

const mockIdentityKeyPair = {
  publicKey: new Uint8Array([1, 2, 3, 4]),
  privateKey: new Uint8Array([5, 6, 7, 8]),
  keyId: 'key-123',
};

const mockKeyBundle = {
  deviceId: 'device-123',
  identityKey: mockIdentityKeyPair,
  signedPreKey: {
    publicKey: new Uint8Array([9, 10, 11, 12]),
    privateKey: new Uint8Array([13, 14, 15, 16]),
    keyId: 'prekey-123',
    signature: new Uint8Array([17, 18, 19, 20]),
  },
  oneTimePreKeys: [],
};

describe('useE2EE', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(false);
    (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(null);
    (e2ee.getDeviceId as jest.Mock).mockResolvedValue(null);
    (e2ee.fingerprint as jest.Mock).mockResolvedValue('abc123fingerprint');
    (e2ee.generateKeyBundle as jest.Mock).mockResolvedValue(mockKeyBundle);
    (e2ee.storeKeyBundle as jest.Mock).mockResolvedValue(undefined);
    (e2ee.formatKeysForRegistration as jest.Mock).mockReturnValue({
      identity_key: 'base64key',
    });
    (e2ee.clearE2EEData as jest.Mock).mockResolvedValue(undefined);
    (e2ee.randomBytes as jest.Mock).mockReturnValue(new Uint8Array(16));
    (e2ee.generatePreKeyPair as jest.Mock).mockResolvedValue({
      publicKey: new Uint8Array([1, 2, 3]),
      privateKey: new Uint8Array([4, 5, 6]),
      keyId: 'new-prekey',
    });
  });

  describe('initialization', () => {
    it('should check E2EE setup status on mount', async () => {
      const { result } = renderHook(() => useE2EE('user-123'));

      expect(result.current.isInitializing).toBe(true);

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(e2ee.isE2EESetUp).toHaveBeenCalled();
    });

    it('should load identity key when E2EE is set up', async () => {
      (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(true);
      (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(mockIdentityKeyPair);
      (e2ee.getDeviceId as jest.Mock).mockResolvedValue('device-123');

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isSetUp).toBe(true);
      });

      expect(result.current.identityKey).toEqual(mockIdentityKeyPair);
      expect(result.current.deviceId).toBe('device-123');
      expect(result.current.fingerprint).toBe('abc123fingerprint');
    });

    it('should report not set up when no identity key exists', async () => {
      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.isSetUp).toBe(false);
      expect(result.current.identityKey).toBeNull();
    });
  });

  describe('setupE2EE', () => {
    it('should generate keys and register with server', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.setupE2EE();
      });

      expect(success).toBe(true);
      expect(e2ee.generateKeyBundle).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/api/v1/e2ee/keys', expect.any(Object));
      expect(e2ee.storeKeyBundle).toHaveBeenCalledWith(mockKeyBundle);
    });

    it('should return true if already set up', async () => {
      (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(true);
      (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(mockIdentityKeyPair);
      (e2ee.getDeviceId as jest.Mock).mockResolvedValue('device-123');

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isSetUp).toBe(true);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.setupE2EE();
      });

      expect(success).toBe(true);
      // Should not generate new keys if already set up
      expect(e2ee.generateKeyBundle).not.toHaveBeenCalled();
    });

    it('should handle key generation failure', async () => {
      (e2ee.generateKeyBundle as jest.Mock).mockRejectedValue(new Error('Crypto error'));

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.setupE2EE();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('resetE2EE', () => {
    it('should clear all E2EE data', async () => {
      // Initially set up
      (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(true);
      (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(mockIdentityKeyPair);
      (e2ee.getDeviceId as jest.Mock).mockResolvedValue('device-123');
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      // After clearE2EEData is called, isE2EESetUp should return false
      (e2ee.clearE2EEData as jest.Mock).mockImplementation(async () => {
        (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(false);
        (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(null);
        (e2ee.getDeviceId as jest.Mock).mockResolvedValue(null);
      });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isSetUp).toBe(true);
      });

      await act(async () => {
        await result.current.resetE2EE();
      });

      expect(e2ee.clearE2EEData).toHaveBeenCalled();

      // Wait for state to update after reset
      await waitFor(() => {
        expect(result.current.isSetUp).toBe(false);
      });

      expect(result.current.identityKey).toBeNull();
    });

    it('should notify server of key reset', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      await act(async () => {
        await result.current.resetE2EE();
      });

      expect(api.delete).toHaveBeenCalledWith('/api/v1/e2ee/keys');
    });
  });

  describe('generateNewKeys', () => {
    it('should generate a new key bundle', async () => {
      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let bundle = null;
      await act(async () => {
        bundle = await result.current.generateNewKeys(50);
      });

      expect(bundle).toEqual(mockKeyBundle);
      expect(e2ee.generateKeyBundle).toHaveBeenCalledWith(expect.any(String), 50);
    });
  });

  describe('refreshOneTimePreKeys', () => {
    it('should generate and upload new prekeys', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.refreshOneTimePreKeys(10);
      });

      expect(success).toBe(true);
      expect(e2ee.generatePreKeyPair).toHaveBeenCalledTimes(10);
      expect(api.post).toHaveBeenCalledWith('/api/v1/e2ee/prekeys', {
        prekeys: expect.any(Array),
      });
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt message for recipient', async () => {
      (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(true);
      (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(mockIdentityKeyPair);
      (e2ee.getDeviceId as jest.Mock).mockResolvedValue('device-123');
      (api.get as jest.Mock).mockResolvedValue({
        data: {
          identity_key: 'recipient-key',
          identity_key_id: 'key-id',
          signed_prekey: 'signed-key',
          signed_prekey_signature: 'signature',
          signed_prekey_id: 'prekey-id',
        },
      });
      (e2ee.encryptForRecipient as jest.Mock).mockResolvedValue({
        ciphertext: 'encrypted',
        ephemeralPublicKey: 'ephemeral',
        senderIdentityKey: 'sender-key',
        recipientIdentityKeyId: 'key-id',
        nonce: 'nonce',
      });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isSetUp).toBe(true);
      });

      let encrypted = null;
      await act(async () => {
        encrypted = await result.current.encryptMessage('recipient-123', 'Hello!');
      });

      expect(encrypted).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith('/api/v1/e2ee/bundle/recipient-123');
      expect(e2ee.encryptForRecipient).toHaveBeenCalled();
    });

    it('should return null if E2EE not set up', async () => {
      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let encrypted = null;
      await act(async () => {
        encrypted = await result.current.encryptMessage('recipient-123', 'Hello!');
      });

      expect(encrypted).toBeNull();
    });
  });

  describe('generateSafetyNumber', () => {
    it('should generate safety number for key verification', async () => {
      (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(true);
      (e2ee.loadIdentityKeyPair as jest.Mock).mockResolvedValue(mockIdentityKeyPair);
      (e2ee.generateSafetyNumber as jest.Mock).mockResolvedValue(
        '12345 67890 12345 67890 12345 67890'
      );

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isSetUp).toBe(true);
      });

      const theirKey = new Uint8Array([21, 22, 23, 24]);
      let safetyNumber: string | null = null;

      await act(async () => {
        safetyNumber = await result.current.generateSafetyNumber(theirKey, 'recipient-123');
      });

      expect(safetyNumber).toBe('12345 67890 12345 67890 12345 67890');
      expect(e2ee.generateSafetyNumber).toHaveBeenCalledWith(
        mockIdentityKeyPair.publicKey,
        'user-123',
        theirKey,
        'recipient-123'
      );
    });
  });

  describe('session management', () => {
    it('should get session for recipient', async () => {
      const mockSession = {
        recipientId: 'recipient-123',
        recipientIdentityKey: new Uint8Array([1, 2, 3]),
        sharedSecret: new Uint8Array([4, 5, 6]),
        chainKey: new Uint8Array([7, 8, 9]),
        messageNumber: 1,
        createdAt: Date.now(),
      };
      (e2ee.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let session = null;
      await act(async () => {
        session = await result.current.getSession('recipient-123');
      });

      expect(session).toEqual(mockSession);
    });

    it('should check if session exists', async () => {
      (e2ee.getSession as jest.Mock).mockResolvedValue({ recipientId: 'recipient-123' });

      const { result } = renderHook(() => useE2EE('user-123'));

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      let hasSession = false;
      await act(async () => {
        hasSession = await result.current.hasSession('recipient-123');
      });

      expect(hasSession).toBe(true);
    });
  });
});
