# Security Architecture

This document describes the security architecture and features implemented in CGraph.

## Overview

CGraph implements industry-standard security practices across multiple layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
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

### 2. Security Headers

**Module:** `CgraphWeb.Plugs.SecurityHeaders`

OWASP-compliant security headers on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| Content-Security-Policy | default-src 'none'; ... | Prevent XSS |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer |
| Permissions-Policy | camera=(), microphone=(), ... | Restrict features |
| Cross-Origin-Opener-Policy | same-origin | Isolate context |

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

### 6. Rate Limiting

**Module:** `CgraphWeb.Plugs.RateLimiterV2`

Multi-algorithm rate limiting:

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| strict | 5 | 5 min | Authentication |
| standard | 1000 | 1 hour | General API |
| relaxed | 10000 | 1 hour | Read-heavy |

**Algorithms:**
- Token Bucket (burst allowance)
- Sliding Window (precise counting)
- Leaky Bucket (constant rate)
- Fixed Window (simple limits)

### 7. Audit Logging

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

### 8. End-to-End Encryption (E2EE)

**Module:** `Cgraph.Crypto.E2EE`

Industry-standard E2EE implementation for private messaging:

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2EE KEY HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Identity Key (Ed25519)         Long-term signing key          │
│   ├── Signed Prekey (X25519)     Medium-term key exchange       │
│   │   └── Signature              Identity key signature         │
│   └── One-Time Prekeys           Single-use keys (100 batch)    │
│                                                                  │
│   Key Exchange: X3DH (Extended Triple Diffie-Hellman)           │
│   Encryption: AES-256-GCM                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Usage:**

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

**Security Properties:**

| Property | Implementation |
|----------|----------------|
| Confidentiality | AES-256-GCM encryption |
| Forward Secrecy | One-time prekeys consumed per session |
| Key Verification | Safety numbers derived from identity keys |
| Key Freshness | Signed prekeys rotated periodically |
| Deniability | No digital signatures on messages |

**Key Lifecycle:**

1. **Identity Key**: Generated once per device, stored permanently
2. **Signed Prekey**: Rotated monthly, signed by identity key
3. **One-Time Prekeys**: Consumed once, replenished in batches of 100

**Privacy Guarantee:**
- Private keys NEVER leave the client device
- Server stores only public keys
- Message content is encrypted client-side before transmission
- Server sees only ciphertext (opaque blobs)

### 9. Voice Message Security

**Module:** `Cgraph.Messaging.VoiceMessage`

Secure handling of voice message recordings:

**Security Controls:**

| Control | Implementation |
|---------|----------------|
| Size Limit | 10 MB maximum |
| Duration Limit | 5 minutes maximum |
| Format Validation | Whitelist of audio MIME types |
| Rate Limiting | 10/minute, 100/hour per user |
| Storage | Encrypted at rest (S3/R2) |
| Access Control | Owner or conversation participants only |

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
- [x] JWT token revocation
- [x] Account lockout
- [x] Password breach checking
- [x] 2FA support
- [x] Audit logging
- [x] SQL injection prevention (Ecto)
- [x] XSS prevention (CSP)
- [x] CSRF protection (SameSite cookies)
- [x] End-to-End Encryption (E2EE)
- [x] Voice message security controls

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
