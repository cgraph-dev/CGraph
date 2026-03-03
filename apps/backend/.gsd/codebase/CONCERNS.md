# CGraph Codebase Concerns

> **Generated**: February 26, 2026 | **Updated**: March 4, 2026 | **Source**: Full monorepo analysis
> | **Codebase Version**: 0.9.47+ | **Composite Score**: 7.3/10

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

### 1.4 SIWE Wallet Authentication — Chain ID Not Validated (NEW)

`lib/cgraph/accounts/wallet_authentication.ex` validates nonce, address, domain, and expiration in
SIWE messages, but does **not validate `chain_id`**. A message signed for chain 137 (Polygon) would
be accepted as valid for chain 1 (Ethereum mainnet). The `chain_id` field is parsed but never
checked in `validate_siwe_fields/3`. This could enable cross-chain replay attacks if CGraph expands
to multi-chain support.

### 1.5 Audit Logging Incomplete

Several audit event categories are not yet logged (`docs/SECURITY_AUDIT_CHECKLIST.md` §4.3):

- [ ] Auth lifecycle events (`login_success`, `logout`, `password_change`)
- [ ] Admin panel access logging
- [ ] Billing/payment event logging — **still missing** despite new creator monetization code
- [ ] Creator payout events (financial transfers) — no structured audit trail
- [ ] Retention cleanup not enabled in production

### 1.6 Key Backup/Recovery Not Implemented

E2EE key backup and recovery is listed as a **gap** in the security audit checklist
(`docs/SECURITY_AUDIT_CHECKLIST.md` §2.1). If a user loses their device, E2EE message history is
unrecoverable.

### 1.7 Threat Model Open Items

From `docs/THREAT_MODEL.md`:

- [ ] Transparency logs for key changes (T-R3 mitigation gap)
- [ ] SRI hashes for CDN scripts (supply chain attack mitigation)
- [ ] Sealed sender (hide sender identity from server — metadata protection)
- [ ] Anomaly detection system (listed as planned, not implemented)
- [ ] Key rotation automation (currently manual process)
- [ ] SIEM integration (centralized log analysis — not implemented)
- [ ] Incident response plan is draft-only, not tested

### 1.8 CSP Accepted Risk

`style-src 'unsafe-inline'` is intentionally set because Framer Motion and Radix UI inject inline
style attributes. This is documented as an accepted risk but remains a security trade-off. Migration
path depends on upstream library support. (`docs/SECURITY_AUDIT_CHECKLIST.md` §4.4)

### 1.9 Apple JWS Signature NOT Verified in IAP Flow (NEW, P0)

`lib/cgraph_web/controllers/iap_controller.ex` line ~128 has the comment `# In production, verify
Apple's JWS signature on signedPayload` but verification is **NOT implemented**.
`decode_apple_notification/1` simply base64-decodes the payload without any signature check.
Additionally, `lib/cgraph/subscriptions/iap_validator.ex` lines ~487-505 `decode_jws_payload/1`
decodes JWS tokens without verifying Apple's signing key. An attacker can forge Apple
Server-to-Server notifications to grant free premium subscriptions. **Critical security gap.**

### 1.10 Google RTDN Pub/Sub Token NOT Verified (NEW, P0)

`lib/cgraph_web/controllers/iap_controller.ex` line ~155 processes Google Real-Time Developer
Notifications (RTDN) without verifying the Pub/Sub push authentication token. A comment states
"must verify Google's OAuth token" but this is not implemented. Anyone who discovers the endpoint
URL can forge subscription events (purchase, renewal, cancellation). **Critical security gap.**

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

### 2.5 Creator Monetization Test Coverage — Zero (NEW, P1)

The entire `CGraph.Creators` context module (9 files, ~900 LOC) has **zero dedicated tests**:

| Module                        | LOC  | Test File | Status      |
| ----------------------------- | ---- | --------- | ----------- |
| `creators.ex` (facade)        | 40   | —         | **MISSING** |
| `connect_onboarding.ex`       | 138  | —         | **MISSING** |
| `paid_subscription.ex`        | 178  | —         | **MISSING** |
| `earnings.ex`                 | 203  | —         | **MISSING** |
| `payout.ex`                   | 141  | —         | **MISSING** |
| `content_gate.ex`             | 107  | —         | **MISSING** |
| `creator_earning.ex` (schema) | 50   | —         | **MISSING** |
| `creator_payout.ex` (schema)  | 48   | —         | **MISSING** |
| `paid_forum_subscription.ex`  | 54   | —         | **MISSING** |
| `creator_controller.ex`       | 242  | —         | **MISSING** |

Existing test files that partially cover payment/webhook flows:

| Test File                                  | Lines | Covers                                |
| ------------------------------------------ | ----- | ------------------------------------- |
| `stripe_webhook_controller_test.exs`       | 50    | Signature rejection only (4 tests)    |
| `payment_controller_test.exs`              | 58    | Plans/status/checkout (5 tests)       |
| `coins_controller_test.exs`                | 82    | Coin bundles/purchase                 |
| `wallet_auth_controller_test.exs`          | 551   | Wallet auth (decent coverage)         |

Stripe webhook event handler logic (subscription.created, payment_succeeded, transfer.paid,
account.updated, etc.) is **completely untested**. This is financial code handling real money.

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

### 4.0 Creator Monetization — Financial Safety Issues (NEW, P0)

#### 4.0.1 No Database Transactions in Payout Flow (Race Condition)

`lib/cgraph/creators/payout.ex` `request_payout/1` performs these steps **without a transaction or
row lock**:

1. `Earnings.get_balance/1` — two separate queries (total earned, total paid out)
2. Validates balance ≥ minimum, no pending payout, etc.
3. Creates Stripe Transfer (external side-effect)
4. Inserts CreatorPayout record

Two concurrent payout requests can both pass the `has_pending_payout?/1` check and both create
Stripe Transfers, causing **double payouts**. The balance check and payout insert are not atomic.

Contrast with `lib/cgraph/gamification/marketplace.ex` which correctly uses `Repo.transaction` + `FOR UPDATE` row locking.

**Fix**: Wrap payout flow in `Repo.transaction` with `SELECT ... FOR UPDATE` on a creator lock row,
or use an advisory lock on `creator_id`.

#### 4.0.2 `Repo.get!` Raises 500 in Subscription Flow

`lib/cgraph/creators/paid_subscription.ex:36` uses `Repo.get!(User, forum.owner_id)` which raises
`Ecto.NoResultsError` (500 Internal Server Error) if the forum owner doesn't exist. Should use
`Repo.get/2` with proper error handling.

#### 4.0.3 `inspect(reason)` Leaks Internal Details in API Responses (Codebase-Wide, P2)

`lib/cgraph_web/controllers/api/v1/creator_controller.ex` returns `inspect(reason)` directly to API
consumers at 6 call sites:

- Line 30: `detail: inspect(reason)` — leaks Stripe API error structs
- Line 74: `detail: inspect(reason)` — leaks onboarding link errors
- Line 102: `json(%{error: %{details: inspect(changeset.errors)}})` — leaks Ecto changeset errors
- Line 131: `json(%{error: %{message: inspect(reason)}})` — leaks subscription errors
- Line 153: `json(%{error: %{message: inspect(reason)}})` — leaks cancellation errors
- Line 192: `json(%{error: %{message: inspect(reason)}})` — leaks payout errors

**This is a systemic codebase-wide issue affecting 25+ controllers**, not just creator_controller.
Other affected controllers include: `coin_shop_controller`, `marketplace_controller`,
`subscription_controller`, `e2ee_controller` (7 instances), `web_push_controller` (3 instances),
`call_controller`, `theme_controller`, `user_controller`, `admin/feature_flag_controller`,
`admin/moderation_controller`, `iap_controller`, and `voice_message_controller`.

These can expose Stripe API keys, internal module paths, or Ecto error details to end users.

**Fix**: Map errors to user-friendly messages; log `inspect(reason)` server-side only. Apply
codebase-wide, not just in creator_controller.

#### 4.0.4 Balance Calculation Not Atomic

`lib/cgraph/creators/earnings.ex` `get_balance/1` runs two separate queries (total earned + total
paid out) outside a transaction. Under concurrent writes, this can return an inconsistent balance.

**Fix**: Either combine into a single query (`SELECT SUM(earned) - SUM(paid)`) or wrap in
`Repo.transaction` with appropriate isolation level.

#### 4.0.5 `Repo.get!` in `creator_controller.ex:subscribe` (NEW, P1)

`lib/cgraph_web/controllers/api/v1/creator_controller.ex` line ~111: `forum = Repo.get!(Forum,
forum_id)` where `forum_id` comes from user-controlled URL params. Raises `Ecto.NoResultsError`
(500 Internal Server Error) if the forum doesn't exist. No `action_fallback` is set on this
controller.

#### 4.0.6 `Repo.get!` in `coin_checkout.ex:do_fulfill` (NEW, P1)

`lib/cgraph/shop/coin_checkout.ex` line ~143: `user = Repo.get!(User, purchase.user_id)` in the
fulfillment path. If a user is deleted between purchase initiation and webhook fulfillment, this
raises a 500 during a financial operation. The purchase remains stuck in pending state with no
recovery path.

#### 4.0.7 `System.get_env` at Compile Time in CoinBundles (NEW, P1)

`lib/cgraph/shop/coin_bundles.ex` lines ~33-62: `System.get_env("STRIPE_PRICE_COINS_*")` is called
inside the module attribute `@bundles`, which evaluates at **compile time**. In Docker deployments
where environment variables are injected at runtime, all Stripe price IDs will be `nil`. Should use
`Application.get_env/3` or runtime config instead.

#### 4.0.8 IAP Credential Fallbacks to Empty Strings (NEW, P2)

`lib/cgraph/subscriptions/iap_validator.ex` lines ~467-476: `apple_jwt_token` and
`google_access_token` default to empty string `""` when unconfigured. API calls to Apple/Google
fail opaquely with unhelpful error messages rather than failing fast at startup. No startup
validation ensures these credentials are present when IAP features are enabled.

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

**No TODO/FIXME/HACK comments were found in the new creator monetization or payment code** (9 files
in `lib/cgraph/creators/`, `creator_controller.ex`, `payment_controller.ex`, `coin_shop_controller.ex`,
`stripe_webhook_controller.ex`, `wallet_authentication.ex`). Clean in this regard.

### 4.2 eslint-disable Suppressions (135 in mobile/packages, 400+ total with web)

Widespread use of `eslint-disable` comments indicating type safety workarounds:

**Mobile app** (~112 suppressions):

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

### 4.3 Type Assertion Debt — 431 Annotated Casts (Originally 952)

431 `as X` type assertions remain annotated with `// type assertion:` comments (originally 952,
partially refactored). While annotated with reason comments, these represent **structural type
safety debt**:

- `scripts/fix-type-assertions.mjs` documents the situation
- Affects 133 web files and 1 mobile file
- Original intent was to replace with runtime type guards; only ~40 were actually replaced

### 4.4 Deprecated Code Still Present

Active `@deprecated` annotations across the codebase:

| File                                                                                        | What's Deprecated                                                                   |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/modules/chat/store/chatBubbleStore.impl.ts`                                   | Entire file — should import from `@/stores/theme`                                   |
| `apps/web/src/lib/crypto/e2ee/key-bundle.ts:79`                                             | Use `e2ee-secure/key-storage.ts` instead                                            |
| `apps/web/src/modules/settings/components/ui-customization-settings.tsx`                    | Import from `./ui-customization` instead                                            |
| `apps/web/src/modules/settings/store/customization/customizationStore.selectors.ts:111,125` | Object selectors cause infinite render loops                                        |
| `apps/web/src/stores/theme/selectors.ts:56`                                                 | Use individual selectors to avoid render issues                                     |
| `apps/mobile/src/lib/crypto/e2ee.ts:179-235`                                                | 7 deprecated types — Phase 2 will replace with portable types from `@cgraph/crypto` |
| `apps/web/src/modules/forums/components/custom-emoji-picker.tsx`                            | Import from `./emoji-picker` instead                                                |
| `apps/web/src/components/content/bb-code-editor.tsx`                                        | Import from `@/modules/forums/components/bbcode-editor`                             |
| `apps/web/src/modules/admin/components/admin-dashboard/shared-components.tsx:159`           | Use `DashboardChart` instead                                                        |
| `apps/web/src/components/enhanced/ui/holographic-ui-v4.tsx`                                 | Import from `./holographic-ui` instead                                              |

---

## 5. Architecture Risks

### 5.0 Creator Controller Approaching God-Controller Pattern (NEW)

`lib/cgraph_web/controllers/api/v1/creator_controller.ex` is 242 lines handling 5 distinct
concerns: Connect onboarding (3 actions), forum monetization config (1), paid subscriptions (2),
balance queries (1), and payouts (2). While just under the 250-line threshold, it mixes Stripe
onboarding, subscription management, and financial payout logic in a single module.

Consider splitting into `CreatorOnboardController`, `PaidForumController`, and
`CreatorPayoutController` when this grows further.

### 5.1 Billing Plan Definitions Hardcoded in Controller (NEW)

`lib/cgraph_web/controllers/api/payment_controller.ex` `plans/2` action (lines 110–165) contains
hardcoded plan definitions including prices, features, and tier names directly in the controller.
These should live in config, a database table, or a dedicated context module to avoid deploying code
for pricing changes.

### 5.2 Empty `@tier_mapping` Module Attribute (NEW)

`lib/cgraph_web/controllers/stripe_webhook_controller.ex` defines `@tier_mapping %{}` (empty map)
with a comment about mapping Stripe price IDs. All lookups fall through to `get_tier_from_env/1`.
The empty compile-time attribute is dead code and should be removed or populated.

### 5.3 Mobile Crypto Not Fully Migrated

Mobile E2EE still uses classical ECDH/AES-GCM. Post-quantum (PQ) scaffolding is done but full Triple
Ratchet is deferred to Phase 2 (`docs/SECURITY_AUDIT_CHECKLIST.md` §2.1). The mobile `e2ee.ts`
contains 7 deprecated type definitions awaiting replacement with portable types from
`@cgraph/crypto`.

### 5.4 CRDT Document Server — Unbounded State Growth

`apps/backend/lib/cgraph/collaboration/document_server.ex:291` has a TODO for Yjs state compaction.
The `compact_updates` function is a no-op. This means CRDT document state grows unboundedly in
memory, which will cause issues with long-lived documents (`docs/V1_ACTION_PLAN.md` Session 37 §P1).

### 5.5 useMemo/useCallback Debt — 1,116 Instances

1,116 `useMemo`/`useCallback` hooks across ~271 files cannot be removed until React Compiler
(`babel-plugin-react-compiler`) is enabled. These are technically unnecessary with React 19 but
required without the compiler (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 12).

### 5.6 Mobile File Size Non-Compliance

**103 mobile TSX files exceed the 300-line limit.** CI warns but does not block. 6 were split in
Session 59 (→ 31 sub-files), but the majority remain (`docs/WORLD_CLASS_GAP_ANALYSIS.md` Rule 8).

### 5.7 Wave 4 (Database & Scaling) — Largely Incomplete

5 of 7 Wave 4 tasks are NOT DONE (`docs/WORLD_CLASS_GAP_ANALYSIS.md`):

| Task                                                      | Status   |
| --------------------------------------------------------- | -------- |
| Deploy PgBouncer                                          | NOT DONE |
| Configure Read Replicas                                   | NOT DONE |
| Activate MeiliSearch (currently PostgreSQL fallback only) | NOT DONE |
| Message Archival Strategy                                 | NOT DONE |
| Frontend Scaling Optimizations                            | PARTIAL  |

### 5.8 Waves 7-9 Not Started

Most tasks in Waves 7-9 (Groups, Mobile, Backend features) are NOT STARTED — covering channel
permissions, pinned messages, categories, custom status, DND mode, quick switcher, and mobile
feature parity.

### 5.9 `iap_validator.ex` Is 542 Lines (NEW, P2)

`lib/cgraph/subscriptions/iap_validator.ex` is 542 lines combining Apple IAP validation, Google
Play validation, notification handling, JWS decoding, and subscription management in a single
module. Should be split into separate modules per provider (e.g., `AppleIapValidator`,
`GoogleIapValidator`) with a shared interface.

### 5.10 `e2ee_controller.ex` Is 686 Lines — Largest Controller (NEW, P2)

`lib/cgraph_web/controllers/api/v1/e2ee_controller.ex` is 686 lines, making it the largest Elixir
controller in the codebase. This significantly exceeds the 250-line threshold flagged for
`creator_controller.ex` in §5.0. Should be split by concern (key management, session management,
device management).

### 5.11 Multiple 400-500+ Line Controllers Not Flagged (NEW, P2)

Several other controllers exceed the threshold but were not previously flagged:

| Controller                    | Lines |
| ----------------------------- | ----- |
| `custom_emoji_controller.ex`  | 560   |
| `user_controller.ex`          | 552   |
| `auth_controller.ex`          | 541   |
| `rss_controller.ex`           | 487   |
| `permissions_controller.ex`   | 470   |

These should be reviewed for splitting along concern boundaries.

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
| P7  | Creator   | `Earnings.get_balance/1` runs 2 queries non-atomically — stale reads possible    |
| P8  | Creator   | `Payout.request_payout/1` has TOCTOU race — no transaction wrapping (NEW)        |

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
| Mobile File Size (Rule 8)    | ~60% — 103 mobile TSX files over 300 lines                   |
| Testing (Rule 9)             | **FAIL** — 17.9% web test coverage vs 100% target            |
| Type Safety (Rule 11)        | ~80% — 431 `as` casts annotated (originally 952)             |
| React 19 (Rule 12)           | ~98% — React Compiler not enabled, 1,116 useMemo/useCallback |

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
5. **Fix payout race condition** (NEW) — `Payout.request_payout/1` lacks transaction/locking;
   concurrent requests can cause double Stripe Transfers with real money loss
6. **Remove `inspect(reason)` from API error responses** (NEW) — Leaks Stripe errors, internal
   module paths, and Ecto details to end users in creator/payment endpoints
7. **Verify Apple JWS signatures in IAP flow** (NEW) — `iap_controller.ex` and `iap_validator.ex`
   decode Apple S2S notifications without verifying JWS signatures; attacker can forge notifications
   to grant free premium subscriptions
8. **Verify Google RTDN Pub/Sub auth tokens** (NEW) — `iap_controller.ex` processes Google RTDN
   notifications without verifying Pub/Sub push OAuth token; forged subscription events possible

### P1 — High Priority

9. **Raise web test coverage** — 17.9% is the single biggest compliance failure; target 60%+
10. **Deploy PgBouncer** — Database connection pooling needed before scaling
11. **Activate MeiliSearch in production** — Search falls back to PostgreSQL ILIKE
12. **Fix Elixir version mismatch** — Dockerfile 1.17.3 vs local 1.19.4
13. **Complete audit logging** — Auth lifecycle, admin access, billing events not logged
14. **Implement CRDT state compaction** — DocumentServer Yjs state grows unboundedly
15. **Write Creator monetization tests** (NEW) — 9 context files + 1 controller with zero tests;
    financial code handling real Stripe transfers/subscriptions is completely untested
16. **Validate SIWE chain_id** (NEW) — Wallet auth accepts messages signed for any chain;
    cross-chain replay possible if multi-chain support is added
17. **Fix `Repo.get!` in subscription flow** (NEW) — Raises 500 if forum owner missing;
    use `Repo.get/2` with proper error handling
18. **Make balance calculation atomic** (NEW) — `Earnings.get_balance/1` runs two separate
    queries outside a transaction; can return inconsistent balance under concurrent writes
19. **Fix `Repo.get!` in creator_controller subscribe** (NEW) — `Repo.get!(Forum, forum_id)` with
    user-controlled param raises 500 if non-existent; no action_fallback set
20. **Fix `Repo.get!` in coin_checkout fulfillment** (NEW) — `Repo.get!(User, purchase.user_id)`
    crashes during financial webhook if user deleted; purchase stuck in pending
21. **Fix compile-time `System.get_env` in CoinBundles** (NEW) — Module attribute evaluates
    `System.get_env("STRIPE_PRICE_COINS_*")` at compile time; nil in Docker runtime-env deployments

### P2 — Medium Priority

22. **Split 103 oversized mobile TSX files** — CI warns but doesn't block
23. **Refactor 431 type assertion annotations** — Replace with type guards
24. **Enable React Compiler** — Allows removal of 1,116 useMemo/useCallback hooks
25. **Clean up deprecated files** — 10+ deprecated shims still in codebase
26. **Implement anomaly detection** — Currently no system for detecting attack patterns
27. **Automate key rotation** — Currently manual process
28. **Wire mobile store facades** — Forums returns empty array, balance hardcoded to 0
29. **Replace mock data with real API** — Progression customization uses placeholder data
30. **Fix conditional hooks violation** —
    `apps/mobile/src/screens/forums/create-post-screen/components/post-type-selector.tsx` calls
    hooks conditionally
31. **Conduct DR drill** — Disaster recovery procedures documented but never tested
32. **Split CreatorController** (NEW) — 242-line controller mixing 5 concerns; split into
    `CreatorOnboardController`, `PaidForumController`, `CreatorPayoutController`
33. **Move plan definitions to config** (NEW) — Hardcoded pricing in `PaymentController.plans/2`
34. **Remove empty `@tier_mapping`** (NEW) — Dead code in `StripeWebhookController`
35. **Expand Stripe webhook tests** (NEW) — Only 50 lines / 4 tests covering signature rejection;
    event handler logic (subscription.created, payment_succeeded, transfer.paid, etc.) is untested
36. **Fix codebase-wide `inspect(reason)` leak** (NEW) — 25+ controllers return `inspect(reason)`
    to API consumers; systemic issue beyond creator_controller (see §4.0.3)
37. **Split `iap_validator.ex`** (NEW) — 542-line module combining Apple + Google validation,
    JWS decoding, and subscription management; split by provider
38. **Split `e2ee_controller.ex`** (NEW) — 686-line controller, largest in codebase; exceeds
    250-line threshold by 2.7×
39. **Review 400-500+ line controllers** (NEW) — `custom_emoji_controller` (560),
    `user_controller` (552), `auth_controller` (541), `rss_controller` (487),
    `permissions_controller` (470) all exceed thresholds
40. **Add IAP credential startup validation** (NEW) — `iap_validator.ex` defaults Apple/Google
    credentials to empty strings; API calls fail opaquely instead of failing fast at boot

### P3 — Long Term

41. **Implement sealed sender** — Metadata protection for privacy-conscious users
42. **SIEM integration** — Centralized security log analysis
43. **Bug bounty program** — Post-launch security incentives
44. **SRI hashes for CDN scripts** — Supply chain attack mitigation
45. **Transparency logs for key changes** — Auditability improvement
46. **Complete Wave 4-9 tasks** — ~35 remaining wave tasks across scaling, testing, and features
47. **Status page** — status.cgraph.org not live
48. **Support ticketing system** — Not set up

---

## Summary Statistics

| Category                     | Count  | Δ Since Last |
| ---------------------------- | ------ | ----------- |
| P0 Critical blockers         | 8      | +4          |
| P1 High priority items       | 13     | +7          |
| P2 Medium priority items     | 19     | +9          |
| P3 Long-term items           | 8      | —           |
| Active TODO comments in code | 9      | —           |
| eslint-disable suppressions  | 400+   | —           |
| Type assertion annotations   | 431    | —           |
| Deprecated files/annotations | 10+    | —           |
| Missing web test files       | ~1,831 | —           |
| Missing creator test files   | 10     | NEW         |
| Oversized mobile TSX files   | 103    | —           |
| Incomplete wave tasks        | ~35    | —           |
| Security reviews overdue     | 2      | —           |
| SLOs not validated           | 6      | —           |
| Financial race conditions    | 1      | NEW         |
| Unverified IAP signatures    | 2      | NEW         |

---

<sub>**CGraph Codebase Concerns** • Generated February 26, 2026 • Updated March 4, 2026 • Based on
full monorepo analysis + creator monetization review</sub>
