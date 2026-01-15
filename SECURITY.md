# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.7.x   | :white_check_mark: |
| 0.6.x   | :white_check_mark: |
| < 0.6   | :x:                |

## Reporting a Vulnerability

Security is a top priority for CGraph. If you discover a vulnerability, please report it
responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email: **security@cgraph.org**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (optional but appreciated)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution**:
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Security Architecture

CGraph implements defense-in-depth with multiple security layers:

#### Authentication & Authorization

- **Password Hashing**: Argon2id (OWASP recommended)
- **JWT Tokens**: Short-lived access tokens with secure refresh
- **2FA Support**: TOTP-based two-factor authentication
- **Session Management**: Remote session revocation, device tracking
- **OAuth 2.0**: Google, Apple, Facebook, TikTok via Assent

#### End-to-End Encryption (E2EE)

- **Algorithm**: AES-256-GCM via Web Crypto API
- **Key Exchange**: P-256 ECDH (Signal Protocol-inspired X3DH)
- **Ratcheting**: Double Ratchet protocol for forward secrecy
- **Key Derivation**: HKDF-SHA256 with conversation-specific salt
- **Zero-Knowledge**: Server never sees plaintext messages
- **Forward Secrecy**: Per-message key ratcheting

> **Note**: Our E2EE implementation is Signal Protocol-inspired but custom-built. It has not
> undergone formal third-party security audit. See
> [SECURITY_ROADMAP.md](docs/guides/SECURITY_ROADMAP.md) for our security maturity plan.

#### Transport & Storage

- **Transport**: TLS 1.3 for all connections
- **At Rest**: AES-256 encryption for sensitive data
- **Secrets**: Environment-based, never committed to source

#### API Security

- **Rate Limiting**: Per-endpoint limits with Redis tracking
- **Input Validation**: Ecto changesets with strict typing
- **SQL Injection**: Prevented via parameterized queries
- **XSS Prevention**: Content Security Policy enforcement
- **CSRF Protection**: Token validation for mutations

#### UI Security (v0.7.37+)

- **Theme Import Removed**: Theme import/export removed to prevent JSON-based XSS/injection
- **Content Sanitization**: User-generated content sanitized before rendering
- **No Dynamic Code Execution**: All theme colors validated as hex/rgba strings only

#### Infrastructure

- **WAF**: Cloudflare Web Application Firewall
- **DDoS Protection**: Cloudflare with geo-blocking
- **Audit Logging**: All sensitive operations logged

#### Data Protection

- **GDPR Compliance**: Full data export and deletion
- **Data Minimization**: Only necessary data collected
- **Retention Policies**: Configurable per data type
- **Backup Encryption**: All backups encrypted

### Security Headers

CGraph sets the following security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

### Responsible Disclosure

Security researchers acting in good faith can expect:

1. Collaborative resolution process
2. Regular progress updates
3. Credit in security acknowledgments (anonymous if preferred)
4. No legal action for responsible disclosure

### Bug Bounty

No formal bounty program exists yet, but significant findings may be rewarded at discretion.

### Security Updates

Security patches are released as point versions and announced via:

- GitHub Security Advisories
- CHANGELOG.md
- Project Discord

## Contributor Security Checklist

Before submitting code:

- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation for all user data
- [ ] Proper error handling (no sensitive data in errors)
- [ ] Rate limiting for new endpoints
- [ ] Authorization checks on protected resources
- [ ] Parameterized SQL queries only
- [ ] File uploads validated and sanitized
- [ ] Logs don't expose sensitive information

## Contact

- Security: security@cgraph.org
- General: hello@cgraph.org
- Website: [www.cgraph.org](https://www.cgraph.org)

— Burca Lucas

- PGP Key: Available on request

---

Thank you for helping keep CGraph and our users safe!
