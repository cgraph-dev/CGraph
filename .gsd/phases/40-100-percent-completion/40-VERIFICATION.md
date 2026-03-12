---
phase: 40-100-percent-completion
verified: 2026-03-12T00:00:00Z
status: plans_amended_ready
score: 0/14
verifier: gsd-verifier
verification_depth: precision (v2) + amendments applied
---

# Phase 40 — 100% Completion: Precision Verification Report (v2, amended)

## Overview

**Phase Goal:** Close every remaining gap from the 5 design documents to reach 100% implementation.  
**Status:** `plans_amended_ready` — All 14+1 gaps remain unbuilt, but plans have been precision-verified and corrected.  
**Score:** 0/14 must-haves verified (0%) — execution not yet started  
**Findings:** 8 plan inaccuracies found and **fixed** + 1 missed gap **added** + 1 watch item

---

## SECTION A: Plan Accuracy Issues (MUST FIX before execution)

These are errors in the Phase 40 plans that would cause compile failures or incorrect behavior if executed as-written.

### Issue 1: `NodeTransaction.@valid_types` missing `"reputation_reward"`

**Plan:** 40-01 Task 1 calls `Nodes.credit_nodes(user_id, amount, :reputation_reward, opts)`  
**Codebase:** `@valid_types ~w(purchase tip_received tip_sent content_unlock subscription_received subscription_sent withdrawal cosmetic_purchase)` — no `reputation_reward` type.  
**Impact:** `validate_inclusion(:type, @valid_types)` will reject the transaction → **compile succeeds but runtime failure**.  
**Fix:** Add `"reputation_reward"` to `@valid_types` in `node_transaction.ex` as part of 40-01 Task 1.

### Issue 2: Wrong function name — `withdraw/3` vs `request_withdrawal/2`

**Plan:** 40-02 Task 1 says "Gate integration: Add enforce_kyc!/1 call at top of CGraph.Nodes.withdraw/3"  
**Codebase:** The actual function is `request_withdrawal/2` at `nodes.ex` L436. There is no `withdraw/3`.  
**Impact:** Executor would look for a non-existent function.  
**Fix:** Plan 40-02 must reference `request_withdrawal/2` (not `withdraw/3`).

### Issue 3: No `CGraph.Friends` module — wrong path for friend count

**Plan:** 40-01 defines milestone `friends_50: 50+ friends → 50 Nodes`  
**Codebase:** Friend count lives at `CGraph.Accounts.Friends.Queries.get_friend_stats/1` → returns `%{friends: count}`. There is no `CGraph.Friends.count_friends/1`.  
**Impact:** Milestone evaluator would call a non-existent module.  
**Fix:** Plan 40-01 must document exact path: `CGraph.Accounts.Friends.Queries.get_friend_stats(user_id).friends`

### Issue 4: No voice hours tracking exists

**Plan:** 40-01 defines milestone `voice_hours_100: 100+ hours → 300 Nodes`  
**Codebase:** Zero voice hour tracking. No `voice_hours`, `voice_time`, or `voice_duration` function anywhere.  
**Impact:** Milestone cannot be evaluated — would need a new query or the milestone should be removed/deferred.  
**Fix:** Either (a) remove `voice_hours_100` milestone from 40-01, or (b) add a new function to query LiveKit session history.

### Issue 5: No group admin count query exists

**Plan:** 40-01 defines milestone `groups_admin_3: admin of 3+ groups → 200 Nodes`  
**Codebase:** Admin checks use bitwise permissions via `Role.permissions_map()[:administrator]`. No query to count groups where a user is admin.  
**Impact:** Milestone cannot be evaluated without building a new query.  
**Fix:** 40-01 Task 1 must include building a `count_admin_groups/1` query in `CGraph.Groups` or replace with an evaluable milestone.

### Issue 6: Forum changeset doesn't cast `monetization_enabled`

**Plan:** 40-01 Task 2 assumes modifying `Forum.changeset/2` to change the field  
**Codebase:** `monetization_enabled` is NOT in `Forum.changeset/2` cast list. It's updated via private `update_forum_monetization/2` in `CreatorController` using inline `Ecto.Changeset.cast()`.  
**Impact:** Adding field to schema without a proper changeset function means existing update paths would break.  
**Fix:** 40-01 Task 2 must also create a `monetization_changeset/2` on Forum schema and update `CreatorController.update_forum_monetization/2` to use the new enum field.

### Issue 7: `useChatIdentity` can't use self-only cosmetics store

**Plan:** 40-03 Task 1 says "fetches user identity data from existing /api/v1/users/:id/cosmetics endpoint"  
**Codebase:** The Zustand customization store only holds the **current user's** equipped items. For other users' cosmetics, must use `cosmetics.getUserBadges(client, userId)` + `cosmetics.getInventory(client, userId)` from `packages/api-client/src/cosmetics.ts`. The endpoint is `/api/v1/users/{userId}/cosmetics/inventory` (not `/cosmetics`).  
**Impact:** Correct endpoint path matters for the hook implementation.  
**Fix:** 40-03 must reference `/api/v1/users/{userId}/cosmetics/inventory` as the data source, not a generic `/cosmetics` endpoint.

### Issue 8: AvatarBorder schema/DB mismatch on `tier`, `metadata`, `animation_config`

**Plan:** 40-04 Task 3 adds `track` field to border schema  
**Codebase:** The `avatar_borders` DB table has columns (`tier`, `metadata`, `animation_config`, `deactivated_at`) that are NOT in the Ecto schema `AvatarBorder`. The seed file uses raw SQL bypassing the schema. Adding `track` to the schema without also adding the other missing fields creates further inconsistency.  
**Impact:** If executor adds `:track` to schema but ignores existing mismatches, schema will still be partial.  
**Fix:** 40-04 Task 3 should add `:track` via migration + raw SQL update (matching existing border seed pattern), OR also add the other missing fields to schema.

---

## SECTION B: Missed Gap (Add to Phase 40)

### Gap B8: Boost Expiration Oban Worker

**Finding:** `CGraph.Boosts.expire_boosts/0` function exists in `boosts.ex` L128 but is **never called**. No `BoostExpirationWorker` Oban module exists. No cron entry in `config.exs` or `prod.exs` schedules it.  
**Impact:** Active boosts will never transition to "expired" status — they accumulate indefinitely.  
**Severity:** MEDIUM  
**Assignment:** Should be added to Plan 40-02 (backend features wave) as a small additional task.

---

## SECTION C: Watch Item

### Node-based Forum Subscription Renewal

**Concern:** Plan 40-01 creates forum monetization tiers priced in Nodes (monthly/yearly). Current `PaidForumSubscription` uses Stripe for billing. If the new Node-priced tiers need automatic monthly renewal debits, a `ForumSubscriptionRenewalWorker` is needed.  
**Risk:** LOW — Stripe-backed billing already handles renewals for existing subscriptions. Node-priced tiers may be manually renewed by users.  
**Action:** Watch during 40-01 execution; implement only if Node auto-debit is required.

---

## SECTION D: Truth Verification (All 24 truths)

### Plan 40-01: Reputation Rewards + Forum Monetization

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T1 | ReputationRewards context: evaluate milestones, grant Nodes | ✗ FAILED | `nodes/reputation_rewards.ex` missing. No milestone logic exists. |
| T2 | ReputationRewardWorker: Oban daily cron | ✗ FAILED | Worker missing. No `:reputation_rewards` Oban queue. 28 queues exist, this isn't one. |
| T3 | Milestone tracking: `reputation_rewards` table | ✗ FAILED | No schema, no migration (157 migrations checked). |
| T4 | Forum `monetization_type` enum replacing boolean | ✗ FAILED | `forum.ex` L143: `field :monetization_enabled, :boolean, default: false`. |
| T5 | ForumMonetization context: tier CRUD | ✗ FAILED | No context module. CreatorController has inline monetization toggle only. |
| T6 | Forum monetization tiers table | ✗ FAILED | No table, schema, or migration. |
| T7 | ForumMonetizationController: 5 REST endpoints | ✗ FAILED | Only `PUT /forums/:id/monetization` in CreatorController (1 of 5). |
| T8 | Route macro imported in router.ex | ✗ FAILED | 21 route modules imported, no monetization routes among them. |

### Plan 40-02: Compliance + Levels + Archiving

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T9 | KYCEnforcement: €500 withdrawal gate | ✗ FAILED | No module. `request_withdrawal/2` checks balance only (L436-489). |
| T10 | AMLMonitor: suspicious pattern detection | ✗ FAILED | All `aml` hits are SAML false positives. Zero AML code. |
| T11 | AMLScanWorker + `aml_flags` table | ✗ FAILED | No worker, no schema, no migration. |
| T12 | ReputationLevel: iron→diamond constants | ✗ FAILED | `reputation.ex` has `calculate_score/1` (formula only), no level mapping. |
| T13 | Thread `is_archived` field | ✗ FAILED | 5 booleans exist (locked/pinned/hidden/approved/content_gated at L47-69), no archived. |
| T14 | Boost `"profile"` target type | ✗ FAILED | `boost.ex` L18: `@target_types ~w(thread post forum)` — 3 types only. |
| T15 | Economic guardrails | ✗ FAILED | `paid_dm_setting.ex` L33: `validate_number(:price_per_file, greater_than: 0)` — no ceiling. |

### Plan 40-03: Frontend

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T16 | ChatIdentityCard component | ✗ FAILED | Missing. Chat has 60+ components, none cosmetics-related. |
| T17 | useChatIdentity hook | ✗ FAILED | Missing. Chat has 9 hooks, none cosmetics-related. |
| T18 | ForumMonetizationPanel UI | ✗ FAILED | Missing. Forum admin has 5 panel types, no monetization. |
| T19 | ForumTierEditor form | ✗ FAILED | Missing. |
| T20 | ProfileSpotlightCard | ✗ FAILED | Missing. `modules/boosts/` dir doesn't exist. |
| T21 | forum-monetization.ts API client | ✗ FAILED | Missing. `packages/api-client/src/` has 5 domain files, no monetization. |

### Plan 40-04: Data

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T22 | 48 new profile frames (55→103) | ✗ FAILED | Exactly 55 entries. Distribution: 5F/10C/10U/10R/8E/7L/5M. |
| T23 | 12 new profile effects (18→30) | ✗ FAILED | Exactly 18 entries. Distribution: 2F/4C/4U/3R/2E/2L/1M. Types: 7 particle, 7 aura, 4 trail. |
| T24 | Border `track` field | ✗ FAILED | 42 borders, 8 themes. No `track` field in schema or seeds. |

---

## SECTION E: Precise Dependency Map

### Verified existing functions the plans depend on

| Function | Location | Signature | Verified |
|----------|----------|-----------|----------|
| `Nodes.credit_nodes` | nodes.ex L76 | `/4 (user_id, amount, type, opts \\ [])` → `{:ok, NodeTransaction.t()}` | ✓ |
| `Nodes.request_withdrawal` | nodes.ex L436 | `/2 (user_id, nodes_amount)` → `{:ok, WithdrawalRequest.t()}` | ✓ |
| `Reputation.calculate_score` | reputation.ex L37 | `/1 (map)` → `float` (posts×1 + replies×0.5 + upvotes×2 + best_answers×5 - reports×3) | ✓ |
| `Reputation.add_reputation` | reputation.ex L56 | `/3 (forum_id, user_id, amount)` → `:ok` | ✓ |
| `ConnectOnboarding.check_account_status` | connect_onboarding.ex L88 | `/1 (stripe_account_id)` → `%{charges_enabled, payouts_enabled, requirements}` | ✓ |
| `UserContent.get_user_post_stats` | user_content.ex L99 | `/1 (user_id)` → `%{post_count, thread_count, total_karma, ...}` | ✓ |
| `Friends.Queries.get_friend_stats` | queries.ex L293 | `/1 (user_id)` → `%{friends: count, ...}` | ✓ |
| `AbuseDetection.check` | abuse_detection.ex | `/3 (user_id, type, opts)` → `:ok \| {:suspicious, ...}` | ✓ (pattern for AML) |

### Verified constants and config

| Constant | Location | Value |
|----------|----------|-------|
| `@min_withdrawal` | nodes.ex L31 | `1000` |
| `@min_tip` | nodes.ex L32 | `10` |
| `@platform_cut_percent` | nodes.ex L29 | `20` |
| `@target_types` | boost.ex L18 | `~w(thread post forum)` |
| `@boost_types` | boost.ex L19 | `~w(visibility pinned highlighted)` |
| `@valid_types` (transactions) | node_transaction.ex | 8 types, no `reputation_reward` |
| `@unlock_types` (frames) | profile_frame.ex | `~w(default achievement level purchase event season gift prestige)` |
| `@effect_types` | profile_effect.ex | `~w(particle aura trail)` |
| `@themes` (borders) | avatar_border.ex | 22 values |
| Latest migration timestamp | migrations/ | `20260728100000` → next: `20260729100000` |
| Oban queues | config.exs L121-149 | 28 queues configured |
| Router route imports | router.ex L25-47 | 21 route modules imported |

### Verified schema field counts

| Schema | Table | Fields | Key fields plan modifies |
|--------|-------|--------|--------------------------|
| Forum | forums | 30+ | `monetization_enabled` (L143, boolean, NOT in main changeset) |
| Thread | threads | 22 | `is_locked/is_pinned/is_hidden/is_approved/is_content_gated` (L47-69) |
| Boost | boosts | 10 | `target_type` (validated against `@target_types`) |
| AvatarBorder | avatar_borders | 27 | No `:track`, no `:tier` in schema (DB has `tier` via raw SQL) |
| ProfileFrame | profile_frames | 10 | `slug` as conflict target |
| ProfileEffect | profile_effects | 9 | `slug` as conflict target |
| NodeTransaction | node_transactions | 11 | `type` validated against `@valid_types` |

### Frontend verified patterns

| Component/Pattern | Location | Details |
|-------------------|----------|---------|
| `MessageGroup` props | message-group.tsx | `author: { id, name, avatar?, roleColor? }` — inline type, no cosmetics |
| `IdentityCard` (reference) | identity-card.tsx | 192 lines. Props: `userId, snapshot?: IdentitySnapshot, compact?` |
| Avatar border rendering | identity-card.tsx | `<img>` overlay with `absolute inset-0 pointer-events-none` on relative container |
| Badge rendering | identity-card.tsx | Max 3 shown, `<span>` pills, cycles `StarIcon/ShieldCheckIcon/TrophyIcon` |
| React Query pattern | useNodes.ts | Local `nodesKeys` factory, `useQuery({ queryKey, queryFn, staleTime })` |
| API client pattern | packages/api-client | `client.get<T>(path)`, first param `client: ApiClient`, native fetch |
| Boost panel | boost-panel.tsx | Hardcoded `/api/v1/boosts` path, no endpoint constant |
| Cosmetics API | cosmetics.ts | `getInventory(client, userId?)`, `getUserBadges(client, userId)` |
| Customization store | customizationStore | Zustand, self-only: `useEquippedTitle()`, `useEquippedBadges()` |
| Central query keys | queryKeys.ts | No cosmetics keys registered |

---

## SECTION F: Existing Infrastructure (Verified)

| System | Status | Key files verified |
|--------|--------|-------------------|
| Nodes economy | ✓ BUILT | `credit_nodes/4`, `request_withdrawal/2`, `NodeTransaction`, `NodeWallet` |
| Forum system | ✓ BUILT | `Forum`, `Thread`, `Post`, `Board`, `ForumMember`, reputation |
| Cosmetics system | ✓ BUILT | `Cosmetics` context (352 lines), `ProfileFrame`, `ProfileEffect`, `AvatarBorder` schemas, inventory |
| Boost system | ✓ BUILT | `Boosts` context, `Boost` schema, `BoostRoutes`, `boost-panel.tsx` |
| Compliance | ✓ BUILT | `TaxReporter` ($600 threshold), `AgeGate` (COPPA/GDPR) |
| Creators | ✓ BUILT | `ConnectOnboarding` (Stripe), `Earnings`, `Payout`, `PaidSubscription` |
| Oban jobs | ✓ BUILT | 28 queues, multiple workers, crontab entries in prod.exs |
| Identity card (forums) | ✓ BUILT | `identity-card.tsx` (192 lines), fully presentational |
| Abuse detection | ✓ BUILT | GenServer + ETS, score-based, AML can follow pattern |
| Creator analytics | ✓ BUILT | Dashboard + 4 endpoints + mobile |
| Content gating | ✓ BUILT | `is_content_gated`, `gate_price_nodes`, `gate_preview_chars` on Thread |
| Creator dashboard | ✓ BUILT | Web + Mobile + backend controller |
| Transaction history | ✓ BUILT | `nodes-wallet.tsx` + `useNodes` hook |

---

## SECTION G: Human Verification Required (post-execution)

| # | Test | Expected | Why Human |
|---|------|----------|-----------|
| 1 | Send DM, check avatar border renders around sender | Equipped Lottie border overlaid on avatar | Visual rendering + animation |
| 2 | Check equipped title appears below sender name in DM | Small gray text showing title | Layout accuracy |
| 3 | Check badges render inline after name (max 3) | Pill badges with icons | Visual density check |
| 4 | Forum admin → open monetization panel | Radio for free/gated/hybrid, tier list | UI interaction |
| 5 | Create tier → check max 3 enforced | 4th tier button disabled | Business logic in UI |
| 6 | Boost own profile → check "Featured" section | Profile appears for selected duration | Discovery integration |
| 7 | Earn > €500 → attempt withdrawal | Blocked with KYC prompt | Compliance flow |
| 8 | Create circular tip pattern → check AML flag | Flag created in admin panel | Detection accuracy |
| 9 | Score 100+ reputation → verify "Bronze" level shows | Level badge visible on profile | Threshold accuracy |
| 10 | Moderator archives thread → check hidden from feed | Thread gone from listing, visible in archive view | Moderation UX |
| 11 | Run profile frame seeds → check 103 in DB | `SELECT count(*) FROM profile_frames` = 103 | Data integrity |
| 12 | Run effect seeds → check 30 in DB | `SELECT count(*) FROM profile_effects` = 30 | Data integrity |

---

## SECTION H: Gaps Summary

### Confirmed Gaps (15 total: 14 original + 1 newly discovered)

**Backend Feature Gaps (11):**

| # | Gap | Plan | Status |
|---|-----|------|--------|
| B1 | Reputation-linked Node rewards | 40-01 | MISSING |
| B2 | Forum monetization enum (boolean → free/gated/hybrid) | 40-01 | MISSING |
| B3 | Forum monetization routes (context + controller + routes) | 40-01 | MISSING |
| B4 | KYC enforcement (€500 withdrawal gate) | 40-02 | MISSING |
| B5 | AML monitoring (circular tips, rapid volume, structuring) | 40-02 | MISSING |
| B6 | Reputation levels (iron→diamond) | 40-02 | MISSING |
| B7 | Thread `is_archived` field | 40-02 | MISSING |
| B8 | **Boost expiration Oban worker** (NEW) | 40-02 | MISSING |
| F2b | Boost "profile" target type | 40-02 | MISSING |
| B9 | Economic guardrails (max price + reputation gate) | 40-02 | MISSING |
| B10 | `"reputation_reward"` added to NodeTransaction @valid_types | 40-01 | MISSING |

**Frontend Gaps (5):**

| # | Gap | Plan | Status |
|---|-----|------|--------|
| F1 | Chat identity card + useChatIdentity hook | 40-03 | MISSING |
| F2a | Profile spotlight card (boost UI) | 40-03 | MISSING |
| F3 | Forum monetization panel + tier editor | 40-03 | MISSING |
| F4 | Forum monetization API client | 40-03 | MISSING |

**Data Gaps (3):**

| # | Gap | Plan | Status |
|---|-----|------|--------|
| D1 | 48 additional profile frames (55→103) | 40-04 | MISSING |
| D2 | 12 additional profile effects (18→30) | 40-04 | MISSING |
| D3 | Border track column + metadata backfill | 40-04 | MISSING |

---

## SECTION I: Recommendations

### Plan amendments — ALL APPLIED ✅

All 10 amendments have been applied to the plan files. Stale references cleaned.

| # | Plan | Amendment | Status |
|---|------|-----------|--------|
| 1 | 40-01 T1 | Add `"reputation_reward"` to `NodeTransaction.@valid_types` | ✅ Applied |
| 2 | 40-01 T1 | Fix milestone dependency paths: `CGraph.Accounts.Friends.Queries.get_friend_stats/1` | ✅ Applied |
| 3 | 40-01 T1 | Remove/defer `voice_hours_100` milestone (no tracking exists) | ✅ Applied |
| 4 | 40-01 T1 | Defer `groups_admin_3` milestone (no query exists) | ✅ Applied |
| 5 | 40-01 T2 | Add creating `Forum.monetization_changeset/2` function | ✅ Applied |
| 6 | 40-01 T2 | Update `CreatorController.update_forum_monetization/2` to use new enum | ✅ Applied |
| 7 | 40-02 T1 | Fix function reference: `request_withdrawal/2` not `withdraw/3` | ✅ Applied |
| 8 | 40-02 T3 | Add `BoostExpirationWorker` Oban cron (calls existing `Boosts.expire_boosts/0`) | ✅ Applied |
| 9 | 40-03 T1 | Fix API endpoint to `/api/v1/users/{userId}/cosmetics/inventory` | ✅ Applied |
| 10 | 40-04 T3 | Use raw SQL pattern for track backfill + fix schema path to gamification/ | ✅ Applied |

### Execution readiness:

**Phase 40 is fully ready for execution.** All plan inaccuracies have been corrected, the missed gap (boost expiration worker) has been added, stale references have been cleaned. The plans are comprehensive, the wave structure is correct, and all existing infrastructure is verified. No hidden implementations would make any plan redundant.

Run: `@gsd-executor execute phase 40`

---

## Verification Metadata

| Field | Value |
|-------|-------|
| Approach | Precision goal-backward: 24 truths + 8 plan accuracy checks + hidden impl scan |
| Depth | v2 — verified function signatures, schema fields, line numbers, module paths |
| Artifacts checked | 17 target files (all MISSING) + 25 dependency files (all verified) |
| Key links checked | 16 target links (all NOT_WIRED) + 8 dependency links (all VALID) |
| Plan accuracy issues | 8 found (see Section A) |
| Missed gaps | 1 found (boost expiration worker) |
| Watch items | 1 (Node-based forum subscription renewal) |
| Hidden implementations | 0 found (all gaps confirmed genuine) |
| Human verification items | 12 items flagged |
| Verification date | 2026-03-12 |
| Verification duration | Precision sweep across 4 parallel subagents + 1 final sweep |
