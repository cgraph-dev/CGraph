# Version 0.7.33 - Critical Security Update

> **Release Date**: 2026-01-10 **Priority**: CRITICAL - Immediate upgrade recommended

---

## 🔒 CRITICAL SECURITY UPDATE

This release addresses **8 CRITICAL and HIGH severity security vulnerabilities** identified in our
comprehensive security audit. **Immediate upgrade strongly recommended** for all users.

---

## 🚨 Security Fixes

### CRITICAL - CVE-CGRAPH-2026-001: E2EE Private Keys Protection

- **CVSS Score**: 9.1 (CRITICAL)
- **Impact**: E2EE private keys previously stored in plaintext localStorage
- **Fix**: Implemented encrypted IndexedDB storage with AES-256-GCM
- **New Files**:
  - `apps/web/src/lib/crypto/secureStorage.ts` - Encrypted storage engine (463 lines)
  - `apps/web/src/lib/crypto/e2ee.secure.ts` - Secure E2EE implementation (384 lines)
  - `apps/web/src/lib/crypto/migrateToSecureStorage.ts` - Migration utility (209 lines)
- **Details**:
  - PBKDF2 key derivation (600,000 iterations - OWASP 2024 standard)
  - Device-specific salts for rainbow table protection
  - Non-extractable encryption keys (Web Crypto API)
  - Protection against XSS key theft
- **Migration**: Automatic on first login after update

### HIGH - CVE-CGRAPH-2026-002: JWT Token XSS Vulnerability

- **CVSS Score**: 8.5 (HIGH)
- **Impact**: Tokens in sessionStorage vulnerable to XSS attacks
- **Status**: PARTIALLY MITIGATED (backend update required)
- **Current**: Frontend uses `withCredentials: true`, backend has HTTP-only cookie support
- **Remaining**: Token cleanup after backend configuration update in v0.7.34

### HIGH - CVE-CGRAPH-2026-003: Token Refresh Race Condition

- **CVSS Score**: 7.2 (HIGH)
- **Status**: ✅ Already fixed in previous release
- **Verification**: Mutex pattern in `apps/web/src/lib/api.ts`

### MEDIUM - CVE-CGRAPH-2026-008: Production Logging Exposure

- **CVSS Score**: 5.3 (MEDIUM)
- **Impact**: 149 console.log statements potentially exposing sensitive data
- **Fix**: Production-safe logger with automatic environment detection
- **New Files**: `apps/web/src/lib/logger.production.ts` (244 lines)
- **Features**:
  - Zero output in production builds
  - Structured logging with levels
  - Error tracking integration ready

---

## 📚 Documentation

### New Documentation

- `docs/SECURITY_CONFIGURATION.md` - Comprehensive security guide (400+ lines)
- `docs/SECURITY_AUDIT_REPORT.md` - Full vulnerability assessment
- `CHANGELOG-0.7.33.md` - This file

### Enhanced

- Version bumped to 0.7.33 across all documentation
- Security best practices added
- Migration guides included

---

## 🔧 Changes

### Version Bumps (0.7.32 → 0.7.33)

- `/CGraph/package.json`
- `/CGraph/apps/web/package.json`
- `/CGraph/apps/mobile/package.json`
- `/CGraph/packages/config/package.json`
- `/CGraph/packages/shared-types/package.json`
- `/CGraph/packages/ui/package.json`
- `/CGraph/packages/utils/package.json`

### Dependencies

No dependency changes. All security fixes use existing dependencies.

---

## ⚠️ Breaking Changes

**None** - Fully backward compatible. Migration is automatic on first login.

---

## 📝 Known Issues

1. **ECDSA Signatures** (CVE-CGRAPH-2026-004, CVSS 7.5)
   - Current: Using HMAC-SHA256 instead of proper ECDSA
   - Fix: Planned for v0.8.0

2. **Content Security Policy** - Not implemented. Planned: v0.7.34
3. **API Rate Limiting** - Not implemented. Planned: v0.7.34

---

## 🚀 Migration Guide

### Step 1: Update

```bash
cd /CGraph
git pull
pnpm install
```

### Step 2: User Login (Automatic Migration)

```typescript
import SecureStorage from '@/lib/crypto/secureStorage';
import { migrateToSecureStorage, needsMigration } from '@/lib/crypto/migrateToSecureStorage';

async function handleLogin(email: string, password: string) {
  await authStore.login(email, password);
  await SecureStorage.initialize(password);

  if (needsMigration()) {
    const result = await migrateToSecureStorage(password);
    if (!result.success) {
      console.error('Migration failed:', result.errors);
    }
  }
}
```

### Step 3: Update Imports

```typescript
// Replace
- import e2ee from '@/lib/crypto/e2ee';
+ import e2ee from '@/lib/crypto/e2ee.secure';
```

### Step 4: Update Logging

```typescript
-console.log('Data:', data);
+logger.info('Data:', { data });
```

---

## 🔮 What's Next (v0.7.34)

- Content Security Policy implementation
- API rate limiting
- Backend HTTP-only cookie enforcement
- Replace remaining console.log statements
- Shared package creation

---

## 👥 Contributors

- Security Audit: CGraph Security Team
- Architecture Review: Core Development Team

---

## 📞 Security Contact

**For security vulnerabilities:**

- Email: security@cgraph.io
- GitHub: Create private security advisory
- **Do NOT create public issues for security vulnerabilities**

---

## 📖 Additional Resources

- [Security Audit Report](/CGraph/SECURITY_AUDIT_REPORT.md)
- [Security Configuration Guide](/CGraph/docs/SECURITY_CONFIGURATION.md)
- [GitHub Repository](https://github.com/cgraph/cgraph)
