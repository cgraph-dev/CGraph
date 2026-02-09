# Security Policy

## ⚠️ Proprietary Software Notice

CGraph is **proprietary software**. This security policy applies to our hosted platform only.
Self-hosting is not permitted under our license.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.9.x   | :white_check_mark: |
| 0.8.x   | :white_check_mark: |
| 0.7.x   | :white_check_mark: |
| < 0.7   | :x:                |

## Reporting a Vulnerability

Security is a top priority for CGraph. If you discover a vulnerability, please report it responsibly
and confidentially.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. **Do NOT** disclose the vulnerability publicly until we have resolved it
3. **Do NOT** exploit the vulnerability beyond what is necessary to demonstrate it
4. Email: **security@cgraph.org**
5. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (optional but appreciated)
   - Your contact information for follow-up

### What We Ask

- Give us reasonable time to address the issue before public disclosure (90 days)
- Do not access or modify other users' data
- Do not degrade the performance of our services
- Do not use social engineering, phishing, or physical attacks

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
- **Key Exchange**: X25519 ECDH (Signal Protocol X3DH)
- **Ratcheting**: Double Ratchet protocol for forward secrecy
- **Key Derivation**: HKDF-SHA256 with conversation-specific salt
- **Zero-Knowledge**: Server stores only public keys; encryption/decryption client-side
- **Forward Secrecy**: Per-message key ratcheting
- **Key Storage**: Client-side IndexedDB/SecureStore, never sent to server

#### Transport & Storage

- **Transport**: TLS 1.3 for all connections
- **At Rest**: AES-256 encryption for sensitive data
- **Secrets**: Environment-based, never committed to source

#### API Security

- **Rate Limiting**: Distributed Redis-backed limiter with trusted proxy enforcement
- **Trusted Proxies**: Only accepts X-Forwarded-For from Cloudflare/private CIDRs
- **Input Validation**: Ecto changesets with strict typing
- **SQL Injection**: Prevented via parameterized queries
- **XSS Prevention**: Content Security Policy enforcement
- **CSRF Protection**: Token validation for mutations
- **Session Cookies**: HTTP-only, Secure, SameSite=Lax

#### Upload Security

- **MIME Sniffing**: Magic byte validation prevents content-type spoofing
- **File Type Allowlist**: Only permitted extensions accepted
- **Size Limits**: Per-tier upload size restrictions
- **Virus Scanning**: Integration ready for external scanning

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
4. No legal action for responsible disclosure that follows this policy

### Bug Bounty

We offer rewards for qualifying security vulnerabilities. Contact security@cgraph.org for details.

| Severity | Reward Range |
| -------- | ------------ |
| Critical | $500 - $2000 |
| High     | $200 - $500  |
| Medium   | $50 - $200   |
| Low      | Recognition  |

_Rewards are at our discretion and depend on the quality of the report and impact of the
vulnerability._

### Security Updates

Security patches are announced via:

- Email to affected users (for critical issues)
- In-app notifications
- Status page at status.cgraph.org

### Prohibited Activities

The following activities are strictly prohibited and may result in legal action:

- Attempting to reverse engineer, decompile, or deobfuscate the Software
- Attempting to access our infrastructure or servers without authorization
- Sharing access credentials or attempting to bypass authentication
- Scraping, crawling, or automated data collection
- Any attempt to self-host or deploy the Software outside our platform

## Contact

- Security: security@cgraph.org
- General: hello@cgraph.org
- Website: [cgraph.org](https://cgraph.org)

---

**CGraph - Proprietary and Confidential**

© 2025-2026 CGraph. All Rights Reserved.

Thank you for helping keep CGraph and our users safe!
