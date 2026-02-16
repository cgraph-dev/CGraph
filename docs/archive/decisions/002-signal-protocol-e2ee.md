# ADR-002: Signal Protocol for E2EE

## Status

**Accepted**

## Date

2025-07-15

## Authors

- @cgraph-dev/security-team

## Context

CGraph provides end-to-end encrypted direct messaging. Users expect that:

- Messages can only be read by sender and recipient
- Server cannot access message content
- Compromise of one message doesn't compromise all messages (forward secrecy)
- Even if long-term keys are compromised, past messages remain secure

We needed to choose an encryption protocol that provides these guarantees while remaining practical
for a real-time messaging application.

## Decision Drivers

- Cryptographic security (proven, audited protocols)
- Forward secrecy (per-message key derivation)
- Post-compromise security (self-healing after key compromise)
- Web browser compatibility (WebCrypto API support)
- Mobile compatibility (iOS/Android)
- User experience (seamless, no manual key management)

## Considered Options

### Option 1: Signal Protocol (X3DH + Double Ratchet)

**Description**: The protocol used by major messaging platforms for E2EE.

**Pros**:

- Battle-tested by billions of users
- Provides forward secrecy and post-compromise security
- Asynchronous key exchange (X3DH) works when recipient is offline
- Well-documented with open-source implementations
- Audited multiple times

**Cons**:

- Complex to implement correctly
- Requires server-side prekey management
- Key verification UX challenges

### Option 2: Matrix Olm/Megolm

**Description**: E2EE protocol used by Matrix/Element.

**Pros**:

- Designed for decentralized systems
- Megolm efficient for group chats
- Open specification

**Cons**:

- Less mature than Signal Protocol
- Fewer security audits
- More complex architecture

### Option 3: Custom AES-GCM with static keys

**Description**: Simple symmetric encryption with pre-shared keys.

**Pros**:

- Simple to implement
- Fast encryption/decryption

**Cons**:

- No forward secrecy
- Key compromise exposes all messages
- Key exchange requires out-of-band coordination

### Option 4: PGP/GPG

**Description**: Classic public key encryption.

**Pros**:

- Well-understood
- Long track record

**Cons**:

- No forward secrecy
- Poor UX for real-time messaging
- Key management burden on users

## Decision

**Chosen option: Signal Protocol (X3DH + Double Ratchet)**

We chose the Signal Protocol because:

1. **Proven security**: Used by Signal, CGraph (3B users), messaging platforms
2. **Forward secrecy**: Each message uses a unique key derived via ratcheting
3. **Post-compromise recovery**: Ratchet "heals" after temporary key compromise
4. **Async support**: X3DH allows sending messages to offline recipients
5. **Audit history**: Multiple independent security audits

## Implementation Details

### Key Exchange (X3DH)

```
Alice                           Server                          Bob
  |                               |                               |
  |---- Fetch Bob's Bundle ------>|                               |
  |<--- {IK_B, SPK_B, OPK_B} -----|                               |
  |                               |                               |
  | DH1 = DH(IK_A, SPK_B)        |                               |
  | DH2 = DH(EK_A, IK_B)         |                               |
  | DH3 = DH(EK_A, SPK_B)        |                               |
  | DH4 = DH(EK_A, OPK_B)        |                               |
  | SK = KDF(DH1 || DH2 || DH3 || DH4)                           |
  |                               |                               |
  |---- Encrypted Message ------->|---- Forward to Bob --------->|
```

### Double Ratchet

Each message advances a symmetric ratchet:

- Sending chain: Derive new key for each outgoing message
- Receiving chain: Derive new key for each incoming message
- DH ratchet: Periodically regenerate ephemeral keys

### Algorithms Used

| Component      | Algorithm   |
| -------------- | ----------- |
| Key agreement  | X25519      |
| Encryption     | AES-256-GCM |
| Key derivation | HKDF-SHA256 |
| Signatures     | Ed25519     |

## Consequences

### Positive

- Messages have perfect forward secrecy
- Compromised key doesn't expose message history
- Protocol self-heals after temporary compromise
- Users don't need to manage keys manually

### Negative

- Complex implementation (high risk of bugs)
- **No external audit yet** (planned for Q1 2026)
- Client-side key storage security critical
- Recent bug: plaintext fallback vulnerability (fixed Jan 2026)

### Neutral

- Server stores only public keys
- Key verification requires safety number comparison

## Security Considerations

⚠️ **WARNING**: This is a custom implementation of Signal Protocol concepts. While we follow the
specification, **a formal security audit is required before claiming production-grade security**.

### Known Risks

1. Implementation bugs (mitigated by code review)
2. Side-channel attacks (mitigated by constant-time operations)
3. Key storage compromise (mitigated by platform secure storage)
4. Fallback to plaintext (mitigated by blocking, fixed in v0.9.5)

## Related Decisions

- ADR-003: Client-side key storage
- ADR-005: E2EE error handling policy

## References

- [Signal Protocol Technical Documentation](https://signal.org/docs/)
- [X3DH Key Agreement Protocol](https://signal.org/docs/specifications/x3dh/)
- [Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
- [CGraph E2EE Security Fix](../../../docs/E2EE_SECURITY_FIX.md)
