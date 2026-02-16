# Security Architecture

> **⚠️ Security Maturity Disclaimer**
>
> CGraph's end-to-end encryption is **Signal Protocol-inspired** but **custom-implemented** using
> the Web Crypto API. While we follow cryptographic best practices (PQXDH key agreement, Triple
> Ratchet, AES-256-GCM), our implementation has **not undergone formal third-party security audit**.
>
> **What this means:**
>
> - ✅ We use well-established cryptographic primitives (P-256 ECDH, ML-KEM-768, AES-256-GCM, HKDF)
> - ✅ We implement Signal Protocol Rev 4 patterns (PQXDH, Triple Ratchet, forward secrecy)
> - ⚠️ We do NOT use libsignal or other audited implementations
> - ⚠️ Custom crypto code may contain implementation bugs
> - 🔜 Third-party audit is planned (see [SECURITY_ROADMAP.md](./SECURITY_ROADMAP.md))
>
> For high-risk threat models, we recommend evaluating the
> [source code](https://github.com/bluscreams/CGraph/tree/main/apps/web/src/lib/crypto) directly.

---

Look, security is one of those things that's easy to get wrong and really hard to fix after the
fact. We've put a lot of thought into how CGraph handles authentication, authorization, and data
protection — and we think we've gotten it right. But security is also a moving target, so if you
spot something off, please let us know.

**v0.7.47 introduces critical security hardening** — 2FA brute force protection, race condition
fixes, and safe parameter parsing across all controllers.

**v0.7.35 introduced PQXDH + Triple Ratchet encryption** — using post-quantum hybrid cryptographic
patterns for industry-leading security.

This doc explains what we've built and why. It's not exhaustive (that would be a book), but it
covers the stuff you actually need to know.

## Overview

We've layered our security like an onion — multiple defenses at different levels. If one layer
fails, the others still protect you. Here's the high-level picture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client-Side E2EE (v0.7.35)                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                PQXDH + TRIPLE RATCHET LAYER               │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│   │  │   PQXDH     │  │   Triple    │  │  AES-256    │      │   │
│   │  │    Key      │──│   Ratchet   │──│    GCM      │      │   │
│   │  │  Agreement  │  │   Engine    │  │ Encryption  │      │   │
│   │  │ (P-256+KEM) │  │             │  │             │      │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│   │                                                          │   │
│   │  Properties: Forward Secrecy | Break-in Recovery         │   │
│   │              Out-of-Order Support | Post-Quantum Ready   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Request Flow                                                   │
│   ┌─────────────┐                                               │
│   │   Client    │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │  Security   │────►│    Rate     │────►│    Auth     │      │
│   │  Headers    │     │   Limiter   │     │  Pipeline   │      │
│   └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                   │             │
│                              ┌────────────────────┴──────┐      │
│                              ▼                           ▼      │
│                       ┌─────────────┐            ┌────────────┐ │
│                       │   Token     │            │  Account   │ │
│                       │ Blacklist   │            │  Lockout   │ │
│                       └─────────────┘            └────────────┘ │
│                                                                  │
│   Additional Security Layers:                                   │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │  Password   │  │    2FA      │  │   Audit     │            │
│   │   Breach    │  │   TOTP      │  │   Logging   │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PQXDH + Triple Ratchet E2EE (current)

Post-quantum hybrid E2EE following Signal Protocol Revision 4. Every message uses a unique key,
providing perfect forward secrecy and future secrecy with post-quantum resistance.

### Implementation Details

**Package:** `packages/crypto/src/` (~2,800 lines)

| Algorithm      | Specification                                    |
| -------------- | ------------------------------------------------ |
| Key Agreement  | PQXDH (P-256 ECDH + ML-KEM-768 post-quantum KEM) |
| Curve          | ECDH P-256 (NIST approved)                       |
| Post-Quantum   | ML-KEM-768 via @noble/post-quantum               |
| Ratcheting     | Triple Ratchet (EC Double Ratchet ∥ SPQR)        |
| Encryption     | AES-256-GCM (authenticated)                      |
| Key Derivation | HKDF-SHA256                                      |
| MAC            | HMAC-SHA256                                      |

### Security Properties

| Property              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| **Forward Secrecy**   | Compromise of long-term keys doesn't reveal past messages |
| **Break-in Recovery** | Session automatically heals after key compromise          |
| **Out-of-Order**      | Handles delayed/reordered messages securely               |
| **Key Erasure**       | Message keys deleted after use                            |
| **Post-Quantum**      | ML-KEM-768 via PQXDH protects against quantum attacks     |

### How the Triple Ratchet Works

```
Alice                                                    Bob
  │                                                       │
  │─────── Initial PQXDH Key Agreement ───────────────────│
  │        (P-256 ECDH + ML-KEM-768 encapsulation)        │
  │                                                       │
  │──[DH Ratchet]── Message 1 ─────────────────────────►│
  │                 (New DH key pair)                     │
  │                                                       │
  │◄─[DH Ratchet]── Message 2 ──────────────────────────│
  │                 (New DH key pair)                     │
  │                                                       │
  │──[Symmetric]─── Message 3 ─────────────────────────►│
  │                 (Same DH, new chain key)              │
  │                                                       │
  │──[Symmetric]─── Message 4 ─────────────────────────►│
  │                 (Same DH, new chain key)              │
  │                                                       │
  │◄─[DH Ratchet]── Message 5 ──────────────────────────│
  │                 (New DH key pair again)               │
```

### Usage Example

```typescript
import { TripleRatchetEngine, generateDHKeyPair } from '@cgraph/crypto';

// Initialize session
const alice = new TripleRatchetEngine({ enableAuditLog: true });
const sharedSecret = await pqxdhKeyAgreement(aliceIdentity, bobPreKey, bobKyberKey);

await alice.initializeAlice(sharedSecret, bobPublicKey);

// Encrypt message - each message gets a unique key
const encrypted = await alice.encryptMessage(
  new TextEncoder().encode('Secret message'),
  associatedData // Optional: conversation ID, etc.
);

// encrypted contains: { header, ciphertext, nonce, mac }
```

### Cryptographic Audit Log

When `enableAuditLog: true`:

```typescript
const log = engine.getAuditLog();
// [
//   { timestamp: 1736..., action: 'INIT_ALICE', success: true },
//   { timestamp: 1736..., action: 'ENCRYPT_START', success: true },
//   { timestamp: 1736..., action: 'DH_RATCHET', success: true },
//   { timestamp: 1736..., action: 'ENCRYPT_COMPLETE', success: true }
// ]
```

### Post-Quantum Status

```typescript
import { TripleRatchetEngine } from '@cgraph/crypto';

// ML-KEM-768 is shipped and active in PQXDH key agreement.
// No placeholder — post-quantum is the default path.
const engine = new TripleRatchetEngine();
await engine.initializeWithQuantumResistance(sharedSecret, peerPublicKey);
```

---

## Security Features

### 1. JWT Token Revocation

**Module:** `Cgraph.Security.TokenBlacklist`

Tokens can be revoked before their natural expiration:

```elixir
# Revoke on logout
TokenBlacklist.revoke(token, reason: :logout, user_id: user.id)

# Revoke all tokens for a user (password change, security breach)
TokenBlacklist.revoke_all_for_user(user.id, reason: :password_change)

# Check if token is revoked
TokenBlacklist.revoked?(token)
```

**Features:**

- Multi-tier storage (Cachex → ETS → Redis)
- Sub-millisecond lookups
- JTI-based revocation for efficiency
- User-level mass revocation
- Automatic cleanup of expired entries

**Storage Architecture:**

- L1: Cachex (hot cache, <1ms)
- L2: ETS bloom filter (<1ms)
- L3: Redis (persistent, <5ms)

### 2. HTTP-Only Cookie Authentication (v0.7.24+)

**Module:** `CgraphWeb.Plugs.CookieAuth`

Web clients now use HTTP-only cookies for JWT storage, preventing XSS-based token theft:

**Cookie Configuration:** | Cookie | Max Age | Flags | |--------|---------|-------| |
`cgraph_access_token` | 15 minutes | HttpOnly, Secure, SameSite=Strict | | `cgraph_refresh_token` |
7 days | HttpOnly, Secure, SameSite=Strict |

**Security Benefits:**

- Tokens inaccessible to JavaScript (prevents XSS theft)
- Automatic CSRF protection via SameSite=Strict
- Cookies only sent over HTTPS (Secure flag)
- Seamless integration with existing Guardian JWT pipeline

**Client Compatibility:**

- **Web:** Uses cookies automatically with `withCredentials: true`
- **Mobile:** Continues using Authorization header with native secure storage
- **API:** Both cookie and header auth supported simultaneously

**How It Works:**

1. Login/register endpoints set HTTP-only cookies alongside JSON response
2. `CookieAuth` plug extracts token from cookie if no Authorization header present
3. Token is injected into connection for Guardian to verify
4. Logout clears cookies with immediate expiration

### 3. Security Headers

**Module:** `CgraphWeb.Plugs.SecurityHeaders`

OWASP-compliant security headers on all responses:

| Header                     | Value                                        | Purpose               |
| -------------------------- | -------------------------------------------- | --------------------- |
| Strict-Transport-Security  | max-age=31536000; includeSubDomains; preload | Force HTTPS           |
| Content-Security-Policy    | default-src 'none'; ...                      | Prevent XSS           |
| X-Content-Type-Options     | nosniff                                      | Prevent MIME sniffing |
| X-Frame-Options            | DENY                                         | Prevent clickjacking  |
| Referrer-Policy            | strict-origin-when-cross-origin              | Control referrer      |
| Permissions-Policy         | camera=(), microphone=(), ...                | Restrict features     |
| Cross-Origin-Opener-Policy | same-origin                                  | Isolate context       |

**Configuration:**

```elixir
config :cgraph, CgraphWeb.Plugs.SecurityHeaders,
  hsts: true,
  hsts_max_age: 31_536_000,
  content_security_policy: :strict
```

### 3. Account Lockout

**Module:** `Cgraph.Security.AccountLockout`

Progressive lockout system to prevent brute force attacks:

```elixir
# Check before authentication
case AccountLockout.check_locked(email) do
  :ok -> proceed_with_auth()
  {:locked, remaining_seconds} -> return_429(remaining_seconds)
end

# Record failed attempt
AccountLockout.record_failed_attempt(email, ip_address: ip)

# Clear on successful login
AccountLockout.clear_attempts(email)
```

**Default Configuration:**

- Max attempts: 5
- Initial lockout: 15 minutes
- Progressive multiplier: 2x
- Max lockout: 24 hours
- Attempt window: 1 hour

**Progressive Lockout Duration:**

1. First lock: 15 minutes
2. Second lock: 30 minutes
3. Third lock: 1 hour
4. Fourth lock: 2 hours
5. Fifth lock+: 24 hours (max)

### 4. Password Breach Detection

**Module:** `Cgraph.Security.PasswordBreachCheck`

Checks passwords against HaveIBeenPwned database using k-anonymity:

```elixir
# Check a password
case PasswordBreachCheck.check(password) do
  {:ok, :safe} -> proceed()
  {:ok, {:breached, count}} -> warn_or_reject(count)
  {:error, _} -> proceed_with_caution()
end

# Validate in changeset
PasswordBreachCheck.validate_changeset(changeset, :password)

# Async check (non-blocking)
PasswordBreachCheck.check_async(password, user_id: user.id)
```

**Privacy Guarantee:**

- Only first 5 characters of SHA-1 hash sent to API
- HIBP cannot determine which password you're checking
- Full password never leaves your server

### 5. Two-Factor Authentication (TOTP)

**Module:** `Cgraph.Security.TOTP`

RFC 6238 compliant TOTP implementation:

```elixir
# Setup 2FA
{:ok, setup} = TOTP.setup_2fa(user)
# Returns secret, QR code URI, and backup codes

# Verify and enable
{:ok, user} = TOTP.verify_and_enable(user, code, secret, backup_codes)

# Verify during login
:ok = TOTP.verify(user, code)

# Use backup code
{:ok, remaining} = TOTP.use_backup_code(user, backup_code)

# Disable 2FA (requires valid code)
{:ok, user} = TOTP.disable_2fa(user, code)
```

**Features:**

- Standard 30-second time windows
- ±1 window drift tolerance
- 10 backup codes per user
- Encrypted secret storage
- Backup codes are hashed (one-way)

**Supported Authenticator Apps:**

- Google Authenticator
- Authy
- Microsoft Authenticator
- 1Password
- Any RFC 6238 compliant app

#### 2FA Brute Force Protection (v0.7.47+)

**Module:** `CgraphWeb.Plugs.TwoFactorRateLimiter`

Progressive lockout system to prevent brute force attacks on 2FA codes:

```elixir
# Applied to all 2FA endpoints
plug CgraphWeb.Plugs.TwoFactorRateLimiter when action in [:verify, :enable, :disable, :use_backup_code]
```

| Threshold               | Action                   |
| ----------------------- | ------------------------ |
| 5 failures in 5 minutes | 15-minute lockout        |
| 3 lockout periods       | 24-hour extended lockout |
| Successful verification | All counters reset       |

**Implementation Details:**

- Redis-backed tracking via `Redix`
- Automatic key expiration (no manual cleanup)
- User-specific tracking (not IP-based)
- Registers success/failure via `Plug.Conn.register_before_send`

**Response on Lockout:**

```json
{
  "error": "too_many_attempts",
  "message": "Too many 2FA attempts. Please try again later.",
  "locked_until": "2026-01-11T15:30:00Z",
  "retry_after": 900
}
```

### 6. OAuth Authentication Security

**Module:** `Cgraph.OAuth`

OAuth 2.0 / OpenID Connect authentication with multiple identity providers:

**Supported Providers:** | Provider | Protocol | Features | |----------|----------|----------| |
Google | OAuth 2.0 + OIDC | Email verification, profile info | | Apple | Sign in with Apple |
Privacy-focused, email relay | | Facebook | OAuth 2.0 | Profile, friends (optional) | | TikTok |
OAuth 2.0 | Login Kit integration |

**Security Implementation:**

```elixir
# OAuth flow is PKCE-enabled for mobile
{:ok, auth_url, state} = OAuth.authorize_url(:google, %{
  redirect_uri: redirect_uri,
  code_challenge: code_challenge,
  code_challenge_method: "S256"
})

# State parameter prevents CSRF attacks
{:ok, user, tokens} = OAuth.callback(:google, code, state)

# Token exchange with secure storage
OAuth.mobile_callback(:google, %{
  access_token: token,
  id_token: id_token  # Verified via JWKS
})
```

**Security Features:**

- **State Parameter**: Cryptographically random, prevents CSRF
- **PKCE**: Proof Key for Code Exchange for mobile/SPA flows
- **ID Token Verification**: JWTs verified against provider JWKS endpoints
- **Token Storage**: OAuth tokens encrypted at rest using `cloak_ecto`
- **Account Linking**: Secure linking with existing accounts requires authentication
- **Provider Validation**: Only configured providers allowed

**Data Handling:**

- Minimal data collection (email, name, avatar only)
- OAuth tokens stored encrypted
- Tokens can be revoked per-provider
- Provider-specific privacy settings respected

**Apple Sign In Specifics:**

- Supports email relay (Hide My Email)
- User info only provided on first authorization
- Server-to-server token validation
- JWT signed with Apple private key

### 7. Rate Limiting

**Module:** `CgraphWeb.Plugs.RateLimiterV2`

Multi-algorithm distributed rate limiting with Redis backend:

| Tier     | Limit | Window | Use Case       |
| -------- | ----- | ------ | -------------- |
| strict   | 5     | 5 min  | Authentication |
| standard | 1000  | 1 hour | General API    |
| relaxed  | 10000 | 1 hour | Read-heavy     |

**Algorithms:**

- Token Bucket (burst allowance)
- Sliding Window (precise counting)
- Leaky Bucket (constant rate)
- Fixed Window (simple limits)

#### Trusted Proxy Enforcement (v0.9.5+)

The rate limiter validates X-Forwarded-For headers only from trusted sources:

```elixir
# Trusted CIDR ranges
@trusted_cidrs [
  # Cloudflare IPv4
  "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "104.16.0.0/13", "104.24.0.0/14", "108.162.192.0/18",
  "131.0.72.0/22", "141.101.64.0/18", "162.158.0.0/15",
  "172.64.0.0/13", "173.245.48.0/20", "188.114.96.0/20",
  "190.93.240.0/20", "197.234.240.0/22", "198.41.128.0/17",
  # Private networks
  "127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"
]
```

This prevents IP spoofing attacks where malicious clients set fake X-Forwarded-For headers.

#### WebSocket Rate Limiting

Real-time message channels include built-in rate limiting to prevent spam and DoS attacks:

| Parameter    | Value      | Description                     |
| ------------ | ---------- | ------------------------------- |
| Window       | 10 seconds | Sliding window duration         |
| Max Messages | 10         | Maximum messages per window     |
| Per User     | Yes        | Each user tracked independently |

**Implementation:**

```elixir
# Sliding window rate limit check
defp check_rate_limit(socket) do
  now = System.monotonic_time(:millisecond)
  window_start = now - @rate_limit_window_ms
  recent = socket.assigns[:rate_limit_messages] || []
  recent = Enum.filter(recent, fn ts -> ts > window_start end)

  if length(recent) >= @rate_limit_max_messages do
    {:error, :rate_limited, socket}
  else
    {:ok, assign(socket, :rate_limit_messages, [now | recent])}
  end
end
```

**Channels Protected:**

- `ConversationChannel` - Direct messages
- `GroupChannel` - Group/channel messages

### 8. Safe Parameter Parsing (v0.7.47+)

**Module:** `CgraphWeb.Helpers.ParamParser`

All API controllers use safe parameter parsing to prevent crashes and injection attacks:

```elixir
import CgraphWeb.Helpers.ParamParser

# Safe integer parsing with bounds
page = parse_int(params["page"], 1, min: 1)
per_page = parse_int(params["per_page"], 20, min: 1, max: 100)
quantity = parse_int(params["quantity"], 1, min: 1, max: 100)

# Safe atom parsing (prevents atom table exhaustion)
sort = parse_atom(params["sort"], :created, [:created, :updated, :name])
direction = parse_atom(params["direction"], :desc, [:asc, :desc])

# Other safe parsers
uuid = parse_uuid(params["id"])           # Returns nil if invalid
date = parse_date(params["start"], ~D[2026-01-01])  # With default
active = parse_bool(params["active"], false)
```

**Security Benefits:**

- Prevents uncaught exceptions from malformed input
- Enforces min/max bounds on numeric parameters
- Whitelist-based atom parsing prevents atom table exhaustion attacks
- Returns safe defaults instead of crashing

**Protected Endpoints:** All 20+ API controllers including:

- ForumController, PostController, CommentController
- UserController, FriendController, GroupController
- MessageController, NotificationController, SearchController
- GamificationController, ShopController, CoinsController

### 9. Audit Logging

**Module:** `Cgraph.Audit`

Comprehensive audit trail for compliance:

```elixir
Audit.log(:auth, :login_success, %{
  user_id: user.id,
  ip_address: ip,
  user_agent: ua
})
```

**Event Categories:**

- `auth`: Login, logout, password changes
- `user`: Profile updates, email changes
- `admin`: Bans, config changes
- `data`: Export, access, modification
- `security`: Rate limits, blocked requests

**Retention Periods:**

- Security events: 7 years
- Admin actions: 5 years
- User actions: 2 years
- General: 1 year

### 9. End-to-End Encryption (E2EE)

**Module:** `Cgraph.Crypto.E2EE`

**Current Status: FULLY ACTIVE (v0.7.26+)**

End-to-end encryption is now integrated into the message flow across all clients. Messages in direct
conversations are encrypted on the sender's device and can only be decrypted by the intended
recipient.

**Implementation Status:**

| Component                 | Status      | Notes                                          |
| ------------------------- | ----------- | ---------------------------------------------- |
| Server Key Storage        | ✅ Complete | Full PQXDH key hierarchy support               |
| Key Registration API      | ✅ Complete | `/api/v1/e2ee/keys` endpoint                   |
| Prekey Bundle API         | ✅ Complete | `/api/v1/e2ee/bundle/:user_id`                 |
| Web Crypto Module         | ✅ Complete | `lib/crypto/e2ee.ts`                           |
| Mobile Crypto Module      | ✅ Complete | `lib/crypto/e2ee.ts`                           |
| Web Message Encryption    | ✅ Complete | `chatStore.sendMessage()` encrypts before send |
| Mobile Message Encryption | ✅ Complete | `ConversationScreen` uses `useE2EE` hook       |
| Backend Metadata Handling | ✅ Complete | `message_controller.ex` preserves E2EE fields  |
| Key Verification UI       | 📋 Planned  | Safety number display                          |

**How It Works:**

1. When a user sends a message, the client fetches the recipient's public key bundle
2. Using PQXDH, a shared secret is derived (P-256 ECDH + ML-KEM-768 encapsulation)
3. The Triple Ratchet derives per-message keys with post-quantum forward secrecy
4. The message content is encrypted with AES-256-GCM using the derived key
5. Encrypted payload, ephemeral public key, and nonce are sent to the server
6. The server stores the encrypted blob and metadata (cannot decrypt)
7. Recipient fetches the message and decrypts using their private key

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2EE KEY HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Identity Key (P-256 ECDSA)     Long-term signing key          │
│   ├── Signed Prekey (P-256 ECDH)  Medium-term key exchange       │
│   │   └── Signature              Identity key signature         │
│   ├── One-Time Prekeys (P-256)   Single-use keys (100 batch)    │
│   └── Kyber Prekeys (ML-KEM-768) Post-quantum prekeys            │
│                                                                  │
│   Key Exchange: PQXDH (P-256 ECDH + ML-KEM-768)                 │
│   Ratcheting: Triple Ratchet (EC DR ∥ SPQR)                     │
│   Encryption: AES-256-GCM                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Security Properties:**

- **Forward Secrecy**: Compromising long-term keys does not expose past messages
- **Cryptographic Deniability**: Recipients cannot prove who sent a message
- **Break-in Recovery**: One-time prekeys limit damage from session compromise

**Fallback Behavior:**

If E2EE encryption fails (missing keys, crypto errors), the system logs the error and falls back to
transport encryption. This maintains availability while alerting operators to key distribution
issues.

**Server-Side API Usage:**

```elixir
# Client registers their public keys
{:ok, result} = E2EE.register_keys(user_id, %{
  identity_key: base64_public_key,
  device_id: device_uuid,
  signed_prekey: base64_signed_prekey,
  prekey_signature: base64_signature,
  one_time_prekeys: [{1, base64_key1}, {2, base64_key2}, ...]
})

# Get recipient's keys for session establishment
{:ok, bundle} = E2EE.get_prekey_bundle(recipient_id)

# Check prekey count (replenish when < 25)
count = E2EE.one_time_prekey_count(user_id)

# Generate safety number for verification
{:ok, safety_number} = E2EE.safety_number(user1_id, user2_id)
```

**Target Security Properties (When Fully Integrated):**

| Property         | Implementation                                                   |
| ---------------- | ---------------------------------------------------------------- |
| Confidentiality  | AES-256-GCM encryption                                           |
| Forward Secrecy  | One-time prekeys consumed per session + key revocation broadcast |
| Key Verification | Safety numbers derived from identity keys                        |
| Key Freshness    | Signed prekeys rotated periodically                              |
| Key Revocation   | Immediate broadcast to all contacts via WebSocket                |
| Deniability      | No digital signatures on messages                                |

**Key Revocation:**

When a user revokes a compromised key (e.g., lost device):

1. Server marks the key as revoked in the database
2. `e2ee:key_revoked` event is broadcast to all contacts via their `user:{id}` channel
3. Client-side E2EE stores invalidate cached prekey bundles for the affected user
4. Future encryption requests fetch fresh key bundles from the server

This ensures Forward Secrecy by preventing encryption to compromised keys.

**Key Lifecycle:**

1. **Identity Key**: Generated once per device, stored in SecureStore (mobile) or IndexedDB (web)
2. **Signed Prekey**: Rotated monthly, signed by identity key
3. **One-Time Prekeys**: Consumed once, replenished in batches of 100

**Privacy Guarantee (Target State):**

- Private keys NEVER leave the client device
- Server stores only public keys
- Message content encrypted client-side before transmission
- Server sees only ciphertext (opaque blobs)

### 10. Voice Message Security

**Module:** `Cgraph.Messaging.VoiceMessage`

Secure handling of voice message recordings:

**Security Controls:**

| Control           | Implementation                          |
| ----------------- | --------------------------------------- |
| Size Limit        | 10 MB maximum                           |
| Duration Limit    | 5 minutes maximum                       |
| Format Validation | Whitelist of audio MIME types           |
| Rate Limiting     | 10/minute, 100/hour per user            |
| Storage           | Encrypted at rest (S3/R2)               |
| Access Control    | Owner or conversation participants only |

**Supported Formats:**

- `audio/webm` (Opus) - Web preferred
- `audio/m4a` (AAC) - iOS preferred
- `audio/ogg`, `audio/mp3`, `audio/wav`

**Processing Pipeline:**

1. Validate format and size
2. Store original securely
3. Extract metadata (duration, waveform)
4. Transcode to Opus for optimal playback
5. Generate signed URLs for access

## CI/CD Security Scanning (v0.9.3)

We've integrated automated security scanning into our CI/CD pipeline to catch vulnerabilities before
they reach production. Two complementary tools run on every push and pull request:

### Semgrep SAST

Semgrep provides fast, pattern-based static analysis:

```yaml
# .github/workflows/semgrep.yml
name: Semgrep SAST
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep ci
```

**What it catches:**

- Hardcoded credentials and secrets
- SQL injection patterns
- Command injection vulnerabilities
- Insecure deserialization
- XSS vulnerabilities
- OWASP Top 10 issues

**Custom rules** are defined in `.semgrep/` for CGraph-specific patterns:

- Unsafe Phoenix controller patterns
- Missing authentication checks
- Insecure cryptography usage
- Exposed debug endpoints

### CodeQL Analysis

GitHub's CodeQL provides deep semantic analysis:

```yaml
# .github/workflows/codeql.yml
name: CodeQL Analysis
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 6 * * 1' # Weekly full scan

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    strategy:
      matrix:
        language: [javascript, typescript]
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/analyze@v3
```

**What it catches:**

- Data flow vulnerabilities
- Taint tracking across function boundaries
- Security-sensitive API misuse
- Complex injection patterns
- Prototype pollution

### Security Gate Policy

Pull requests are blocked if:

- **Critical** or **High** severity findings are detected
- Security scan fails to complete
- New vulnerabilities are introduced (delta scan)

Results are posted as PR comments and tracked in GitHub Security tab.

### Local Security Scanning

Developers can run scans locally before pushing:

```bash
# Run Semgrep locally
pnpm security:scan

# Run specific ruleset
semgrep --config=p/owasp-top-ten .

# Scan only changed files
semgrep --config=.semgrep/ --diff-depth=2
```

## JWT Configuration

```elixir
# Production recommended settings
config :cgraph, :jwt_access_token_ttl, 900       # 15 minutes
config :cgraph, :jwt_refresh_token_ttl, 604_800  # 7 days
```

Tokens include:

- `sub`: User ID
- `jti`: Unique token ID for revocation
- `typ`: Token type (access/refresh)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

## API Security Checklist

- [x] HTTPS enforced (HSTS)
- [x] Content Security Policy
- [x] Clickjacking protection
- [x] MIME sniffing prevention
- [x] Rate limiting on all endpoints
- [x] Strict rate limiting on auth endpoints
- [x] Trusted proxy CIDR enforcement (v0.9.5+)
- [x] JWT token revocation
- [x] HTTP-only session cookies (v0.9.5+)
- [x] Account lockout
- [x] Password breach checking
- [x] 2FA support
- [x] Audit logging
- [x] SQL injection prevention (Ecto)
- [x] XSS prevention (CSP)
- [x] CSRF protection (SameSite cookies)
- [x] End-to-End Encryption (E2EE) - Server infrastructure ready
- [x] Voice message security controls
- [x] Magic byte file validation (v0.7.23+, enhanced v0.9.5)
- [x] Message idempotency (v0.7.23+)
- [x] Semgrep SAST scanning (v0.9.3+)
- [x] CodeQL semantic analysis (v0.9.3+)
- [x] Security gate on PRs (v0.9.3+)
- [x] Stripe webhook verification (v0.9.5+)

## Security Telemetry Events

```elixir
# Token events
[:cgraph, :security, :token_revoked]
[:cgraph, :security, :token_check]
[:cgraph, :security, :mass_revocation]

# Account events
[:cgraph, :security, :login_failed]
[:cgraph, :security, :account_locked]
[:cgraph, :security, :account_unlocked]

# Password events
[:cgraph, :security, :password_breach_check]
[:cgraph, :security, :password_breached]

# 2FA events
[:cgraph, :security, :totp_enabled]
[:cgraph, :security, :totp_disabled]
[:cgraph, :security, :totp_backup_code_used]

# Header events
[:cgraph, :security, :headers_applied]
```

## Environment Variables

```bash
# JWT Settings
JWT_SECRET=your-256-bit-secret
JWT_ACCESS_TOKEN_TTL=900          # 15 minutes
JWT_REFRESH_TOKEN_TTL=604800      # 7 days

# Security Settings
ENABLE_PASSWORD_BREACH_CHECK=true
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION=900              # 15 minutes

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

## Best Practices

1. **Always use HTTPS** - HSTS is enabled by default
2. **Rotate JWT secrets** regularly in production
3. **Monitor security events** via telemetry
4. **Enable 2FA** for admin accounts
5. **Review audit logs** for suspicious activity
6. **Keep dependencies updated** for security patches
7. **Use strong passwords** - breach check is enabled by default

## Incident Response

In case of a security incident:

1. **Revoke all user tokens:**

   ```elixir
   Guardian.revoke_all_user_tokens(user_id, :security_breach)
   ```

2. **Lock the account:**

   ```elixir
   AccountLockout.record_failed_attempt(email)
   # Repeat until locked
   ```

3. **Review audit logs:**

   ```elixir
   Audit.query(user_id: user_id, from: incident_time)
   ```

4. **Force password reset:**

   ```elixir
   Accounts.request_password_reset(email)
   ```

5. **Disable 2FA if compromised:**
   - Use admin unlock if user can't access account
