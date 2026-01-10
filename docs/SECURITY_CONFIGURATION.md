# Security Configuration Guide

> **Version**: 0.7.33
> **Status**: CRITICAL SECURITY UPDATE
> **Last Updated**: 2026-01-10

## 🔒 Overview

This document outlines the security fixes implemented in v0.7.33 to address critical vulnerabilities identified in the security audit (CVE-CGRAPH-2026-001 through CVE-CGRAPH-2026-008).

---

## 🚨 Critical Security Fixes

### CVE-CGRAPH-2026-001: E2EE Private Keys in Unencrypted localStorage

**Severity**: CRITICAL (CVSS 9.1)
**Status**: ✅ FIXED in v0.7.33

**Problem**:
```typescript
// INSECURE - Old implementation
localStorage.setItem('cgraph_e2ee_identity', JSON.stringify(privateKey));
```

**Solution**:
```typescript
// SECURE - New implementation
import SecureStorage from '@/lib/crypto/secureStorage';

// Initialize with user password
await SecureStorage.initialize(userPassword);

// Store encrypted
await SecureStorage.setItem('e2ee_identity_key', JSON.stringify(privateKey));
```

**Implementation**:
- ✅ Created `secureStorage.ts` - AES-256-GCM encrypted IndexedDB
- ✅ Created `e2ee.secure.ts` - Secure drop-in replacement
- ✅ Created `migrateToSecureStorage.ts` - Migration utility
- ✅ PBKDF2 key derivation (600,000 iterations)
- ✅ Device-specific salts
- ✅ Non-extractable encryption keys

**Migration Steps**:
```typescript
import { migrateToSecureStorage } from '@/lib/crypto/migrateToSecureStorage';

// On user login (when password is available)
const result = await migrateToSecureStorage(userPassword);

if (result.success) {
  console.log('Migrated keys:', result.migratedKeys);
} else {
  console.error('Migration errors:', result.errors);
}
```

---

### CVE-CGRAPH-2026-002: JWT Tokens in sessionStorage (XSS Vulnerable)

**Severity**: HIGH (CVSS 8.5)
**Status**: ⚠️ PARTIALLY MITIGATED

**Current State**:
- Backend already supports HTTP-only cookies
- Frontend has `withCredentials: true` configured
- Token still in sessionStorage for WebSocket authentication

**Remaining Work** (Backend Required):
```elixir
# config/config.exs
config :cgraph, CGraphWeb.Auth.Guardian,
  token_storage: :cookie,
  cookie_options: [
    http_only: true,
    secure: true,
    same_site: :strict,
    max_age: 900  # 15 minutes
  ]
```

**Frontend Cleanup** (After backend update):
```typescript
// Remove token from authStore.ts
// Keep only for WebSocket (with short TTL)
```

---

### CVE-CGRAPH-2026-003: Token Refresh Race Condition

**Severity**: HIGH (CVSS 7.2)
**Status**: ✅ FIXED in existing code

**Implementation**:
```typescript
// apps/web/src/lib/api.ts - lines 7-30
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Mutex pattern prevents race condition
if (isRefreshing) {
  return new Promise((resolve) => {
    subscribeTokenRefresh((token: string) => {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      resolve(api(originalRequest));
    });
  });
}
```

**Status**: Already implemented correctly ✓

---

### CVE-CGRAPH-2026-004: Weak HMAC Signatures Instead of ECDSA

**Severity**: HIGH (CVSS 7.5)
**Status**: 📝 DOCUMENTED (Requires refactor)

**Current Implementation**:
```typescript
// apps/web/src/lib/crypto/e2ee.ts - lines 216-226
export async function sign(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  // WEAK: Using HMAC-SHA256 as signature substitute
  const keyMaterial = await crypto.subtle.exportKey('pkcs8', privateKey);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(keyMaterial).slice(0, 32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', hmacKey, data);
}
```

**Required Fix** (Breaking change - requires migration):
```typescript
// Generate separate ECDSA signing key
export async function generateSigningKeyPair(): Promise<KeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

// Proper ECDSA signature
export async function signECDSA(
  privateKey: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  return await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    data
  );
}
```

**Impact**: Requires all users to regenerate E2EE keys
**Planned**: v0.8.0

---

### CVE-CGRAPH-2026-008: Production console.log Statements

**Severity**: MEDIUM (CVSS 5.3)
**Status**: ✅ FIXED in v0.7.33

**Solution**:
```typescript
import logger from '@/lib/logger.production';

// Automatically disabled in production
logger.info('User logged in', { userId });  // Only in development
logger.error('API failed', error);           // Always logged

// Replace all instances of:
// console.log() → logger.info()
// console.error() → logger.error()
// console.warn() → logger.warn()
// console.debug() → logger.debug()
```

**Files Created**:
- ✅ `apps/web/src/lib/logger.production.ts`

**Migration Required**:
- [ ] Replace 149 console.log occurrences across codebase
- [ ] Use ESLint rule to prevent new console.* calls

---

## 🛡️ Security Best Practices

### 1. Encryption at Rest

**E2EE Private Keys**:
```typescript
// ✅ CORRECT
await SecureStorage.setItem('identity_key', serializedKey);

// ❌ WRONG
localStorage.setItem('identity_key', serializedKey);
```

**Session Tokens**:
```typescript
// ✅ CORRECT (backend sets HTTP-only cookie)
// No manual token storage needed

// ❌ WRONG
sessionStorage.setItem('token', jwt);
```

---

### 2. Content Security Policy (CSP)

**Recommended Headers** (Backend configuration):
```nginx
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss://api.cgraph.io;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**Status**: ⚠️ Not yet implemented
**Priority**: HIGH

---

### 3. Secure Cookie Configuration

**Required Backend Settings**:
```elixir
# Phoenix endpoint configuration
config :cgraph, CGraphWeb.Endpoint,
  http: [port: 4000],
  https: [
    port: 4001,
    cipher_suite: :strong,
    keyfile: System.get_env("SSL_KEY_PATH"),
    certfile: System.get_env("SSL_CERT_PATH"),
    versions: [:"tlsv1.2", :"tlsv1.3"]
  ],
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  session_options: [
    store: :cookie,
    key: "_cgraph_session",
    signing_salt: System.get_env("SESSION_SIGNING_SALT"),
    encryption_salt: System.get_env("SESSION_ENCRYPTION_SALT"),
    max_age: 86400,  # 24 hours
    secure: true,     # HTTPS only
    http_only: true,  # No JavaScript access
    same_site: :strict
  ]
```

---

### 4. Rate Limiting

**API Protection**:
```elixir
# Recommended: Plug.RateLimit
plug Plug.RateLimit,
  name: :api_limiter,
  max_requests: 100,
  interval_seconds: 60,
  storage: Plug.RateLimit.Storage.ETS
```

**Status**: ⚠️ Not yet implemented
**Priority**: HIGH

---

## 📋 Security Checklist

### Production Deployment

- [ ] **Environment Variables**
  - [ ] `SECRET_KEY_BASE` - Minimum 64 characters
  - [ ] `SESSION_SIGNING_SALT` - Cryptographically random
  - [ ] `SESSION_ENCRYPTION_SALT` - Cryptographically random
  - [ ] `DATABASE_URL` - SSL mode required
  - [ ] `VITE_ENABLE_LOGGING=false` - Disable frontend logging

- [ ] **HTTPS Configuration**
  - [ ] TLS 1.2+ only
  - [ ] Valid SSL certificate
  - [ ] HSTS header enabled
  - [ ] Certificate pinning (optional)

- [ ] **Database Security**
  - [ ] Encrypted connections (SSL/TLS)
  - [ ] Principle of least privilege (database user permissions)
  - [ ] Regular backups with encryption
  - [ ] Audit logging enabled

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry, LogRocket)
  - [ ] Security event logging
  - [ ] Failed login attempt monitoring
  - [ ] API rate limit alerting

- [ ] **Dependencies**
  - [ ] Run `pnpm audit` and fix vulnerabilities
  - [ ] Keep dependencies up to date
  - [ ] Use SRI for CDN resources

---

## 🔄 Migration Guide for v0.7.33

### Step 1: Update Dependencies
```bash
cd /CGraph
pnpm install
```

### Step 2: Initialize Secure Storage (First User Login)
```typescript
// In your login handler
import SecureStorage from '@/lib/crypto/secureStorage';
import { migrateToSecureStorage, needsMigration } from '@/lib/crypto/migrateToSecureStorage';

async function handleLogin(email: string, password: string) {
  // Existing login logic
  await authStore.login(email, password);

  // Initialize secure storage
  await SecureStorage.initialize(password);

  // Migrate E2EE keys if needed
  if (needsMigration()) {
    const result = await migrateToSecureStorage(password);
    if (!result.success) {
      console.error('Key migration failed:', result.errors);
      // Handle migration failure
    }
  }
}
```

### Step 3: Update E2EE Imports
```typescript
// Replace old import
- import e2ee from '@/lib/crypto/e2ee';
+ import e2ee from '@/lib/crypto/e2ee.secure';
```

### Step 4: Replace console.log Calls
```typescript
// Replace throughout codebase
- console.log('User authenticated', user);
+ logger.info('User authenticated', { user });

- console.error('API error:', error);
+ logger.error('API error', error);
```

### Step 5: Update Logger Imports
```bash
# Find and replace across project
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i 's/console\.log/logger.info/g'
```

---

## 🧪 Testing Security Fixes

### Test E2EE Encryption
```typescript
import SecureStorage from '@/lib/crypto/secureStorage';

describe('SecureStorage', () => {
  it('should encrypt data', async () => {
    await SecureStorage.initialize('test-password');

    await SecureStorage.setItem('test-key', 'sensitive-data');

    // Verify encrypted in IndexedDB (cannot read without password)
    const raw = await getRawIndexedDBValue('test-key');
    expect(raw).not.toContain('sensitive-data');

    // Verify decryption works
    const decrypted = await SecureStorage.getItem('test-key');
    expect(decrypted).toBe('sensitive-data');
  });
});
```

### Test Token Refresh Mutex
```typescript
describe('API Token Refresh', () => {
  it('should not have race condition', async () => {
    // Simulate 10 concurrent requests with expired token
    const promises = Array(10).fill(null).map(() =>
      api.get('/api/v1/protected-resource')
    );

    const results = await Promise.all(promises);

    // All should succeed with same refreshed token
    results.forEach(r => expect(r.status).toBe(200));

    // Verify refresh was called only once
    expect(refreshTokenCallCount).toBe(1);
  });
});
```

---

## 📞 Security Contact

For security vulnerabilities, please report to:
- **Email**: security@cgraph.io (recommended)
- **GitHub**: Create a private security advisory
- **PGP Key**: Available at https://cgraph.io/.well-known/security.txt

**Do NOT create public GitHub issues for security vulnerabilities.**

---

## 📚 Additional Resources

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Signal Protocol Documentation](https://signal.org/docs/)
- [Web Crypto API Spec](https://www.w3.org/TR/WebCryptoAPI/)

---

**Last Security Audit**: 2026-01-10
**Next Scheduled Audit**: 2026-04-10
**Responsible Team**: @security-team
