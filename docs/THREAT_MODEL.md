# CGraph Threat Model

> **Version: 0.9.31** | Last Updated: January 2026 **Classification:** Internal Engineering

A systematic analysis of potential threats to CGraph and corresponding mitigations.

---

## 1. System Overview

### Assets Under Protection

| Asset               | Sensitivity | Impact if Compromised                             |
| ------------------- | ----------- | ------------------------------------------------- |
| User messages       | Critical    | Privacy violation, legal liability                |
| E2E encryption keys | Critical    | Breaks confidentiality for all messages           |
| User credentials    | High        | Account takeover                                  |
| User metadata       | High        | Privacy violation, profiling                      |
| Session tokens      | High        | Unauthorized access                               |
| Server private keys | Critical    | MITM attacks possible                             |
| Database backups    | Critical    | Historical data exposure                          |
| Source code         | Medium      | Competitive disadvantage, vulnerability discovery |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Browser   │     │  Mobile App │     │ Attacker    │   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘   │
│         │                   │                   │          │
└─────────┼───────────────────┼───────────────────┼──────────┘
          │                   │                   │
    ══════╪═══════════════════╪═══════════════════╪════════════
          │            TRUST BOUNDARY             │
    ══════╪═══════════════════╪═══════════════════╪════════════
          │                   │                   ✗ (blocked)
┌─────────┼───────────────────┼───────────────────────────────┐
│         ▼                   ▼                               │
│    ┌─────────────────────────────┐                          │
│    │        CDN / WAF            │  ← Rate limiting, DDoS   │
│    └──────────────┬──────────────┘                          │
│                   │                                         │
│         ┌─────────┴─────────┐                               │
│         ▼                   ▼                               │
│  ┌─────────────┐     ┌─────────────┐                        │
│  │ Web (Vercel)│     │ API (Fly.io)│                        │
│  └─────────────┘     └──────┬──────┘                        │
│                             │                               │
│                    ═════════╪═════════                      │
│                     DB TRUST BOUNDARY                       │
│                    ═════════╪═════════                      │
│                             │                               │
│                      ┌──────┴──────┐                        │
│                      │  PostgreSQL │                        │
│                      │   (Fly.io)  │                        │
│                      └─────────────┘                        │
│                                                             │
│                    TRUSTED ZONE (Infrastructure)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Analysis (STRIDE)

### 2.1 Spoofing

| Threat | Description                      | Likelihood | Impact   | Mitigation                                                    |
| ------ | -------------------------------- | ---------- | -------- | ------------------------------------------------------------- |
| T-S1   | Session hijacking via stolen JWT | Medium     | High     | Short JWT expiry (15min), refresh tokens, secure cookie flags |
| T-S2   | Account impersonation            | Low        | Critical | MFA, email verification, device tracking                      |
| T-S3   | OAuth token theft                | Low        | High     | PKCE, state parameter validation                              |
| T-S4   | DNS spoofing                     | Very Low   | Critical | DNSSEC, certificate pinning in mobile                         |

### 2.2 Tampering

| Threat | Description                     | Likelihood | Impact   | Mitigation                                |
| ------ | ------------------------------- | ---------- | -------- | ----------------------------------------- |
| T-T1   | Message modification in transit | Very Low   | Critical | E2EE prevents server-side tampering       |
| T-T2   | Database tampering              | Very Low   | Critical | Access controls, audit logs, backups      |
| T-T3   | Code injection via dependencies | Medium     | High     | Dependabot, lockfile auditing, SBOM       |
| T-T4   | Configuration tampering         | Low        | High     | Secrets management, environment isolation |

### 2.3 Repudiation

| Threat | Description                       | Likelihood | Impact | Mitigation                            |
| ------ | --------------------------------- | ---------- | ------ | ------------------------------------- |
| T-R1   | User denies sending message       | Low        | Medium | Cryptographic signatures in E2EE      |
| T-R2   | Admin denies configuration change | Low        | Medium | Comprehensive audit logging           |
| T-R3   | Attacker covers tracks            | Medium     | High   | Append-only audit logs, external SIEM |

### 2.4 Information Disclosure

| Threat | Description                | Likelihood | Impact   | Mitigation                                       |
| ------ | -------------------------- | ---------- | -------- | ------------------------------------------------ |
| T-I1   | Message content leak       | Low        | Critical | E2EE (content never decryptable server-side)     |
| T-I2   | Metadata analysis          | Medium     | High     | Minimize stored metadata, sealed sender          |
| T-I3   | Key extraction from device | Medium     | High     | Secure storage (Keychain/Keystore), key rotation |
| T-I4   | Backup exposure            | Low        | Critical | Encrypted backups, access logging                |
| T-I5   | Debug info in production   | Low        | Medium   | Stripped source maps, sanitized errors           |
| T-I6   | Timing side-channels       | Low        | Medium   | Constant-time crypto operations                  |

### 2.5 Denial of Service

| Threat | Description                    | Likelihood | Impact | Mitigation                       |
| ------ | ------------------------------ | ---------- | ------ | -------------------------------- |
| T-D1   | API rate exhaustion            | Medium     | Medium | Rate limiting per user/IP        |
| T-D2   | WebSocket flood                | Medium     | High   | Connection limits, auth required |
| T-D3   | Storage exhaustion             | Low        | Medium | Upload quotas, auto-cleanup      |
| T-D4   | Database connection exhaustion | Medium     | High   | Connection pooling, PgBouncer    |
| T-D5   | Compute exhaustion (crypto)    | Low        | Medium | Proof-of-work for key operations |

### 2.6 Elevation of Privilege

| Threat | Description                     | Likelihood | Impact   | Mitigation                                |
| ------ | ------------------------------- | ---------- | -------- | ----------------------------------------- |
| T-E1   | Horizontal privilege escalation | Medium     | High     | IDOR checks on all endpoints              |
| T-E2   | Vertical privilege escalation   | Low        | Critical | RBAC, principle of least privilege        |
| T-E3   | SQL injection                   | Very Low   | Critical | Parameterized queries via Ecto            |
| T-E4   | XSS to admin escalation         | Low        | High     | CSP, input sanitization, httpOnly cookies |

---

## 3. Attack Scenarios

### 3.1 Scenario: Compromised Device

**Attacker Goal:** Access victim's messages

**Attack Path:**

1. Attacker gains access to unlocked device
2. Extracts session token from storage
3. Uses token to access account

**Mitigations:**

- [ ] Session invalidation on device lock
- [x] Biometric authentication option
- [ ] Remote session revocation
- [x] Session list in security settings

**Detection:**

- Multiple sessions from different locations
- Unusual access patterns

### 3.2 Scenario: Malicious Server Operator

**Attacker Goal:** Read user messages

**Attack Path:**

1. Rogue employee or compromised server
2. Attempts to intercept message content

**Mitigations:**

- [x] E2EE - server never has plaintext
- [x] Key verification UI (safety numbers)
- [ ] Transparency logs for key changes

**Why E2EE Matters:** Even with full server access, attacker can only see:

- Encrypted ciphertext blobs
- Metadata (sender, recipient, timestamp)
- Cannot decrypt without device private keys

### 3.3 Scenario: Supply Chain Attack

**Attacker Goal:** Inject malicious code

**Attack Path:**

1. Compromise popular npm package
2. Malicious code executes in user browser
3. Exfiltrates encryption keys

**Mitigations:**

- [x] Lockfile pinning (pnpm-lock.yaml)
- [x] Dependabot alerts
- [x] Renovate with automerge restrictions
- [ ] SRI hashes for CDN scripts
- [ ] Regular dependency audits

### 3.4 Scenario: Mass Surveillance

**Attacker Goal:** Collect metadata for profiling

**Attack Path:**

1. Legal or illegal access to server logs
2. Analyze communication patterns

**Mitigations:**

- [x] Minimal metadata collection
- [x] Log rotation and deletion
- [ ] Sealed sender (hide sender identity from server)
- [ ] Onion routing for connection anonymity

---

## 4. Cryptographic Considerations

### Current Cryptographic Stack

| Component          | Algorithm                  | Security Level              | Notes                            |
| ------------------ | -------------------------- | --------------------------- | -------------------------------- |
| Key Exchange       | ML-KEM-768 + P-256 (PQXDH) | 192-bit (PQ) + 128-bit (EC) | Hybrid post-quantum key exchange |
| Message Encryption | AES-256-GCM                | 256-bit                     | With Triple Ratchet              |
| KEM                | ML-KEM-768                 | 192-bit                     | NIST FIPS 203                    |
| Signatures         | ECDSA P-256                | 128-bit                     | For identity verification        |
| Password Hashing   | Argon2id                   | Configurable                | Memory-hard                      |
| Session Tokens     | JWT + refresh              | -                           | RS256 signing                    |

### Cryptographic Risks

| Risk                          | Impact                 | Mitigation                                 |
| ----------------------------- | ---------------------- | ------------------------------------------ |
| Quantum threat to ECDH        | Future decryption      | ✅ Mitigated — PQXDH + ML-KEM-768 deployed |
| Weak random number generation | Key compromise         | Use WebCrypto API only                     |
| Key reuse across protocols    | Cross-protocol attacks | Domain separation                          |
| Side-channel in JS crypto     | Key extraction         | Use WebCrypto (native)                     |

### Key Management Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    KEY LIFECYCLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Generation → Storage → Usage → Rotation → Destruction      │
│      │           │         │        │           │           │
│      ▼           ▼         ▼        ▼           ▼           │
│  WebCrypto   IndexedDB   Memory   Session    Secure        │
│  (CSPRNG)   (encrypted)  only     ratchet   wipe          │
│                                                             │
│  • Never export    • Key wrapping   • Forward    • Zero     │
│    raw keys        • Per-device     secrecy     memory    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Security Controls Matrix

### Preventive Controls

| Control                  | Status    | Coverage                   |
| ------------------------ | --------- | -------------------------- |
| Input validation         | ✅ Active | All endpoints              |
| CSRF protection          | ✅ Active | State-changing requests    |
| Rate limiting            | ✅ Active | API endpoints              |
| Content Security Policy  | ✅ Active | Web app                    |
| CORS restrictions        | ✅ Active | API                        |
| SQL injection prevention | ✅ Active | Ecto parameterized queries |

### Detective Controls

| Control           | Status     | Coverage                |
| ----------------- | ---------- | ----------------------- |
| Audit logging     | ⚠️ Partial | Auth events only        |
| Error monitoring  | ✅ Active  | Sentry integration      |
| Anomaly detection | ❌ Planned | Not implemented         |
| Security scanning | ⚠️ Partial | Gitleaks, needs Semgrep |

### Corrective Controls

| Control                | Status     | Coverage               |
| ---------------------- | ---------- | ---------------------- |
| Incident response plan | ⚠️ Draft   | Documented in runbooks |
| Automatic banning      | ✅ Active  | Rate limit violations  |
| Session revocation     | ✅ Active  | User-initiated         |
| Key rotation           | ⚠️ Partial | Manual process         |

---

## 6. Compliance Mapping

### GDPR Requirements

| Requirement         | Status | Implementation                   |
| ------------------- | ------ | -------------------------------- |
| Consent             | ✅     | Terms acceptance, privacy policy |
| Right to access     | ✅     | Data export feature              |
| Right to erasure    | ✅     | Account deletion                 |
| Data portability    | ✅     | JSON export                      |
| Breach notification | ⚠️     | Process documented, not tested   |

### SOC 2 Type II Alignment

| Control             | Status | Notes                            |
| ------------------- | ------ | -------------------------------- |
| Access controls     | ✅     | RBAC implemented                 |
| Change management   | ⚠️     | PR reviews, needs formal process |
| Encryption          | ✅     | E2EE for messages                |
| Monitoring          | ⚠️     | Basic, needs enhancement         |
| Incident management | ⚠️     | Documented, needs testing        |

---

## 7. Recommendations & Priorities

### Critical (P0) - Address Immediately

1. **External E2EE audit** - Validate cryptographic implementation
2. **Penetration test** - Before public launch
3. **Complete audit logging** - Expand beyond auth events

### High (P1) - Next Quarter

4. **SIEM integration** - Centralized log analysis
5. **Key rotation automation** - Server keys, signing keys
6. **Rate limiting refinement** - Per-endpoint tuning
7. **Security headers review** - HSTS preload, stricter CSP

### Medium (P2) - 6 Month Roadmap

8. **Bug bounty program** - Post-launch
9. **Sealed sender implementation** - Enhanced metadata protection
10. **PQXDH migration plan** - Post-quantum readiness

### Low (P3) - Long Term

11. **Onion routing consideration** - For high-risk users
12. **Transparency logs** - Key change auditability
13. **HSM for server keys** - Hardware security modules

---

## 8. Review Schedule

| Review Type             | Frequency   | Owner           | Next Due      |
| ----------------------- | ----------- | --------------- | ------------- |
| Threat model update     | Quarterly   | Security Lead   | April 2026    |
| Dependency audit        | Monthly     | Platform Team   | February 2026 |
| Access review           | Quarterly   | Team Leads      | April 2026    |
| Penetration test        | Annual      | External Vendor | TBD           |
| Incident response drill | Semi-annual | SRE Team        | July 2026     |

---

<sub>**CGraph Threat Model** • Version 0.9.31 • Internal Use Only</sub>
