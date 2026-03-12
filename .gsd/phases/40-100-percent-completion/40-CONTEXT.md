# Phase 40 — 100% Completion: Context & Gap Analysis

**Created:** 2026-03-12
**Goal:** Close every remaining gap from the 5 design documents to reach 100% implementation
**Source docs audited:**
1. `WEB_MOBILE_FEATURE_MAP.md`
2. `Nodes Economy Design` (Nodes are already a solid.txt)
3. `CGRAPH-FORUMS-NEXT-GEN-PLAN.md`
4. `CGRAPH-FORUMS-INFRASTRUCTURE.md`
5. `CGraph Complete Cosmetics.txt`

---

## Corrected Gap List (After Verification)

### Items that were INCORRECTLY flagged as gaps:

| Item | Actual State | Source |
|------|-------------|--------|
| Thread tags on mobile | **EXISTS** — `TagChips` component in `apps/mobile/src/components/forums/tag-chips`, used in forum-search-screen.tsx | Forums Next-Gen |
| Forum theme rendering pipeline | **EXISTS** — `ForumThemeProvider`, `useForumThemeStyles`, `AnimatedForumTitle`, `RoleBadge`, `ForumBanner` in `apps/web/src/modules/forums/components/forum-theme-renderer/` | Forums Next-Gen |
| API endpoints returning `[]` | **FIXED** — All cosmetics controllers now query DB and return real data | Cosmetics |

### Actual Remaining Gaps (14 items):

#### Backend Feature Gaps (7 items)
| # | Gap | File | Severity |
|---|-----|------|----------|
| B1 | Reputation-linked Node rewards — no milestone→Nodes pipeline | NEW: `apps/backend/lib/cgraph/nodes/reputation_rewards.ex` | HIGH |
| B2 | Forum monetization is a boolean, not `free/gated/hybrid` enum | MODIFY: `apps/backend/lib/cgraph/forums/forum.ex` L143 | HIGH |
| B3 | Forum monetization routes/controller | NEW: `apps/backend/lib/cgraph_web/controllers/api/v1/forum_monetization_controller.ex` + route macro | HIGH |
| B4 | KYC enforcement module (beyond Stripe Connect) | NEW: `apps/backend/lib/cgraph/compliance/kyc_enforcement.ex` | MEDIUM |
| B5 | AML monitoring module (circular tip detection) | NEW: `apps/backend/lib/cgraph/compliance/aml_monitor.ex` | MEDIUM |
| B6 | `user_reputation_scores` consolidated table + reputation levels (bronze→diamond) | NEW: migration + schema `apps/backend/lib/cgraph/forums/reputation_level.ex` | MEDIUM |
| B7 | Thread `is_archived` field | MODIFY: `apps/backend/lib/cgraph/forums/thread.ex` | LOW |

#### Frontend Feature Gaps (2 items)
| # | Gap | File | Severity |
|---|-----|------|----------|
| F1 | Identity cards (nameplates) in DM/group chat messages | MODIFY: `apps/web/src/modules/chat/components/message-group.tsx` | MEDIUM |
| F2 | Profile spotlight boost type | MODIFY: `apps/backend/lib/cgraph/boosts/boost.ex` + new web component | LOW |

#### Data Gaps (3 items)
| # | Gap | Current | Target |
|---|-----|---------|--------|
| D1 | Profile frames seed data | 55 | 103 |
| D2 | Profile effects seed data | 18 | 30 |
| D3 | Border track metadata (add `track` to border seeds for unlock-track organization) | No `track` field | 7 tracks: messaging, forum, group, social, security, creator, shop |

#### Infrastructure Gaps (2 items — NOT code gaps)
| # | Gap | Status | Action |
|---|-----|--------|--------|
| I1 | Physical shard repos (Repo0–Repo15) | Framework built, not deployed | SKIP — ops/scaling concern, not code |
| I2 | S3 Parquet cold storage pipeline | R2 archival exists | SKIP — ops/scaling concern, not code |

---

## Scope Exclusions

Infrastructure gaps I1/I2 are **explicitly excluded** from this phase. They are operational
scaling tasks that require DevOps/infra work (provisioning multiple databases, configuring
replication). The sharding _framework_ (ShardRouter, ConsistentHash, ShardManager) is fully
built and ready; actual deployment happens when traffic warrants it.

Phase 19 (App Store submission) remains separately blocked on Apple/Google credentials.

---

## Wave Structure

| Wave | Plans | Focus |
|------|-------|-------|
| 1 | 40-01, 40-02 | Backend: Reputation rewards, forum monetization, compliance, reputation levels, thread archiving |
| 2 | 40-03 | Frontend: Identity cards in DMs, profile spotlight boost |
| 3 | 40-04 | Data: Profile frames (48 new), profile effects (12 new), border track metadata |

---

## Codebase References

| File | State | Key Info |
|------|-------|----------|
| `forum.ex` L143 | `field :monetization_enabled, :boolean, default: false` | Needs enum migration |
| `thread.ex` | No `is_archived` field | Has `is_locked`, `is_pinned`, `is_hidden` |
| `reputation.ex` | `calculate_score/1` returns integer | No levels/tiers |
| `boost.ex` L16 | `@target_types ~w(thread post forum)` | Missing "profile" |
| `message-group.tsx` | Shows Avatar + author.name + roleColor | No nameplate/border/badge |
| `seed_borders.exs` | 42 borders, `theme` field, no `track` field | metadata.tags exists |
| `profile_frame_seeds.exs` | 55 items | Target: 103 |
| `profile_effect_seeds.exs` | 18 items | Target: 30 |
| `identity-card.tsx` | Exists in forums + mobile | Not wired into chat |
| `nodes.ex` | Full tip/unlock/withdraw | No reputation_rewards |
| `compliance/` | `tax_reporter.ex` + `age_gate.ex` | No KYC/AML |
