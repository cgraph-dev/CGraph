# CGraph Codebase Concerns

> **Generated**: February 26, 2026 | **Source**: Full monorepo analysis **Codebase Version**: 0.9.53
> | **Composite Score**: 8.7/10

---

## 1. Critical Security Concerns

### 1.1 External Audits Not Conducted (P0 — Blocking Launch)

Both external security reviews are **overdue** (targeted Q1 2026, never started):

- **E2EE Protocol Audit**: PQXDH + Triple Ratchet + ML-KEM-768 implementation has **never been
  externally audited**. Candidate firms identified (NCC Group, Trail of Bits, Cure53, Doyensec) but
  no engagement signed. Budget: $25K–$120K. (`docs/SECURITY_REVIEW_TRACKING.md`,
  `docs/SECURITY_AUDIT_CHECKLIST.md`)
- **External Penetration Test**: No pen test has ever been conducted against the application.
  Candidate firms identified (Bishop Fox, Cobalt, Synack) but no engagement signed. Budget:
  $15K–$80K. (`docs/SECURITY_REVIEW_TRACKING.md`)

### 1.2 Security Audit Checklist — Incomplete Operational Items

5 operational security actions remain unchecked (`docs/SECURITY_AUDIT_CHECKLIST.md`):

- [ ] Audit firm selection and engagement contracts
- [ ] Staging environment provisioned for auditors
- [ ] Auditor credentials created with scoped access
- [ ] Anonymized database snapshot available
- [ ] Network diagram provided (Fly.io topology)

### 1.3 Authentication Gaps

- **Session invalidation on device lock**: Not implemented (`docs/SECURITY_AUDIT_CHECKLIST.md` §4.1)
- **Remote session revocation**: Only partial implementation
- **Device binding**: Not implemented — JWT claims contain only `jti/iat/kid`, no device fingerprint
  (`docs/V1_ACTION_PLAN.md` §2.6)

### 1.4 Audit Logging Incomplete

Several audit event categories are not yet logged (`docs/SECURITY_AUDIT_CHECKLIST.md` §4.3):

- [ ] Auth lifecycle events (`login_success`, `logout`, `password_change`)
- [ ] Admin panel access logging
- [ ] Billing/payment event logging
- [ ] Retention cleanup not enabled in production

### 1.5 Key Backup/Recovery Not Implemented

E2EE key backup and recovery is listed as a **gap** in the security audit checklist
(`docs/SECURITY_AUDIT_CHECKLIST.md` §2.1). If a user loses their device, E2EE message history is
unrecoverable.

### 1.6 Threat Model Open Items

From `docs/THREAT_MODEL.md`:

- [ ] Transparency logs for key changes (T-R3 mitigation gap)
- [ ] SRI hashes for CDN scripts (supply chain attack mitigation)
- [ ] Sealed sender (hide sender identity from server — metadata protection)
- [ ] Anomaly detection system (listed as planned, not implemented)
- [ ] Key rotation automation (currently manual process)
- [ ] SIEM integration (centralized log analysis — not implemented)
- [ ] Incident response plan is draft-only, not tested

### 1.7 CSP Accepted Risk

`style-src 'unsafe-inline'` is intentionally set because Framer Motion and Radix UI inject inline
style attributes. This is documented as an accepted risk but remains a security trade-off. Migration
path depends on upstream library support. (`docs/SECURITY_AUDIT_CHECKLIST.md` §4.4)

---

## 2. Testing Gaps (Rule 9 — FAIL)

### 2.1 Web Test Coverage Critically Low

This is the **single biggest compliance failure** in the World-Class Gap Analysis:

| Metric                  | Current   | Target       | Gap                |
| ----------------------- | --------- | ------------ | ------------------ |
| Web test files          | 399       | ~2,230 (1:1) | **~1,831 missing** |
| Web test coverage ratio | ~17.9%    | 100%         | ~82.1%             |
| CI coverage gate        | 40% lines | 70%+         | Gate too low       |

Source: `docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 9

### 2.2 Per-Module Test Coverage Breakdown

| Module       | Tests | Components | Coverage | Missing |
| ------------ | ----- | ---------- | -------- | ------- |
| settings     | 27    | 186        | 14.5%    | 159     |
| premium      | 6     | 38         | 15.8%    | 32      |
| groups       | 15    | 91         | 16.5%    | 76      |
| admin        | 11    | 66         | 16.7%    | 55      |
| forums       | 43    | 232        | 18.5%    | 189     |
| gamification | 37    | 192        | 19.3%    | 155     |
| social       | 18    | 81         | 22.2%    | 63      |
| search       | 6     | 26         | 23.1%    | 20      |
| calls        | 5     | 18         | 27.8%    | 13      |
| auth         | 9     | 32         | 28.1%    | 23      |
| moderation   | 9     | 27         | 33.3%    | 18      |
| chat         | 74    | 192        | 38.5%    | 118     |

### 2.3 CI Coverage Thresholds Too Low

Actual CI enforcement thresholds are well below aspirational targets
(`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 13):

- Vitest: statements 40%, branches 55%, functions 50%, lines 40%
- CI hard gate: `WEB_PCT < 40`
- Previous documentation claimed 65% — this was **inflated and corrected**

### 2.4 Missing Test Categories

- [ ] Customization integration tests (Wave 6.1 — NOT DONE)
- [ ] Backend sender data tests (Wave 6.2 — NOT DONE)
- [ ] Store→API→component integration tests (Rule 9.5 — NOT DONE)
- [ ] Actual backend line coverage % unknown — need `MIX_ENV=test mix coveralls` run
- [ ] Mobile has only 25 test files (needs assessment)
- 1 test suite skipped (`App.test.tsx` — hangs loading entire app tree)

---

## 3. Load Testing Not Executed

### 3.1 Zero Production/Staging Load Test Runs

k6 test scripts exist but **no load tests have been executed against staging or production**
(`docs/LOAD_TEST_RESULTS.md`):

- 5 k6 scripts ready: `infrastructure/load-tests/k6/{smoke,load,stress,websocket,writes}.js`
- Only a local dev smoke test baseline exists (179ms avg, 5.24 RPS, 10 VUs)
- Auth duration p95=383ms **exceeded** the 300ms SLO threshold even in local dev
- Operational Maturity Registry scores load testing at **3/10**
  (`docs/OPERATIONAL_MATURITY_REGISTRY.md` §4)

### 3.2 No Baseline Metrics

No documented baseline for: p50/p95/p99 latency under load, max RPS before degradation, WebSocket
connection limits, database connection pool saturation point, or message write throughput.

---

## 4. Technical Debt — Code-Level

### 4.1 TODO/FIXME Comments in Code

Active TODOs found in production code:

| File                                                                     | TODO                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `apps/mobile/src/lib/crypto/e2ee.ts:585`                                 | `TODO: DH4 = ECDH(EK_A, OPK_B)` — one-time prekey DH computation not implemented           |
| `apps/mobile/src/lib/deepLinks.ts:249`                                   | `TODO: Add GroupInviteAccept screen` — invite flow not built                               |
| `apps/mobile/src/stores/index.ts:182`                                    | `TODO: wire to forum store` — forums facade returns empty array                            |
| `apps/mobile/src/stores/index.ts:259`                                    | `TODO: wire to gamification store coins` — balance hardcoded to 0                          |
| `apps/mobile/src/features/messaging/hooks/index.ts:40`                   | `TODO: Implement with expo-av` — voice recording stub                                      |
| `apps/mobile/src/features/messaging/components/index.ts:21`              | `TODO: Create when needed` — placeholder component barrel                                  |
| `apps/backend/test/cgraph_web/channels/chat_channel_test.exs:15,33`      | `TODO: Create conversation fixture` / `TODO: Set up joined socket` — incomplete test setup |
| `apps/backend/lib/cgraph/collaboration/document_server.ex:291`           | `TODO(P2): Implement server-side Yjs state compaction` — unbounded state growth            |
| `apps/web/src/pages/customize/progression-customization/mock-data.ts:10` | `@todo(api) Create achievements API endpoints` — using mock data                           |

### 4.2 eslint-disable Suppressions (60+ occurrences)

Widespread use of `eslint-disable` comments indicating type safety workarounds:

**Mobile app** (~35+ suppressions):

- `@typescript-eslint/no-explicit-any`: 14+ files (`apps/mobile/src/screens/moderation/`,
  `apps/mobile/src/hooks/useGamification.ts`, `apps/mobile/src/screens/settings/`, etc.)
- `@typescript-eslint/no-non-null-assertion`: 6+ files
  (`apps/mobile/src/screens/settings/profile-screen.tsx`,
  `apps/mobile/src/screens/community/leaderboard/`)
- `no-console`: 7+ files (`apps/mobile/src/hooks/usePushNotifications.ts`,
  `apps/mobile/src/screens/messages/conversation-screen/components/video-components.tsx`)
- `react-hooks/rules-of-hooks`:
  `apps/mobile/src/screens/forums/create-post-screen/components/post-type-selector.tsx:23,26` —
  **hooks called conditionally** (rules violation)

**Shared packages** (~20+ suppressions):

- `@typescript-eslint/consistent-type-assertions`: pervasive across `packages/utils/src/helpers.ts`
  (6), `packages/socket/src/phoenixClient.ts` (3), `packages/api-client/src/client.ts` (4),
  `packages/crypto/src/tripleRatchet.ts`

### 4.3 Type Assertion Debt — 952 Suppressed Casts

952 `as X` type assertions are suppressed via `eslint-disable` directives, not refactored to type
guards. While annotated with `// type assertion: [reason]` comments, these represent **structural
type safety debt**:

- `scripts/fix-type-assertions.mjs` documents the situation
- Affects 49+ web files and multiple package files
- Original intent was to replace with runtime type guards; only ~40 were actually replaced

### 4.4 Deprecated Code Still Present

Active `@deprecated` annotations across the codebase:

| File                                                                                        | What's Deprecated                                                                   |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/modules/chat/store/chatBubbleStore.impl.ts`                                   | Entire file — should import from `@/stores/theme`                                   |
| `apps/web/src/lib/crypto/e2ee/key-bundle.ts:79`                                             | Use `e2ee-secure/key-storage.ts` instead                                            |
| `apps/web/src/modules/settings/components/ui-customization-settings.tsx`                    | Import from `./ui-customization` instead                                            |
| `apps/web/src/modules/settings/store/customization/customizationStore.selectors.ts:107-125` | Object selectors cause infinite render loops                                        |
| `apps/web/src/stores/theme/selectors.ts:56`                                                 | Use individual selectors to avoid render issues                                     |
| `apps/mobile/src/lib/crypto/e2ee.ts:179-235`                                                | 6 deprecated types — Phase 2 will replace with portable types from `@cgraph/crypto` |
| `apps/web/src/modules/forums/components/custom-emoji-picker.tsx`                            | Import from `./emoji-picker` instead                                                |
| `apps/web/src/components/content/bb-code-editor.tsx`                                        | Import from `@/modules/forums/components/bbcode-editor`                             |
| `apps/web/src/modules/admin/components/admin-dashboard/shared-components.tsx:159`           | Use `DashboardChart` instead                                                        |
| `apps/web/src/components/enhanced/ui/holographic-ui-v4.tsx`                                 | Import from `./holographic-ui` instead                                              |

---

## 5. Architecture Risks

### 5.1 Mobile Crypto Not Fully Migrated

Mobile E2EE still uses classical ECDH/AES-GCM. Post-quantum (PQ) scaffolding is done but full Triple
Ratchet is deferred to Phase 2 (`docs/SECURITY_AUDIT_CHECKLIST.md` §2.1). The mobile `e2ee.ts`
contains 6 deprecated type definitions awaiting replacement with portable types from
`@cgraph/crypto`.

### 5.2 CRDT Document Server — Unbounded State Growth

`apps/backend/lib/cgraph/collaboration/document_server.ex:291` has a TODO for Yjs state compaction.
The `compact_updates` function is a no-op. This means CRDT document state grows unboundedly in
memory, which will cause issues with long-lived documents (`docs/V1_ACTION_PLAN.md` Session 37 §P1).

### 5.3 useMemo/useCallback Debt — 1,112 Instances

1,112 `useMemo`/`useCallback` hooks across ~250 files cannot be removed until React Compiler
(`babel-plugin-react-compiler`) is enabled. These are technically unnecessary with React 19 but
required without the compiler (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 12).

### 5.4 Mobile File Size Non-Compliance

**160 mobile TSX files exceed the 300-line limit.** CI warns but does not block. 6 were split in
Session 59 (→ 31 sub-files), but the majority remain (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 8).

### 5.5 Wave 4 (Database & Scaling) — Largely Incomplete

5 of 7 Wave 4 tasks are NOT DONE (`docs/WORLD_CLASS_GAP_ANALYSIS.md`):

| Task                                                      | Status   |
| --------------------------------------------------------- | -------- |
| Deploy PgBouncer                                          | NOT DONE |
| Configure Read Replicas                                   | NOT DONE |
| Activate MeiliSearch (currently PostgreSQL fallback only) | NOT DONE |
| Message Archival Strategy                                 | NOT DONE |
| Frontend Scaling Optimizations                            | PARTIAL  |

### 5.6 Waves 7-9 Not Started

Most tasks in Waves 7-9 (Groups, Mobile, Backend features) are NOT STARTED — covering channel
permissions, pinned messages, categories, custom status, DND mode, quick switcher, and mobile
feature parity.

---

## 6. Performance Concerns

### 6.1 Nested Preload Depth

Conversation messages query has 3-level nested preloads triggering 4+ additional queries. From
`docs/QUERY_PERFORMANCE_AUDIT.md` query #5:

> `sender: :customization`, `reactions: :user`, `reply_to: [sender: :customization]` **Note**:
> 3-level nested preload triggers 4+ additional queries. At scale, consider batch loading or lateral
> joins.

### 6.2 Auth Duration Exceeds SLO

Even in local dev smoke test, auth p95 latency was **383ms** vs the **300ms SLO target**
(`docs/V1_ACTION_PLAN.md` §3.6). This will worsen under production load.

### 6.3 MeiliSearch Not Deployed

Search currently falls back to PostgreSQL `ILIKE` with GIN trigram indexes. MeiliSearch integration
code exists (`lib/cgraph/search/search_engine.ex`) but is not deployed in production. This affects
search latency at scale (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Wave 4.4).

### 6.4 PgBouncer Not Deployed

Connection pooling via PgBouncer is planned but not deployed (`docs/WORLD_CLASS_GAP_ANALYSIS.md`
Wave 4.1). Under high concurrency, database connection exhaustion is identified as a
Medium-likelihood/High-impact threat (`docs/THREAT_MODEL.md` T-D4).

### 6.5 Monitored Performance Concerns (Not Bugs)

From `docs/V1_ACTION_PLAN.md` Session 37:

| ID  | Area      | Description                                                                      |
| --- | --------- | -------------------------------------------------------------------------------- |
| P1  | CRDT      | DocumentServer Yjs state grows unboundedly — `compact_updates` is a TODO no-op   |
| P3  | CRDT      | Race condition: incremental updates could arrive before initial state in mailbox |
| P4  | Collab    | `useCollaborativeEditor` creates extra `Y.Doc()` on every render                 |
| P5  | AI Config | `enabled: false` vs `api_key` presence check disconnected in runtime.exs         |
| P6  | Sync      | `list_user_conversations_since` doesn't filter soft-deleted conversations        |

---

## 7. Elixir Version Mismatch

Dockerfile pins Elixir **1.17.3** while local development uses **1.19.4**
(`docs/CURRENT_STATE_DASHBOARD.md` Version Matrix). This version divergence can cause production
behavior differences, especially with Elixir 1.18/1.19 language features.

---

## 8. Inline Animation Values Remaining

~100+ inline animation values remain that couldn't be migrated to presets because they are dynamic
or layout-dependent. 319 of 339 identified inline values were migrated, but the remainder needs
incremental migration (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 4).

---

## 9. Compliance & Process Gaps

### 9.1 SOC 2 / GDPR Readiness

From `docs/THREAT_MODEL.md` §6:

| Requirement               | Status     | Gap                                        |
| ------------------------- | ---------- | ------------------------------------------ |
| GDPR Breach notification  | ⚠️ Partial | Process documented but not tested          |
| SOC 2 Change management   | ⚠️ Partial | PR reviews exist but formal process needed |
| SOC 2 Monitoring          | ⚠️ Partial | Basic — needs enhancement                  |
| SOC 2 Incident management | ⚠️ Partial | Documented but needs testing               |

### 9.2 Detective Controls Incomplete

- **Anomaly detection**: Not implemented (planned)
- **Security scanning**: Gitleaks active, Semgrep added, but SIEM integration missing
- **Audit logging**: Only covers auth events — needs expansion

### 9.3 Key Rotation Manual

Key rotation is currently a manual process. Automation is listed as P1 priority
(`docs/THREAT_MODEL.md` §7).

---

## 10. Dependency & Build Concerns

### 10.1 Vulnerability Status Unknown

The Current State Dashboard shows TBD for medium/low npm and Elixir dependency vulnerabilities, and
TBD for container image high-severity CVEs (`docs/CURRENT_STATE_DASHBOARD.md` Vulnerability Status
table). While critical CVEs are at 0, the full vulnerability picture is not tracked.

### 10.2 Mobile App Still in Beta

Mobile app is listed as 🟡 Beta — not GA. iOS/Android public release (TestFlight/Play Store) is
listed as P0 for v1.0 but marked as "In Progress" (`docs/ROADMAP.md`).

---

## 11. Documentation Gaps

### 11.1 JSDoc Enforcement Gap

`eslint-plugin-jsdoc` is configured but `require-jsdoc` and `require-description` rules remain at
**warn** (not error) because 150+ exported functions still lack JSDoc. Escalation blocked until
JSDoc backfill is complete (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 6).

### 11.2 Mock Data in Production Code

`apps/web/src/pages/customize/progression-customization/mock-data.ts` contains placeholder data with
a `@todo(api)` annotation indicating real API endpoints need to be created.

---

## 12. SLO & Operational Readiness

### 12.1 SLOs Defined But Not Validated

SLO targets are well-documented (`docs/SLO_DOCUMENT.md`) with Prometheus recording rules and Grafana
dashboards, but **actual SLO compliance has never been measured in production**. Error budgets, burn
rates, and budget exhaustion policies exist on paper only.

### 12.2 Disaster Recovery Not Tested

DR procedures are documented with target RPO/RTO values:

- PostgreSQL: RPO 1 hour / RTO 4 hours
- Application tier: RTO 5 minutes

But the testing schedule section is empty — no DR drill has been conducted (`docs/SLO_DOCUMENT.md`).

---

## 13. Roadmap Risks

### 13.1 v1.0 Launch Blockers (Target: June 2026)

From `docs/ROADMAP.md` launch checklist, these remain unchecked:

- [ ] Security audit report published
- [ ] Mobile apps in TestFlight/Play Store
- [ ] Status page live (status.cgraph.org)
- [ ] Support ticketing system ready
- [ ] Community server seeded
- [ ] Press kit and launch blog post
- [ ] Analytics and error tracking verified

### 13.2 Overall World-Class Compliance

From `docs/WORLD_CLASS_GAP_ANALYSIS.md` Part 5 scorecard:

| Dimension                    | Status                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Animation Standards (Rule 4) | ~75% — ~100+ dynamic inline values remain                    |
| Mobile File Size (Rule 8)    | ~60% — 160 mobile TSX files over 300 lines                   |
| Testing (Rule 9)             | **FAIL** — 17.9% web test coverage vs 100% target            |
| Type Safety (Rule 11)        | ~80% — 952 `as` casts suppressed via eslint-disable          |
| React 19 (Rule 12)           | ~98% — React Compiler not enabled, 1,112 useMemo/useCallback |

### 13.3 Wave Task Completion

Only **~67% of 106 wave tasks are done** (~71/106). Major incomplete waves:

- Wave 4 (Database & Scaling): 2/7 done
- Wave 6 (Testing): 1/3 done
- Waves 7-9: Mostly NOT STARTED

---

## 14. Prioritized Action Items

### P0 — Critical (Launch Blockers)

1. **Engage external E2EE audit firm** — Validates cryptographic implementation before public launch
2. **Engage external penetration test firm** — Required before public-facing deployment
3. **Run load tests against staging** — Zero production-grade performance data exists
4. **Implement key backup/recovery** — Users will lose E2EE history on device loss

### P1 — High Priority

5. **Raise web test coverage** — 17.9% is the single biggest compliance failure; target 60%+
6. **Deploy PgBouncer** — Database connection pooling needed before scaling
7. **Activate MeiliSearch in production** — Search falls back to PostgreSQL ILIKE
8. **Fix Elixir version mismatch** — Dockerfile 1.17.3 vs local 1.19.4
9. **Complete audit logging** — Auth lifecycle, admin access, billing events not logged
10. **Implement CRDT state compaction** — DocumentServer Yjs state grows unboundedly

### P2 — Medium Priority

11. **Split 160 oversized mobile TSX files** — CI warns but doesn't block
12. **Refactor 952 type assertion suppressions** — Replace eslint-disable with type guards
13. **Enable React Compiler** — Allows removal of 1,112 useMemo/useCallback hooks
14. **Clean up deprecated files** — 10+ deprecated shims still in codebase
15. **Implement anomaly detection** — Currently no system for detecting attack patterns
16. **Automate key rotation** — Currently manual process
17. **Wire mobile store facades** — Forums returns empty array, balance hardcoded to 0
18. **Replace mock data with real API** — Progression customization uses placeholder data
19. **Fix conditional hooks violation** —
    `apps/mobile/src/screens/forums/create-post-screen/components/post-type-selector.tsx` calls
    hooks conditionally
20. **Conduct DR drill** — Disaster recovery procedures documented but never tested

### P3 — Long Term

21. **Implement sealed sender** — Metadata protection for privacy-conscious users
22. **SIEM integration** — Centralized security log analysis
23. **Bug bounty program** — Post-launch security incentives
24. **SRI hashes for CDN scripts** — Supply chain attack mitigation
25. **Transparency logs for key changes** — Auditability improvement
26. **Complete Wave 4-9 tasks** — ~35 remaining wave tasks across scaling, testing, and features
27. **Status page** — status.cgraph.org not live
28. **Support ticketing system** — Not set up

---

## Summary Statistics

| Category                     | Count  |
| ---------------------------- | ------ |
| P0 Critical blockers         | 4      |
| P1 High priority items       | 6      |
| P2 Medium priority items     | 10     |
| P3 Long-term items           | 8      |
| Active TODO comments in code | 9      |
| eslint-disable suppressions  | 60+    |
| Type assertion suppressions  | 952    |
| Deprecated files/annotations | 10+    |
| Missing web test files       | ~1,831 |
| Oversized mobile TSX files   | 160    |
| Incomplete wave tasks        | ~35    |
| Security reviews overdue     | 2      |
| SLOs not validated           | 6      |

---

<sub>**CGraph Codebase Concerns** • Generated February 26, 2026 • Based on full monorepo
analysis</sub>
