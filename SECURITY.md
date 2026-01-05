# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.7.x   | :white_check_mark: |
| 0.6.x   | :white_check_mark: |
| < 0.6   | :x:                |

## Reporting a Vulnerability

We take the security of CGraph seriously. If you believe you've found a security vulnerability, please report it to us responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email us at: **security@cgraph.org**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Security Measures

CGraph implements multiple layers of security:

#### Authentication & Authorization
- **Password Hashing**: Argon2id (OWASP recommended)
- **JWT Tokens**: Short-lived access tokens with secure refresh mechanism
- **2FA Support**: TOTP-based two-factor authentication
- **Session Management**: Remote session revocation, device tracking
- **OAuth 2.0**: Google, Apple, Facebook, TikTok integration via Assent

#### Encryption
- **Transport**: TLS 1.3 for all communications
- **At Rest**: AES-256 encryption for sensitive data
- **End-to-End**: X3DH key agreement + AES-256-GCM for private messages
- **Key Storage**: Secure key derivation with device-specific binding

#### API Security
- **Rate Limiting**: Per-endpoint limits with Redis-backed tracking
- **Input Validation**: Ecto changesets with strict type enforcement
- **SQL Injection**: Parameterized queries via Ecto
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: Token-based validation for state-changing operations

#### Infrastructure
- **WAF**: Cloudflare Web Application Firewall
- **DDoS Protection**: Cloudflare with geo-blocking capabilities
- **Secrets Management**: Environment variables, never committed
- **Audit Logging**: All sensitive operations logged with user context

#### Data Protection
- **GDPR Compliance**: Data export, deletion on request
- **Data Minimization**: Only collect necessary information
- **Retention Policies**: Configurable data retention periods
- **Backup Encryption**: All backups encrypted at rest

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

We believe in responsible disclosure and will:

1. Work with you to understand and resolve the issue
2. Keep you informed of our progress
3. Credit you in our security acknowledgments (unless you prefer to remain anonymous)
4. Not take legal action against researchers acting in good faith

### Bug Bounty

We currently don't have a formal bug bounty program, but we deeply appreciate security research and may offer rewards for significant findings at our discretion.

### Security Updates

Security updates are released as patch versions and announced via:
- GitHub Security Advisories
- CHANGELOG.md
- Our official Discord server

## Security Checklist for Contributors

Before submitting PRs:

- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation for all user-supplied data
- [ ] Proper error handling without information leakage
- [ ] Rate limiting for new endpoints
- [ ] Authorization checks on protected resources
- [ ] SQL queries use parameterized statements
- [ ] File uploads validated and sanitized
- [ ] Logging doesn't expose sensitive data

## Contact

- Security issues: security@cgraph.org
- General questions: support@cgraph.org
- PGP Key: Available on request

---

Thank you for helping keep CGraph and our users safe!
