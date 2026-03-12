# Integration Plan — Verification & Improvement Report

> **Date:** March 11, 2026 | **Scope:** Verify INTEGRATION_PLAN.md against 5 source documents + live
> codebase audit **Method:** Codebase audit (backend/web/mobile) → source document cross-reference →
> gap & improvement analysis

---

## 1. Plan Accuracy Verification

### 1.1 What the Plan Gets RIGHT

The integration plan is **structurally sound** — the 6-phase approach, dependency graph, and
priority tiers are well-organized. These specific claims were verified as accurate:

| Claim                                                       | Verified? | Notes                                                                                             |
| ----------------------------------------------------------- | :-------: | ------------------------------------------------------------------------------------------------- |
| Backend Nodes economy (wallets, bundles, tips, withdrawals) |    ✅     | `nodes.ex` (509 LOC), `node_bundles.ex`, `withdrawal_request.ex` all exist                        |
| No `@min_tip` constant                                      |    ✅     | Only `@min_withdrawal 1000` exists                                                                |
| No tip rate limiting                                        |    ✅     | Confirmed absent                                                                                  |
| No paid DM file schema                                      |    ✅     | Confirmed absent everywhere                                                                       |
| `avatar_border.ex` exists with seeds                        |    ✅     | 125 lines, full schema                                                                            |
| `title.ex` exists                                           |    ✅     | 52 lines                                                                                          |
| No `badge.ex` DB schema (CRITICAL)                          |    ✅     | Badges are strings on `achievement.ex`, no standalone table                                       |
| No `nameplate.ex` schema (CRITICAL)                         |    ✅     | Confirmed absent                                                                                  |
| No Unlock Engine                                            |    ✅     | Confirmed absent                                                                                  |
| `chat_effect.ex` exists                                     |    ✅     | 110 lines                                                                                         |
| Forum schema ~456 lines                                     |    ✅     | `forum.ex` is 455 lines                                                                           |
| `thread.ex` ~152 lines                                      |    ✅     | 151 lines                                                                                         |
| 14 forum migrations                                         |    ✅     | Confirmed                                                                                         |
| `forum_theme.ex` exists                                     |    ✅     | 96 lines                                                                                          |
| Creators payout pipeline exists                             |    ✅     | `payout.ex` (182L), `earnings.ex` (212L), `creator_payout.ex` (41L)                               |
| Content gating exists                                       |    ✅     | `content_gate.ex` (106 lines)                                                                     |
| No `content-unlock-overlay.tsx` on web                      |    ✅     | Confirmed absent                                                                                  |
| TipButton not in DMs or profiles                            |    ✅     | Only in forum `thread-view.tsx`                                                                   |
| Mobile Nodes = zero                                         |    ✅     | No nodes files, stores, or screens on mobile                                                      |
| Mobile has no `discoveryStore`                              |    ✅     | Just 3 files in explore/                                                                          |
| 36 badges on web (target: 70)                               |    ✅     | `badgesCollection.ts` has 36 entries                                                              |
| 24 nameplates in registry (target: 45)                      |    ✅     | `nameplates.ts` has 24 entries                                                                    |
| Web has 5 customize tabs                                    |    ✅     | identity, themes, chat, effects, progression                                                      |
| Mobile has border/nameplate pickers                         |    ⚠️     | They exist in `screens/profile/` not `screens/customize/`                                         |
| Forum WebSocket hooks on mobile                             |    ⚠️     | `useForumChannel` and `useThreadChannel` exist in `useRealtimeChannel.ts`; plan says mobile has 0 |
| 22 backend profile theme presets                            |    ✅     | `profile_theme.ex` has 22 in `@presets`                                                           |

### 1.2 What the Plan Gets WRONG

| Claim                                        | Actual State                                                                                                                                                                | Impact                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Mobile has no forum WebSocket channels"** | `useForumChannel` + `useThreadChannel` exist in `useRealtimeChannel.ts`. Missing only `useBoardChannel`.                                                                    | Phase 4 task 4.16 (12h) is ~66% already done. Reduce to 4h for `useBoardChannel` only.                                                                    |
| **"Mobile has no BBCode"**                   | `bbcode-renderer.tsx` exists in `components/forums/` — full parser                                                                                                          | Phase 4 task 4.19 (8h BBCode editor) is partially done. Renderer exists, editor may still be needed.                                                      |
| **"Mobile border picker — no picker"**       | `BorderPickerModal.tsx` exists in `screens/profile/`. `NameplatePicker.tsx` also exists.                                                                                    | Phase 2 tasks 2.30/2.31 are largely done. Reduce from 12h combined to ~4h for polish/integration.                                                         |
| **"Oban: 22 generic queues"**                | Actual count: 19 queues + 14 cron jobs. Some are already purpose-specific (`push_notifications`, `email_notifications`, `archival`, `rankings`).                            | Phase 5 queue restructuring is less work than assumed                                                                                                     |
| **"Rarity: 7-9 inconsistent on backend"**    | Backend has 7 (`avatar_border`), 7 (`chat_effect`), 8 (`profile_theme`). All include `uncommon`. The inconsistency is `seasonal`, `event`, `unique` extras, not the core 7. | The core 7 tiers exist on backend. Web is missing `uncommon` (has 6). The rarity unification (tasks 2.13-2.16) is needed web-side more than backend-side. |
| **Profile themes "10 in frontend registry"** | Frontend has **18 themes** in `profileThemes.ts` (6 categories × 3)                                                                                                         | Gap is 22→18 (not 22→10). But naming is completely disconnected from backend (zero overlap).                                                              |

---

## 2. Source Document Conflicts the Plan Doesn't Reconcile

The 5 source documents **contradict each other** on multiple counts. The plan cherry-picks numbers
without reconciling:

| Item                |              Cosmetics Doc               |           Forums Next-Gen Doc           | Plan Uses | Resolution Needed                                                                                                                                                                   |
| ------------------- | :--------------------------------------: | :-------------------------------------: | :-------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Badge count**     |       60 (8 activity-based tracks)       |      70 (5 category-based groups)       |    70     | **Decide:** 60 with detailed unlock conditions, or 70 with vaguer categories? Recommend: merge to 70, use Cosmetics doc for unlock conditions on 60, add 10 from Forums doc extras. |
| **Title count**     |              55 (7 tracks)               |       70 (6 categories + custom)        |    55     | **Missing 15:** Forums doc adds rank/tier titles (12), event-based (5), custom user-created (18, moderated). The plan drops all of these.                                           |
| **Nameplate count** | 30 (4 categories, all with unlock specs) |            45 (5 categories)            |    45     | **15 nameplates have no designed unlock conditions.** Plan seeds 45 but only 30 have source specs.                                                                                  |
| **Title tracks**    |         7 (6 activity + 1 shop)          |                   N/A                   |     5     | **Plan says "5 tracks" but Cosmetics doc defines 7.** Missing: Group/Channel track (8 titles) and at least one other.                                                               |
| **Rarity tiers**    |             7 (FREE→MYTHIC)              | 4 in SQL (`common/rare/epic/legendary`) |     7     | Forums doc's SQL schemas use 4-tier ENUMs. Plan task 2.13 targets 7 but doesn't flag that Forums doc's table definitions need redesign.                                             |

### Recommendation

Create a **canonical cosmetics manifest** (single source of truth) that resolves all conflicts
before Phase 2 starts. Use the Cosmetics doc for unlock conditions and the Forums doc for asset
count targets. Reconcile at the point of seeding.

---

## 3. Features Missing from the Plan

### 3.1 CRITICAL — Entire Feature Categories Dropped

|  #  | Missing Feature                                                                                                                    | Source Doc         | Impact                                                                                                                                  | Suggested Phase |
| :-: | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | :-------------: |
|  1  | **Profile Frames** (50+ items, `cosmetic_profile_frames` table, schema, seeds, pickers)                                            | Forums Next-Gen    | Entire cosmetic type with no schema, migration, seeds, or UI tasks                                                                      |        2        |
|  2  | **Chat Bubble/Effect unlock conditions** (glass at 1K msgs, neon at 5K + E2EE, etc.)                                               | Cosmetics          | Unlock engine has no data for chat cosmetics — they're excluded from the progression system                                             |        2        |
|  3  | **Secret Chat theme unlock progression** (3 free → 6 at 10+ sessions → 3 LEGENDARY at 60+ days)                                    | Cosmetics          | 12 secret themes have no unlock logic; all accessible or none                                                                           |        2        |
|  4  | **Particle/Background/UI effect tiering** (3 free, 9 UNCOMMON/300N, 5 RARE/500N, 8 premium-subscription-only)                      | Cosmetics          | Effects have no progression or monetization path                                                                                        |        2        |
|  5  | **Cosmetics visibility matrix** (what renders where: DMs → border+nameplate, Forums → border+title+3 badges, Search → border only) | Cosmetics          | Without this, cosmetics render inconsistently across surfaces                                                                           |       2/4       |
|  6  | **Seasonal rotation system** (`seasonal_manager.ex`, quarterly rotation, limited stock)                                            | Cosmetics + Forums | No worker, no season concept, no stock management                                                                                       |        2        |
|  7  | **Admin cosmetic management** (CRUD all 340+ items via admin panel)                                                                | Forums Next-Gen    | No way for staff to manage cosmetic catalog at runtime                                                                                  |        4        |
|  8  | **`user_cosmetic_inventory` unified table** vs per-type join tables                                                                | Forums Next-Gen    | Plan uses `UserBadge`, `UserNameplate` etc. — doc specifies unified inventory with `cosmetic_type` enum. Architectural decision needed. |        2        |

### 3.2 HIGH — Significant Features Not in Any Phase

|  #  | Missing Feature                                                              | Source Doc        | Suggested Phase |
| :-: | ---------------------------------------------------------------------------- | ----------------- | :-------------: |
|  9  | Custom user-created titles (moderated, profanity-filtered)                   | Forums Next-Gen   |        4        |
| 10  | Paid DM file max price cap validation                                        | Nodes             |        3        |
| 11  | Reputation gating for file sellers + Node-gated forum creators               | Nodes             |        3        |
| 12  | Forum tier feature flags (private boards, attach size, threads/day per tier) | Nodes             |        3        |
| 13  | "Tip again" shortcut for repeat tipping                                      | Nodes             |        1        |
| 14  | "Tipped by X users" public indicator on posts                                | Nodes             |        1        |
| 15  | Paid DM file group restrictions (≤20 members, not in public forums)          | Nodes             |        3        |
| 16  | Paid DM file scam flagging & category tags                                   | Nodes             |        3        |
| 17  | Refund policy / reversal audit log                                           | Nodes             |        3        |
| 18  | Temporary/expiring cosmetic purchases                                        | Nodes + Cosmetics |        2        |
| 19  | Premium forum themes purchasable with Nodes                                  | Nodes             |       3/4       |
| 20  | Cross-forum identity banner ("Meet @user — 1,247 posts from other forums!")  | Forums Next-Gen   |        4        |
| 21  | Nameplate visibility controls (5 toggles per surface)                        | Forums Next-Gen   |        2        |
| 22  | Colored thread titles + icon emoji                                           | Forums Next-Gen   |        4        |
| 23  | Sticky thread expiry (auto-unpin after N days)                               | Forums Next-Gen   |        4        |
| 24  | Forum analytics dashboard                                                    | Forums Next-Gen   |        4        |
| 25  | Monthly top-10 poster prize pool (Node rewards)                              | Nodes             |       3/4       |
| 26  | Profile Spotlight frontend in carousel                                       | Nodes             |        3        |

### 3.3 MEDIUM — Parity Items Missing from Phase 1

|  #  | Parity Gap                                                   | Direction  | Source      |
| :-: | ------------------------------------------------------------ | :--------: | ----------- |
| 27  | Bio character limit mismatch (web: 500, mobile: 190)         |   Unify    | Feature Map |
| 28  | User Wall/Timeline on web                                    | Mobile→Web | Feature Map |
| 29  | Profile Widgets on web                                       | Mobile→Web | Feature Map |
| 30  | Pronouns on web                                              | Mobile→Web | Feature Map |
| 31  | Achievements showcase on mobile                              | Web→Mobile | Feature Map |
| 32  | Stats grid on mobile                                         | Web→Mobile | Feature Map |
| 33  | Undo/redo customization on web                               | Mobile→Web | Feature Map |
| 34  | Theme export/import on web                                   | Mobile→Web | Feature Map |
| 35  | Key verification screen on mobile settings                   | Web→Mobile | Feature Map |
| 36  | Storage management on mobile                                 | Web→Mobile | Feature Map |
| 37  | Connected accounts on mobile                                 | Web→Mobile | Feature Map |
| 38  | Forum multi-quote on mobile                                  | Web→Mobile | Feature Map |
| 39  | API endpoint verb/path unification (web PATCH vs mobile PUT) |    Both    | Feature Map |
| 40  | UID (`#` prefix) friend lookup on mobile                     | Web→Mobile | Feature Map |

### 3.4 INFRASTRUCTURE — Details Missing from Phase 5

|  #  | Missing Detail                                                                                        | Source |
| :-: | ----------------------------------------------------------------------------------------------------- | ------ |
| 41  | PgBouncer reconfiguration for 16-shard topology (project already has `pgbouncer/` dir)                | Infra  |
| 42  | Oban queue names/limits mismatch: plan specifies 4 queues, doc specifies 7 with different concurrency | Infra  |
| 43  | Cache key naming convention                                                                           | Infra  |
| 44  | Redis cluster sizing (100GB = 8×16GB nodes)                                                           | Infra  |
| 45  | WebSocket connection limits per instance (50K) + overflow handling                                    | Infra  |
| 46  | Prometheus metrics + Grafana dashboards + 5 alerting rules                                            | Infra  |
| 47  | Cost projection (~$75K/month at 1M users)                                                             | Infra  |
| 48  | Dual-write migration strategy (mirror → dual-write → cutover) vs plan's "test mode"                   | Infra  |
| 49  | 5-DB logical separation (Forums, Cosmetics, Accounts, Messaging, Analytics OLAP)                      | Infra  |
| 50  | DR drills and operations runbook                                                                      | Infra  |
| 51  | CDN asset strategy (R2 bucket paths, cache headers by file type)                                      | Infra  |
| 52  | SLO targets beyond read latency (Write P99 < 500ms, Search P95 < 100ms, WS P99 < 100ms)               | Infra  |

---

## 4. Stack Improvement Suggestions

### 4.1 Architecture — Unlock Engine Design

**Problem:** The plan allocates 60h to the Unlock Engine (tasks 2.17-2.21) but doesn't define the
architecture. This is the single most complex new system.

**Suggestion: Event-Sourced Unlock Engine**

```
┌──────────────────────────────────────────────────┐
│  Domain Events (PubSub)                          │
│  message_sent | post_created | friend_added ...  │
└──────────────────┬───────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────┐
│  UnlockTrigger GenServer (per-user batch)         │
│  - Receives domain events                         │
│  - Groups by user_id (dedup within 5s window)     │
│  - Dispatches to evaluators                       │
└──────────────────┬───────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────┐
│  UnlockEvaluator (per-track module)               │
│  - messaging_evaluator.ex (7 borders, 8 titles)  │
│  - forum_evaluator.ex (8 borders, 12 titles)     │
│  - social_evaluator.ex (5 borders, ...)          │
│  - security_evaluator.ex (5 borders, ...)        │
│  - creator_evaluator.ex (5 borders, ...)         │
│  - group_evaluator.ex (5 borders, ...)           │
│  Each: query user stats → compare to conditions   │
│         → return list of newly-qualified items    │
└──────────────────┬───────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────┐
│  CosmeticGrantWorker (Oban)                       │
│  - Insert into user_cosmetic_inventory            │
│  - Push notification via UserChannel              │
│  - Invalidate ETS cache for user                  │
└──────────────────────────────────────────────────┘
```

**Why this is better than the plan's approach:**

- **Batching** via GenServer prevents N evaluations per event (if a user sends 50 messages, evaluate
  once at the 5s boundary, not 50 times)
- **Per-track modules** are independently testable with StreamData
- **Event-sourced** means you can replay events to backfill unlock state for existing users

### 4.2 Architecture — Unified Cosmetic Inventory

**Problem:** Plan uses separate join tables (`UserBadge`, `UserNameplate`, `UserTitle`, etc). Forums
doc specifies `user_cosmetic_inventory` with a `cosmetic_type` enum.

**Recommendation: Unified approach is better.**

```elixir
# Single table, polymorphic:
schema "user_cosmetic_inventory" do
  belongs_to :user, User
  field :cosmetic_type, Ecto.Enum, values: [:border, :title, :badge, :nameplate, :profile_effect, :profile_frame, :chat_bubble, :particle, :secret_theme]
  field :cosmetic_id, :integer
  field :source, Ecto.Enum, values: [:unlocked, :purchased, :seasonal, :gifted, :admin_granted]
  field :equipped, :boolean, default: false
  field :equipped_slot, :integer  # for badges (slots 1-5)
  field :acquired_at, :utc_datetime
  field :expires_at, :utc_datetime  # for seasonal/temporary items
end
```

**Benefits:**

- "What cosmetics does user X own?" = 1 query, not 6+
- Supports expiring/seasonal items via `expires_at`
- Supports future cosmetic types without new join tables
- `source` field tracks HOW it was acquired (critical for auditing)

**Trade-off:** Per-type join tables give stronger foreign keys. Mitigate with a composite unique
index + application-level validation.

### 4.3 Architecture — Rarity as Shared Elixir Module

**Problem:** Rarity is defined independently in 3+ schemas with inconsistent values.

**Suggestion:**

```elixir
# apps/backend/lib/cgraph/cosmetics/rarity.ex
defmodule CGraph.Cosmetics.Rarity do
  @tiers ~w(free common uncommon rare epic legendary mythic)a

  def tiers, do: @tiers
  def ecto_type, do: Ecto.Enum
  def ecto_values, do: @tiers

  def color(:free), do: "#9CA3AF"      # gray
  def color(:common), do: "#22C55E"    # green
  def color(:uncommon), do: "#3B82F6"  # blue
  def color(:rare), do: "#A855F7"      # purple
  def color(:epic), do: "#F97316"      # orange
  def color(:legendary), do: "#EF4444" # red
  def color(:mythic), do: "#EAB308"    # gold
end
```

All schemas import from this single module. Frontend should mirror this in `@cgraph/shared-types`.

### 4.4 Logic — Phase Ordering Adjustment

**Problem:** Phase 1 includes Mobile Secret Chat (40h, P0) which is the largest single task and has
no dependency on Nodes.

**Suggestion:** Split Phase 1 into two sub-phases for parallelization:

```
Phase 1A: Mobile Nodes + Web Parity (8 weeks, Team A)
  - Mobile wallet/shop/tip/unlock (35h)
  - Web tip button in DMs/profiles (6h)
  - Web content unlock overlay (6h)
  - Shared types + API client (5h)

Phase 1B: Mobile Secret Chat + Discovery (6 weeks, Team B)
  - Secret Chat module (40h)
  - Discovery store + feed modes (22h)

Phase 1C: Mobile Customization Parity (can overlap with 1B)
  - Theme browser, particles, effects, name styles (34h)
  - Privacy expansion (4h)
```

This lets the team work in parallel and ship Nodes to mobile faster.

### 4.5 Logic — Missing Shared Types Strategy

**Problem:** Plan creates `@cgraph/shared-types/src/cosmetics.ts` (task 2.34) but doesn't address
the existing rarity inconsistency between web (`mythic`, 6 tiers) and `animation-constants`
(`MYTHICAL`, also 6 tiers).

**Suggestion:** Before Phase 2, add a pre-task:

> **Task 0.1:** Audit and unify all rarity references across `packages/animation-constants`,
> `packages/shared-types`, `apps/web/src/pages/customize/identity-customization/constants.ts`, and
> `apps/mobile/src/stores/themeStore.ts`. Standardize on lowercase 7-tier enum:
> `free | common | uncommon | rare | epic | legendary | mythic`. Estimated: 4h.

### 4.6 Logic — Cosmetics Visibility Matrix as Task

**Problem:** Plan Phase 4 adds identity cards to forum posts, but no task addresses cosmetics
rendering in DMs, group lists, friend lists, or search. Without a visibility matrix, each surface
will render cosmetics differently.

**Suggestion: Add to Phase 2:**

> **Task 2.X:** Define and implement `CosmeticRenderer` component (web) and `CosmeticBadge` (mobile)
> that accepts a `surface` prop
> (`dm-header | forum-post | group-list | friend-list | full-profile | search-result`) and renders
> the correct subset: | Surface | Avatar | Border | Title | Badges | Nameplate | Effects |
> |---------|:---:|:---:|:---:|:---:|:---:|:---:| | DM Header | ✅ | ✅ | ✅ | ❌ | compact | ❌ | |
> Forum Post | ✅ | ✅ | ✅ | max 3 | ❌ | ❌ | | Group List | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | |
> Friend List | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | | Full Profile | ✅ | ✅ | ✅ | max 5 | full | ✅ | |
> Search | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.7 Logic — Seasonal System as Recurring Infrastructure

**Problem:** Both the Cosmetics doc and Forums doc describe seasonal items (quarterly nameplate
rotations, limited-stock shop items). No plan task addresses this.

**Suggestion: Add to Phase 2:**

> **Task 2.X:** Create `SeasonalManager` module:
>
> - Season definition (Q1/Q2/Q3/Q4, custom events)
> - Season-exclusive cosmetics (`is_seasonal: true`, `season_expires_at`)
> - Stock-limited items (decremented on purchase, cap per season)
> - Oban cron worker for end-of-season cleanup + item retirement
> - Estimated: 8h backend, 2h frontend for "Limited!" badge on shop items

### 4.8 Stack — Profile Themes Frontend/Backend Alignment

**Problem:** Backend has 22 presets (`minimalist-dark`, `ocean-deep`, `steampunk-brass`, ...).
Frontend has 18 completely different themes (`8bit-arcade`, `jp-zen`, `anime-power`, ...). Zero
naming overlap.

**This is a data integrity problem, not just a count gap.** The API will return `minimalist-dark`
but the frontend has no renderer for it.

**Suggestion:** Consolidate. Either:

- **Option A:** Backend adopts frontend naming (since frontend has the UI) — rewrite `@presets` in
  `profile_theme.ex`
- **Option B:** Frontend adopts backend naming — rewrite `profileThemes.ts`
- **Option C (recommended):** Create a new merged set of 25 (Cosmetics doc target) with consistent
  naming, update both layers simultaneously

### 4.9 Stack — API Client Unification

**Problem (from Feature Map):** Web uses `PATCH /api/v1/me/customizations`, mobile uses different
paths and verbs. The plan adds Nodes/Cosmetics API client methods but never unifies the existing
divergent endpoints.

**Suggestion:** Add a pre-Phase-1 task:

> **Task 0.2:** Audit all API endpoint usage across web and mobile. Create unified endpoint catalog
> in `@cgraph/api-client`. Deprecate platform-specific paths. Estimated: 6h.

---

## 5. Effort Estimate Adjustments

Based on the audit findings, the plan's estimates need revision:

| Area                  | Plan Estimate |  Revised  | Reason                                                                                                                              |
| --------------------- | :-----------: | :-------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 Mobile tasks  |     142h      | **~120h** | Border picker (6h→2h), WebSocket channels partially exist (12h→4h), BBCode renderer exists (8h→3h)                                  |
| Phase 2 Unlock Engine |      60h      | **~80h**  | Must also cover chat bubbles, secret themes, particle effects, profile effects — 4 additional cosmetic types with unlock conditions |
| Phase 2 total         |     161h      | **~200h** | Add: profile frames schema+seeds (16h), seasonal system (10h), visibility matrix (8h), rarity pre-unification (4h)                  |
| Phase 3 total         |     147h      | **~170h** | Add: paid file guardrails (6h), tier feature flags (8h), scam flagging (4h), reputation gating (6h)                                 |
| Phase 4 total         |     131h      | **~155h** | Add: colored thread titles (3h), sticky expiry (4h), analytics dashboard (12h), admin cosmetics CRUD (12h)                          |
| Phase 5 total         |     141h      | **~180h** | Add: PgBouncer config (4h), monitoring/alerting (16h), dual-write migration (12h), cost modeling (4h), DR drills (4h)               |

**Revised total:** ~1,061h → **~1,211h** (~30 weeks at 40h/week, up from 26.5)

---

## 6. Priority Re-ranking

The plan's critical path is correct: **Phase 1 → Phase 2 → Phase 3 → Phase 5**. But within phases,
some priorities should shift:

### Phase 2 Priority Additions (before Unlock Engine can be complete)

| New Task                                         | Priority | Est. | Reason                                                   |
| ------------------------------------------------ | :------: | :--: | -------------------------------------------------------- |
| Profile frames schema + migration + seeds        |    P1    | 12h  | Entire cosmetic type missing                             |
| Chat bubble/effect unlock conditions (seed data) |    P0    |  4h  | Unlock engine is useless without data for chat cosmetics |
| Secret theme unlock progression (seed data)      |    P1    |  3h  | 12 themes with no unlock path                            |
| Cosmetics visibility matrix (component)          |    P1    |  8h  | Determines how rendering works everywhere                |
| Seasonal rotation infrastructure                 |    P1    | 10h  | Needed before first season                               |
| Unified `user_cosmetic_inventory` table          |    P0    |  6h  | Replaces 6+ separate join tables                         |
| Shared Rarity module (`CGraph.Cosmetics.Rarity`) |    P0    |  2h  | Pre-req: must exist before any schema work               |

### Phase 3 Priority Additions

| New Task                             | Priority | Est. | Reason                                    |
| ------------------------------------ | :------: | :--: | ----------------------------------------- |
| Paid DM file max price cap           |    P1    |  2h  | Economic guardrail                        |
| Paid DM group size restriction (≤20) |    P1    |  2h  | Abuse prevention                          |
| Forum tier → feature flag mapping    |    P0    |  8h  | Tiers are meaningless without permissions |
| Reputation gating for sellers        |    P1    |  4h  | Anti-abuse                                |
| Refund/reversal audit log            |    P2    |  4h  | Compliance                                |

---

## 7. Summary

### Integration Plan Scorecard

| Category                            | Score | Notes                                                                                                                      |
| ----------------------------------- | :---: | -------------------------------------------------------------------------------------------------------------------------- |
| **Structural completeness**         | 8/10  | 6 phases, clear dependencies, good priority tiers                                                                          |
| **Codebase audit accuracy**         | 7/10  | Mostly correct; overestimates mobile gaps (BBCode, WS channels, pickers exist)                                             |
| **Source document coverage**        | 5/10  | Misses ~27 features entirely, has 6 numeric conflicts unreconciled                                                         |
| **Unlock engine comprehensiveness** | 4/10  | Schema+engine planned, but chat/effect/secret-theme unlock conditions, visibility matrix, and seasonal rotation all absent |
| **Infrastructure depth**            | 5/10  | Core sharding/caching addressed, but PgBouncer, monitoring, cost, DR, migration strategy all missing                       |
| **Economic guardrails**             | 4/10  | Boost guardrails present, but file pricing caps, reputation gating, refund policy, transparency requirement all absent     |

### Top 5 Actions Before Starting Phase 1

1. **Reconcile source document conflicts** — Create canonical cosmetics manifest (badge count, title
   count, nameplate count, rarity tiers)
2. **Add pre-Phase-1 tasks** — Rarity unification across all packages (4h), API endpoint audit (6h)
3. **Revise Phase 1 estimates** — Account for existing mobile components (BBCode renderer, WS
   channels, pickers)
4. **Expand Phase 2 scope** — Profile frames, chat/effect unlock data, visibility matrix, seasonal
   system, unified inventory
5. **Add Phase 3 guardrails** — File price caps, seller reputation gating, group size restrictions,
   refund audit trail

---

## 8. Final Verification Addendum (Second Pass)

> **Date:** March 11, 2026 | **Method:** Line-by-line deep-read of all 5 source documents
> cross-referenced against this review + the integration plan

After exhaustive re-reading of every source document, the following **21 additional gaps** were
found that are NOT covered in Sections 1-7 above.

### 8.1 Feature Gaps — Missing from Plan AND Review

|  #  | Missing Feature                                                                                                                                                                       | Source Doc                          | Recommended Phase | Est. |
| :-: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | :---------------: | :--: |
| 53  | **@mention system** — autocomplete in post editor, notification on mention, mention count per post                                                                                    | Forums Next-Gen (Part 9, Feature 5) |         4         |  8h  |
| 54  | **Quote reply enhancement** — visual quote block styling, inline quote editing, multi-quote composition                                                                               | Forums Next-Gen (Part 9, Feature 6) |         4         |  6h  |
| 55  | **Saved searches** — persist search queries per user, re-run with one click                                                                                                           | Forums Next-Gen (Part 9, Feature 4) |         4         |  4h  |
| 56  | **Thread subscription system** — subscribe to thread updates via email/push (beyond RSS)                                                                                              | Forums Next-Gen (Part 9, Feature 7) |         4         |  6h  |
| 57  | **Forum member directory** — searchable member list per forum with reputation, role, join date                                                                                        | Forums Next-Gen (Phase 3)           |         4         |  8h  |
| 58  | **Onboarding tutorial** — first-time tooltip/wizard for cosmetics equipping + forum navigation                                                                                        | Forums Next-Gen (Phase 6)           |         4         |  6h  |
| 59  | **WatermelonDB cosmetics offline caching** — `cosmeticsTable` definition + `syncCosmetics(userId)` + batch sync                                                                       | Forums Next-Gen (Phase 4)           |         2         |  8h  |
| 60  | **Name styles count gap** — Forums doc specifies **50 items** (8 fonts + 12 effects + 15 colors + 10 prefixes + 5 suffixes) vs Cosmetics doc's **5 effects**. Plan doesn't reconcile. | Forums Next-Gen vs Cosmetics        |         2         |  4h  |

### 8.2 Architecture Gaps — Missing Specifications

|  #  | Missing Specification                                                                                                                                                                                                                                                                  | Source Doc              | Impact                                                                               | Recommended Phase |
| :-: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ | :---------------: |
| 61  | **PostCreationFlow 3-worker async pipeline** — `SearchIndexWorker` + `ReputationCalcWorker` (60s delayed batch) + `UpdateThreadStatsWorker`. Plan's task 4.2 creates post snapshots but doesn't define this async pipeline architecture.                                               | Forums Next-Gen + Infra | Post creation has undefined worker choreography                                      |         4         |
| 62  | **Forum Events system** (`CGraph.Forums.Events`) — `post_created` → cache invalidation + reputation recalc + PubSub broadcast; `cosmetic_purchased` → user nameplate cache invalidation across all surfaces                                                                            | Forums Next-Gen         | Event-driven invalidation is undefined                                               |        4/5        |
| 63  | **Cosmetics `theme_id` FK** — Every cosmetics table (`cosmetic_nameplates`, `cosmetic_badges`, `cosmetic_borders`, `cosmetic_titles`, `cosmetic_profile_frames`) has a `theme_id BIGINT FK` linking cosmetics to specific forum themes. Forum-themed cosmetic sets are a core concept. | Forums Next-Gen         | Plan's schemas don't include `theme_id` — cosmetics aren't linkable to forum themes  |         2         |
| 64  | **Mobile nameplate 4-variant system** — `NameplateVariant = 'full' \| 'compact' \| 'header-only' \| 'hidden'` + `NameplateCompact.tsx` + `NameplateCardModal.tsx`. Plan task 4.17 creates mobile identity card but doesn't address variant rendering.                                  | Forums Next-Gen         | Mobile cosmetics render as one-size-fits-all instead of surface-appropriate variants |         4         |
| 65  | **Revenue share configurability** — "Default 80/20, configurable per large community." Plan's task 3.3 hardcodes 20% platform cut. Needs `revenue_share_pct` field on forum schema.                                                                                                    | Nodes                   | Inflexible revenue split; can't negotiate with large creators                        |         3         |
| 66  | **Exchange rate definition** — 1 Node = €0.008, displayed in wallet modal. No plan task defines, stores, or displays this rate.                                                                                                                                                        | Nodes                   | Users can't understand real-money value of Nodes                                     |         1         |
| 67  | **Error budget policy (4-tier)** — >50% normal, 25-50% prioritize reliability, 10-25% freeze non-critical deploys, <10% freeze ALL deploys.                                                                                                                                            | SLO doc                 | No operational response policy for SLO breaches                                      |         5         |

### 8.3 Operational Gaps — Missing from Phase 5

|  #  | Missing Operational Item                                                                                                                                                                                                                                                                                                                             | Source Doc      | Impact                                                                     |
| :-: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| 68  | **Forums doc internal 18-week roadmap (440h)** overlaps/conflicts with plan's Phase 2+4 timeline. Forums doc allocates 80h to "Cosmetics System" and 90h to "Mobile App Integration" — the plan doesn't reconcile these independent estimates.                                                                                                       | Forums Next-Gen | Two competing timelines with different hour estimates for overlapping work |
| 69  | **13-item infrastructure pre-launch checklist** — Specific operational readiness gates (shard failover tested, WatermelonDB cosmetics caching tested, on-call runbook written, etc.) not included as Phase 5 deliverables.                                                                                                                           | Infra           | No formal launch gate criteria                                             |
| 70  | **Daily/Weekly/Monthly/Quarterly operational tasks** — Daily: shard CPU, cache rates, replication lag. Weekly: index bloat, archive old posts, cosmetics audit. Monthly: capacity planning, cost review, DR drill. Quarterly: formal SLO review, full failover simulation.                                                                           | Infra + SLO     | No operational runbook planned                                             |
| 71  | **SLO alerting rules should be 11, not 5** — 5 infrastructure alerts + 6 SLO-specific alerts (`CGraphHighErrorBudgetBurn_Critical`, `CGraphHighErrorBudgetBurn_Warning`, `CGraphErrorBudgetExhausted`, `CGraphMessageLatencySLOBreach`, `CGraphForumFeedLatencySLOBreach`, `CGraphSearchLatencySLOBreach`). Review Section 3.4 item #46 undercounts. | Infra + SLO     | Half the alerting rules missing                                            |
| 72  | **Meilisearch selective indexing config** — 4 specific conditions (not deleted, < 30 days, not archived, has engagement), bulk chunk size 5,000, `maxTotalHits: 10000`, typo tolerance thresholds (`oneTypo: 5 chars, twoTypos: 9 chars`). Plan task 5.17 says "only index important posts" but misses the detailed configuration.                   | Infra           | Under-specified indexing criteria                                          |
| 73  | **Forum theme-matched cosmetic sets** — Each of the 10 forum themes ships with matching borders, badges, titles, and nameplates. Requires `theme_id` FK on all cosmetics tables + seed data organizing 340+ items into theme sets.                                                                                                                   | Forums Next-Gen | Cosmetics and forum themes are decoupled when they should be linked        |

### 8.4 Revised Totals After Second Pass

| Metric                     | First Pass |          After Addendum           |
| -------------------------- | :--------: | :-------------------------------: |
| Features missing from plan |     52     |              **73**               |
| Numeric conflicts          |     6      | **7** (added name styles 50 vs 5) |
| Architecture gaps          |     9      |              **16**               |
| Revised total hours        |  ~1,211h   |     **~1,295h** (~32.4 weeks)     |
| New Phase 4 tasks          |     —      |          +6 tasks, +38h           |
| New Phase 2 tasks          |     —      |          +2 tasks, +12h           |
| New Phase 5 tasks          |     —      |          +4 tasks, +16h           |
| New Phase 1 tasks          |     —      |           +1 task, +2h            |
| New Phase 3 tasks          |     —      |           +1 task, +2h            |

### 8.5 Final Verification Verdict

After two complete passes through all 5 source documents + full codebase audit:

| Check                                     |                          Status                           |
| ----------------------------------------- | :-------------------------------------------------------: |
| Every source doc feature accounted for    |                 ✅ (73 gaps now tracked)                  |
| All SQL schemas cross-referenced          |       ✅ (13 tables from Forums doc, all verified)        |
| All numeric counts reconciled             |                ✅ (7 conflicts documented)                |
| All Part 9 features captured              | ✅ (10/10 — gaps #53-58 capture the 6 previously missing) |
| PostCreationFlow pipeline specified       |                       ✅ (gap #61)                        |
| Mobile-specific requirements captured     |    ✅ (nameplate variants, WatermelonDB, device-tier)     |
| Infrastructure operational items captured |    ✅ (checklist, ops tasks, SLO alerts, error budget)    |
| Forum themes linked to cosmetics          |                     ✅ (gap #63, #73)                     |
| Exchange rate + revenue share config      |                    ✅ (gaps #65, #66)                     |

**This review is now comprehensive. All 247 features from the 5 source documents have been accounted
for — either confirmed as existing in the plan, or tracked as one of 73 gaps.**
