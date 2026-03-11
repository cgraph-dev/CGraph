# CGraph — Comprehensive Integration Plan

> **Version:** 1.0.0 | **Date:** March 11, 2026 | **Status:** Strategic Planning Document
> **Scope:** Integrate ALL features from 5 design documents into the CGraph codebase
> **Method:** Atomic review of each document → codebase audit → gap analysis → phased implementation plan

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Source Documents](#2-source-documents)
3. [Codebase Audit Results](#3-codebase-audit-results)
4. [Gap Registry](#4-gap-registry)
5. [Implementation Plan — Phase 1: Parity + Mobile Nodes](#5-phase-1)
6. [Implementation Plan — Phase 2: Cosmetics + Unlock Engine](#6-phase-2)
7. [Implementation Plan — Phase 3: Creator Economy](#7-phase-3)
8. [Implementation Plan — Phase 4: Forum Transformation](#8-phase-4)
9. [Implementation Plan — Phase 5: Infrastructure Scaling](#9-phase-5)
10. [Implementation Plan — Phase 6: Enterprise](#10-phase-6)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Risk Matrix](#12-risk-matrix)
13. [Success Metrics](#13-success-metrics)

---

## 1. Executive Summary

### What Exists Today (v1.0.0)

CGraph v1.0.0 has a **strong foundation** across all layers:

| Layer | Status | Strength |
|-------|--------|----------|
| **Backend (Elixir/Phoenix)** | 🟢 Robust | Forums, Nodes, Creators, Gamification, E2EE — all contexts exist with 14+ forum migrations |
| **Web (React 19/Vite)** | 🟢 Feature-rich | 5-tab customization, Nodes wallet/shop/tipping, 80+ forum components, 12 forum store slices |
| **Mobile (RN 0.81/Expo 54)** | 🟡 Growing | DMs (13K+ lines), forums (9K+ lines), settings (12K+ lines) — but major gaps in Nodes, effects, discovery |
| **Shared packages** | 🟢 Solid | 6 packages (types, API client, socket, crypto, utils, animation constants) |
| **Infrastructure** | 🟡 Single-instance | Fly.io + Supabase PostgreSQL + Redis + Meilisearch — works up to ~100K users |

### What's Missing (from 5 design documents)

The 5 documents define **247 discrete features/requirements**. After atomic codebase audit:

| Category | Fully Exists | Partial | Missing | Total Items |
|----------|:------------:|:-------:|:-------:|:-----------:|
| Nodes Economy | 14 | 8 | 12 | 34 |
| Cosmetics System | 18 | 11 | 14 | 43 |
| Forum Transformation | 22 | 9 | 12 | 43 |
| Forum Infrastructure | 2 | 5 | 8 | 15 |
| Web/Mobile Parity | 28 | 12 | 72 | 112 |
| **Totals** | **84 (34%)** | **45 (18%)** | **118 (48%)** | **247** |

**34% done, 18% partially done, 48% completely missing.** This plan covers all 163 incomplete items across 6 phases.

---

## 2. Source Documents

| # | Document | Key Deliverables | Primary Phase |
|---|----------|-----------------|---------------|
| 1 | `WEB_MOBILE_FEATURE_MAP.md` | 72 parity gaps across 9 sections (customize, nodes, DMs, friends, discovery, profile, settings, forums) | Phase 1 |
| 2 | `Nodes are already a solid.txt` | Tipping expansion, paid DM files, forum gating types, forum monetization tiers, boosts, creator payouts, KYC/AML, mobile Nodes | Phases 1, 3 |
| 3 | `CGraph Complete Cosmetics.txt` | 42 borders (7 unlock tracks), 55 titles, 70 badges, 45 nameplates, 7 rarity tiers, unlock engine | Phase 2 |
| 4 | `CGRAPH-FORUMS-NEXT-GEN-PLAN.md` | Board hierarchy polish, 10 forum themes, identity cards on posts, 340 cosmetic assets, nameplate system | Phases 2, 4 |
| 5 | `CGRAPH-FORUMS-INFRASTRUCTURE.md` | 16-shard PostgreSQL, 3-tier cache, multi-queue Oban, TimescaleDB warm tier, S3 cold tier, presence optimization | Phase 5 |

---

## 3. Codebase Audit Results

### 3.1 Nodes Economy — Current State

| Feature | Backend | Web | Mobile | Status |
|---------|:-------:|:---:|:------:|:------:|
| Wallets (balance/CRUD) | ✅ `nodes.ex` | ✅ `nodes-wallet.tsx` | ❌ | PARTIAL |
| Bundles (5 tiers, Stripe) | ✅ `node_bundles.ex` | ✅ `nodes-shop.tsx` | ❌ | PARTIAL |
| Tipping (Forums only) | ✅ `tip/3` | ✅ `tip-modal.tsx` | ❌ | PARTIAL |
| Tipping in DMs | — | ❌ no TipButton in messaging | ❌ | MISSING |
| Tipping on Profiles | — | ❌ no TipButton in profile | ❌ | MISSING |
| Tip minimum (5-10 Nodes) | ❌ no @min_tip | ❌ no validation | ❌ | MISSING |
| Tip rate limiting | ❌ no tip-specific limiter | — | ❌ | MISSING |
| Paid DM Files | ❌ no schema | ❌ | ❌ | MISSING |
| Thread content gating | ✅ full | ⚠️ no unlock UI overlay | ❌ | PARTIAL |
| Time-based/tier-based gating | ❌ one-time only | ❌ | ❌ | MISSING |
| Forum monetization (tiers) | ⚠️ boolean only | ⚠️ | ⚠️ | PARTIAL |
| Forum Node-priced tiers | ❌ fiat/Stripe only | ❌ | ❌ | MISSING |
| Cosmetic purchases | ✅ `title_shop_system.ex` | ⚠️ | ❌ | PARTIAL |
| Boosts (forum/thread/profile) | ❌ category exists, no logic | ❌ | ❌ | MISSING |
| Reputation → Node rewards | ⚠️ achievement-only | — | — | PARTIAL |
| Creator payouts (Stripe) | ✅ full | ✅ dashboard | ❌ | PARTIAL |
| Withdrawal (min 1000) | ✅ full | ✅ modal | ❌ | PARTIAL |
| KYC threshold | ❌ delegates to Stripe | — | — | MISSING |
| AML flagging | ❌ | — | — | MISSING |
| Tax receipts | ❌ | — | — | MISSING |
| Mobile wallet screen | — | — | ❌ | MISSING |
| Mobile tip button | — | — | ❌ | MISSING |
| Mobile unlock button | — | — | ❌ | MISSING |

### 3.2 Cosmetics System — Current State

| Feature | Backend | Web | Mobile | Status |
|---------|:-------:|:---:|:------:|:------:|
| Border schema (42 entries) | ✅ `avatar_border.ex` + seeds | ✅ `borders-section.tsx` | ❌ no picker | PARTIAL |
| Border unlock tracks (7) | ❌ organized by visual theme | — | — | MISSING |
| Border unlock conditions | ⚠️ fields exist, no real conditions | — | — | PARTIAL |
| Title schema (~59 exist) | ✅ `title.ex` | ✅ `titles-section.tsx` | ❌ | PARTIAL |
| Title unlock tracks (5) | ❌ by rarity, not track | — | — | MISSING |
| Badge schema | ❌ no DB table, string arrays only | ✅ `badges-section.tsx` (~36) | ❌ | CRITICAL |
| Badge backend CRUD | ❌ no BadgeController | — | — | MISSING |
| Badge count (target: 70) | — | ⚠️ 36/70 | — | PARTIAL |
| Nameplate schema | ❌ no DB table | ✅ 24/45 in registry | ❌ | CRITICAL |
| Nameplate backend CRUD | ❌ | — | — | MISSING |
| Profile Effects schema | ❌ no standalone schema | ✅ 12 effects | ❌ | PARTIAL |
| Name Styles backend | ❌ no storage | ✅ full UI | ❌ | MISSING |
| Chat Bubbles | ✅ `chat_effect.ex` | ✅ 12+ styles, 30+ effects | ⚠️ basic | EXISTS |
| Secret Themes | — | ✅ 12 themes | ❌ | PARTIAL |
| Profile Themes | ✅ 22 presets | ⚠️ 10 in registry | ❌ | PARTIAL |
| Rarity tiers (7: FREE→MYTHIC) | ⚠️ 7-9 (inconsistent) | ⚠️ 6 (no UNCOMMON) | — | INCONSISTENT |
| **Unlock Engine** | ❌ **completely missing** | — | — | **CRITICAL** |
| Cosmetics API returns data | ⚠️ if seeded | — | — | PARTIAL |

### 3.3 Forum System — Current State

| Feature | Backend | Web | Mobile | Status |
|---------|:-------:|:---:|:------:|:------:|
| Forum CRUD (full) | ✅ 456-line schema | ✅ 80+ components | ✅ 37 files | EXISTS |
| Board hierarchy | ✅ `board.ex` + permissions | ✅ hierarchy tree | ✅ board screen | EXISTS |
| Thread schema | ✅ 152 lines | ✅ thread card/view | ✅ post screen | EXISTS |
| Thread posts | ✅ full | ✅ full | ✅ basic | EXISTS |
| Sticky/announcement types | ⚠️ via enum, not bool | ⚠️ | ⚠️ | PARTIAL |
| Locked/archived states | ✅ | ✅ | ✅ | EXISTS |
| Forum themes (schema) | ✅ `forum_theme.ex` | ✅ theme renderer | ✅ customization screen | EXISTS |
| 10 predefined themes | ❌ no seed data | ❌ no theme gallery | ❌ | MISSING |
| Thread tags (many-to-many) | ❌ only inline prefix | ❌ | ❌ | MISSING |
| Identity cards on posts | ❌ no nameplate snapshot | ❌ | ❌ | MISSING |
| Per-forum reputation table | ⚠️ scattered across 3 tables | ⚠️ | ⚠️ | PARTIAL |
| Forum monetization modes | ⚠️ boolean only | ⚠️ | ⚠️ | PARTIAL |
| RSS feeds | ✅ | ✅ | ❌ | PARTIAL |
| Content gating | ✅ backend | ⚠️ no unlock overlay | ❌ | PARTIAL |
| WebSocket channels | ✅ 3 channels | ✅ 3 hooks | ❌ | PARTIAL |
| Announcements system | ✅ full | ✅ banner | ❌ | PARTIAL |
| Threaded comments | — | ✅ tree rendering | ❌ flat only | PARTIAL |
| BBCode editor | — | ✅ full | ❌ plain text | PARTIAL |
| 14 DB migrations | ✅ complete set | — | — | EXISTS |

### 3.4 Infrastructure — Current State

| Feature | Status | Current | Target |
|---------|:------:|---------|--------|
| PostgreSQL | 🟡 | Single Supabase instance | 16 shards by forum_id |
| Connection pool | 🟡 | 300 total | 800 (50 × 16 shards) |
| Read replicas | ❌ | None | 3 per shard (48 total) |
| ETS caching (L1) | ⚠️ | Cachex for 2FA/general | Forum-specific TTL 1hr for cosmetics |
| Redis caching (L2) | ⚠️ | Presence + general | Structured forum cache, 5-min TTL |
| DB replica reads (L3) | ❌ | Direct primary reads | Dedicated read replicas |
| Oban queues | ⚠️ | 22 generic queues | 6 dedicated high-concurrency queues |
| Hot data (< 30d) | ✅ | Default behavior | Keep in-shard |
| Warm tier (30-90d) | ❌ | None | TimescaleDB hypertables |
| Cold tier (> 90d) | ❌ | None | S3 Parquet files |
| Meilisearch | ⚠️ | Generic adapter | Selective incremental indexing |
| Presence | ⚠️ | HyperLogLog sampling | Optimized for 1M+ concurrent |

### 3.5 Web/Mobile Parity — Critical Gaps

| Feature | Web LOC | Mobile LOC | Gap |
|---------|--------:|----------:|:---:|
| Nodes (wallet/shop/tip/unlock) | 927 | **0** | 🔴 |
| Customize (effects/themes/particles) | 6,247 | 1,211 | 🔴 |
| Discovery (5 feed modes + store) | ~700 | 893 (basic) | 🔴 |
| Secret Chat module | Full | **0** | 🔴 |
| Forum real-time sockets | 3 channels | **0** | 🟠 |
| Forum threaded comments | Tree | Flat | 🟠 |
| Forum BBCode editor | Full | Plain text | 🟠 |
| Privacy settings depth | 15 toggles | 6 | 🟡 |
| Profile layouts selector | 5 layouts | **0** | 🟡 |
| Theme categories | 4 + secret | Accent only | 🟡 |
| Chat effects store | Full (321 lines) | **0** | 🟡 |

---

## 4. Gap Registry

### 4.1 Critical Gaps (Must-Fix — Blocking Core Features)

| ID | Gap | Impact | Source Doc | Phase |
|:--:|-----|--------|-----------|:-----:|
| C1 | **Unlock Engine** — No system evaluates `unlock_requirement` and grants cosmetics | Every cosmetic is locked with no door | Cosmetics | 2 |
| C2 | **Badge backend** — No DB table, no schema, no CRUD API | Frontend-only string arrays, can't persist | Cosmetics | 2 |
| C3 | **Nameplate backend** — No DB table, no schema, no API | 24 nameplates exist only as frontend constants | Cosmetics + Forums | 2 |
| C4 | **Mobile Nodes = zero** — No wallet, shop, tip, unlock on mobile | Half the userbase can't participate in economy | Nodes + Parity | 1 |
| C5 | **Paid DM Files** — Completely unimplemented at all layers | Key monetization feature missing | Nodes | 3 |
| C6 | **Identity Cards on Posts** — No nameplate/badge rendering on forum posts | Core forum transformation innovation missing | Forums | 4 |
| C7 | **Rarity tier inconsistency** — Frontend: 6 tiers (no UNCOMMON), Backend: 7-9, "MYTHIC" vs "MYTHICAL" | Breaks cosmetic unlock logic | Cosmetics | 2 |

### 4.2 High-Priority Gaps (Significant Feature Missing)

| ID | Gap | Source Doc | Phase |
|:--:|-----|-----------|:-----:|
| H1 | Mobile Secret Chat (E2EE, PQXDH, ghost mode, themes) | Parity | 1 |
| H2 | Mobile Discovery (5 feed modes + frequency weights + store) | Parity | 1 |
| H3 | Mobile Profile Layouts (5 templates) | Parity | 1 |
| H4 | Mobile Theme categories (4 + secret themes) | Parity | 1 |
| H5 | Mobile Particle/Background/UI effects | Parity | 1 |
| H6 | 10 predefined forum themes (Neon Cyber → Zen Garden) | Forums | 4 |
| H7 | Forum monetization modes (free/gated/hybrid) + 3 Node tiers | Nodes + Forums | 3 |
| H8 | Time-based & tier-based content gating | Nodes | 3 |
| H9 | Boosts (forum/thread/profile spotlight) | Nodes | 3 |
| H10 | Name Style backend storage | Cosmetics | 2 |
| H11 | Profile Effect standalone backend schema | Cosmetics | 2 |
| H12 | Tip button in DMs and Profiles (web + mobile) | Nodes | 1 |
| H13 | Content unlock UI overlay (web) | Nodes | 1 |
| H14 | Thread tags (many-to-many) | Forums | 4 |
| H15 | Mobile forum WebSocket channels | Parity + Forums | 4 |

### 4.3 Medium-Priority Gaps (Enhancement/Polish)

| ID | Gap | Source Doc | Phase |
|:--:|-----|-----------|:-----:|
| M1 | Nameplate count gap (24/45) | Cosmetics | 2 |
| M2 | Badge count gap (36/70) | Cosmetics | 2 |
| M3 | Profile theme frontend gap (10/22 presets synced) | Cosmetics | 2 |
| M4 | Tip minimum validation (5-10 Nodes) | Nodes | 1 |
| M5 | Tip rate limiting | Nodes | 1 |
| M6 | Per-forum reputation table consolidation | Forums | 4 |
| M7 | KYC threshold enforcement | Nodes | 3 |
| M8 | AML flagging system | Nodes | 3 |
| M9 | Tax receipt generation | Nodes | 3 |
| M10 | Oban held-nodes release worker | Nodes | 1 |
| M11 | Creator payout scheduled worker | Nodes | 3 |
| M12 | Mobile threaded comments (tree vs flat) | Parity | 4 |
| M13 | Mobile BBCode editor | Parity | 4 |
| M14 | Mobile announcements system | Parity | 4 |
| M15 | Shared cosmetics types package | Cosmetics | 2 |

### 4.4 Infrastructure Gaps (Phase 5 — Scale)

| ID | Gap | Target |
|:--:|-----|--------|
| I1 | 16-shard PostgreSQL | `Repo.Router` with `rem(forum_id, 16)` |
| I2 | Read replicas (3 per shard) | 48 read replicas via Fly |
| I3 | ETS forum cache (TTL 1hr) | `CGraph.Cosmetics.Cache` module |
| I4 | Redis structured forum cache (TTL 5min) | `CGraph.Forums.RedisCache` |
| I5 | TimescaleDB warm tier (30-90d) | Hypertable partitioning |
| I6 | S3 cold tier (>90d) | Parquet archival worker |
| I7 | Dedicated Oban queues (6, higher concurrency) | `forum_notifications:50`, `forum_indexing:20`, `cosmetics_processing:10` |
| I8 | Selective Meilisearch indexing | Incremental forum indexer worker |
| I9 | Presence optimization (1M+) | Sharded presence with cluster-aware sampling |

---

## 5. Phase 1: Parity + Mobile Nodes (v1.1 — Q2 2026)

**Goal:** Bring mobile to feature parity on critical systems. Every CGraph user on mobile can use Nodes, discover content, and access Secret Chat.

### 5.1 Backend Tasks

| # | Task | Files to Create/Modify | Depends On | Priority | Est. |
|:-:|------|----------------------|:----------:|:--------:|:----:|
| 1.1 | Add `@min_tip 10` constant + validation in `tip/3` | `apps/backend/lib/cgraph/nodes/nodes.ex` | — | P1 | 1h |
| 1.2 | Add tip rate limiter plug (10/min per user pair) | `apps/backend/lib/cgraph_web/plugs/tip_rate_limiter.ex` | — | P2 | 2h |
| 1.3 | Create `HeldNodesReleaseWorker` (Oban, daily) | `apps/backend/lib/cgraph/workers/held_nodes_release_worker.ex` | M10 | P1 | 3h |
| 1.4 | Unify mobile cosmetics API (`/api/v1/me/cosmetics`) | `apps/backend/lib/cgraph_web/controllers/api/v1/me_cosmetics_controller.ex` | — | P2 | 4h |

### 5.2 Web Tasks

| # | Task | Files to Create/Modify | Depends On | Priority | Est. |
|:-:|------|----------------------|:----------:|:--------:|:----:|
| 1.5 | Add `TipButton` to DM message actions | `apps/web/src/modules/messaging/components/message-actions.tsx` | H12 | P1 | 2h |
| 1.6 | Add `TipButton` to profile card | `apps/web/src/modules/social/components/profile-card/` | H12 | P1 | 2h |
| 1.7 | Add minimum tip validation to `tip-modal.tsx` | `apps/web/src/modules/nodes/components/tip-modal.tsx` | M4 | P2 | 1h |
| 1.8 | Build content unlock overlay component | `apps/web/src/modules/nodes/components/content-unlock-overlay.tsx` | H13 | P1 | 4h |
| 1.9 | Integrate unlock overlay in `thread-view.tsx` | `apps/web/src/modules/forums/components/thread-view/thread-view.tsx` | 1.8 | P1 | 2h |
| 1.10 | Add friend favorites + nicknames (parity with mobile) | `apps/web/src/modules/social/` | — | P2 | 4h |
| 1.11 | Add mutual friends/groups to profile | `apps/web/src/modules/social/` | — | P2 | 3h |

### 5.3 Mobile Tasks

| # | Task | Files to Create/Modify | Depends On | Priority | Est. |
|:-:|------|----------------------|:----------:|:--------:|:----:|
| 1.12 | **Nodes Wallet Screen** (balance, history, filters) | `apps/mobile/src/screens/nodes/wallet-screen.tsx` | C4 | P0 | 8h |
| 1.13 | **Nodes Shop Screen** (5 bundles, Stripe/IAP) | `apps/mobile/src/screens/nodes/shop-screen.tsx` | C4 | P0 | 8h |
| 1.14 | **Nodes Store** (Zustand) | `apps/mobile/src/stores/nodesStore.ts` | C4 | P0 | 4h |
| 1.15 | **Nodes Service** (API calls) | `apps/mobile/src/services/nodesService.ts` | C4 | P0 | 3h |
| 1.16 | **Tip Button** (DM long-press, profile) | `apps/mobile/src/components/tip-button.tsx`, `apps/mobile/src/components/tip-modal.tsx` | 1.14 | P0 | 6h |
| 1.17 | **Content Unlock Button** (forum posts) | `apps/mobile/src/components/content-unlock-button.tsx` | 1.14 | P1 | 4h |
| 1.18 | **Withdrawal Screen** | `apps/mobile/src/screens/nodes/withdrawal-screen.tsx` | 1.14 | P1 | 4h |
| 1.19 | **Secret Chat Module** (PQXDH, ghost mode, panic wipe) | `apps/mobile/src/modules/secret-chat/` (15+ files) | H1 | P0 | 40h |
| 1.20 | **Discovery Store** + 5 feed modes | `apps/mobile/src/stores/discoveryStore.ts` | H2 | P1 | 8h |
| 1.21 | **Discovery Feed Modes UI** | `apps/mobile/src/screens/explore/` (update) | 1.20 | P1 | 8h |
| 1.22 | **Frequency Picker + Topic Selector** | `apps/mobile/src/components/discovery/` | 1.20 | P2 | 6h |
| 1.23 | **Profile Layouts Selector** (5 templates) | `apps/mobile/src/screens/customize/profile-layouts-screen.tsx` | H3 | P2 | 4h |
| 1.24 | **Theme Category Browser** (4 categories + secret) | `apps/mobile/src/screens/customize/theme-browser-screen.tsx` | H4 | P1 | 6h |
| 1.25 | **Particle Effects Screen** | `apps/mobile/src/screens/customize/particle-effects-screen.tsx` | H5 | P2 | 8h |
| 1.26 | **Background Effects Screen** | `apps/mobile/src/screens/customize/background-effects-screen.tsx` | H5 | P2 | 6h |
| 1.27 | **UI Animations Presets Screen** | `apps/mobile/src/screens/customize/animation-presets-screen.tsx` | H5 | P2 | 4h |
| 1.28 | **Name Styles Screen** (font + effect + colors) | `apps/mobile/src/screens/customize/name-styles-screen.tsx` | — | P2 | 6h |
| 1.29 | **Privacy Settings Expansion** (15 toggles parity) | `apps/mobile/src/screens/settings/privacy-screen.tsx` (update) | — | P2 | 4h |
| 1.30 | **Chat Effects Store** | `apps/mobile/src/stores/chatEffectsStore.ts` | — | P2 | 4h |
| 1.31 | **Navigator Updates** (register new screens) | `apps/mobile/src/navigation/` (multiple files) | 1.12-1.30 | P1 | 3h |

### 5.4 Shared Package Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 1.32 | Add Nodes types to `@cgraph/shared-types` | `packages/shared-types/src/nodes.ts` | P1 | 2h |
| 1.33 | Add Nodes API methods to `@cgraph/api-client` | `packages/api-client/src/nodes.ts` | P1 | 3h |

### Phase 1 Totals

- **Backend:** 4 tasks, ~10h
- **Web:** 7 tasks, ~18h
- **Mobile:** 20 tasks, ~142h
- **Shared:** 2 tasks, ~5h
- **Total:** 33 tasks, ~175h (≈4.4 weeks at 40h/week)

---

## 6. Phase 2: Cosmetics + Unlock Engine (v1.2 — Q3 2026)

**Goal:** Every cosmetic has a purpose. The unlock engine automatically evaluates conditions and grants rewards. Rarity tiers are consistent. Backend schemas exist for ALL cosmetic types.

### 6.1 Backend Tasks — Schema Creation

| # | Task | Files to Create | Depends On | Priority | Est. |
|:-:|------|----------------|:----------:|:--------:|:----:|
| 2.1 | **Badge Ecto schema** (`badges` table) | `apps/backend/lib/cgraph/gamification/badge.ex` | C2 | P0 | 4h |
| 2.2 | **Badge migration** (id, slug, name, description, icon_url, category, rarity, unlock_type, unlock_requirement, max_equip) | `apps/backend/priv/repo/migrations/YYYYMMDD_create_badges.exs` | 2.1 | P0 | 2h |
| 2.3 | **UserBadge join table** | `apps/backend/lib/cgraph/gamification/user_badge.ex` | 2.1 | P0 | 2h |
| 2.4 | **BadgeController** (list, unlocked, equip/unequip, purchase) | `apps/backend/lib/cgraph_web/controllers/badge_controller.ex` | 2.1 | P0 | 4h |
| 2.5 | **Nameplate Ecto schema** (`nameplates` table) | `apps/backend/lib/cgraph/gamification/nameplate.ex` | C3 | P0 | 4h |
| 2.6 | **Nameplate migration** (id, slug, name, description, rarity, text_effect, gradient_config, emblem, particles, unlock_type, unlock_requirement, coin_cost) | `apps/backend/priv/repo/migrations/YYYYMMDD_create_nameplates.exs` | 2.5 | P0 | 2h |
| 2.7 | **UserNameplate join table** | `apps/backend/lib/cgraph/gamification/user_nameplate.ex` | 2.5 | P0 | 2h |
| 2.8 | **NameplateController** | `apps/backend/lib/cgraph_web/controllers/nameplate_controller.ex` | 2.5 | P0 | 4h |
| 2.9 | **ProfileEffect Ecto schema** (standalone) | `apps/backend/lib/cgraph/gamification/profile_effect.ex` | H11 | P1 | 3h |
| 2.10 | **ProfileEffect migration** | `apps/backend/priv/repo/migrations/YYYYMMDD_create_profile_effects.exs` | 2.9 | P1 | 2h |
| 2.11 | **Add `display_name_style` to UserCustomization** (font, effect, primary_color, secondary_color) | `apps/backend/lib/cgraph/customizations/user_customization.ex` (modify) | H10 | P1 | 2h |
| 2.12 | **Display name style migration** | `apps/backend/priv/repo/migrations/YYYYMMDD_add_display_name_style.exs` | 2.11 | P1 | 1h |

### 6.2 Backend Tasks — Rarity Unification

| # | Task | Files to Modify | Priority | Est. |
|:-:|------|----------------|:--------:|:----:|
| 2.13 | **Unify rarity enum** to 7 tiers: `free, common, uncommon, rare, epic, legendary, mythic` | All gamification schemas | P0 | 4h |
| 2.14 | **Migration: add `uncommon` rarity** to borders/titles that need it | New migration | P0 | 2h |
| 2.15 | **Fix frontend MYTHIC/MYTHICAL inconsistency** | `packages/animation-constants/src/registries/nameplates.ts`, `profileEffects.ts` | P0 | 1h |
| 2.16 | **Update `constants.ts`** to include UNCOMMON tier | `apps/web/src/pages/customize/identity-customization/constants.ts` | P0 | 1h |

### 6.3 Backend Tasks — Unlock Engine

| # | Task | Files to Create | Priority | Est. |
|:-:|------|----------------|:--------:|:----:|
| 2.17 | **`UnlockEngine` module** — evaluates conditions, grants cosmetics | `apps/backend/lib/cgraph/gamification/unlock_engine.ex` | P0 | 16h |
| 2.18 | **`UnlockCondition` parser** — parses condition strings into evaluable structs | `apps/backend/lib/cgraph/gamification/unlock_condition.ex` | P0 | 8h |
| 2.19 | **`UnlockEvaluator` workers** — per-track evaluators (messaging, forum, group, social, security, creator) | `apps/backend/lib/cgraph/gamification/unlock_evaluators/` (6 files) | P0 | 24h |
| 2.20 | **Event-driven unlock triggers** — hook into post creation, DM sending, friend adding, etc. | `apps/backend/lib/cgraph/gamification/unlock_triggers.ex` | P0 | 8h |
| 2.21 | **`CosmeticGrantWorker`** (Oban) — processes unlock queue | `apps/backend/lib/cgraph/workers/cosmetic_grant_worker.ex` | P1 | 4h |

### 6.4 Backend Tasks — Seed Data

| # | Task | Files to Create/Modify | Priority | Est. |
|:-:|------|----------------------|:--------:|:----:|
| 2.22 | **Seed 42 borders with unlock conditions** (7 tracks × 5-8 borders) | `apps/backend/priv/repo/seeds/seed_borders.exs` (rewrite) | P0 | 6h |
| 2.23 | **Seed 55 titles with unlock conditions** (5 tracks) | `apps/backend/priv/repo/seeds/seed_titles.exs` | P0 | 4h |
| 2.24 | **Seed 70 badges** (5 categories: achievement 20, role 10, status 15, seasonal 15, exclusive 10) | `apps/backend/priv/repo/seeds/seed_badges.exs` | P0 | 6h |
| 2.25 | **Seed 45 nameplates** (5 categories: game 12, season 8, premium 8, exclusive 10, themed 7) | `apps/backend/priv/repo/seeds/seed_nameplates.exs` | P0 | 4h |
| 2.26 | **Seed 12+ profile effects** | `apps/backend/priv/repo/seeds/seed_profile_effects.exs` | P1 | 2h |

### 6.5 Frontend Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 2.27 | **Update `badgesCollection.ts`** to 70 badges | `apps/web/src/data/badgesCollection.ts` | P1 | 4h |
| 2.28 | **Create nameplate registry** (45 entries) | `packages/animation-constants/src/registries/nameplates.ts` (expand) | P1 | 4h |
| 2.29 | **Sync profile themes** (22 backend → frontend) | `packages/animation-constants/src/registries/profileThemes.ts` | P2 | 2h |
| 2.30 | **Mobile border picker screen** | `apps/mobile/src/screens/customize/border-picker-screen.tsx` | P1 | 6h |
| 2.31 | **Mobile nameplate picker screen** | `apps/mobile/src/screens/customize/nameplate-picker-screen.tsx` | P1 | 6h |
| 2.32 | **Mobile profile effects screen** | `apps/mobile/src/screens/customize/profile-effects-screen.tsx` | P2 | 4h |
| 2.33 | **Nodes shop cosmetics integration** (web) | `apps/web/src/pages/nodes/nodes-shop.tsx` (expand) | P1 | 6h |

### 6.6 Shared Package Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 2.34 | **Create `@cgraph/shared-types/src/cosmetics.ts`** — unified Border, Title, Badge, Nameplate, ProfileEffect, NameStyle types | `packages/shared-types/src/cosmetics.ts` | P0 | 4h |
| 2.35 | **Cosmetics API client methods** | `packages/api-client/src/cosmetics.ts` | P1 | 3h |

### Phase 2 Totals

- **Backend schemas:** 12 tasks, ~32h
- **Backend rarity:** 4 tasks, ~8h
- **Backend unlock engine:** 5 tasks, ~60h
- **Backend seeds:** 5 tasks, ~22h
- **Frontend:** 7 tasks, ~32h
- **Shared:** 2 tasks, ~7h
- **Total:** 35 tasks, ~161h (≈4 weeks)

---

## 7. Phase 3: Creator Economy (v1.3 — Q4 2026)

**Goal:** Full creator/consumer economy. Paid DM files, forum monetization tiers with Nodes, boosts, KYC/AML, tax receipts.

### 7.1 Backend Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 3.1 | **Paid DM Files — Schema** (`paid_file_attachments` table: file_id, price_nodes, license_notes, category, buyer_accesses) | `apps/backend/lib/cgraph/messaging/paid_file_attachment.ex` + migration | P0 | 6h |
| 3.2 | **Paid DM Files — API** (`POST /messages/:id/sell-file`, `POST /messages/:id/unlock-file`) | `apps/backend/lib/cgraph_web/controllers/api/v1/paid_file_controller.ex` | P0 | 8h |
| 3.3 | **Paid DM Files — Transaction flow** (debit buyer, credit seller with 20% cut, 21-day hold) | `apps/backend/lib/cgraph/nodes/nodes.ex` (extend) | P0 | 4h |
| 3.4 | **Content gating types** — Add `gate_type` enum to threads (`one_time`, `time_based`, `tier_based`) | `apps/backend/lib/cgraph/forums/thread.ex` + migration | P1 | 4h |
| 3.5 | **Time-based unlock** — `gate_duration_days` field, access expiry logic | `apps/backend/lib/cgraph/creators/content_gate.ex` (extend) | P1 | 6h |
| 3.6 | **Tier-based unlock** — integrate with forum subscription tiers | `apps/backend/lib/cgraph/creators/content_gate.ex` (extend) | P1 | 4h |
| 3.7 | **Forum monetization modes** — Replace `monetization_enabled` boolean with `monetization_type` enum (`free`, `gated`, `hybrid`) | `apps/backend/lib/cgraph/forums/forum.ex` + migration | P1 | 4h |
| 3.8 | **Forum Node tiers** — Up to 3 tiers per forum with Node pricing (`forum_subscription_tiers` table) | `apps/backend/lib/cgraph/creators/forum_subscription_tier.ex` + migration | P1 | 8h |
| 3.9 | **Forum Node subscription flow** — Subscribe via Nodes (not just Stripe) | `apps/backend/lib/cgraph/creators/paid_subscription.ex` (extend) | P1 | 6h |
| 3.10 | **Boosts — Schema** (`boosts` table: boostable_type, boostable_id, user_id, node_cost, duration_hours, expires_at) | `apps/backend/lib/cgraph/nodes/boost.ex` + migration | P1 | 4h |
| 3.11 | **Boosts — API** (`POST /forums/:id/boost`, `POST /threads/:id/boost`, `POST /profiles/spotlight`) | `apps/backend/lib/cgraph_web/controllers/api/v1/boost_controller.ex` | P1 | 6h |
| 3.12 | **Boosts — Discovery integration** — Boosted items get score multiplier in Pulse/Discovery feeds | `apps/backend/lib/cgraph/discovery/` (modify) | P2 | 6h |
| 3.13 | **Boost guardrails** — Max boosts/day per user, reputation gating, organic score floor | `apps/backend/lib/cgraph/nodes/boost.ex` (extend) | P2 | 3h |
| 3.14 | **KYC threshold enforcement** — require verification at €500 lifetime earnings | `apps/backend/lib/cgraph/creators/kyc_enforcement.ex` | P2 | 6h |
| 3.15 | **AML flagging** — suspicious pattern detection (circular tips, high-frequency same-pair tips) | `apps/backend/lib/cgraph/nodes/aml_monitor.ex` | P2 | 8h |
| 3.16 | **Tax receipt generation** — monthly/yearly earnings PDF per creator | `apps/backend/lib/cgraph/creators/tax_receipts.ex` | P2 | 8h |
| 3.17 | **Payout processing worker** (Oban, weekly) | `apps/backend/lib/cgraph/workers/payout_processing_worker.ex` | P2 | 4h |

### 7.2 Web Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 3.18 | **Paid DM file UI** — "Sell this file" toggle on attachment, price input, license notes | `apps/web/src/modules/messaging/components/paid-file-toggle.tsx` | P0 | 8h |
| 3.19 | **Paid file unlock UI** — "Unlock for X Nodes" button in DM messages | `apps/web/src/modules/messaging/components/paid-file-unlock.tsx` | P0 | 6h |
| 3.20 | **Content gating admin** — Set gate type, price, duration on thread creation/edit | `apps/web/src/modules/forums/components/content-gate-settings.tsx` | P1 | 6h |
| 3.21 | **Forum monetization settings** — 3 modes + tier editor | `apps/web/src/modules/forums/components/monetization-settings.tsx` | P1 | 8h |
| 3.22 | **Boost UI** — "Boost" button on forums/threads, spotlight button on profile | `apps/web/src/modules/nodes/components/boost-button.tsx`, `boost-modal.tsx` | P1 | 6h |
| 3.23 | **Creator tax receipts UI** — Download monthly/yearly reports | `apps/web/src/pages/creator/tax-receipts.tsx` | P2 | 4h |

### 7.3 Mobile Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 3.24 | **Paid file attachment** — "Sell" toggle in DM file picker | `apps/mobile/src/components/paid-file-toggle.tsx` | P1 | 6h |
| 3.25 | **Paid file unlock** — "Unlock for X Nodes" in DM | `apps/mobile/src/components/paid-file-unlock.tsx` | P1 | 4h |
| 3.26 | **Boost button** (forum/thread long-press) | `apps/mobile/src/components/boost-button.tsx` | P2 | 4h |
| 3.27 | **Creator dashboard screen** | `apps/mobile/src/screens/creator/dashboard-screen.tsx` | P2 | 8h |

### Phase 3 Totals

- **Backend:** 17 tasks, ~87h
- **Web:** 6 tasks, ~38h
- **Mobile:** 4 tasks, ~22h
- **Total:** 27 tasks, ~147h (≈3.7 weeks)

---

## 8. Phase 4: Forum Transformation (v1.4 — Q1 2027)

**Goal:** Forums evolve from Reddit-like to enterprise-grade with identity cards, 10 themes, thread tags, consolidated reputation, and full mobile parity.

### 8.1 Backend Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 4.1 | **Identity card rendering** — `user_nameplate_snapshot` JSONB on `thread_posts` (border, badge IDs, title, nameplate) | `apps/backend/lib/cgraph/forums/thread_post.ex` + migration | P0 | 4h |
| 4.2 | **Snapshot population** — On post creation, snapshot user's active cosmetics | `apps/backend/lib/cgraph/forums/thread_posts.ex` (extend) | P0 | 4h |
| 4.3 | **Thread tags schema** (`forum_thread_tags` table: thread_id, tag_name, color, unique constraint) | `apps/backend/lib/cgraph/forums/thread_tag.ex` + migration | P1 | 4h |
| 4.4 | **Thread tag API** (CRUD on threads) | `apps/backend/lib/cgraph_web/controllers/api/v1/thread_tag_controller.ex` | P1 | 3h |
| 4.5 | **Consolidate reputation** — Create `user_reputation_scores` view or materialized table from `forum_members` + `reputation_entries` + `forum_ranks` | `apps/backend/lib/cgraph/forums/user_reputation_score.ex` + migration | P1 | 6h |
| 4.6 | **Add `helpful_votes` + `reputation_level`** to consolidated model | Part of 4.5 | P1 | 2h |
| 4.7 | **Seed 10 forum themes** (Neon Cyber, Royal Gold, Midnight Ocean, Sakura Blossom, Lava Flow, Forest Mist, Retro Arcade, Ethereal Dream, Cyberpunk Metro, Zen Garden) | `apps/backend/priv/repo/seeds/seed_forum_themes.exs` | P0 | 8h |
| 4.8 | **Forum theme CSS variables** — Convert theme colors to `css_custom_properties` format | Part of 4.7 | P0 | 4h |
| 4.9 | **Reputation-linked Node rewards** — Milestone system (100 helpful votes → 100 Nodes) | `apps/backend/lib/cgraph/gamification/reputation_rewards.ex` | P2 | 6h |

### 8.2 Web Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 4.10 | **Identity card component** — Renders nameplate + badges + title + reputation on post | `apps/web/src/modules/forums/components/identity-card/` | P0 | 12h |
| 4.11 | **Integrate identity card in post view** | `apps/web/src/modules/forums/components/thread-view/` (modify) | P0 | 4h |
| 4.12 | **Thread tag picker** — Add/remove tags on threads | `apps/web/src/modules/forums/components/thread-tag-picker.tsx` | P1 | 4h |
| 4.13 | **Thread tag filter** — Filter threads by tag | `apps/web/src/modules/forums/components/thread-tag-filter.tsx` | P1 | 3h |
| 4.14 | **Forum theme gallery** — 10-theme selector for forum admins | `apps/web/src/modules/forums/components/forum-theme-gallery.tsx` | P0 | 6h |
| 4.15 | **Reputation display widget** — Show reputation level + rank on user hover/card | `apps/web/src/modules/forums/components/reputation-widget.tsx` | P1 | 4h |

### 8.3 Mobile Tasks

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 4.16 | **Forum WebSocket channels** (3: forum, board, thread) | `apps/mobile/src/hooks/useForumChannel.ts`, `useBoardChannel.ts`, `useThreadChannel.ts` | P0 | 12h |
| 4.17 | **Identity card component (mobile)** | `apps/mobile/src/components/forum/identity-card.tsx` | P0 | 8h |
| 4.18 | **Threaded comment tree** (upgrade from flat) | `apps/mobile/src/components/forum/threaded-comments.tsx` | P1 | 8h |
| 4.19 | **BBCode editor integration** | `apps/mobile/src/components/forum/bbcode-editor.tsx` | P2 | 8h |
| 4.20 | **Forum announcements display** | `apps/mobile/src/components/forum/announcement-banner.tsx` | P2 | 4h |
| 4.21 | **Forum theme gallery (mobile)** | `apps/mobile/src/screens/forums/forum-theme-picker-screen.tsx` | P1 | 6h |
| 4.22 | **Thread tags display + filter** | `apps/mobile/src/components/forum/thread-tags.tsx` | P2 | 4h |
| 4.23 | **Reputation display (mobile)** | `apps/mobile/src/components/forum/reputation-badge.tsx` | P2 | 3h |
| 4.24 | **RSS feeds (mobile)** | `apps/mobile/src/screens/forums/rss-screen.tsx` | P2 | 4h |

### Phase 4 Totals

- **Backend:** 9 tasks, ~41h
- **Web:** 6 tasks, ~33h
- **Mobile:** 9 tasks, ~57h
- **Total:** 24 tasks, ~131h (≈3.3 weeks)

---

## 9. Phase 5: Infrastructure Scaling (v1.5 — Q2 2027)

**Goal:** Scale from 100K to 1M+ concurrent users. Database sharding, 3-tier caching, archival, queue optimization.

### 9.1 Database Sharding

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 5.1 | **`Repo.Router` module** — `get_shard/1` with `rem(forum_id, 16)` | `apps/backend/lib/cgraph/repo/router.ex` | P0 | 8h |
| 5.2 | **`Repo.ShardN` dynamic repos** (16 repos) | `apps/backend/lib/cgraph/repo/shards.ex` | P0 | 8h |
| 5.3 | **Forum context shard-aware queries** — Route all forum reads/writes through shard router | All `CGraph.Forums.*` modules | P0 | 24h |
| 5.4 | **Cosmetics DB separation** — Dedicated replicated Postgres instance for cosmetics | Infrastructure + Ecto config | P1 | 8h |
| 5.5 | **Read replica configuration** — 3 replicas per shard via Fly multi-region | `apps/backend/config/runtime.exs` + fly.toml | P1 | 8h |
| 5.6 | **Connection pool expansion** (300 → 800) | Config changes | P1 | 2h |

### 9.2 Caching Layer

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 5.7 | **ETS cosmetics cache** (TTL 1hr, ~500MB) | `apps/backend/lib/cgraph/cosmetics/cache.ex` | P0 | 8h |
| 5.8 | **Redis forum data cache** (TTL 5min) — boards, threads, top posts | `apps/backend/lib/cgraph/forums/redis_cache.ex` | P0 | 8h |
| 5.9 | **Cache invalidation events** — Event-driven invalidation on post/thread/board changes | `apps/backend/lib/cgraph/forums/cache_invalidation.ex` | P0 | 6h |
| 5.10 | **Cache warming on startup** | `apps/backend/lib/cgraph/cosmetics/cache_warmer.ex` | P2 | 3h |

### 9.3 Archival & Storage Tiers

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 5.11 | **TimescaleDB integration** — Hypertable for posts 30-90 days old | `apps/backend/lib/cgraph/archival/timescale_adapter.ex` + config | P1 | 12h |
| 5.12 | **S3 cold archival worker** — Posts > 90 days → Parquet files on S3 | `apps/backend/lib/cgraph/workers/cold_archival_worker.ex` | P2 | 8h |
| 5.13 | **Transparent query routing** — Auto-route to hot/warm/cold storage by post age | `apps/backend/lib/cgraph/archival/query_router.ex` | P1 | 8h |
| 5.14 | **Forum post archival worker** (Oban, nightly) | `apps/backend/lib/cgraph/workers/forum_archival_worker.ex` | P1 | 4h |

### 9.4 Queue Optimization

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 5.15 | **Dedicated Oban queues** — `forum_notifications:50`, `forum_indexing:20`, `cosmetics_processing:10`, `analytics:10` | `apps/backend/config/config.exs` | P1 | 2h |
| 5.16 | **Forum notification worker** (high-concurrency) | `apps/backend/lib/cgraph/workers/forum_notification_worker.ex` | P1 | 4h |
| 5.17 | **Selective Meilisearch indexer** — Only index "important" posts (score > threshold) | `apps/backend/lib/cgraph/workers/selective_search_indexer.ex` | P2 | 6h |

### 9.5 Presence Optimization

| # | Task | Files | Priority | Est. |
|:-:|------|-------|:--------:|:----:|
| 5.18 | **Sharded presence** — Partition presence by forum/channel, reduce cross-shard chatter | `apps/backend/lib/cgraph/presence/sharded.ex` | P1 | 8h |
| 5.19 | **Presence batching** — Batch presence diffs to reduce WebSocket frame count | `apps/backend/lib/cgraph/presence/batcher.ex` | P2 | 6h |

### Phase 5 Totals

- **Backend/Infra:** 19 tasks, ~141h
- **Total:** 19 tasks, ~141h (≈3.5 weeks)

---

## 10. Phase 6: Enterprise + Desktop (v2.0 — H2 2027)

**Goal:** Enterprise features, self-hosting, SSO, admin console, desktop apps.

### 10.1 Tasks (High-Level — Detailed Planning in Q1 2027)

| # | Task | Priority | Est. |
|:-:|------|:--------:|:----:|
| 6.1 | **Admin console** — Organization management, user management, analytics dashboard | P0 | 80h |
| 6.2 | **SSO integration** — SAML 2.0 + OIDC for enterprise customers | P0 | 40h |
| 6.3 | **Self-hosting package** — Docker Compose + Helm chart + documentation | P1 | 40h |
| 6.4 | **Desktop apps** — Electron or Tauri wrapper for web app | P1 | 60h |
| 6.5 | **Audit logging** — Enterprise-grade activity logs with export | P1 | 24h |
| 6.6 | **Data residency controls** — Choose data region (EU/US/APAC) | P2 | 30h |
| 6.7 | **Custom branding** — White-label option for enterprise | P2 | 20h |
| 6.8 | **API rate limiting tiers** — Free/Pro/Enterprise with different limits | P1 | 12h |

### Phase 6 Totals

- **Total:** 8 tasks, ~306h (≈7.7 weeks)

---

## 11. Cross-Cutting Concerns

### 11.1 Testing Strategy

| Phase | Testing Requirements |
|-------|---------------------|
| All | Unit tests for every new Elixir module (ExUnit, minimum 80% coverage) |
| All | Integration tests for every new API endpoint |
| Phase 1 | Mobile E2E tests for Nodes flow (Detox) |
| Phase 2 | Unlock engine property-based tests (StreamData) |
| Phase 3 | Financial transaction tests (double-entry bookkeeping assertions) |
| Phase 5 | Load tests at 100K/500K/1M simulated users (k6 or Locust) |

### 11.2 Migration Strategy

| Concern | Approach |
|---------|----------|
| DB migrations | Always backwards-compatible. No column drops without 2-release deprecation |
| API versioning | New endpoints under `/api/v1/`. Breaking changes get `/api/v2/` prefix |
| Feature flags | Use `FunWithFlags` (already in project) for all new features |
| Rollback plan | Every migration has a `down/0`. Every feature flag defaults to `off` |

### 11.3 Shared Package Updates

| Package | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|:-------:|:-------:|:-------:|:-------:|
| `@cgraph/shared-types` | Nodes types | Cosmetics types | Creator types | Forum types |
| `@cgraph/api-client` | Nodes API | Cosmetics API | Creator API | Forum API |
| `@cgraph/animation-constants` | — | 45 nameplates, unified registries | — | 10 theme presets |
| `@cgraph/socket` | — | — | — | Mobile forum channels |

### 11.4 Documentation Updates

| Document | When to Update |
|----------|---------------|
| `docs/API_DOCUMENTATION.md` | Every phase (new endpoints) |
| `docs/ARCHITECTURE_DIAGRAMS.md` | Phase 2 (unlock engine), Phase 5 (sharding) |
| `docs/ROADMAP.md` | After each phase ships |
| `.gsd/codebase/STRUCTURE.md` | After each phase (new files/modules) |
| `.gsd/codebase/ARCHITECTURE.md` | Phase 5 (infrastructure transformation) |

---

## 12. Risk Matrix

| Risk | Phase | Probability | Impact | Mitigation |
|------|:-----:|:-----------:|:------:|------------|
| Unlock engine complexity explosion | 2 | 🟠 | 🔴 | Start with 3 simple evaluators (message count, post count, friend count). Add rest incrementally |
| Mobile Secret Chat crypto bugs | 1 | 🟠 | 🔴 | Port web implementation directly. Property-based testing on key exchange |
| Sharding breaks existing queries | 5 | 🟡 | 🔴 | Build shard router with test mode (single DB, shard-aware queries). Migrate gradually |
| Forum monetization → Stripe compliance | 3 | 🟡 | 🟠 | Legal review before launch. Start with Nodes-only (no fiat tiers initially) |
| Paid DM files → abuse/scam vector | 3 | 🟠 | 🟠 | Report/flag system, category tags, mod review queue, purchase limits |
| Boost system → pay-to-win perception | 3 | 🟡 | 🟡 | Organic score floor (boosts influence but don't override quality). Transparent "Boosted" label |
| Rarity inconsistency during migration | 2 | 🟡 | 🟡 | Single migration that normalizes ALL existing cosmetics to 7-tier system atomically |
| TimescaleDB operational complexity | 5 | 🟡 | 🟡 | Start with simple partitioning. Full hypertable conversion in Phase 5.1 |

---

## 13. Success Metrics

### Phase 1 (v1.1) — Parity

| Metric | Target |
|--------|--------|
| Mobile Nodes adoption | 30% of mobile users have wallet balance within 60 days |
| Mobile tip volume | 10% of all tips originate from mobile within 30 days |
| Discovery engagement (mobile) | 25% of mobile users try at least 2 feed modes |
| Feature parity score | Mobile reaches 85% of web functionality (from current ~65%) |

### Phase 2 (v1.2) — Cosmetics

| Metric | Target |
|--------|--------|
| Unlock engine activations | 10,000 cosmetics auto-unlocked in first month |
| Cosmetics engagement | 40% of users equip a non-default border or title |
| API returns data | `/api/v1/cosmetics/*` endpoints return > 100 items each |
| Rarity consistency | 100% of cosmetics use the 7-tier system |

### Phase 3 (v1.3) — Creator Economy

| Metric | Target |
|--------|--------|
| Paid DM file transactions | 500+ unlock transactions in first month |
| Forum monetization | 50+ forums with paid tiers active |
| Boost revenue | $5K MRR from boosts within 90 days |
| Creator payouts | $10K total creator payouts within 90 days |

### Phase 4 (v1.4) — Forum Transformation

| Metric | Target |
|--------|--------|
| Identity card visibility | 100% of forum posts render identity cards |
| Theme adoption | 30% of forums use a non-default theme |
| Thread tags usage | 50% of new threads have at least 1 tag |
| Mobile forum sockets | Real-time updates on 100% of mobile forum views |

### Phase 5 (v1.5) — Infrastructure

| Metric | Target |
|--------|--------|
| P99 latency (forum reads) | < 200ms |
| Concurrent users supported | 1M+ |
| Cache hit rate | > 90% for cosmetics, > 75% for forum data |
| Archival efficiency | 30+ day posts auto-archived, < 100ms retrieval |

---

## Appendix A: Total Effort Summary

| Phase | Tasks | Estimated Hours | Calendar Weeks (40h/wk) |
|-------|:-----:|:---------------:|:----------------------:|
| Phase 1: Parity + Mobile Nodes | 33 | 175h | 4.4 |
| Phase 2: Cosmetics + Unlock Engine | 35 | 161h | 4.0 |
| Phase 3: Creator Economy | 27 | 147h | 3.7 |
| Phase 4: Forum Transformation | 24 | 131h | 3.3 |
| Phase 5: Infrastructure Scaling | 19 | 141h | 3.5 |
| Phase 6: Enterprise | 8 | 306h | 7.7 |
| **Total** | **146** | **1,061h** | **26.5 weeks** |

## Appendix B: Dependency Graph

```
Phase 1 (Parity)
  └──→ Phase 2 (Cosmetics)
         ├──→ Phase 3 (Creator Economy) ──→ Phase 4 (Forum Transformation)
         │                                        │
         └────────────────────────────────────────→ Phase 5 (Infrastructure)
                                                           │
                                                           └──→ Phase 6 (Enterprise)
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 5
**Parallelizable:** Phase 3 and Phase 4 can run concurrently after Phase 2 completes.

## Appendix C: File Inventory (New Files Required)

| Phase | New Backend Files | New Web Files | New Mobile Files | New Shared Files | Total |
|-------|:-----------------:|:-------------:|:----------------:|:----------------:|:-----:|
| 1 | 4 | 5 | 18 | 2 | 29 |
| 2 | 20 | 4 | 4 | 2 | 30 |
| 3 | 14 | 6 | 4 | 0 | 24 |
| 4 | 5 | 6 | 9 | 0 | 20 |
| 5 | 15 | 0 | 0 | 0 | 15 |
| 6 | TBD | TBD | TBD | TBD | TBD |
| **Total** | **58** | **21** | **35** | **4** | **118** |
