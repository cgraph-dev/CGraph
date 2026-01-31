# Architecture Decision Record: Signal Protocol E2EE

## Status

Accepted

## Date

2025-01-01

## Context

CGraph requires end-to-end encryption (E2EE) for private messages. We needed:

- Strong cryptographic security
- Forward secrecy (compromise of current keys doesn't reveal past messages)
- Future secrecy (recovery from compromise)
- Multi-device support

## Decision

We implemented **Signal Protocol** with:

- **X3DH** (Extended Triple Diffie-Hellman) for initial key exchange
- **Double Ratchet** for ongoing message encryption

### Key Components

```
lib/crypto/
├── e2ee.ts           # Core encryption/decryption
├── e2ee.secure.ts    # Key storage (IndexedDB)
├── e2eeStore.ts      # Zustand state management
├── sessionManager.ts # Double Ratchet session handling
└── doubleRatchet.ts  # Ratchet implementation
```

### Protocol Flow

1. **Key Generation**: Each user generates identity, signed prekey, and one-time prekeys
2. **Key Bundle Upload**: Public keys uploaded to server
3. **Session Initiation**: Sender fetches recipient's bundle, performs X3DH
4. **Message Exchange**: Double Ratchet provides forward secrecy per message

```typescript
// Encryption flow
const encrypted = await encryptForRecipient(recipientId, plaintext, recipientBundle);

// Decryption flow
const plaintext = await decryptFromSender(senderId, senderIdentityKey, encryptedMessage);
```

## Consequences

### Positive

- **Industry Standard**: Signal Protocol is battle-tested
- **Forward Secrecy**: Past messages protected even if keys compromised
- **Deniability**: Messages are cryptographically deniable
- **Async Friendly**: Works with offline recipients via prekeys

### Negative

- **Complexity**: Significant implementation effort
- **Key Management**: Users must manage multiple devices
- **Storage**: Session state requires local storage
- **No Server Search**: Server cannot index encrypted content

## Security Considerations

1. **Keys never leave device**: Private keys stored in IndexedDB
2. **No plaintext fallback**: Encryption failures throw errors
3. **Safety numbers**: Users can verify each other's identity keys
4. **Key rotation**: Signed prekeys rotated periodically

## Alternatives Considered

1. **Matrix Olm/Megolm**: Group encryption focused
   - Rejected: More complex, designed for room-based chat

2. **OpenPGP**: Email encryption standard
   - Rejected: No forward secrecy, bulky key format

3. **OMEMO (XMPP)**: Signal Protocol variant
   - Rejected: XMPP-specific, less well documented

## References

- [Signal Protocol Specification](https://signal.org/docs/)
- [X3DH Key Agreement](https://signal.org/docs/specifications/x3dh/)
- [Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
