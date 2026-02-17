# @cgraph/crypto

> **Status**: Active — consolidation target for web + mobile E2EE implementations. See
> [Consolidation Plan](#consolidation-plan) below.

Post-quantum end-to-end encryption for CGraph, implementing **Signal Protocol Revision 4** with the
**Triple Ratchet** algorithm.

## Protocol Overview

```
PQXDH Handshake                    Triple Ratchet Messaging
─────────────────                  ────────────────────────
Alice              Bob             Alice              Bob
  │                  │               │                  │
  │  Fetch bundle    │               │  encrypt(m)      │
  │ ───────────────► │               │ ───────────────► │
  │ { IK_B, SPK_B,  │               │ { header, ct,    │
  │   kemPreKey,     │               │   nonce, mac }   │
  │   OPK_B? }      │               │                  │
  │                  │               │  EC Double       │
  │  PQXDH(          │               │  Ratchet ──────► │
  │    ECDH + KEM    │               │  ∥               │
  │  ) ──► SK (64B)  │               │  SPQR ─────────► │
  │                  │               │  = KDF_HYBRID    │
  │  Split SK ──►    │               │    (ec_mk,       │
  │  { skEc, skScka }│               │     pq_mk)       │
  │                  │               │  → hybrid key    │
  │  Init Triple     │               │  → AES-256-GCM   │
  │  Ratchet         │               │                  │
  └──────────────────┘               └──────────────────┘
```

### Key Algorithms

| Component              | Algorithm        | Standard                   |
| ---------------------- | ---------------- | -------------------------- |
| Post-quantum KEM       | ML-KEM-768       | NIST FIPS 203              |
| Classical key exchange | P-256 ECDH       | NIST SP 800-56A            |
| Message encryption     | AES-256-GCM      | NIST FIPS 197 / SP 800-38D |
| Key derivation         | HKDF-SHA-256     | RFC 5869                   |
| EC Double Ratchet      | Signal Spec §5   | Signal Protocol Rev 4      |
| SPQR (Sub-Protocol)    | SCKA + KEM Braid | Signal Protocol Rev 4      |
| Triple Ratchet         | EC DR ∥ SPQR     | Signal Protocol Rev 4 §6   |

### Security Properties

- **Post-quantum forward secrecy**: ML-KEM-768 protects against harvest-now-decrypt-later
- **Classical forward secrecy**: ECDH ratchet provides per-message forward secrecy
- **Hybrid security**: KDF_HYBRID ensures security if either EC or PQ is secure
- **Break-in recovery**: DH ratchet advancement heals after compromise
- **Out-of-order tolerance**: Skipped message keys cached up to `MAX_SKIP`
- **Replay resistance**: Used message keys are consumed and never reused
- **Associated data binding**: Headers authenticated via AEAD

## Architecture

```
@cgraph/crypto
├── errors.ts          Typed error hierarchy (CryptoErrorCode enum)
├── stores.ts          Protocol store interfaces + InMemoryProtocolStore
├── kem.ts             ML-KEM-768 keygen / encapsulate / decapsulate
├── x3dh.ts            EC key generation, ECDSA signing, X3DH key agreement
├── pqxdh.ts           PQXDH handshake (ECDH + ML-KEM-768 hybrid)
├── scka.ts            Symmetric-key Continuous Key Agreement
├── spqr.ts            Sub-Protocol for Post-Quantum Ratcheting
├── doubleRatchet.ts   EC Double Ratchet (Signal §5)
├── tripleRatchet.ts   Triple Ratchet engine (Signal §6)
└── index.ts           Barrel exports
```

## Installation

```bash
pnpm add @cgraph/crypto
```

## Usage

### Full E2EE Session (PQXDH → Triple Ratchet)

```typescript
import {
  generateECKeyPair,
  generateSigningKeyPair,
  kemKeygen,
  generatePQXDHBundle,
  pqxdhInitiate,
  pqxdhRespond,
  splitTripleRatchetSecret,
  TripleRatchetEngine,
} from '@cgraph/crypto';

// ── BOB: Generate & publish key bundle ──
const bobIdentity = await generateECKeyPair();
const bobSigning = await generateSigningKeyPair();
const bobKemKP = kemKeygen();

const { bundle, signedPreKeyPair: bobSPK } = await generatePQXDHBundle(
  bobIdentity,
  bobSigning,
  bobKemKP,
  1, // signedPreKeyId
  100 // kemPreKeyId
);
// Publish `bundle` to server

// ── ALICE: Fetch bundle & initiate handshake ──
const aliceIdentity = await generateECKeyPair();
const aliceResult = await pqxdhInitiate(aliceIdentity, bundle);
// Send aliceResult.ephemeralPublicKey + aliceResult.kemCipherText to Bob

// ── BOB: Complete handshake ──
const bobResult = await pqxdhRespond(
  bobIdentity,
  bobSPK,
  bobKemKP.secretKey,
  aliceIdentity.rawPublicKey,
  aliceResult.ephemeralPublicKey,
  aliceResult.kemCipherText
);

// Both now have the same 64-byte shared secret
// aliceResult.sharedSecret === bobResult.sharedSecret

// ── Initialize Triple Ratchet ──
const aliceSplit = splitTripleRatchetSecret(aliceResult.sharedSecret);
const bobSplit = splitTripleRatchetSecret(bobResult.sharedSecret);

const alice = await TripleRatchetEngine.initializeAlice(
  aliceSplit.skEc,
  aliceSplit.skScka,
  bobSPK.rawPublicKey
);
const bob = await TripleRatchetEngine.initializeBob(bobSplit.skEc, bobSplit.skScka, bobSPK);

// ── Messaging ──
const plaintext = new TextEncoder().encode('Hello, Bob!');
const encrypted = await alice.encrypt(plaintext);
const decrypted = await bob.decrypt(encrypted);
// new TextDecoder().decode(decrypted.plaintext) === 'Hello, Bob!'

// ── Cleanup ──
alice.destroy();
bob.destroy();
```

### Standalone Double Ratchet

```typescript
import { DoubleRatchetEngine, generateDHKeyPair } from '@cgraph/crypto';

const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
const bobKP = await generateDHKeyPair();

const alice = new DoubleRatchetEngine({ enableAuditLog: true });
const bob = new DoubleRatchetEngine({ enableAuditLog: true });

await alice.initializeAlice(sharedSecret, bobKP.rawPublicKey);
await bob.initializeBob(sharedSecret, bobKP);

const msg = await alice.encryptMessage(new TextEncoder().encode('Secret'));
const result = await bob.decryptMessage(msg);

// State persistence
const aliceState = await alice.exportState();
const restored = new DoubleRatchetEngine({ enableAuditLog: false });
await restored.importState(aliceState);
```

### ML-KEM-768 (Post-Quantum KEM)

```typescript
import { kemKeygen, kemEncapsulate, kemDecapsulate } from '@cgraph/crypto';

const keyPair = kemKeygen();
// keyPair.publicKey  — 1184 bytes
// keyPair.secretKey  — 2400 bytes

const { sharedSecret, cipherText } = kemEncapsulate(keyPair.publicKey);
// sharedSecret — 32 bytes
// cipherText   — 1088 bytes

const recovered = kemDecapsulate(cipherText, keyPair.secretKey);
// recovered deepEquals sharedSecret
```

## Testing

```bash
cd packages/crypto
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
```

### Test Coverage

| Test File                     |   Tests | Coverage Area                                                    |
| ----------------------------- | ------: | ---------------------------------------------------------------- |
| `errors.test.ts`              |       9 | Error hierarchy, factories, JSON serialization                   |
| `stores.test.ts`              |      22 | Protocol store, identity TOFU, session persistence               |
| `kem.test.ts`                 |      16 | ML-KEM-768 keygen/encap/decap, serialization, wipe               |
| `x3dh.test.ts`                |      10 | EC key gen, ECDSA signing, X3DH key agreement                    |
| `pqxdh.test.ts`               |      14 | PQXDH handshake, bundle generation, signature checks             |
| `scka.test.ts`                |       9 | SCKA chain ratchet, epoch advance, KEM braid                     |
| `spqr.test.ts`                |       7 | SPQR send/receive, epoch transitions, state management           |
| `doubleRatchet.test.ts`       |      16 | DR init, encrypt/decrypt, out-of-order, state export             |
| `tripleRatchet.test.ts`       |      17 | TR init, bidirectional, security properties, stats               |
| `integration.test.ts`         |       3 | Full PQXDH → Triple Ratchet lifecycle                            |
| `cross-platform.test.ts`      |       9 | Web↔mobile simulation, binary data, multi-user                   |
| `adversarial.test.ts`         |      23 | Replay, ciphertext tampering, header manipulation, fuzz          |
| `stress.test.ts`              |      16 | 200+ msg conversations, 1MB payloads, concurrency                |
| `protocol-edge-cases.test.ts` |      21 | Empty plaintext, AD handling, state persistence, PQXDH lifecycle |
| **Total**                     | **192** |                                                                  |

### Test Categories

- **Unit tests**: Individual module correctness (errors, stores, KEM, X3DH)
- **Integration tests**: Full protocol flow from PQXDH through Triple Ratchet
- **Cross-platform simulation**: Web↔mobile messaging with 50-100 message exchanges
- **Adversarial tests**: Replay attacks, bit flips, header manipulation, version downgrade
- **Stress tests**: 200+ alternating messages, 1MB payloads, 5 concurrent sessions, reverse-order
  delivery
- **Property-based tests**: fast-check roundtrip, key uniqueness, ciphertext uniqueness
- **Protocol edge cases**: Empty messages, associated data, state export/import chains

## Integration Status

The `@cgraph/crypto` package is the **next-generation** E2EE implementation for CGraph. Currently:

| Platform | Status     | Current Implementation                      | Migration Path                        |
| -------- | ---------- | ------------------------------------------- | ------------------------------------- |
| Web      | 🔜 Planned | Local `lib/crypto/` (X3DH + Double Ratchet) | Replace with `@cgraph/crypto` imports |
| Mobile   | 🔜 Planned | Local `lib/crypto/` (simplified X3DH)       | Replace with `@cgraph/crypto` imports |
| Backend  | ✅ Ready   | Stores KEM pre-keys + EC pre-keys           | PQXDH bundle endpoints ready          |

Both web and mobile apps currently list `@cgraph/crypto` as a workspace dependency but use their own
local crypto implementations. The migration will replace those local implementations with imports
from this package.

## Dependencies

- [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum) — ML-KEM-768 (FIPS 203)
- [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) — HKDF, HMAC, SHA-256

## Consolidation Plan

### Current State (v0.9.31)

| Location                    | Implementation                              | Forward Secrecy | Post-Quantum |
| --------------------------- | ------------------------------------------- | --------------- | ------------ |
| `apps/web/src/lib/crypto/`  | 46 files, 4,859 LOC, full Double Ratchet    | Yes             | No           |
| `apps/mobile/src/lib/e2ee/` | 5 files, 1,058 LOC, X3DH only               | **No**          | No           |
| `packages/crypto/` (this)   | 13 files, 4,071 LOC, Triple Ratchet + PQXDH | Yes             | **Yes**      |

Neither web nor mobile currently imports this package. Both have independent implementations.

### Phase 1 — Shared Types & Utils (v0.9.x)

Extract common types and pure utility functions that both apps can import:

- `@cgraph/crypto/types` — `KeyPair`, `IdentityKeyPair`, `KeyBundle`, `EncryptedMessage`, `Session`
- `@cgraph/crypto/utils` — `randomBytes`, `hkdf`, `arrayBufferToBase64`, `base64ToArrayBuffer`

### Phase 2 — Mobile Forward Secrecy (v1.0)

Mobile must adopt Double Ratchet for security parity. This is a protocol upgrade:

1. Implement `ProtocolStore` interface from this package with `expo-secure-store` backend
2. Replace mobile's single-secret X3DH with this package's X3DH (or PQXDH)
3. Add ratchet state persistence via `ProtocolStore`

### Phase 3 — Full Consolidation (v1.0+)

Both apps delegate all crypto operations to `@cgraph/crypto`:

1. Web implements `ProtocolStore` with IndexedDB backend
2. Mobile implements `ProtocolStore` with SecureStore backend
3. App-level E2EE stores (Zustand) remain app-specific but call `@cgraph/crypto` APIs
4. Enable PQXDH + Triple Ratchet for post-quantum security

## License

Proprietary — see [LICENSE](../../LICENSE)
