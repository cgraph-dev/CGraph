# Phase 7 Research: E2EE & Mobile Security

## Executive Summary

CGraph has a **remarkably mature** E2EE foundation. The `@cgraph/crypto` package (v0.9.47) is a
near-complete Signal-grade crypto library implementing PQXDH, Triple Ratchet (EC Double Ratchet ∥
SPQR), ML-KEM-768, AES-256-GCM, and injectable protocol stores — all with comprehensive tests. Both
web and mobile apps already have working E2EE flows (key generation, registration, X3DH
encryption/decryption), a full backend key management API with DB schemas, and UI components for
encryption indicators and safety numbers.

**What's left is integration and upgrade work**, not green-field crypto development:

1. **Upgrade from X3DH → PQXDH + Triple Ratchet** — The crypto lib is ready; the web PQ adapter
   (`protocol/pqxdh-adapter.ts`) exists but the flag `useTripleRatchet` defaults to `false`.
   Mobile's `pq-bridge.ts` exists but isn't wired into the message flow.
2. **Wire encrypt-before-send into the real message pipeline** — Web already has this in
   `chatStore.messaging.ts`. Mobile needs the same integration into its chat send flow.
3. **Safety number / QR code UI** — Backend `safety_number/2` API exists. Mobile
   `useE2EE.generateSafetyNumber` exists. Need the actual verification screens.
4. **Multi-device key sync** — Backend supports per-device identity keys. No sync protocol exists
   yet.
5. **Biometric auth** — `lib/biometrics.ts` is fully functional with expo-local-authentication.
   Needs to be wired to gate encryption key access.
6. **Auto-bootstrap after login** — Web `e2eeStore.initialize()` runs on app load. Mobile
   `E2EEProvider` calls `checkStatus`. Need to trigger `setupE2EE` automatically if not set up.

**Confidence: HIGH** — The hardest parts (crypto primitives, protocol implementation, backend
schemas) are done. Phase 7 is primarily integration engineering.

---

## Existing Code Audit

### packages/crypto

**Location:** `packages/crypto/src/`  
**Version:** 0.9.47  
**Status:** ✅ PRODUCTION-READY (comprehensive implementation with 14 test suites)

#### Modules & API Surface

| Module                          | Purpose                                                                                    | Status      |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ----------- |
| `pqxdh.ts` (440 lines)          | Post-Quantum Extended Diffie-Hellman key agreement (P-256 ECDH + ML-KEM-768)               | ✅ Complete |
| `tripleRatchet.ts` (623 lines)  | Triple Ratchet engine (EC Double Ratchet ∥ SPQR + KDF_HYBRID)                              | ✅ Complete |
| `doubleRatchet.ts` (1029 lines) | EC Double Ratchet with forward secrecy, break-in recovery, out-of-order handling           | ✅ Complete |
| `spqr.ts` (240 lines)           | Sparse Post-Quantum Ratchet (epoch-based ML-KEM chain)                                     | ✅ Complete |
| `scka.ts` (345 lines)           | ML-KEM Braid — continuous key agreement between SPQR epochs                                | ✅ Complete |
| `kem.ts` (238 lines)            | ML-KEM-768 wrapping `@noble/post-quantum` (keygen, encaps, decaps)                         | ✅ Complete |
| `x3dh.ts`                       | Classical X3DH key agreement                                                               | ✅ Complete |
| `aes.ts`                        | AES-256-GCM symmetric encryption                                                           | ✅ Complete |
| `stores.ts` (319 lines)         | Signal ProtocolStore pattern (Session, Identity, PreKey, SignedPreKey, KyberPreKey stores) | ✅ Complete |
| `types-portable.ts` (131 lines) | Cross-platform Uint8Array-based types for web + mobile                                     | ✅ Complete |
| `types.ts`                      | Web Crypto CryptoKey-based types                                                           | ✅ Complete |
| `errors.ts`                     | Typed crypto errors with error codes                                                       | ✅ Complete |
| `utils.ts`                      | Key generation, HKDF, import/export, base64 conversion                                     | ✅ Complete |

#### Key Exports

```typescript
// Core protocol engines
TripleRatchetEngine.initializeAlice(skEc, skScka, bobPublicKey);
TripleRatchetEngine.initializeBob(skEc, skScka, ourKeyPair);
DoubleRatchetEngine(constructor - based);
SPQREngine.initialize(skScka, isAlice, maxSkip);

// Key agreement
pqxdhInitiate(ourIdentityKeyPair, recipientBundle, secretLength);
pqxdhRespond(ourKeyPairs, initialMessage, secretLength);
splitTripleRatchetSecret(sharedSecret); // → { skEc, skScka }
generatePQXDHBundle(options); // Full bundle generation

// KEM primitives
kemKeygen(); // ML-KEM-768 key pair
kemEncapsulate(publicKey); // → { cipherText, sharedSecret }
kemDecapsulate(cipherText, secretKey);

// Stores
InMemoryProtocolStore(test / demo);
// Plus all store interfaces for concrete implementation
```

#### Dependencies

- `@noble/hashes` ^1.8.0 — HKDF, SHA-256
- `@noble/post-quantum` ^0.2.1 — ML-KEM-768 (FIPS 203)
- No native dependencies — pure JS, cross-platform

#### Test Coverage

14 test suites in `src/__tests__/`:

- `pqxdh.test.ts`, `tripleRatchet.test.ts`, `doubleRatchet.test.ts`, `spqr.test.ts`, `scka.test.ts`,
  `kem.test.ts`, `x3dh.test.ts`
- `integration.test.ts`, `cross-platform.test.ts`, `adversarial.test.ts`, `stress.test.ts`,
  `protocol-edge-cases.test.ts`
- `stores.test.ts`, `errors.test.ts`

**Confidence: HIGH** — This is a well-tested, well-documented crypto library.

---

### Backend E2EE Infrastructure

**Status:** ✅ FULLY FUNCTIONAL — schema, API, key management all exist

#### Database Tables (4 tables)

| Table                   | Migration        | Purpose                                         |
| ----------------------- | ---------------- | ----------------------------------------------- |
| `e2ee_identity_keys`    | `20260102000002` | Long-term Ed25519 identity keys per user/device |
| `e2ee_signed_prekeys`   | `20260102000002` | Medium-term X25519 signed prekeys               |
| `e2ee_one_time_prekeys` | `20260102000002` | Ephemeral one-time prekeys (consumed on use)    |
| `e2ee_kyber_prekeys`    | `20260220000001` | ML-KEM-768 prekeys for PQXDH                    |

All tables have proper foreign keys (`user_id`, `identity_key_id`), timestamps, and the Kyber table
was added specifically for post-quantum support.

#### Elixir Modules

| Module                               | File                             | Purpose                                                                                        |
| ------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `CGraph.Crypto.E2EE`                 | `lib/cgraph/crypto/e2ee.ex`      | Main context — schemas (IdentityKey, SignedPrekey, OneTimePrekey, KyberPrekey) + delegated API |
| `CGraph.Crypto.E2EE.KeyGeneration`   | `e2ee/key_generation.ex`         | Server-side test key gen + X3DH encryption (test only)                                         |
| `CGraph.Crypto.E2EE.KeyRegistration` | `e2ee/key_registration.ex`       | Key upsert logic + Kyber prekey support                                                        |
| `CGraph.Crypto.E2EE.KeyOperations`   | `e2ee/key_operations.ex`         | Bundle retrieval, prekey count, verify/revoke, safety numbers, device listing                  |
| `CGraphWeb.API.V1.E2EEController`    | `e2ee_controller.ex` (431 lines) | Full REST API                                                                                  |

#### API Routes (10 endpoints)

```
POST   /api/v1/e2ee/keys                    → register_keys
POST   /api/v1/e2ee/keys/prekeys            → replenish_prekeys
GET    /api/v1/e2ee/keys/count              → prekey_count
GET    /api/v1/e2ee/keys/:user_id           → get_prekey_bundle
GET    /api/v1/e2ee/devices                 → list_devices
DELETE /api/v1/e2ee/devices/:device_id      → remove_device
GET    /api/v1/e2ee/safety-number/:user_id  → safety_number
POST   /api/v1/e2ee/keys/:key_id/verify     → verify_key
POST   /api/v1/e2ee/keys/:key_id/revoke     → revoke_key
```

#### Key Finding: Kyber prekeys are already in the bundle response

In `key_operations.ex`, `get_prekey_bundle/1` already includes `kyber_prekey`, `kyber_prekey_id`,
and `kyber_prekey_signature` in the response when available. This means PQXDH sessions can be
negotiated transparently — if a user publishes KEM keys, initiators will see them and can use PQXDH.

#### What's Missing in Backend

1. **No `is_encrypted` column is used for message content handling** — The conversation channel
   passes `is_encrypted` to `Messaging.create_message/1` but the server doesn't act on it
   differently. This is correct (server should be ciphertext-agnostic).
2. **No key sync endpoint** — For multi-device key sync, a new endpoint is needed where a verified
   device can download encrypted key material.
3. **Safety number computation** uses simple SHA-256(sorted_keys) — adequate for v1 but Signal uses
   iterated SHA-512 for 60-digit numbers. Consider upgrading.

**Confidence: HIGH**

---

### Mobile Security

#### Biometric Auth (`apps/mobile/src/lib/biometrics.ts`)

**Status:** ✅ FULLY FUNCTIONAL (212 lines)

Complete implementation using `expo-local-authentication` (v17.0.0):

- `getBiometricStatus()` — hardware detection, enrollment check, type classification
  (facial/fingerprint/iris)
- `authenticateWithBiometrics(reason)` — Face ID / Touch ID / Fingerprint prompt with passcode
  fallback
- `isBiometricLockEnabled()` / `setBiometricLockEnabled(enabled)` — user preference in SecureStore
- `needsReauthentication(timeoutMs)` — timeout-based re-auth (default 5 min)
- `requireAuthenticationIfNeeded(reason)` — convenience wrapper

Already configured in `app.config.js`:

- `USE_BIOMETRIC`, `USE_FINGERPRINT` permissions (Android)
- `faceIDPermission` description (iOS)
- `expo-secure-store` and `expo-local-authentication` plugins registered

#### Biometric Integration in Settings

`apps/mobile/src/screens/settings/account-screen.tsx` already has a biometric toggle UI with status
display. The biometric preference is persisted in SecureStore.

#### What's Missing: Biometric-Gated Key Access

The biometric module exists independently from the E2EE module. The integration needed:

- On app foreground (after timeout) → `requireAuthenticationIfNeeded()` → if fail, lock E2EE
  operations
- Gate `loadIdentityKeyPair()` behind biometric check for sensitive operations
- Store encryption keys with `SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY` already in use (✅)

**Confidence: HIGH** — All building blocks exist, just need to connect them.

---

#### Mobile E2EE (`apps/mobile/src/lib/crypto/`)

**Status:** ⚠️ FUNCTIONAL but needs PQXDH upgrade

| File                             | Purpose                                                                | Status                                    |
| -------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| `e2ee.ts` (891 lines)            | X3DH E2EE — key gen, encrypt, decrypt, session mgmt via SecureStore    | ✅ Working (Phase 1)                      |
| `pq-bridge.ts` (401 lines)       | PQXDH + Triple Ratchet bridge using @cgraph/crypto                     | ✅ Code exists, not wired to message flow |
| `e2-ee-context.tsx`              | React Context (legacy wrapper) → delegates to Zustand store            | ✅ Working                                |
| `store/e2eeStore.ts` (365 lines) | Zustand store — checkStatus, setupE2EE, encryptMessage, decryptMessage | ✅ Working (X3DH)                         |

Key observation from `e2ee.ts` line 14-15:

> _"Phase 2 of crypto consolidation will migrate to @cgraph/crypto's full protocol (PQXDH + Triple
> Ratchet) for post-quantum security and forward secrecy."_

The Phase 2 migration path is clear:

1. `pq-bridge.ts` already wraps `@cgraph/crypto` (PQXDH, Triple Ratchet)
2. It already has `generateKeyBundle()`, `initiateSession()`, `respondToSession()`,
   `encryptMessage()`, `decryptMessage()`
3. It uses `expo-secure-store` for private key storage with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
4. Just need to switch `e2eeStore.encryptMessage` to use `pq-bridge` instead of `e2ee.ts`

**Confidence: HIGH**

---

### Web Crypto Integration

**Status:** ✅ COMPREHENSIVE — multi-protocol support with PQ adapter ready

#### Architecture

```
E2EE Store (Zustand) — apps/web/src/lib/crypto/e2ee-store/
  ├── core-actions.ts — initialize, setup, KEM prekey generation
  ├── encryption-actions.ts — X3DH + Double Ratchet encrypt/decrypt
  └── store.ts — composes all actions

Session Manager — apps/web/src/lib/crypto/session-manager/
  ├── session-manager-class.ts — singleton, routes to correct protocol
  ├── session-x3dh.ts — classical X3DH sessions
  ├── session-manager-pq.ts — PQXDH + Triple Ratchet sessions
  ├── message-ops.ts — encrypt/decrypt dispatch
  └── storage.ts — IndexedDB session persistence

Protocol Module — apps/web/src/lib/crypto/protocol/
  ├── types.ts — CryptoProtocol enum (CLASSICAL_V1, CLASSICAL_V2, PQXDH_V1)
  ├── pqxdh-adapter.ts — bridges session manager ↔ @cgraph/crypto
  └── index.ts — barrel

Secure Storage — apps/web/src/lib/crypto/secure-storage/
  └── IndexedDB + AES-256-GCM + PBKDF2 encrypted key storage

E2EE Secure — apps/web/src/lib/crypto/e2ee-secure/
  ├── key-storage.ts — encrypted IndexedDB for identity/signed/OTP keys
  ├── messaging.ts — X3DH encrypt/decrypt using encrypted storage
  ├── sessions.ts — session persistence
  └── constants.ts
```

#### Message Flow Integration (Already Working!)

In `chatStore.messaging.ts` (line 41-92):

```typescript
if (e2eeStore.isInitialized && conversation?.type === 'direct' && !forceUnencrypted) {
  const encryptedMsg = await e2eeStore.encryptMessage(recipientParticipant.userId, content);
  // Posts encrypted payload to /api/v1/conversations/:id/messages
  // with is_encrypted: true, ciphertext, ephemeralPublicKey, nonce, etc.
}
```

**CRITICAL SECURITY BEHAVIOR** (line 93-102): On encryption failure, the code throws an error and
does NOT fall back to plaintext. This is correct.

#### Protocol Negotiation

The `E2EEState` has two flags:

- `useDoubleRatchet: true` (default — EC Double Ratchet for forward secrecy)
- `useTripleRatchet: false` (default — PQXDH + Triple Ratchet off by default)

The protocol module in `types.ts` checks `bundleSupportsPQ(bundle)` — if the recipient's bundle has
`kyber_prekey` + `kyber_prekey_signature`, PQXDH is used. This means **enabling Triple Ratchet is
just flipping the `useTripleRatchet` flag**.

#### Key Storage (Web)

Uses `SecureStorage` — IndexedDB encrypted with AES-256-GCM, key derived via PBKDF2 from a user
credential. This is already significantly more secure than localStorage.

#### What's Missing in Web

1. **Triple Ratchet flag defaulting to `true`** — trivial change
2. **Decrypt-on-receive pipeline** — `chatStore.messaging.ts` encrypts on send. Need to add decrypt
   logic when receiving messages via Phoenix Channel `new_message` events.
3. **Safety number/QR code verification screen** — API exists
   (`/api/v1/e2ee/safety-number/:user_id`), store method `getSafetyNumber()` exists. Need UI.
4. **Encryption lock icon** — Conversation header already shows a shield icon for E2EE conversations
   (line 116 of `conversation-header.tsx`). May need per-message lock icon.

**Confidence: HIGH**

---

## Standard Stack

### Libraries to Use (Prescriptive)

| Need                | Library                                                    | Rationale                                         |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Post-quantum crypto | `@cgraph/crypto` (own package)                             | Already exists, tested, Signal-grade              |
| ML-KEM-768          | `@noble/post-quantum` (via @cgraph/crypto)                 | Already a dependency, FIPS 203 compliant          |
| Mobile key storage  | `expo-secure-store` v15.0.0                                | Already installed, Keychain/Keystore backed       |
| Mobile biometrics   | `expo-local-authentication` v17.0.0                        | Already installed, fully implemented              |
| Web key storage     | `SecureStorage` (own module)                               | Already exists — IndexedDB + AES-256-GCM + PBKDF2 |
| QR code generation  | `react-native-qrcode-skia` (mobile) / `qrcode.react` (web) | Standard choices for safety number QR display     |
| QR code scanning    | `expo-camera` (already in deps)                            | For scanning verification QR codes                |
| State management    | Zustand (both web and mobile)                              | Already used for E2EE stores on both platforms    |

### DO NOT ADD

- ❌ `libsignal-protocol-javascript` — we have our own complete implementation
- ❌ `react-native-keychain` — `expo-secure-store` already handles this
- ❌ `@noble/ed25519` — not needed, using P-256 ECDSA (already in SubtleCrypto)
- ❌ Any external Double Ratchet library — `@cgraph/crypto` has it

---

## Architecture Patterns

### Encrypt Pipeline (Send)

```
User types message
  → chatStore.sendMessage() / mobile send handler
    → Check: E2EE initialized? Direct conversation? Not forceUnencrypted?
      → YES: e2eeStore.encryptWithRatchet(recipientId, plaintext)
        → sessionManager checks for existing session
          → No session? Fetch recipient bundle from /api/v1/e2ee/keys/:user_id
            → Bundle has kyber_prekey? → PQXDH + Triple Ratchet
            → No kyber_prekey? → X3DH + Double Ratchet
          → Session exists? → ratchet.encrypt(plaintext)
        → Returns: { ciphertext, header, protocol_version, ... }
      → POST /api/v1/conversations/:id/messages with is_encrypted: true
      → Store plaintext locally for sender's view
      → NO: Send plaintext (group chats, unencrypted mode)
```

### Decrypt Pipeline (Receive)

```
Phoenix Channel → "new_message" event
  → Check: message.is_encrypted?
    → YES: e2eeStore.decryptWithRatchet(message)
      → sessionManager routes to correct protocol
        → PQXDH_V1: tripleRatchet.decrypt(ciphertext)
        → CLASSICAL_V2: doubleRatchet.decrypt(ciphertext)
        → CLASSICAL_V1: legacy X3DH decrypt
      → Returns plaintext
      → Store decrypted content locally
      → Display with 🔒 lock icon
    → NO: Display plaintext as-is
```

### Key Management Flow

```
Login → E2EE auto-bootstrap:
  1. Check SecureStorage/SecureStore for existing identity key
  2. If exists: load keys, initialize session manager, start prekey replenishment
  3. If not: generate full key bundle (identity + signed prekey + 100 OTKs + KEM prekey)
     → Register with server: POST /api/v1/e2ee/keys
     → Store private keys locally (encrypted IndexedDB / Keychain)
  4. Check prekey count → if < 25, upload more OTKs

Periodic: prekey replenishment check (on app foreground / every 5 min)
```

### Multi-Device Key Sync Pattern

```
New device login:
  1. New device generates its OWN identity key + prekeys
  2. Registers with server (server now has 2+ devices for this user)
  3. Existing device is notified (via user channel)
  4. User verifies new device via cross-signing:
     → Old device signs new device's identity key
     → New device signs old device's identity key
  5. Existing sessions continue on old device
  6. New sessions can be established with either device
  7. Server returns ALL device bundles when requested (1 per device)
```

---

## Integration Points

### Web — Exact Files to Modify

| Requirement                     | File(s)                                                                                      | Change                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| E2EE-01: PQXDH + Triple Ratchet | [e2ee-store/store.ts](apps/web/src/lib/crypto/e2ee-store/store.ts#L48)                       | Set `useTripleRatchet: true` by default             |
| E2EE-01: Auto-setup on login    | [e2ee-store/core-actions.ts](apps/web/src/lib/crypto/e2ee-store/core-actions.ts#L38)         | In `initialize()`, call `setupE2EE()` if `!isSetUp` |
| E2EE-01: Decrypt incoming       | [chatStore.messaging.ts](apps/web/src/modules/chat/store/chatStore.messaging.ts)             | Add decrypt logic in message receive handler        |
| E2EE-03: Safety number UI       | New component in `modules/chat/components/`                                                  | Display formatted safety number + QR code           |
| E2EE-04: Key sync               | New endpoint + `e2ee-store` actions                                                          | Cross-device key signing protocol                   |
| E2EE-08: Already done           | [e2ee-secure/key-storage.ts](apps/web/src/lib/crypto/e2ee-secure/key-storage.ts)             | ✅ Encrypted IndexedDB already in use               |
| E2EE-09: Auto-bootstrap         | [e2ee-store/core-actions.ts](apps/web/src/lib/crypto/e2ee-store/core-actions.ts#L38)         | Call `setupE2EE()` on first login                   |
| Lock icon                       | [conversation-header.tsx](apps/web/src/modules/chat/components/conversation-header.tsx#L116) | ✅ Already shows shield icon for E2EE               |

### Mobile — Exact Files to Modify

| Requirement                | File(s)                                                           | Change                                                                    |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| E2EE-01: PQXDH migration   | [e2eeStore.ts](apps/mobile/src/lib/crypto/store/e2eeStore.ts)     | Switch `encryptMessage`/`decryptMessage` to use `pq-bridge.ts`            |
| E2EE-01: Wire to chat send | Mobile chat send flow (needs investigation of chat screen)        | Call `e2eeStore.encryptMessage()` before sending                          |
| E2EE-03: Safety number UI  | New screen                                                        | Use `useE2EE.generateSafetyNumber()` + QR component                       |
| E2EE-04: Key sync          | New implementation                                                | Cross-device signing via secure channel                                   |
| E2EE-08: Key storage       | [pq-bridge.ts](apps/mobile/src/lib/crypto/pq-bridge.ts#L100)      | ✅ Already uses `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` |
| E2EE-09: Auto-bootstrap    | [e2-ee-context.tsx](apps/mobile/src/lib/crypto/e2-ee-context.tsx) | After `checkStatus()`, call `setupE2EE()` if not initialized              |
| AUTH-06: Biometric         | [biometrics.ts](apps/mobile/src/lib/biometrics.ts)                | Wire `requireAuthenticationIfNeeded()` to app foreground + key access     |

### Backend — Changes Needed

| Requirement                   | File(s)                                                                                 | Change                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| E2EE-04: Key sync endpoint    | New controller action + context function                                                | `POST /api/v1/e2ee/devices/:device_id/sync` — encrypted key transfer |
| E2EE-04: Cross-signing        | New schema + controller                                                                 | Store cross-device signatures for trust chain                        |
| Kyber bundle in all responses | [key_operations.ex](apps/backend/lib/cgraph/crypto/e2ee/key_operations.ex#L47)          | ✅ Already includes kyber prekey in bundle                           |
| Safety number endpoint        | [e2ee_controller.ex](apps/backend/lib/cgraph_web/controllers/api/v1/e2ee_controller.ex) | ✅ Route exists at `/api/v1/e2ee/safety-number/:user_id`             |

---

## Don't Hand-Roll

| Component            | What Exists                                                   | Use It       |
| -------------------- | ------------------------------------------------------------- | ------------ |
| Crypto primitives    | `@cgraph/crypto` — complete PQXDH, Triple Ratchet, ML-KEM-768 | ✅ Use as-is |
| Key storage (mobile) | `expo-secure-store` — Keychain/Keystore backed                | ✅ Use as-is |
| Key storage (web)    | `SecureStorage` — IndexedDB + AES-256-GCM                     | ✅ Use as-is |
| Biometric auth       | `biometrics.ts` — full implementation                         | ✅ Use as-is |
| Protocol negotiation | `protocol/` module — version detection, adapter routing       | ✅ Use as-is |
| Session management   | `session-manager/` — persistence, lifecycle, multi-protocol   | ✅ Use as-is |
| Prekey replenishment | `usePreKeyReplenishment` hook (both platforms)                | ✅ Use as-is |
| E2EE store (web)     | `e2ee-store/` — Zustand with all actions                      | ✅ Use as-is |
| E2EE store (mobile)  | `store/e2eeStore.ts` — Zustand with all actions               | ✅ Use as-is |

**Do NOT rewrite any crypto code.** The library is tested and auditable. Only wire it in.

---

## Common Pitfalls

### 1. Race Condition: Concurrent Session Initialization

**Risk:** Two messages sent before the first PQXDH completes → two sessions created. **Mitigation:**
`setupPromiseRef` pattern (already implemented in mobile `useE2EE.ts` line 235). Ensure the same
pattern exists in the web session manager's `encryptMessage`.

### 2. Prekey Exhaustion

**Risk:** If one-time prekeys run out, new sessions degrade to no-OTK mode (slightly weaker forward
secrecy). **Mitigation:** Prekey replenishment hooks already exist on both platforms. Threshold is
25 (server-side check) / 20 (mobile). Ensure replenishment runs on app foreground.

### 3. Key Change Without Verification Reset

**Risk:** User re-installs app, gets new identity key. Remote contacts should be notified.
**Mitigation:** Backend `KeyRegistration.update_identity_key_if_changed/3` already logs warnings and
resets `is_verified` to false. The frontend needs to display a "security number changed" banner.

### 4. Decrypt Failure on Schema Migration

**Risk:** Messages encrypted with X3DH can't be decrypted by Triple Ratchet decoder. **Mitigation:**
The protocol version is embedded in messages. The `CryptoProtocol` enum (CLASSICAL_V1, CLASSICAL_V2,
PQXDH_V1) ensures the correct decoder is used. Keep backward compatibility during transition.

### 5. Mobile App Backgrounding & Key Access

**Risk:** On iOS, Keychain items with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` are inaccessible when device
is locked. Background message decryption fails. **Mitigation:** Queue encrypted messages in
WatermelonDB and decrypt when app returns to foreground after biometric unlock.

### 6. Web Worker / Tab Synchronization

**Risk:** Multiple browser tabs could create conflicting sessions or duplicate key registrations.
**Mitigation:** Use a shared `BroadcastChannel` or `SharedWorker` for E2EE state. At minimum, use
`localStorage` events for cross-tab key change detection.

### 7. Triple Ratchet Message Ordering

**Risk:** Out-of-order messages (common in unreliable networks) need skipped-key management.
**Mitigation:** Both `DoubleRatchetEngine` and `TripleRatchetEngine` already handle this with
`MKSKIPPED` maps and configurable `MAX_SKIP` (1000 for EC, 100 for SPQR). No action needed.

### 8. Large KEM Keys on Wire

**Risk:** ML-KEM-768 public keys are 1184 bytes, ciphertexts 1088 bytes. First messages in PQXDH
sessions are significantly larger. **Mitigation:** Only the initial key exchange includes KEM data.
Subsequent messages are normal ratchet-sized. This is an acceptable one-time cost. Ensure WebSocket
frame size limits accommodate this.

### 9. Server Must Never Log Ciphertext Content

**Risk:** Log middleware inadvertently logging encrypted message payloads. **Mitigation:** The
backend already treats message content as opaque. Verify that telemetry/OTel spans don't capture
content fields.

### 10. Multi-Device Session Fanout

**Risk:** When a user has 2+ devices, sender needs to encrypt separately for each device.
**Mitigation:** Backend `list_user_devices/1` returns all device identity keys. Sender should
establish separate sessions per device and send ciphertext per device. This is the Signal pattern.
**This is the hardest new integration work in Phase 7.**

---

## Code Examples

### Existing: Web Encrypt-Before-Send (chatStore.messaging.ts)

```typescript
// Already working in chatStore.messaging.ts lines 41-92
if (e2eeStore.isInitialized && conversation?.type === 'direct' && !forceUnencrypted) {
  const encryptedMsg = await e2eeStore.encryptMessage(recipientParticipant.userId, content);
  const payload = {
    content: encryptedMsg.ciphertext,
    is_encrypted: true,
    ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
    nonce: encryptedMsg.nonce,
    recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
  };
  await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
}
```

### Existing: Mobile PQ Session Creation (pq-bridge.ts)

```typescript
// Already exists in pq-bridge.ts lines 175-220
export async function initiateSession(remoteBundle, store) {
  const result = await pqxdhInitiate({ identityKeyPair, remoteBundle });
  const ratchet = new TripleRatchetEngine({
    sharedKey: result.sharedKey,
    isInitiator: true,
    store,
  });
  // ...session stored and returned
}
```

### Existing: Backend Kyber-Aware Bundle (key_operations.ex)

```elixir
# Already in get_prekey_bundle/1
case get_current_kyber_prekey(user_id) do
  nil -> bundle
  kyber -> Map.merge(bundle, %{
    kyber_prekey: Base.encode64(kyber.public_key),
    kyber_prekey_id: kyber.key_id,
    kyber_prekey_signature: Base.encode64(kyber.signature)
  })
end
```

### Existing: Biometric Gate (biometrics.ts)

```typescript
// Already fully implemented
export async function requireAuthenticationIfNeeded(reason) {
  const needsAuth = await needsReauthentication();
  if (!needsAuth) return { success: true };
  return authenticateWithBiometrics(reason);
}
```

---

## Open Questions

### 1. Multi-Device Encryption: Per-Device or Sender Key?

**Options:**

- **Per-device sessions** (Signal pattern): Sender encrypts N times for N devices. Most secure.
- **Sender Key** (Signal Groups pattern): Sender distributes a sender key to all devices, then
  encrypts once. Less overhead but weaker forward secrecy.

**Recommendation:** Per-device sessions for 1:1 chats (Phase 7 scope). Sender Keys for future group
E2EE.

### 2. Key Sync: Cross-Signing or Key Transfer?

**Options:**

- **Cross-signing:** Each device has its own identity key. Devices sign each other's keys to
  establish a trust chain. Safer — no private keys in transit.
- **Key transfer:** Export encrypted identity key from old device to new device (like Signal's
  "transfer account"). Simpler UX but requires old device to be available.

**Recommendation:** Cross-signing as primary (works even if old device is lost). Key transfer as
optional convenience (requires old device QR scan).

### 3. How Should E2EE Bootstrap Interact with Onboarding?

The success criteria says "bootstraps automatically after login without user action." Currently,
`setupE2EE()` generates keys and registers them. Should this happen:

- During the login response handler?
- On first render of the main app shell?
- Lazily on first message send?

**Recommendation:** On first render of the main app shell, right after auth token is confirmed. Show
a brief "Setting up encryption..." status if it takes > 500ms.

### 4. What Wire Format for Triple Ratchet Messages?

The message format needs to be agreed between web and mobile. Currently:

- X3DH messages use: `{ ciphertext, ephemeralPublicKey, nonce, recipientIdentityKeyId }`
- Triple Ratchet messages include composite headers (EC + PQ + version)

**Recommendation:** Use a versioned envelope:
`{ version: 4, protocol: "pqxdh_v1", header: base64(...), ciphertext: base64(...), nonce: base64(...) }`.
The `version` field allows future upgrades.

### 5. Should Safety Numbers Use Signal's Numeric Format or QR-Only?

Signal uses 60-digit numeric codes + QR codes. The current backend generates hex fingerprints.

**Recommendation:** Implement Signal's numeric format (groups of 5 digits, 12 groups). Add QR code
for easy scanning. Both humans and cameras can verify.

---

## Confidence Levels

| Finding                                  | Confidence | Notes                                                                                      |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `@cgraph/crypto` completeness            | **HIGH**   | 14 test suites, complete protocol chain, well-documented                                   |
| Backend E2EE API readiness               | **HIGH**   | All endpoints exist, Kyber support included, schemas in place                              |
| Web encrypt-on-send integration          | **HIGH**   | Already working in chatStore.messaging.ts                                                  |
| Web decrypt-on-receive gap               | **HIGH**   | Confirmed missing — needs to be added to message receive                                   |
| Mobile biometric module readiness        | **HIGH**   | Fully functional, just needs wiring to key access                                          |
| Mobile PQXDH bridge readiness            | **HIGH**   | pq-bridge.ts has full implementation, just not wired                                       |
| Triple Ratchet activation (web)          | **HIGH**   | Literally flipping `useTripleRatchet: true` + testing                                      |
| Multi-device key sync complexity         | **MEDIUM** | Backend supports multi-device. No sync protocol yet — this is the most complex new feature |
| Safety number UI effort                  | **MEDIUM** | API exists, hooks exist. Need UI components + QR generation                                |
| Wire format compatibility (web ↔ mobile) | **MEDIUM** | Both use @cgraph/crypto types. Need to verify base64 encoding consistency                  |
| Cross-tab E2EE state sync (web)          | **LOW**    | Not investigated deeply. May need SharedWorker or BroadcastChannel                         |

---

## Summary: What Needs to Be Built vs What Exists

| Item                                               | Status    | Effort |
| -------------------------------------------------- | --------- | ------ |
| Crypto library (PQXDH, Triple Ratchet, ML-KEM-768) | ✅ EXISTS | 0      |
| Backend key management API (10 endpoints)          | ✅ EXISTS | 0      |
| Backend DB schemas (4 tables + migrations)         | ✅ EXISTS | 0      |
| Web E2EE store + session manager                   | ✅ EXISTS | 0      |
| Web PQ protocol adapter                            | ✅ EXISTS | 0      |
| Web encrypted key storage (IndexedDB)              | ✅ EXISTS | 0      |
| Mobile E2EE store + hooks                          | ✅ EXISTS | 0      |
| Mobile PQ bridge                                   | ✅ EXISTS | 0      |
| Mobile biometric module                            | ✅ EXISTS | 0      |
| Mobile Keychain key storage                        | ✅ EXISTS | 0      |
| **Enable Triple Ratchet by default**               | 🔧 WIRE   | Small  |
| **Auto-bootstrap E2EE on login**                   | 🔧 WIRE   | Small  |
| **Decrypt-on-receive pipeline (web)**              | 🔧 BUILD  | Medium |
| **Decrypt-on-receive pipeline (mobile)**           | 🔧 BUILD  | Medium |
| **Wire PQ-bridge into mobile chat flow**           | 🔧 WIRE   | Medium |
| **Safety number verification screen (web)**        | 🔧 BUILD  | Medium |
| **Safety number verification screen (mobile)**     | 🔧 BUILD  | Medium |
| **QR code for verification**                       | 🔧 BUILD  | Small  |
| **Biometric gate for key access (mobile)**         | 🔧 WIRE   | Small  |
| **Encryption lock icon per message**               | 🔧 BUILD  | Small  |
| **Multi-device key sync protocol**                 | 🆕 NEW    | Large  |
| **Cross-device signing / trust chain**             | 🆕 NEW    | Large  |
| **Key change notification banner**                 | 🔧 BUILD  | Small  |
| **Backend key sync endpoint**                      | 🆕 NEW    | Medium |
