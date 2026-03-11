# CGraph Codebase Concerns

> **Generated**: February 26, 2026 | **Updated**: March 11, 2026 | **Source**: Full monorepo
> analysis | **Codebase Version**: 1.1.0 | **Composite Score**: 8.7/10

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
  (`.archived/docs/V1_ACTION_PLAN.md` §2.6)

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
| Web test files          | 357       | ~2,218 (1:1) | **~1,861 missing** |
| Web test coverage ratio | ~16.1%    | 100%         | ~83.9%             |
| CI coverage gate        | 40% lines | 70%+         | Gate too low       |

Source: `.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 9

### 2.2 Per-Module Test Coverage Breakdown

| Module       | Tests | Components | Coverage | Missing |
| ------------ | ----- | ---------- | -------- | ------- | ------------------------------------------------- |
| settings     | 27    | 186        | 14.5%    | 159     |
| premium      | 6     | 38         | 15.8%    | 32      |
| groups       | 15    | 91         | 16.5%    | 76      |
| admin        | 11    | 66         | 16.7%    | 55      |
| forums       | 43    | 232        | 18.5%    | 189     |
| gamification | —     | —          | N/A      | —       | ← **REMOVED** (Phase 26: module deleted from web) |
| social       | 18    | 81         | 22.2%    | 63      |
| search       | 6     | 26         | 23.1%    | 20      |
| calls        | 5     | 18         | 27.8%    | 13      |
| auth         | 9     | 32         | 28.1%    | 23      |
| moderation   | 9     | 27         | 33.3%    | 18      |
| chat         | 74    | 192        | 38.5%    | 118     |

### 2.3 CI Coverage Thresholds Too Low

CI enforcement thresholds have been raised but the hard gate in `ci.yml` remains low
(`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 13):

- Vitest (`apps/web/vite.config.ts`): statements 40%, branches 55%, functions 50%, lines 40%
- CI hard gate in `.github/workflows/ci.yml`: `WEB_PCT < 40` (aligned with vitest lines threshold)
- Separate `coverage.yml` coverage-gate job runs vitest with same thresholds / 75% backend
- **Note**: `ci.yml` hard gate (40%) is now aligned with vitest lines threshold (40%)

### 2.4 Missing Test Categories

- [ ] Customization integration tests (Wave 6.1 — NOT DONE)
- [ ] Backend sender data tests (Wave 6.2 — NOT DONE)
- [ ] Store→API→component integration tests (Rule 9.5 — NOT DONE)
- [ ] Actual backend line coverage % unknown — need `MIX_ENV=test mix coveralls` run
- [ ] Mobile has only 23 test files (needs assessment)
- 1 test suite skipped (`App.test.tsx` — hangs loading entire app tree)

---

## 3. Load Testing — No Usable Production Baseline

### 3.1 No Successful Production/Staging Load Test Runs

k6 test scripts exist and have been **attempted** but produced no usable results
(`.archived/docs/LOAD_TEST_RESULTS.md`):

- 8 k6 scripts ready:
  `infrastructure/load-tests/k6/{smoke,load,stress,websocket,writes,realistic-traffic,rich-media,websocket-10k}.js`
- Load test result files exist in `infrastructure/load-tests/k6/results/` for `realistic-traffic`,
  `rich-media`, and `websocket` — but **all checks failed** (100% fail rate, 0 passes), likely run
  against unreachable targets
- Only a local dev smoke test baseline exists (179ms avg, 5.24 RPS, 10 VUs)
- Auth duration p95=383ms **exceeded** the 300ms SLO threshold even in local dev
- Operational Maturity Registry scores load testing at **3/10**
  (`.archived/docs/OPERATIONAL_MATURITY_REGISTRY.md` §4)

### 3.2 No Baseline Metrics

No documented baseline for: p50/p95/p99 latency under load, max RPS before degradation, WebSocket
connection limits, database connection pool saturation point, or message write throughput.

---

## 4. Technical Debt — Code-Level

### 4.1 TODO/FIXME Comments in Code

Active TODOs found in production code:

| File                                                                         | TODO                                                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/lib/deepLinks.ts:245`                                       | `TODO: Add GroupInviteAccept screen` — invite flow not built                                                    |
| `apps/backend/test/cgraph_web/channels/chat_channel_test.exs:15,33`          | `TODO: Create conversation fixture` / `TODO: Set up joined socket` — incomplete test setup                      |
| `apps/backend/lib/cgraph/ai/moderation.ex:23`                                | `TODO: Integrate vision model (OpenAI GPT-4V / Claude) for image analysis` — image moderation stub              |
| ~~`apps/mobile/src/lib/crypto/e2ee.ts:585`~~                                 | ~~`TODO: DH4 = ECDH(EK_A, OPK_B)`~~ — **RESOLVED**: TODO removed                                                |
| ~~`apps/mobile/src/stores/index.ts:193`~~                                    | ~~`TODO: wire to forum store`~~ — **RESOLVED**: TODO removed                                                    |
| ~~`apps/mobile/src/stores/index.ts:270`~~                                    | ~~`TODO: wire to gamification store coins`~~ — **RESOLVED**: TODO removed                                       |
| ~~`apps/mobile/src/features/messaging/hooks/index.ts:40`~~                   | ~~`TODO: Implement with expo-av`~~ — **RESOLVED**: real implementation added                                    |
| ~~`apps/mobile/src/features/messaging/components/index.ts:21`~~              | ~~`TODO: Create when needed`~~ — **RESOLVED**: components now exported                                          |
| ~~`apps/mobile/src/screens/calls/call-history-screen.tsx:86`~~               | ~~`TODO: get from auth store in production`~~ — **RESOLVED**: uses `useAuthStore`                               |
| ~~`apps/backend/lib/cgraph/collaboration/document_server.ex:291`~~           | ~~`TODO(P2): Implement server-side Yjs state compaction`~~ — **RESOLVED**: `compact_updates` now has real logic |
| ~~`apps/web/src/pages/customize/progression-customization/mock-data.ts:10`~~ | ~~`@todo(api) Create achievements API endpoints`~~ — **RESOLVED**: file deleted (Phase 26)                      |

**Web `TODO(phase-26)` Rewire Comments** (~20+ across 34 files, ~53 markers):

After the Phase 26 gamification removal, ~53 `TODO(phase-26): Rewire` comments remain across 34 web
files. These mark places where gamification components (LevelProgress, TitleBadge, InlineTitle,
ProgressionCustomization, ReferralDashboard) were deleted and replaced with stub/empty JSX. Key
affected areas: `pages/profile/`, `pages/customize/`, `pages/settings/`, `pages/forums/`,
`pages/messages/`, `pages/referrals/`.

### 4.2 eslint-disable Suppressions (167 in mobile/packages, 449 total with web)

Widespread use of `eslint-disable` comments indicating type safety workarounds:

**Mobile app** (~138 suppressions):

- `@typescript-eslint/no-explicit-any`: 14+ files (`apps/mobile/src/screens/moderation/`,
  `apps/mobile/src/screens/settings/`, etc.)
- `@typescript-eslint/no-non-null-assertion`: 6+ files
  (`apps/mobile/src/screens/settings/profile-screen.tsx`,
  `apps/mobile/src/screens/community/leaderboard/`)
- `no-console`: 7+ files (`apps/mobile/src/hooks/usePushNotifications.ts`,
  `apps/mobile/src/screens/messages/conversation-screen/components/video-components.tsx`)
- `react-hooks/rules-of-hooks`:
  `apps/mobile/src/screens/forums/create-post-screen/components/post-type-selector.tsx:23,26` —
  **hooks called conditionally** (rules violation)

**Web app** (~282 suppressions)

**Shared packages** (~29 suppressions):

- `@typescript-eslint/consistent-type-assertions`: pervasive across `packages/utils/src/helpers.ts`
  (6), `packages/socket/src/phoenixClient.ts` (3), `packages/api-client/src/client.ts` (4),
  `packages/crypto/src/tripleRatchet.ts`

### 4.3 Type Assertion Debt — 345 Annotated Casts (Originally 952)

345 `as X` type assertions remain annotated with `// type assertion:` comments (originally 952,
partially refactored). While annotated with reason comments, these represent **structural type
safety debt**:

- `scripts/fix-type-assertions.mjs` documents the situation
- Affects ~99 web files (0 mobile files)
- Original intent was to replace with runtime type guards; only ~40 were actually replaced
- Rule 11 (Type Safety) now rated **PASS** in gap analysis — 0 unannotated casts remain

### 4.4 Deprecated Code Still Present

Active `@deprecated` annotations across the codebase (includes 7 XP/gamification stubs in backend):

| File                                                                                        | What's Deprecated                                                                   |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --- | -------------------------------------------------------- | ----------------------------------------------- |
| `apps/web/src/modules/chat/store/chatBubbleStore.impl.ts`                                   | Entire file — should import from `@/stores/theme`                                   |
| `apps/web/src/lib/crypto/e2ee/key-bundle.ts:79`                                             | Use `e2ee-secure/key-storage.ts` instead                                            |
| `apps/web/src/modules/settings/components/ui-customization-settings.tsx`                    | Import from `./ui-customization` instead                                            |
| `apps/web/src/modules/settings/store/customization/customizationStore.selectors.ts:111,125` | Object selectors cause infinite render loops                                        |
| `apps/web/src/stores/theme/selectors.ts:56`                                                 | Use individual selectors to avoid render issues                                     |
| `apps/mobile/src/lib/crypto/e2ee.ts:179-235`                                                | 7 deprecated types — Phase 2 will replace with portable types from `@cgraph/crypto` |
| `apps/web/src/modules/forums/components/custom-emoji-picker.tsx`                            | Import from `./emoji-picker` instead                                                |
| `apps/web/src/components/content/bb-code-editor.tsx`                                        | Import from `@/modules/forums/components/bbcode-editor`                             |
| `apps/web/src/modules/admin/components/admin-dashboard/shared-components.tsx:159`           | Use `DashboardChart` instead                                                        |
| `apps/web/src/components/enhanced/ui/holographic-ui-v4.tsx`                                 | Import from `./holographic-ui` instead                                              |     | `apps/web/src/components/enhanced/ui/holographic-ui.tsx` | Use the v4 API from `./holographic-ui` directly |
| `apps/web/src/pages/customize/effects-customization.tsx`                                    | Import from `./effects-customization/index` instead                                 |
| ~~`apps/web/src/pages/leaderboard/leaderboard-page.tsx`~~                                   | ~~Import from `@/pages/leaderboard` instead~~ — **RESOLVED**: file deleted          |
| `apps/web/src/modules/forums/components/thread-view.tsx`                                    | Import from `./thread-view/index` instead for modular access                        |
| `apps/web/src/components/ui/animated-avatar.tsx`                                            | Import from `@/components/ui/animated-avatar` instead                               |
| `packages/shared-types/src/subscription.ts:48`                                              | Use `Invoice` from `./billing` instead                                              |
| `apps/backend/lib/cgraph/gamification.ex:48-75`                                             | 7 XP/streak stubs marked `@deprecated "XP system removed — no-op stub"` (Phase 26)  |

---

## 5. Architecture Risks

### 5.1 Mobile Crypto Not Fully Migrated

Mobile E2EE still uses classical ECDH/AES-GCM. Post-quantum (PQ) scaffolding is done but full Triple
Ratchet is deferred to Phase 2 (`docs/SECURITY_AUDIT_CHECKLIST.md` §2.1). The mobile `e2ee.ts`
contains 7 deprecated type definitions awaiting replacement with portable types from
`@cgraph/crypto`.

### 5.2 CRDT Document Server — State Compaction Implemented

`compact_updates` now has real server-side compaction logic — it monitors `yjs_state` byte size and
broadcasts compaction requests to connected clients when state exceeds 512KB. The original TODO at
`document_server.ex:291` has been resolved. However, compaction relies on client cooperation (client
must respond to compaction broadcast), so documents with no active clients cannot be compacted
server-side. Originally tracked as P1 in `.archived/docs/V1_ACTION_PLAN.md` Session 37 §P1.

### 5.3 useMemo/useCallback Debt — ~2,448 Instances

~2,448 `useMemo`/`useCallback` hook usages across ~575 files cannot be removed until React Compiler
(`babel-plugin-react-compiler`) is enabled. These are technically unnecessary with React 19 but
required without the compiler. Rule 12 (React 19 Patterns) is now rated **PASS** in gap analysis
(`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 12).

### 5.4 Mobile File Size Non-Compliance

**136 mobile TSX files exceed the 300-line limit** (up from 133 at last audit). CI warns but does
not block. 6 were split in Session 59 (→ 31 sub-files), but the backlog has grown. Note: Rule 8
(File Size) is rated **PASS** for web (16 tracked files all split), but mobile remains non-compliant
(`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 8).

### 5.5 Wave 4 (Database & Scaling) — Largely Incomplete

5 of 7 Wave 4 tasks are NOT DONE (`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md`):

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
`.archived/docs/QUERY_PERFORMANCE_AUDIT.md` query #5:

> `sender: :customization`, `reactions: :user`, `reply_to: [sender: :customization]` **Note**:
> 3-level nested preload triggers 4+ additional queries. At scale, consider batch loading or lateral
> joins.

### 6.2 Auth Duration Exceeds SLO

Even in local dev smoke test, auth p95 latency was **383ms** vs the **300ms SLO target**
(`.archived/docs/V1_ACTION_PLAN.md` §3.6). This will worsen under production load.

### 6.3 MeiliSearch Not Deployed

Search currently falls back to PostgreSQL `ILIKE` with GIN trigram indexes. MeiliSearch integration
code exists (`lib/cgraph/search/search_engine.ex`) but is not deployed in production. This affects
search latency at scale (`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Wave 4.4).

### 6.4 PgBouncer Not Deployed

Connection pooling via PgBouncer is planned but not deployed
(`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Wave 4.1). Under high concurrency, database connection
exhaustion is identified as a Medium-likelihood/High-impact threat (`docs/THREAT_MODEL.md` T-D4).

### 6.5 Monitored Performance Concerns (Not Bugs)

From `.archived/docs/V1_ACTION_PLAN.md` Session 37:

| ID  | Area      | Description                                                                           |
| --- | --------- | ------------------------------------------------------------------------------------- |
| P1  | CRDT      | DocumentServer Yjs `compact_updates` now implemented — broadcasts compaction at 512KB |
| P3  | CRDT      | Race condition: incremental updates could arrive before initial state in mailbox      |
| P4  | Collab    | `useCollaborativeEditor` creates extra `Y.Doc()` on every render                      |
| P5  | AI Config | `enabled: false` vs `api_key` presence check disconnected in runtime.exs              |
| P6  | Sync      | `list_user_conversations_since` doesn't filter soft-deleted conversations             |

---

## 7. Elixir/OTP Version Mismatch

Dockerfile pins Elixir **1.17.3** on Erlang/OTP **27.1.2** while local development uses Elixir
**1.19.4** on OTP **28.3** (`.tool-versions`). This is a two-level version divergence:

- **Elixir**: 1.17.3 vs 1.19.4 — two minor versions apart
- **Erlang/OTP**: 27.1.2 vs 28.3 — one major version apart

This can cause production behavior differences, especially with Elixir 1.18/1.19 language features
and OTP 28 runtime changes (`.archived/docs/CURRENT_STATE_DASHBOARD.md` Version Matrix).

---

## 8. Inline Animation Values Remaining

~100+ inline animation values remain that couldn't be migrated to presets because they are dynamic
or layout-dependent. 319 of 339 identified inline values were migrated, but the remainder needs
incremental migration (`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 4).

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
TBD for container image high-severity CVEs (`.archived/docs/CURRENT_STATE_DASHBOARD.md`
Vulnerability Status table). While critical CVEs are at 0, the full vulnerability picture is not
tracked.

### 10.2 Mobile App Still in Beta

Mobile app is listed as 🟡 Beta — not GA. iOS/Android public release (TestFlight/Play Store) is
listed as P0 for v1.0 but marked as "In Progress" (`docs/ROADMAP.md`).

---

## 11. Documentation Gaps

### 11.1 JSDoc Enforcement Gap

`eslint-plugin-jsdoc` is configured but `require-jsdoc` and `require-description` rules remain at
**warn** (not error) because 150+ exported functions still lack JSDoc. Escalation blocked until
JSDoc backfill is complete (`.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 6).

### 11.2 Mock Data in Production Code — RESOLVED

~~`apps/web/src/pages/customize/progression-customization/mock-data.ts`~~ — **RESOLVED**: Entire
`progression-customization/` directory was deleted in Phase 26 (gamification removal). No mock data
remains in production code for this feature.

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

From `.archived/docs/WORLD_CLASS_GAP_ANALYSIS.md` Part 5 scorecard:

| Dimension                    | Status                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| Animation Standards (Rule 4) | **PASS** — ~100+ dynamic inline values remain but all migratable ones done |
| Mobile File Size (Rule 8)    | **PASS** (web) — but 136 mobile TSX files still over 300 lines             |
| Testing (Rule 9)             | **FAIL** — 16.1% web test coverage vs 100% target (357/2218)               |
| Type Safety (Rule 11)        | **PASS** — 345 `as` casts annotated, 0 unannotated remain                  |
| React 19 (Rule 12)           | **PASS** — React Compiler not enabled, ~2,448 useMemo/useCallback remain   |

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

5. **Raise web test coverage** — 16.1% is the single biggest compliance failure; target 60%+
6. **Deploy PgBouncer** — Database connection pooling needed before scaling
7. **Activate MeiliSearch in production** — Search falls back to PostgreSQL ILIKE
8. **Fix Elixir/OTP version mismatch** — Dockerfile 1.17.3/OTP-27 vs local 1.19.4/OTP-28
9. **Complete audit logging** — Auth lifecycle, admin access, billing events not logged
10. ~~**Implement CRDT state compaction**~~ — **RESOLVED**: `compact_updates` now has real logic

### P2 — Medium Priority

11. **Split 136 oversized mobile TSX files** — CI warns but doesn't block
12. **Refactor 345 type assertion annotations** — Replace with type guards
13. **Enable React Compiler** — Allows removal of ~2,448 useMemo/useCallback hooks
14. **Clean up deprecated files** — 20 deprecated shims still in codebase
15. **Implement anomaly detection** — Currently no system for detecting attack patterns
16. **Automate key rotation** — Currently manual process
17. ~~**Wire mobile store facades** — Forums returns empty array, balance hardcoded to 0~~
    **RESOLVED** (store TODOs removed, facades now wired)
18. ~~**Replace mock data with real API** — Progression customization uses placeholder data~~
    **RESOLVED** (Phase 26 deletion)
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

## 15. New Concerns (Added March 11, 2026)

### 15.1 Pre-existing TypeScript Errors — 17 in Web App (P2)

17 pre-existing TypeScript errors exist in the web app, primarily related to `AnimatedEmoji`:

- **Duplicate identifier**: `AnimatedEmoji` is exported as both a component (`./animated-emoji.tsx`)
  and an interface (`./lottie-types.ts`) from `src/lib/lottie/index.ts`, causing duplicate
  identifier errors in consumers
- **Type confusion**: `AnimatedEmoji` used as a type (`typeof`) instead of value in emoji-picker and
  lottie-renderer components
- **Affected files**: `src/lib/lottie/index.ts`, `src/lib/lottie/lottie-renderer.tsx`,
  `src/modules/auth/components/auth-logo.tsx`, emoji-picker type imports

### 15.2 Backend Compile Warnings — 15 Active (P2)

15 compile warnings persist in the Elixir backend:

| Warning                                         | Count | Location / Root Cause                                                                                                      |
| ----------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `Forums.is_moderator?/2` undefined              | 2     | `forum_customization_controller.ex:183`, `forum_theme_crud_controller.ex:157` — function never defined in `Forums` context |
| `Gamification.*` undefined/deprecated           | 2     | `deduct_currency/3` undefined; `award_xp/4` deprecated but still called                                                    |
| Unreachable clause / will never match           | 6     | Pattern match clauses that can never execute (3 "cannot match" + 3 "will never match")                                     |
| Ungrouped clauses `upload_prekeys/2`            | 1     | `e2ee_controller.ex:254` — clauses with same name/arity not grouped together                                               |
| `ChatPoll` invalid association                  | 1     | `messaging/message.ex` — `ChatPollVote` missing `chat_poll_id` field                                                       |
| `VoiceMessage.encryption_changeset/2` undefined | 1     | `voice_message_controller.ex:197` — function not defined on `VoiceMessage`                                                 |
| `Moderation.Reports.create_report/1` undefined  | 1     | Controller calls undefined context function                                                                                |
| `HTTPoison` not available                       | 1     | `message_translation.ex:55` — `HTTPoison` not in `mix.exs` dependencies                                                    |

### 15.3 Gamification Stub Cleanup Pending (P3)

The XP/gamification system was deliberately removed in Phase 26, but cleanup is incomplete:

- **Backend**: `apps/backend/lib/cgraph/gamification.ex` still has 7 `@deprecated` stub functions
  (XP grants, level-up checks, streak claims) that return `{:error, :deprecated}`. Could be fully
  removed if no callers remain.
- **Web**: ~53 `TODO(phase-26): Rewire` comments across 34 files mark where gamification UI was
  stripped. These are cosmetic stubs (empty JSX, hardcoded `level = 1`) needing eventual cleanup.
- ~~**Mobile**: `stores/index.ts` had `TODO: wire to gamification store coins`~~ — **RESOLVED**:
  TODO removed, facades wired.

### 15.4 `unlockLevel` Interface Field — Vestigial (P3)

`unlockLevel?: number` still exists in 4 data collection interfaces even though the XP level system
was removed:

- `apps/web/src/data/profileThemes.ts:77`
- `apps/web/src/data/titlesCollection.ts:33`
- `apps/web/src/data/badgesCollection.ts:18`
- `apps/web/src/data/avatar-borders.ts:832`

The field values were stripped from actual data entries but the interface definition remains. Safe
to remove once confirmed no consumers check the field.

### 15.5 Legacy Customization Store Exports — Active Consumers (P3)

- **`themeColors` legacy export**: Exported from `customizationStore.ts:192` as
  `export const themeColors = THEME_COLORS;`. Still has **7 active import consumers** across
  settings panels and preview components. Cannot be removed without migrating consumers.
- **`updateChatStyle` / `updateEffects` batch methods**: Legacy batch-update methods in
  customization store still have consumers in `useChatCustomization.ts`,
  `useEffectsCustomization.ts`, `theme-application-test.tsx`, and tests. Cannot remove yet.

### 15.6 eslint-disable Suppressions — Updated Count (P2)

Web app eslint-disable count is now **282** (up from 271 at last audit — slight increase likely from
new code). Total across monorepo is now ~443 (282 web + ~138 mobile + ~23 packages).

---

## Summary Statistics

| Category                       | Count                                     |
| ------------------------------ | ----------------------------------------- |
| P0 Critical blockers           | 4                                         |
| P1 High priority items         | 6                                         |
| P2 Medium priority items       | 10                                        |
| P3 Long-term items             | 8                                         |
| Active TODO comments in code   | 4 + ~53 phase-26 rewire TODOs             |
| eslint-disable suppressions    | ~443 (282 web, ~138 mobile, ~23 packages) |
| Type assertion annotations     | 345                                       |
| Deprecated files/annotations   | 20 (incl. gamification.ex stubs)          |
| Missing web test files         | ~1,861                                    |
| Oversized mobile TSX files     | 136                                       |
| Incomplete wave tasks          | ~35                                       |
| Security reviews overdue       | 2                                         |
| SLOs not validated             | 6                                         |
| Pre-existing TS errors (web)   | 17                                        |
| Backend compile warnings       | 15                                        |
| Vestigial `unlockLevel` fields | 4                                         |

---

<sub>**CGraph Codebase Concerns** • Generated February 26, 2026 • Updated March 11, 2026 • Based on
full monorepo analysis</sub>
