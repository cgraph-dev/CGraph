/**
 * E2EE Store — Main Store
 *
 * Zustand store that composes all E2EE actions.
 *
 * @module lib/crypto/e2ee-store/store
 */

import { create } from 'zustand';
import type { E2EEState } from './types';

import {
  createInitialize,
  createSetupE2EE,
  createResetE2EE,
  createGetRecipientBundle,
  createHandleKeyRevoked,
  createSetUseDoubleRatchet,
  createSetUseTripleRatchet,
  createGetSessionProtocol,
  createClearError,
} from './core-actions';

import {
  createEncryptMessage,
  createDecryptMessage,
  createEncryptWithRatchet,
  createDecryptWithRatchet,
  createHasRatchetSession,
  createDestroyRatchetSession,
  createGetRatchetSessionStats,
  createUploadMorePrekeys,
  createGetPrekeyCount,
  createGetSafetyNumber,
  createGetDevices,
  createRevokeDevice,
} from './encryption-actions';

export const useE2EEStore = create<E2EEState>()((set, get) => ({
  // Initial state
  isInitialized: false,
  isLoading: false,
  error: null,
  deviceId: null,
  fingerprint: null,
  prekeyCount: 0,
  bundleCache: new Map(),
  useDoubleRatchet: true,
  useTripleRatchet: true,

  // Core actions
  initialize: createInitialize(set, get),
  setupE2EE: createSetupE2EE(set, get),
  resetE2EE: createResetE2EE(set, get),
  getRecipientBundle: createGetRecipientBundle(set, get),
  handleKeyRevoked: createHandleKeyRevoked(set, get),
  setUseDoubleRatchet: createSetUseDoubleRatchet(set),
  setUseTripleRatchet: createSetUseTripleRatchet(set),
  getSessionProtocol: createGetSessionProtocol(),
  clearError: createClearError(set),

  // Legacy encryption
  encryptMessage: createEncryptMessage(set, get),
  decryptMessage: createDecryptMessage(set, get),

  // Double Ratchet encryption
  encryptWithRatchet: createEncryptWithRatchet(set, get),
  decryptWithRatchet: createDecryptWithRatchet(set, get),
  hasRatchetSession: createHasRatchetSession(),
  destroyRatchetSession: createDestroyRatchetSession(),
  getRatchetSessionStats: createGetRatchetSessionStats(),

  // Key management
  uploadMorePrekeys: createUploadMorePrekeys(set, get),
  getPrekeyCount: createGetPrekeyCount(set),
  getSafetyNumber: createGetSafetyNumber(set, get),
  getDevices: createGetDevices(),
  revokeDevice: createRevokeDevice(set, get),
  reset: () =>
    set({
      isInitialized: false,
      isLoading: false,
      error: null,
      deviceId: null,
      fingerprint: null,
      prekeyCount: 0,
      bundleCache: new Map(),
      useDoubleRatchet: true,
      useTripleRatchet: true,
      initialize: createInitialize(set, get),
      setupE2EE: createSetupE2EE(set, get),
      resetE2EE: createResetE2EE(set, get),
      getRecipientBundle: createGetRecipientBundle(set, get),
      handleKeyRevoked: createHandleKeyRevoked(set, get),
      setUseDoubleRatchet: createSetUseDoubleRatchet(set),
      setUseTripleRatchet: createSetUseTripleRatchet(set),
      getSessionProtocol: createGetSessionProtocol(),
      clearError: createClearError(set),
      encryptMessage: createEncryptMessage(set, get),
      decryptMessage: createDecryptMessage(set, get),
      encryptWithRatchet: createEncryptWithRatchet(set, get),
      decryptWithRatchet: createDecryptWithRatchet(set, get),
      hasRatchetSession: createHasRatchetSession(),
      destroyRatchetSession: createDestroyRatchetSession(),
      getRatchetSessionStats: createGetRatchetSessionStats(),
      uploadMorePrekeys: createUploadMorePrekeys(set, get),
      getPrekeyCount: createGetPrekeyCount(set),
      getSafetyNumber: createGetSafetyNumber(set, get),
      getDevices: createGetDevices(),
      revokeDevice: createRevokeDevice(set, get),
    }),
}));
