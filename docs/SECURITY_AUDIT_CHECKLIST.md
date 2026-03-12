# Security Audit Readiness Checklist

> **Version:** 0.9.48 | **Last Updated:** March 2026 **Purpose:** Pre-audit readiness
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
| Forward Secrecy (Mobile)                | Mobile classical ECDH/AES-GCM; PQ scaffolding done, full ratchet Phase 2          | ⚠️ Partial     |

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
| Nodes Economy      | `apps/backend/lib/cgraph/nodes/` + `controllers/api/v1/nodes_controller.ex`        | Wallet balances, transactions, withdrawals |
| Creator Economy    | `apps/backend/lib/cgraph/creators/` + `controllers/api/v1/creator_controller.ex`   | Earnings, payouts, revenue splits    |
| Paid DM            | `apps/backend/lib/cgraph/paid_dm/` + `controllers/api/v1/paid_dm_controller.ex`    | File access gating, payment verification |
| Boosts             | `apps/backend/lib/cgraph/boosts/` + `controllers/api/v1/boost_controller.ex`       | Effect validation, stacking limits   |
| Cosmetics Shop     | `apps/backend/lib/cgraph/cosmetics/` + `controllers/api/v1/cosmetics_controller.ex`| Inventory manipulation, purchase validation |
| Forum Moderation   | `apps/backend/lib/cgraph/forums/` + `controllers/api/v1/forum_admin_controller.ex` | Permission escalation, mod log integrity |

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
- [x] Semgrep SAST integration in CI (`.github/workflows/semgrep.yml` — 8 rulesets, SARIF,
      quick-scan on PRs)

### 4.3 Audit Logging

- [x] Security events logged (2FA, lockouts, token revocations)
- [x] Admin marketplace actions logged to DB
- [x] Group moderation actions logged to DB
- [x] **Security events now persisted to DB** (was in-memory only — fixed Feb 2026)
- [x] Integrity checksums (SHA-256) on audit entries
- [x] **111 Logger string interpolation violations fixed** — all structured metadata (Tier 1, Feb 2026)
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

> **CSP `style-src 'unsafe-inline'` — Accepted Risk**
>
> `style-src 'self' 'unsafe-inline'` is intentionally set in the web and landing CSP policies. This
> is required because **Framer Motion** and **Radix UI** inject inline `style` attributes at runtime
> for animations and positioning (e.g., `transform`, `opacity`, `pointer-events`). Nonce-based
> `style-src` cannot cover dynamically injected `style=` attributes — only `<style>` blocks. There
> is no spec-compliant way to restrict inline style attributes without breaking these libraries.
>
> **Risk assessment:** `style-src` injection alone cannot execute JavaScript. XSS protection is
> enforced via `script-src 'self'` (no `'unsafe-inline'` or `'unsafe-eval'` in source HTML). All
> major production apps using CSS-in-JS or animation libraries accept this trade-off: Discord,
> Slack, Notion, GitHub, and Google Workspace all ship `style-src 'unsafe-inline'`.
>
> **Mitigation path:** When Framer Motion and Radix UI support CSP-safe styling (tracked upstream),
> migrate to `style-src 'self' 'nonce-{random}'` using the existing nonce infrastructure in
> `vite-plugin-csp-nonce.ts`.

### 4.5 Client-Side XSS Protection

#### XSS Audit Results (Feb 21, 2026)

All 8 `dangerouslySetInnerHTML` usages audited and confirmed safe:
- 7 files use `DOMPurify.sanitize()`: ThreadedComment, ContentPreview, AnnouncementItem, post-content, FeedSubscribeModal, SearchResultCard, BBCodeRenderer
- 1 file uses purpose-built `sanitizeCss()`: ForumThemeProvider
- DOMPurify ^3.3.1 installed in apps/web
- **Status: PASS** — No unprotected innerHTML usage found

### 4.6 WebSocket Security

- [x] Socket authentication (`socket_security.ex`)
- [x] Channel authorization checks
- [x] Rate limiting on channel joins
- [x] Message size limits

---

## 5. CI/CD Security Pipeline

| Tool             | Purpose                          | Status                                                                                                     |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Gitleaks         | Secret detection                 | ✅ Active                                                                                                  |
| pnpm audit       | Dependency vulnerabilities       | ✅ Active                                                                                                  |
| Sobelow          | Elixir security analysis         | ✅ Active                                                                                                  |
| Grype            | Container vulnerability scanning | ✅ Active                                                                                                  |
| Syft             | SBOM generation                  | ✅ Active                                                                                                  |
| License checker  | OSS license compliance           | ✅ Active                                                                                                  |
| Semgrep          | SAST (code patterns)             | ✅ Active — .github/workflows/semgrep.yml configured with 8 rulesets, SARIF output, and quick-scan for PRs |
| DAST (OWASP ZAP) | Dynamic testing                  | ❌ Not yet integrated                                                                                      |

> **CI Permissions Hardening (Feb 21, 2026):** All 17 GitHub Actions workflows have explicit `permissions:` blocks (Tier 1, commit `9d8fb58a`).

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

1. **Mobile E2EE gap**: Mobile has classical X3DH + AES-GCM. PQ scaffolding in place (protocol
   negotiation, KEM storage, bundle detection). Full Triple Ratchet deferred pending RN WASM.
2. **Sealed sender not implemented**: Metadata protection is limited
3. **Key transparency logs**: No transparency mechanism for key changes
4. **Anomaly detection**: Not implemented — planned for post-audit
5. **SIEM integration**: Log stack configured (Loki+Promtail), not deployed to production

---

## 9. Pre-Audit Actions (Ordered by Priority)

| #   | Action                            | Priority | Est. Effort | Status         |
| --- | --------------------------------- | -------- | ----------- | -------------- |
| 1   | Select and engage audit firms     | P0       | 1 week      | ❌ Not started |
| 2   | Provision staging environment     | P0       | 2 days      | ❌ Not started |
| 3   | Add auth lifecycle audit events   | P1       | 1 day       | ❌ Not started |
| 4   | Integrate Semgrep in CI           | P1       | 0.5 day     | ✅ Done        |
| 5   | Enable audit retention cleanup    | P2       | 0.5 day     | ✅ Done        |
| 6   | Conduct incident response drill   | P2       | 1 day       | ❌ Not started |
| 7   | Create auditor access credentials | P1       | 0.5 day     | ❌ Not started |
| 8   | Review and update API docs        | P2       | 1 day       | ⚠️ Partial     |
| 9   | Ship Semgrep results baseline     | P2       | 0.5 day     | ✅ Done        |

---

## Change Log

| Date       | Change                                                             |
| ---------- | ------------------------------------------------------------------ |
| 2026-02-20 | PQ deployment complete — backend KEM endpoints, web full stack     |
| 2026-02-20 | Semgrep CI active, audit retention live, mobile PQ scaffolding     |
| 2026-02-17 | Initial checklist created                                          |
| 2026-02-17 | Audit persistence enabled for security events (was in-memory only) |
