# Architecture Decision Record: Post-Quantum Triple Ratchet E2EE

## Status

Accepted

## Date

2026-02-15

## Context

CGraph's original E2EE implementation (ADR-004) used Signal Protocol with X3DH key exchange and
Double Ratchet for message encryption. While cryptographically sound, this design:

- Provided no protection against future quantum computer attacks
- Used only classical elliptic curve key agreement (P-256 ECDH)
- Lacked a post-quantum key encapsulation layer
- Had three duplicate crypto implementations across the codebase

Signal's own Revision 4 specification introduced PQXDH and a post-quantum ratchet extension. We
needed to align with this updated standard.

## Decision

We upgraded to **Signal Protocol Revision 4** with:

- **PQXDH** (Post-Quantum Extended Diffie-Hellman) for initial key exchange
  - Hybrid: P-256 ECDH + ML-KEM-768 (NIST FIPS 203)
- **Triple Ratchet** for ongoing message encryption
  - EC Double Ratchet ∥ SPQR (Symmetric Post-Quantum Ratchet)
  - Combined via KDF_HYBRID key derivation

### Key Components

```
packages/crypto/
├── src/
│   ├── pqxdh.ts              # PQXDH key exchange (P-256 + ML-KEM-768)
│   ├── tripleRatchet.ts       # Triple Ratchet (EC DR ∥ SPQR)
│   ├── doubleRatchet.ts       # EC Double Ratchet (classical)
│   ├── spqr.ts                # Symmetric Post-Quantum Ratchet
│   ├── mlkem.ts               # ML-KEM-768 adapter
│   ├── sessionManager.ts      # Session lifecycle management
│   └── index.ts               # Public API
└── __tests__/
    ├── pqxdh.test.ts          # 22 tests
    ├── tripleRatchet.test.ts  # 20 tests
    ├── doubleRatchet.test.ts  # 22 tests
    ├── adversarial.test.ts    # 23 tests
    ├── stress.test.ts         # 16 tests
    └── ... (14 files, 192 tests total)
```

### Protocol Flow

1. **Key Generation**: Each user generates EC identity key + ML-KEM-768 keypair
2. **Key Bundle Upload**: Public keys (EC + PQ) uploaded to server
3. **Session Initiation**: Sender performs PQXDH with recipient's bundle
4. **Message Exchange**: Triple Ratchet provides post-quantum forward secrecy per message

```typescript
// PQXDH key exchange
const session = await pqxdh.initiateSession(identityKey, recipientBundle);

// Triple Ratchet encryption
const encrypted = await tripleRatchet.encrypt(session, plaintext);

// Triple Ratchet decryption
const plaintext = await tripleRatchet.decrypt(session, encrypted);
```

## Consequences

### Positive

- **Quantum Resistant**: ML-KEM-768 provides security against quantum attacks
- **Hybrid Safety**: If ML-KEM is broken, P-256 ECDH still protects
- **Signal Rev 4 Aligned**: Follows the latest Signal specification
- **Single Implementation**: Consolidated three duplicate crypto implementations into one package
- **192 Tests**: Comprehensive test coverage including adversarial and stress scenarios
- **Forward Secrecy**: Both classical and post-quantum forward secrecy

### Negative

- **Larger Key Bundles**: ML-KEM-768 public keys are ~1,184 bytes (vs ~32 bytes for X25519)
- **Increased Bandwidth**: Initial key exchange messages are larger
- **Complexity**: Triple Ratchet adds implementation complexity over Double Ratchet
- **Performance**: ML-KEM operations are slower than pure ECDH

## Security Considerations

1. **Hybrid approach**: Both classical and PQ algorithms must be broken to compromise
2. **KDF_HYBRID**: Combines EC and PQ ratchet outputs via HKDF
3. **No plaintext fallback**: Encryption failures throw errors (CVE fix from v0.9.22)
4. **Safety numbers**: Identity verification still supported
5. **Key rotation**: Both EC signed prekeys and ML-KEM keys rotated periodically

## Supersedes

- [ADR-004: Signal Protocol E2EE](004-signal-protocol-e2ee.md)

## References

- [Signal Protocol Revision 4](https://signal.org/docs/)
- [PQXDH Specification](https://signal.org/docs/specifications/pqxdh/)
- [NIST FIPS 203 (ML-KEM)](https://csrc.nist.gov/pubs/fips/203/final)
- [Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
