/**
 * Group E2EE Store - Zustand store for managing group Sender Key state.
 *
 * Manages sender keys, peer keys, and encryption/decryption operations
 * for group E2EE using the Sender Key protocol.
 *
 * @module modules/groups/store/groupE2eeStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateSenderKey,
  encryptGroupMessage,
  decryptGroupMessage,
  exportPublicKey,
  importPublicKey,
  type SenderKeyPair,
  type EncryptedGroupMessage,
} from '@/lib/crypto/group-e2ee';

// =============================================================================
// Types
// =============================================================================

interface StoredSenderKey {
  senderKeyId: string;
  /** base64-encoded raw public key */
  publicKeyRaw: string;
  chainIndex: number;
}

interface PeerKeyEntry {
  senderKeyId: string;
  senderUserId: string;
  /** base64-encoded raw public key */
  publicKeyRaw: string;
  chainIndex: number;
}

interface GroupE2eeState {
  /** Our sender keys per group: groupId → StoredSenderKey */
  senderKeys: Record<string, StoredSenderKey>;
  /** Peer sender keys: senderKeyId → PeerKeyEntry */
  peerKeys: Record<string, PeerKeyEntry>;
  /** Groups with E2EE enabled */
  enabledGroups: Set<string>;

  // Actions
  initGroupE2EE: (groupId: string) => Promise<{ senderKeyId: string; publicKeyBase64: string }>;
  handleSessionKeys: (groupId: string, keys: SessionKeyPayload[]) => Promise<void>;
  encryptMessage: (groupId: string, content: string) => Promise<EncryptedGroupMessage | null>;
  decryptMessage: (senderKeyId: string, ciphertext: string, chainIndex: number, iv: string) => Promise<string | null>;
  isGroupE2EEEnabled: (groupId: string) => boolean;
  enableGroupE2EE: (groupId: string) => void;
  disableGroupE2EE: (groupId: string) => void;
}

interface SessionKeyPayload {
  sender_key_id: string;
  sender_user_id: string;
  public_sender_key: string; // base64
  chain_key_index: number;
}

// In-memory cache for CryptoKey objects (not serializable)
const cryptoKeyCache = new Map<string, CryptoKey>();
const senderKeyPairCache = new Map<string, SenderKeyPair>();

// =============================================================================
// Store
// =============================================================================

export const useGroupE2eeStore = create<GroupE2eeState>()(
  persist(
    (set, get) => ({
      senderKeys: {},
      peerKeys: {},
      enabledGroups: new Set(),

      /**
       * Initialize group E2EE — generate sender key for this group.
       */
      initGroupE2EE: async (groupId: string) => {
        const existing = get().senderKeys[groupId];
        if (existing) {
          return {
            senderKeyId: existing.senderKeyId,
            publicKeyBase64: existing.publicKeyRaw,
          };
        }

        const keyPair = await generateSenderKey();
        const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

        // Cache the full key pair in memory
        senderKeyPairCache.set(groupId, keyPair);

        set((state) => ({
          senderKeys: {
            ...state.senderKeys,
            [groupId]: {
              senderKeyId: keyPair.senderKeyId,
              publicKeyRaw: publicKeyBase64,
              chainIndex: 0,
            },
          },
        }));

        return {
          senderKeyId: keyPair.senderKeyId,
          publicKeyBase64,
        };
      },

      /**
       * Handle received session keys from server on channel join.
       */
      handleSessionKeys: async (_groupId: string, keys: SessionKeyPayload[]) => {
        const newPeerKeys: Record<string, PeerKeyEntry> = {};

        for (const key of keys) {
          // Import and cache the CryptoKey
          try {
            const cryptoKey = await importPublicKey(key.public_sender_key);
            cryptoKeyCache.set(key.sender_key_id, cryptoKey);

            newPeerKeys[key.sender_key_id] = {
              senderKeyId: key.sender_key_id,
              senderUserId: key.sender_user_id,
              publicKeyRaw: key.public_sender_key,
              chainIndex: key.chain_key_index,
            };
          } catch {
            console.warn(`Failed to import sender key ${key.sender_key_id}`);
          }
        }

        set((state) => ({
          peerKeys: { ...state.peerKeys, ...newPeerKeys },
        }));
      },

      /**
       * Encrypt a message for a group.
       */
      encryptMessage: async (groupId: string, content: string) => {
        let keyPair = senderKeyPairCache.get(groupId);

        if (!keyPair) {
          // Try to reconstruct from stored key
          const stored = get().senderKeys[groupId];
          if (!stored) return null;

          // Need to regenerate since we can't persist CryptoKey
          const newKeyPair = await generateSenderKey();
          senderKeyPairCache.set(groupId, newKeyPair);
          keyPair = newKeyPair;
        }

        const encrypted = await encryptGroupMessage(content, keyPair);

        // Increment chain index
        keyPair.chainIndex++;
        set((state) => ({
          senderKeys: {
            ...state.senderKeys,
            [groupId]: {
              ...state.senderKeys[groupId],
              chainIndex: keyPair!.chainIndex,
            },
          },
        } as Partial<GroupE2eeState>));

        return encrypted;
      },

      /**
       * Decrypt a received group message.
       */
      decryptMessage: async (
        senderKeyId: string,
        ciphertext: string,
        chainIndex: number,
        iv: string
      ) => {
        let publicKey = cryptoKeyCache.get(senderKeyId);

        if (!publicKey) {
          // Try to import from stored peer key
          const peerKey = get().peerKeys[senderKeyId];
          if (!peerKey) return null;

          try {
            publicKey = await importPublicKey(peerKey.publicKeyRaw);
            cryptoKeyCache.set(senderKeyId, publicKey);
          } catch {
            return null;
          }
        }

        try {
          return await decryptGroupMessage(
            { ciphertext, senderKeyId, chainIndex, iv },
            publicKey
          );
        } catch {
          console.warn(`Failed to decrypt message with key ${senderKeyId}`);
          return null;
        }
      },

      isGroupE2EEEnabled: (groupId: string) => {
        return get().enabledGroups.has(groupId);
      },

      enableGroupE2EE: (groupId: string) => {
        set((state) => {
          const newSet = new Set(state.enabledGroups);
          newSet.add(groupId);
          return { enabledGroups: newSet };
        });
      },

      disableGroupE2EE: (groupId: string) => {
        set((state) => {
          const newSet = new Set(state.enabledGroups);
          newSet.delete(groupId);
          return { enabledGroups: newSet };
        });
      },
    }),
    {
      name: 'cgraph-group-e2ee',
      partialize: (state) => ({
        senderKeys: state.senderKeys,
        peerKeys: state.peerKeys,
        enabledGroups: Array.from(state.enabledGroups),
      }),
    }
  )
);
