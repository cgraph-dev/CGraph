# Phase 16 Discovery: Gamification

> Generated: 2026-03-02 | Depth: Level 2 (Standard) | Confidence: HIGH

## Summary

Phase 16 builds on a **massively pre-built gamification system** (~350+ files, ~43,000+ lines). The backend has complete contexts, schemas, controllers, and routes for all 12 requirements. The web has full component/store/page infrastructure. The mobile has screens, stores, and services. **This is an integration & activation phase, not a build-from-scratch phase.**

### Key Insight

The gamification system's architecture is complete. What's missing is the **event integration layer** — the glue that connects real user actions (messaging, forum posts, social interactions) to the XP/coin/achievement/quest engines. Additionally, progressive disclosure (GAME-09) needs implementation, animated border rendering needs performance optimization (GAME-11), and titles need propagation throughout the app (GAME-12).

**Pattern:** Identical to Phase 15 where backend was 85-90% complete and primary work was frontend wiring + admin UIs. Here, both backend AND frontend exist — primary work is **event wiring + feature activation + cross-cutting integration**.

---

## Existing Infrastructure Inventory

### Backend (Elixir/Phoenix) — ~9,200 lines

| System | Module | LOC | Status |
|--------|--------|-----|--------|
| XP Engine | `Gamification` facade + `award_xp/award_coins/spend_coins` | 454 | Working — polynomial curve, multipliers, SELECT FOR UPDATE |
| Achievements | `AchievementSystem` + `AchievementRepository` | 311 | Working — progress tracking, unlock, level-based checks |
| Quests | `QuestSystem` | 147 | Working — list/accept/progress/claim |
| Titles | `TitleShopSystem` | 181 | Working — equip/unequip/purchase |
| Leaderboard | `Leaderboard` + `LeaderboardSystem` | 556 | Working — Redis sorted-sets, cursor pagination, DB fallback |
| Currency | `CurrencySystem` | 52 | Working — generic add/deduct |
| Events | `EventSystem` + `Events` (Crud/Content/Participation) | 879 | Working — seasonal events, battle pass tiers |
| Marketplace | `Marketplace` | 224 | Working — CRUD, pagination |
| Cosmetics | `AvatarBorder`, `ProfileTheme`, `ChatEffect` schemas | ~500 | Working — 22 themes, 12 animation types, 30+ effects |
| Prestige | `UserPrestige` + `PrestigeReward` | ~200 | Working — prestige levels, bonuses |
| Controllers | 10 controllers + 2 admin controllers + channel | ~4,550 | Working — ~60+ routes |
| Migrations | 13 migrations | — | Applied |

### Web (React 19) — ~25,120 lines

| Area | Components | LOC | Status |
|------|-----------|-----|--------|
| Achievement display | 6 components | 1,272 | Built |
| Achievement notification | Toast/popup | 153 | Built |
| Badges | 4 components (animated, collection, picker, showcase) | 2,184 | Built |
| Daily rewards | 3 components | 957 | Built |
| Events/Battle pass | 5 components (tiers, banner, themes, milestones) | 2,263 | Built |
| Leaderboard widget | 4 components + full page | 813 | Built |
| Level-up modal | Particles + rewards | 315 | Built |
| Marketplace | 5 components + page | 965 | Built |
| Price history chart | SVG visualization | 869 | Built |
| Quest panel | Full/compact panels | 778 | Built |
| Referral dashboard | 4 components | 871 | Built |
| Streak tracker | Fire animation + calendar | 805 | Built |
| Title badge | Display + animations | 894 | Built |
| User stars | Tier badges + crowns | 793 | Built |
| Stores | 15+ files (gamification, avatarBorder, marketplace, prestige, seasonal, referral) | ~2,800 | Built |
| Socket integration | `useGamificationSocket` + socket store | 512 | Built |
| Pages | Hub, achievements, quests, coin-shop, leaderboard | ~1,500 | Built |

### Mobile (React Native) — ~8,602 lines

| Area | Files | LOC | Status |
|------|-------|-----|--------|
| Components | Level progress, level-up modal, quest panel, achievement notification, streak, title badge | ~3,000 | Built |
| Screens | Hub (7 sub), achievements (4), quests (4), titles (4) | ~4,500 | Built |
| Store + service | gamificationStore + gamificationService | ~800 | Built |
| Feature module | Barrel exports | ~300 | Built |

### Shared Types — GAP

- `packages/shared-types/src/forum-leaderboard.ts` (148L) exists
- **No `packages/shared-types/src/gamification.ts`** — types scattered across web module types

---

## Gap Analysis by Requirement

### GAME-01: XP from Actions (Daily Caps) — ~80% Built

**What exists:** Full XP engine with `award_xp`, polynomial level curve, XP multipliers (premium 2x, enterprise 3x), `XpTransaction` logging, 16 source types.

**What's missing:**
- **Event integration layer** — No code triggers `award_xp` when users send messages, create threads, add friends, etc.
- **Daily cap enforcement** — `award_xp` doesn't check daily limits
- **Diminishing returns** — No exponential decay for repeated same-action XP
- **Real-time XP bar update** — Socket channel exists but needs trigger points

### GAME-02: Achievement Milestones — ~75% Built

**What exists:** `AchievementSystem` with 6 categories, 6 rarity tiers, progress tracking, unlock flow, level-based auto-checks, `AchievementRepository`.

**What's missing:**
- **Milestone trigger events** — No event handlers that check "user sent 100th message → unlock achievement"
- **Achievement seed data** — Need 30+ achievements covering all categories
- **Progressive achievement chains** — Bronze → Silver → Gold → Platinum for same activity

### GAME-03: Daily/Weekly Quests — ~70% Built

**What exists:** `QuestSystem` with 5 quest types, objective map tracking, accept/claim flow, controller routes.

**What's missing:**
- **Quest rotation worker** — No Oban job to generate/rotate daily/weekly quests
- **Quest seed data** — Need 20+ quest templates
- **Objective tracking hooks** — Quest progress doesn't update when actions happen
- **Quest notification** — No push/toast when new quests available

### GAME-04: Leaderboards — ~85% Built

**What exists:** Redis sorted-set leaderboard (313 LOC), 7 categories, cursor pagination, DB fallback, web widget (813 LOC), leaderboard page.

**What's missing:**
- **Per-group leaderboards** — Current is global only, needs group scoping
- **Per-forum leaderboards** — Phase 15-05 built ranking bridge, needs full integration
- **Real-time position updates** — Socket broadcast on rank changes

### GAME-05: Battle Pass — ~85% Built

**What exists:** Full `EventSystem` with seasonal events, `BattlePassTier` schema, `UserEventProgress`, event controller (326 LOC), admin controller (441 LOC), web event components (2,263 LOC).

**What's missing:**
- **Seasonal event lifecycle automation** — No Oban worker for event start/end
- **Battle pass XP from game actions** — Event progress needs action triggers
- **Premium pass purchase flow** — Controller exists but needs Stripe/IAP prep hook

### GAME-06: Virtual Currency — ~90% Built

**What exists:** Full coin system with `award_coins`/`spend_coins` (SELECT FOR UPDATE for race conditions), `CoinTransaction` logging, shop items (5 categories), coin controller + routes, web coin-shop page.

**What's missing:**
- **Coin earn triggers** — No wiring from user actions to coin awards
- **Daily coin cap** — No enforcement
- **Coin reward confirmation UI** — Toast/animation for coin earnings

### GAME-07: Cosmetics — ~90% Built

**What exists:** 3 cosmetic types (150+ border styles, 23 theme presets, 30+ chat effects), user ownership schemas, cosmetics controller (442 LOC), web stores.

**What's missing:**
- **Cosmetic preview before purchase** — UI for try-before-buy
- **Cosmetic showcase on profile** — Display equipped cosmetics prominently

### GAME-08: Marketplace — ~85% Built

**What exists:** `Marketplace` context (224 LOC), `MarketplaceItem` schema with dynamic pricing, marketplace controller (366 LOC), admin controller (381 LOC), web marketplace page (965 LOC) + price history chart (869 LOC).

**What's missing:**
- **Listing creation flow** — End-to-end: select owned cosmetic → set price → list
- **Purchase transaction** — Coin deduction + ownership transfer atomically
- **Trade history** — Log of all marketplace trades per user

### GAME-09: Progressive Disclosure — NOT BUILT

**What's missing (everything):**
- **Level-gated feature map** — Define which features unlock at which levels
- **Backend level check middleware** — Return 403 for level-locked endpoints
- **Frontend feature gate component** — `<LevelGate level={10}>` wrapper
- **Unlock notification** — "You unlocked the Marketplace!" toast at threshold
- **Gradual UI reveal** — Sidebar/nav items appear as levels increase

### GAME-10: Forum XP — ~60% Built

**What exists:** Phase 15-05 built ranking/gamification bridge with Oban scheduler, rank images, leaderboard pages. `XpTransaction` has forum-related source types.

**What's missing:**
- **Forum action → XP triggers** — Creating threads, posting, receiving upvotes → XP
- **Forum-specific leaderboard** — Per-board leaderboard page with XP rankings
- **Forum activity multipliers** — Bonus XP for high-quality posts (upvotes threshold)

### GAME-11: Animated Borders (Performant) — ~70% Built

**What exists:** `AvatarBorder` schema with 12 animation types, web avatar border store (146 LOC) + actions (309 LOC) + getters (164 LOC).

**What's missing:**
- **CSS animation implementation** — Actual keyframe animations for 12 types
- **Performance optimization** — `will-change`, `contain: layout`, reduced motion, `requestAnimationFrame` for complex animations
- **Avatar component integration** — Render borders on all avatar instances app-wide
- **Mobile native animations** — Reanimated/Skia for smooth mobile rendering

### GAME-12: Equippable Titles — ~75% Built

**What exists:** `TitleShopSystem` with equip/unequip/purchase, 7 rarity tiers, web title-badge component (894 LOC).

**What's missing:**
- **Title display propagation** — Show equipped title in: message bubbles, profile cards, leaderboard entries, forum posts, member lists
- **Title color rendering** — Titles have color field but need styled display
- **Title unlock notifications** — Toast when new title earned

---

## Dependency Map

```
GAME-01 (XP Engine)  ──────────┐
GAME-06 (Coins)      ──────────┤
                                ├──→ GAME-09 (Progressive Disclosure) ──→ GAME-08 (Marketplace)
GAME-02 (Achievements) ────────┤
GAME-03 (Quests) ──────────────┤
GAME-10 (Forum XP) ────────────┘

GAME-04 (Leaderboards) ← depends on GAME-01

GAME-05 (Battle Pass) ← depends on GAME-01, GAME-03

GAME-07 (Cosmetics) ← standalone
GAME-11 (Animated Borders) ← depends on GAME-07
GAME-12 (Titles) ← standalone
```

## Plan Recommendation

**5 plans, 2 waves:**

| Plan | Wave | Scope | Requirements |
|------|------|-------|--------------|
| 16-01 | 1 | XP event pipeline + daily caps + forum XP triggers | GAME-01, GAME-10 |
| 16-02 | 1 | Achievement triggers + quest rotation + objective tracking | GAME-02, GAME-03 |
| 16-03 | 1 | Shared types + progressive disclosure system | GAME-09, types |
| 16-04 | 2 | Leaderboard scoping + battle pass activation + marketplace wiring | GAME-04, GAME-05, GAME-06, GAME-08 |
| 16-05 | 2 | Cosmetics rendering + animated borders (perf) + title display propagation | GAME-07, GAME-11, GAME-12 |

**Rationale:** Wave 1 establishes the action→reward pipeline (XP/coins flowing, quests tracking, progressive disclosure gating). Wave 2 builds on top for leaderboards (need XP data), battle pass (needs quest infra), marketplace (needs coins flowing + progressive disclosure), and cosmetics rendering (standalone but needs full context).
