# Security Audit Readiness Checklist

> **Version:** 0.9.31 | **Last Updated:** February 2026 **Purpose:** Pre-audit readiness
> verification before external E2EE audit and penetration test

---

## 1. Audit Firm Selection (P0 — Blocker)

- [ ] **E2EE Protocol Audit firm selected** — Candidates: NCC Group, Trail of Bits, Cure53, Doyensec
- [ ] **Penetration Test firm selected** — Candidates: Bishop Fox, Cobalt, Synack
- [ ] **Budget approved** — E2EE audit: $25K–$120K; Pentest: $15K–$80K
- [ ] **Engagement contracts signed**
- [ ] **Timeline agreed** — Target: Q1 2026 kickoff

---

## 2. Scope Documentation

### 2.1 Cryptographic Protocol (E2EE Audit Scope)

| Component                               | Location                                                                          | Status         |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------- |
| Triple Ratchet Protocol                 | `packages/crypto/src/tripleRatchet.ts` + `apps/backend/lib/cgraph/crypto/e2ee.ex` | ✅ Implemented |
| PQXDH Key Exchange (ML-KEM-768 + P-256) | `packages/crypto/src/pqxdh.ts`                                                    | ✅ Implemented |
| AES-256-GCM Message Encryption          | `packages/crypto/src/aes.ts`                                                      | ✅ Implemented |
| Prekey Management                       | `apps/backend/lib/cgraph/cache/unified.ex` (prekey bundle caching)                | ✅ Implemented |
| Device Verification (Safety Numbers)    | `apps/web/src/modules/chat/components/e2ee/` + `apps/web/src/pages/security/`     | ✅ Implemented |
| Key Backup / Recovery                   | Not yet implemented                                                               | ❌ Gap         |
| Forward Secrecy (Mobile)                | Mobile lacks Double Ratchet                                                       | ⚠️ Gap         |

### 2.2 Application Security (Pentest Scope)

| Surface            | Location                                                                           | Notes                                |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------ |
| REST API (v1)      | `apps/backend/lib/cgraph_web/controllers/api/v1/`                                  | Auth, RBAC, input validation         |
| WebSocket Channels | `apps/backend/lib/cgraph_web/channels/`                                            | Real-time messaging, presence        |
| Authentication     | JWT + refresh tokens, OAuth2, TOTP 2FA                                             | Token blacklist, account lockout     |
| Authorization      | Role-based (owner, admin, moderator, member)                                       | Per-group permission checks          |
| File Upload        | Media attachments, avatars, exports                                                | Content-type validation, size limits |
| Admin Panel        | `apps/web/src/modules/admin/`                                                      | Marketplace, events, moderation      |
| Payment (Stripe)   | `apps/backend/lib/cgraph/subscriptions/` + `controllers/api/payment_controller.ex` | Webhooks, checkout, portal           |

---

## 3. Infrastructure Readiness

- [ ] **Staging environment provisioned** — Separate Fly.io instance for auditors
- [ ] **Auditor credentials created** — Scoped accounts with appropriate access levels
- [ ] **Database snapshot available** — Anonymized production-like dataset
- [ ] **API documentation current** — `docs/API_DOCUMENTATION.md` up to date
- [ ] **Architecture diagrams current** — `docs/ARCHITECTURE_DIAGRAMS.md` reviewed
- [ ] **Network diagram provided** — Fly.io topology, Cloudflare, PgBouncer

---

## 4. Code-Level Security Controls (Verify Before Audit)

### 4.1 Authentication & Authorization

- [x] JWT token validation with expiry enforcement
- [x] Refresh token rotation
- [x] TOTP 2FA implementation
- [x] Account lockout after failed attempts (`account_lockout.ex`)
- [x] Token blacklist / revocation (`token_blacklist.ex`)
- [x] Password breach checking (`password_breach_check.ex`)
- [x] OAuth2 provider integration
- [ ] Session invalidation on device lock
- [ ] Remote session revocation (partial)

### 4.2 Input Validation & Injection Prevention

- [x] Ecto changesets with type validation
- [x] Parameterized queries (no raw SQL)
- [x] Content-Security-Policy headers (`security_headers.ex`)
- [x] CORS configuration
- [x] Rate limiting (Hammer)
- [ ] Semgrep SAST integration in CI

### 4.3 Audit Logging

- [x] Security events logged (2FA, lockouts, token revocations)
- [x] Admin marketplace actions logged to DB
- [x] Group moderation actions logged to DB
- [x] **Security events now persisted to DB** (was in-memory only — fixed Feb 2026)
- [x] Integrity checksums (SHA-256) on audit entries
- [ ] Auth lifecycle events (login_success, logout, password_change)
- [ ] Admin panel access logging
- [ ] Billing/payment event logging
- [ ] Retention cleanup enabled in production

### 4.4 Security Headers

- [x] `Content-Security-Policy`
- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `Strict-Transport-Security` (HSTS)
- [x] `X-XSS-Protection`
- [x] `Referrer-Policy`
- [x] `Permissions-Policy`

### 4.5 WebSocket Security

- [x] Socket authentication (`socket_security.ex`)
- [x] Channel authorization checks
- [x] Rate limiting on channel joins
- [x] Message size limits

---

## 5. CI/CD Security Pipeline

| Tool             | Purpose                          | Status                |
| ---------------- | -------------------------------- | --------------------- |
| Gitleaks         | Secret detection                 | ✅ Active             |
| pnpm audit       | Dependency vulnerabilities       | ✅ Active             |
| Sobelow          | Elixir security analysis         | ✅ Active             |
| Grype            | Container vulnerability scanning | ✅ Active             |
| Syft             | SBOM generation                  | ✅ Active             |
| License checker  | OSS license compliance           | ✅ Active             |
| Semgrep          | SAST (code patterns)             | ❌ Not yet integrated |
| DAST (OWASP ZAP) | Dynamic testing                  | ❌ Not yet integrated |

---

## 6. Compliance Readiness

### GDPR

- [x] Data export functionality (`data_export.ex`)
- [x] Account deletion / right to erasure
- [x] Privacy policy documented
- [x] Consent tracking
- [ ] Data Processing Agreement (DPA) template
- [ ] Data Protection Impact Assessment (DPIA)

### SOC 2 Type II

- [ ] Change management documentation
- [ ] Monitoring & alerting (partial — telemetry exists, alerting stubs)
- [ ] Incident management plan tested
- [ ] Access review process documented

---

## 7. Incident Response Readiness

- [x] Security contact: `security@cgraph.org`
- [x] Vulnerability response SLAs defined (Critical: 24h, High: 72h)
- [x] Operational runbooks documented (`docs/OPERATIONAL_RUNBOOKS.md`)
- [ ] **Incident response drill conducted** — breach notification untested
- [ ] **External notification plan** — user communication templates
- [ ] **Forensics capability** — log aggregation for post-incident analysis

---

## 8. Known Gaps to Disclose to Auditors

1. **Mobile E2EE gap**: Mobile app lacks Double Ratchet / forward secrecy (uses simplified
   encryption)
2. **Sealed sender not implemented**: Metadata protection is limited
3. **Key transparency logs**: No transparency mechanism for key changes
4. **Anomaly detection**: Not implemented — planned for post-audit
5. **SIEM integration**: No external log shipping yet

---

## 9. Pre-Audit Actions (Ordered by Priority)

| #   | Action                            | Priority | Est. Effort | Status         |
| --- | --------------------------------- | -------- | ----------- | -------------- |
| 1   | Select and engage audit firms     | P0       | 1 week      | ❌ Not started |
| 2   | Provision staging environment     | P0       | 2 days      | ❌ Not started |
| 3   | Add auth lifecycle audit events   | P1       | 1 day       | ❌ Not started |
| 4   | Integrate Semgrep in CI           | P1       | 0.5 day     | ❌ Not started |
| 5   | Enable audit retention cleanup    | P2       | 0.5 day     | ❌ Not started |
| 6   | Conduct incident response drill   | P2       | 1 day       | ❌ Not started |
| 7   | Create auditor access credentials | P1       | 0.5 day     | ❌ Not started |
| 8   | Review and update API docs        | P2       | 1 day       | ❌ Not started |
| 9   | Ship Semgrep results baseline     | P2       | 0.5 day     | ❌ Not started |

---

## Change Log

| Date       | Change                                                             |
| ---------- | ------------------------------------------------------------------ |
| 2026-02-17 | Initial checklist created                                          |
| 2026-02-17 | Audit persistence enabled for security events (was in-memory only) |
