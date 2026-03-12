# CGraph Product Roadmap

> **Version:** 1.0.0 | **Last Updated:** March 11, 2026 | **Status:** v1.0.0 Shipped → Building
> toward v2.0

---

## Vision Statement

CGraph is the **most trusted collaboration platform** for communities, teams, and creators—combining
real-time communication with **end-to-end encryption by default**, a **full creator economy
(Nodes)**, **enterprise-grade forums**, and **MOBA-inspired cosmetic identity** that persists across
every surface.

**Target state** (defined by 4 design documents):

- [WEB_MOBILE_FEATURE_MAP.md](../.gsd/codebase/WEB_MOBILE_FEATURE_MAP.md) — Web/mobile parity
  alignment
- [Nodes Economy Design](../.gsd/codebase/Nodes%20are%20already%20a%20solid.txt) — Full
  creator/consumer economy
- [Forums Next-Gen Plan](../.gsd/codebase/CGRAPH-FORUMS-NEXT-GEN-PLAN.md) — Enterprise forum
  transformation + 340 cosmetics
- [Forums Infrastructure](../.gsd/codebase/CGRAPH-FORUMS-INFRASTRUCTURE.md) — 1M+ user scaling
  architecture
- [Complete Cosmetics System](../.gsd/codebase/CGraph%20Complete%20Cosmetics.txt) — Unlock
  conditions for every cosmetic

---

## Release Timeline

```
       2026                                              2027
┌──────────────────────────────────────────────────┬─────────────────────────────────────┐
│ Q1 2026        │ Q1 2026        │ Q1 2026        │ Q1 2026    │ Q1 2026    │ H2 2027  │
├────────────────┼────────────────┼────────────────┼────────────┼────────────┼──────────┤
│ v1.1 ✅        │ v1.2 ✅        │ v1.3 ✅        │ v1.4 ✅    │ v1.5 ✅    │ v2.0     │
│ Parity +       │ Cosmetics +    │ Creator        │ Forum      │ Infra      │ Enter-   │
│ Mobile Nodes   │ Unlock Engine  │ Economy        │ Transform  │ Scale      │ prise    │
│ (Phase 34)     │ (Phase 33+35)  │ (Phase 36)     │ (Phase 37) │ (Phase 38) │          │
│                │                │                │            │            │          │
│ ✅ Mobile      │ ✅ Rarity sys  │ ✅ Paid DM     │ ✅ Identity│ ✅ DB      │ • Admin  │
│   Nodes+SC+Disc│ ✅ 325 items   │   files        │   cards    │   shard-   │   con-   │
│ ✅ Web parity  │ ✅ Badge sys   │ ✅ Forum       │ ✅ Tags    │   ing      │   sole   │
│ ✅ Privacy 15  │ ✅ Nameplate   │   monetize     │ ✅ Custom  │ ✅ 3-tier  │ • SSO    │
│   toggles      │ ✅ Unlock eng  │ ✅ Boosts      │   forums   │   cache    │ • Self   │
│ ✅ API unify   │   5 evaluators │ ✅ Compliance  │ ✅ Mod log │ ✅ 1M+     │   host   │
│                │ ✅ Nodes shop  │ ✅ Creator $   │ ✅ Perms   │   users    │ • Desk-  │
│                │                │                │   21 flags │            │   top    │
└────────────────┴────────────────┴────────────────┴────────────┴────────────┴──────────┘
```

---

## v1.0.0 — Shipped (March 2026)

> **All 69 planned features shipped (100%).** 3 major capabilities added in v0.9.33–v0.9.34 (AI
> Service, CRDT Collaboration, Offline-First Mobile). Composite score: 8.7/10. All repo-facing files
> at v1.0.0. GitHub metadata updated. Codebase docs audited (75 inaccuracies corrected).
>
> **Post v1.0 progress (Phases 33-38):** 6 additional phases shipped with 94 commits implementing
> Canonical Reconciliation, Web/Mobile Parity, Cosmetics + Unlock Engine, Creator Economy, Forum
> Transformation, and Infrastructure Scaling.

### ✅ Completed Features

| Category           | Feature                                              | Status     |
| ------------------ | ---------------------------------------------------- | ---------- |
| **Core Messaging** | Real-time channels                                   | ✅ Shipped |
|                    | Direct messages (E2EE)                               | ✅ Shipped |
|                    | Group DMs (E2EE)                                     | ✅ Shipped |
|                    | Message editing/deletion                             | ✅ Shipped |
|                    | Message forwarding/scheduling                        | ✅ Shipped |
| **Voice/Video**    | Voice channels, video, screenshare                   | ✅ Shipped |
| **Security**       | E2EE (Triple Ratchet / PQXDH)                        | ✅ Shipped |
|                    | Device verification + safety numbers                 | ✅ Shipped |
| **Media**          | Files, GIFs, image previews                          | ✅ Shipped |
| **Customization**  | Theme system + custom CSS                            | ✅ Shipped |
| **Forums**         | CRUD, boards, BBCode, polls, voting                  | ✅ Shipped |
|                    | Full-text search (tsvector)                          | ✅ Shipped |
|                    | Real-time board broadcasting                         | ✅ Shipped |
|                    | Discovery feed (5 ranked modes)                      | ✅ Shipped |
|                    | Content gating (thread-level)                        | ✅ Shipped |
| **Nodes**          | Wallet, bundles, tips, unlock, withdrawal (web only) | ✅ Shipped |
| **AI**             | Chat completion, summarize, moderate, sentiment      | ✅ Shipped |
| **Collaboration**  | CRDT document editing (Yjs) + presence               | ✅ Shipped |
| **Offline**        | WatermelonDB sync engine                             | ✅ Shipped |
| **Platform**       | Web app + Landing page                               | ✅ Shipped |
|                    | Mobile (React Native)                                | 🟡 Beta    |

### Known Gaps at v1.0.0

Identified by the Web/Mobile Feature Map audit — these drive the v1.1+ roadmap:

| Gap Category                   | Critical Items                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile zero implementation** | Nodes (entire module), Secret Chat, Discovery feed modes, Discovery frequency weights                                                                                      |
| **Mobile significant gaps**    | Forum real-time sockets, threaded comments, multi-quote, BBCode, chat effects, particle/background effects, 9 privacy toggles missing                                      |
| **Web missing from mobile**    | Friend favorites/nicknames, mutual friends/groups, user wall/timeline, pronouns, profile widgets, border picker (42 borders), undo/redo customization, theme export/import |
| **API divergence**             | Customization (bulk PATCH vs individual POST), profile (PATCH vs PUT), avatar upload (generic vs dedicated), cosmetics endpoints return `[]`                               |

---

## v1.1.0 — Web/Mobile Feature Parity + Mobile Nodes ✅ SHIPPED (Phase 34)

**Theme:** Close the critical platform gap. Mobile users get Nodes, Secret Chat, and Discovery. Web
gets mobile-only social features. APIs unified.

**Shipped:** March 2026 (26 commits: ad690db3…95b9058b)

### Mobile — Critical Missing (P0)

| Feature                        | Scope                                                                          | Priority | Source           |
| ------------------------------ | ------------------------------------------------------------------------------ | -------- | ---------------- |
| **Nodes wallet screen**        | Balance display, transaction history, "Buy Nodes" via Stripe mobile web        | P0       | Feature Map §2   |
| **Nodes tip button**           | Profile + DM message long-press → preset amounts (10/50/100/500)               | P0       | Nodes Economy §1 |
| **Nodes unlock button**        | Gated forum posts + DM files unlock flow                                       | P0       | Nodes Economy §7 |
| **Nodes shop**                 | Bundle grid (5 bundles), Stripe Checkout trigger                               | P1       | Feature Map §2   |
| **Nodes store + service**      | Zustand store + API service (mirror web's 7 endpoints)                         | P0       | Feature Map §2   |
| **Secret Chat module**         | Ghost mode, 12 themes, panic wipe, Triple Ratchet (PQXDH) via `@cgraph/crypto` | P0       | Feature Map §3   |
| **Discovery feed modes**       | 5 modes (Pulse/Fresh/Rising/Deep Cut/Frequency Surf) + `GET /api/v1/feed`      | P0       | Feature Map §5   |
| **Discovery frequency picker** | Topic multi-select grid with weight sliders (0-100)                            | P1       | Feature Map §5   |
| **Discovery store**            | `useDiscoveryStore` — active feed mode + community filter                      | P0       | Feature Map §5   |
| **Discovery settings screen**  | Frequency picker embedded in mobile settings                                   | P1       | Feature Map §5   |

### Mobile — Significant Gaps (P1)

| Feature                               | Scope                                                                                                                                                                               | Priority |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Chat effects store**                | Message effects, bubble styles, sound effects, emoji packs                                                                                                                          | P1       |
| **Chat bubble customization store**   | `useChatBubbleStore` equivalent                                                                                                                                                     | P1       |
| **Thread store**                      | `openThread`, `closeThread`, `fetchMoreReplies`, `sendThreadReply`                                                                                                                  | P1       |
| **Cross-conversation message search** | Search across all conversations (not per-screen)                                                                                                                                    | P1       |
| **E2EE key verification in chat**     | Full modal (currently only in settings)                                                                                                                                             | P1       |
| **Privacy toggles expansion**         | Add 9 missing fields: `showBio`, `showPostCount`, `showJoinDate`, `showLastActive`, `showSocialLinks`, `showActivity`, `showInMemberList`, `allowGroupInvites`, `profileVisibility` | P1       |
| **Enhanced conversation**             | WebGL shader backgrounds, AI themes (mobile-adapted)                                                                                                                                | P2       |

### Web — Catch Up to Mobile (P1)

| Feature                     | Scope                                                     | Priority |
| --------------------------- | --------------------------------------------------------- | -------- |
| **Friend favorites**        | `toggleFavoriteFriend`, `getFavoriteFriends` API + UI     | P1       |
| **Friend nicknames**        | `setFriendNickname` via PATCH + UI                        | P1       |
| **Mutual friends/groups**   | `getMutualFriends`, `getMutualGroups` API + UI on profile | P1       |
| **User wall/timeline**      | Post creation, like/comment on profile page               | P1       |
| **Pronouns**                | Profile row + settings field                              | P2       |
| **Profile widgets**         | Configurable widget slots on profile                      | P2       |
| **Customization undo/redo** | 50-deep undo/redo history in `useCustomizationStore`      | P2       |
| **Theme export/import**     | JSON format export/import                                 | P2       |

### API Unification (P0)

| Current Divergence                                                                                  | Unified Target                                                                    |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Web: `PATCH /api/v1/me/customizations` (bulk) vs Mobile: `POST /api/v1/users/me/badge` (individual) | Unified: support both patterns, same controller                                   |
| Web: `GET /api/v1/cosmetics/borders` (returns `[]`) vs Mobile: `GET /api/v1/users/me/badges`        | Unified: single `/api/v1/cosmetics/:type` + `/api/v1/me/cosmetics/:type/equipped` |
| Web: `PATCH /api/v1/users/:id` vs Mobile: `PUT /api/v1/me`                                          | Unified: `PATCH /api/v1/me` for self, `GET /api/v1/users/:id` for others          |
| Web: `POST /api/v1/uploads` vs Mobile: `POST /api/v1/me/avatar`                                     | Keep both (generic + dedicated)                                                   |

### v1.1 Launch Checklist

- [x] Mobile Nodes wallet/shop/tip functional
- [x] Mobile Secret Chat operational with all 12 themes
- [x] Mobile Discovery shows 5 feed modes
- [x] Web friend favorites/nicknames/mutual working
- [x] Web user wall functional
- [x] API endpoints unified (no 404s cross-platform)
- [x] Privacy toggles aligned (15 fields both platforms)
- [ ] Mobile in TestFlight/Play Store (public beta)

---

## v1.2.0 — Cosmetics & Unlock Engine ✅ SHIPPED (Phase 33 + 35)

**Theme:** Every cosmetic gets a door. The rarity system, unlock conditions engine, and Nodes shop
turn the cosmetic wardrobe into a living economy. Cosmetics APIs stop returning `[]`.

**Shipped:** March 2026 (Phase 33: 15 commits c37878ef…789e5d60 + Phase 35: 18 commits
324f6a3d…26d95be6)

**Source:** Complete Cosmetics System design doc + Forums Next-Gen Plan §3

### Backend — Unlock Conditions Engine

| Task                                | Scope                                                                                                                                                                                                       | Priority |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Rarity system schema**            | 7 tiers (FREE/COMMON/UNCOMMON/RARE/EPIC/LEGENDARY/MYTHIC) as DB enum + color/label mapping                                                                                                                  | P0       |
| **`cosmetic_definitions` table**    | `id`, `type` (border/title/badge/nameplate/effect), `name`, `rarity`, `unlock_type` (activity/purchase/seasonal/exclusive), `unlock_condition` (JSONB), `nodes_price` (nullable), `is_limited`, `season_id` | P0       |
| **`user_cosmetic_inventory` table** | `user_id`, `cosmetic_id`, `acquired_at`, `acquisition_source`, `expires_at` (nullable)                                                                                                                      | P0       |
| **Unlock conditions evaluator**     | `CGraph.Cosmetics.UnlockEngine` — checks user activity against conditions, grants cosmetics                                                                                                                 | P0       |
| **Activity tracking hooks**         | Emit events on: message sent, post created, friend added, tip sent, forum created, voice hours, E2EE key verified, consecutive days, etc.                                                                   | P0       |
| **Cosmetics API population**        | `/api/v1/cosmetics/borders`, `/titles`, `/badges` return real data with rarity + unlock status per user                                                                                                     | P0       |

### Avatar Borders — 42 Borders, 7 Tracks

All 42 existing borders from `BorderPickerModal.tsx` get unlock conditions:

| Track                | Count | Examples                                                                   | Rarity Range         |
| -------------------- | ----- | -------------------------------------------------------------------------- | -------------------- |
| **Messaging/DM**     | 7     | First Contact (FREE) → Ghost Protocol (LEGENDARY, 90 days Secret Chat)     | FREE → LEGENDARY     |
| **Forum/Community**  | 8     | First Post (FREE) → Grand Architect (LEGENDARY, 3+ forums w/ 200+ members) | FREE → LEGENDARY     |
| **Group/Channel**    | 5     | Channel Lurker (COMMON) → Server Sovereign (LEGENDARY, 500+ member group)  | COMMON → LEGENDARY   |
| **Social**           | 5     | Friendly (COMMON, 10 friends) → Influencer (LEGENDARY, 50+ referrals)      | COMMON → LEGENDARY   |
| **Account/Security** | 5     | Verified (UNCOMMON) → Immortal (LEGENDARY, 2yr + zero violations)          | UNCOMMON → LEGENDARY |
| **Creator/Nodes**    | 5     | First Tip (COMMON) → Top Creator (EPIC, 50K Nodes earned)                  | COMMON → EPIC        |
| **Nodes Shop**       | 7     | Neon Surge (500N) → Celestial (8,000N MYTHIC, limited per season)          | RARE → MYTHIC        |

### Titles — 55 Total (Expanded from 30+)

| Track                | Count | Examples                                                                          |
| -------------------- | ----- | --------------------------------------------------------------------------------- |
| **Messaging/DM**     | 8     | "Newcomer" (FREE) → "Cipher" (EPIC, 25+ E2EE verifications + 90 days Secret Chat) |
| **Forum/Thread**     | 12    | "Lurker" (FREE) → "Grand Sage" (MYTHIC, top 10 all-time poster)                   |
| **Group/Channel**    | 8     | "Channel Hopper" (COMMON) → "Overlord" (LEGENDARY, 1K+ member group 1yr)          |
| **Social/Friends**   | 7     | "Friend" (COMMON) → "Influencer" (LEGENDARY, 50+ referrals + 500 friends)         |
| **Account/Security** | 5     | "New Account" (FREE) → "Immortal" (LEGENDARY, 3yr + zero violations)              |
| **Creator/Nodes**    | 8     | "Tipper" (COMMON) → "Tycoon" (MYTHIC, 500K+ Nodes earned)                         |
| **Seasonal**         | 4     | Quarterly rotation, time-limited                                                  |
| **Custom**           | 3     | User-created (moderated, profanity-filtered, RARE+ only)                          |

### Badges — 70 Total (Expanded from 40+)

| Category        | Count | Examples                                                                   |
| --------------- | ----- | -------------------------------------------------------------------------- |
| **Achievement** | 20    | First post, 100 posts, 1000 posts, Helpful contributor, Developer          |
| **Role-Based**  | 10    | Moderator, Admin, Verified Seller, Creator, VIP, Premium, Trusted          |
| **Status**      | 15    | Verified Email, Phone Verified, 2FA Enabled, Community Leader, Rising Star |
| **Seasonal**    | 15    | Rotated quarterly (Halloween, Christmas, New Year, Spring Festival…)       |
| **Exclusive**   | 10    | Beta Tester, Founding Member, Hall of Fame, Partner                        |

### Nameplate System — 45 Total

Nameplates combine border + badge + title into a single identity card visible across forums, groups,
DMs, and profiles.

| Category         | Count | Design Reference                                                                        |
| ---------------- | ----- | --------------------------------------------------------------------------------------- |
| **Game Legends** | 12    | LoL championship plates, Valorant agent plates, Wild Rift/Mobile Legends rank aesthetic |
| **Rank Seasons** | 8     | Season 1-8 exclusive (limited-time, one per season)                                     |
| **Premium Tier** | 8     | Diamond/Platinum/Gold/Silver styling                                                    |
| **Exclusive**    | 10    | Founder, Beta tester, Hall of fame, Moderator, Admin, Creator, Partner                  |
| **Themed**       | 7     | Cyberpunk, Fantasy, Steampunk, Cosmic, Retro, Minimalist, Holographic                   |

### Nodes Shop Integration

| Item Type            | Price Range        | Notes                                             |
| -------------------- | ------------------ | ------------------------------------------------- |
| **Borders**          | 500–8,000 Nodes    | 7 shop-exclusive borders (Neon Surge → Celestial) |
| **Nameplates**       | 1,000–15,000 Nodes | Premium + themed nameplates                       |
| **Profile Effects**  | 500–3,000 Nodes    | Animated effects, time-limited options            |
| **Secret Themes**    | 200–1,000 Nodes    | Additional secret chat themes                     |
| **Temporary Boosts** | 100–500 Nodes      | Limited-time animated nameplates/effects (N days) |

### Frontend Work

| Task                                                     | Platform     | Priority |
| -------------------------------------------------------- | ------------ | -------- |
| Cosmetics API integration (replace static fallback data) | Web + Mobile | P0       |
| Unlock progress display per cosmetic                     | Web + Mobile | P0       |
| Rarity badge/glow on all cosmetic items                  | Web + Mobile | P1       |
| Nodes shop page (buy cosmetics)                          | Web + Mobile | P1       |
| Nameplate rendering component                            | Web + Mobile | P1       |
| Nameplate equip in customization                         | Web + Mobile | P1       |
| Cosmetic inventory/collection screen                     | Web + Mobile | P2       |

---

## v1.3.0 — Creator Economy ✅ SHIPPED (Phase 36)

**Theme:** Nodes becomes a full creator/consumer economy. Paid files in DMs, forum monetization
tiers, boosts, reputation rewards, and creator compliance.

**Shipped:** March 2026 (5 commits: 3f8125f7…8c8c5997)

**Source:** Nodes Economy design doc

### DM File Monetization

| Task                         | Scope                                                                                                   | Priority |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| **"Sell this file" toggle**  | On file attach in DMs: set price (min/max), license notes                                               | P0       |
| **Locked file message type** | Placeholder: "Locked file – 200 Nodes to unlock"                                                        | P0       |
| **Unlock flow**              | `POST /api/v1/messages/:id/unlock-file` → `content_unlock` transaction → 20% platform cut → file access | P0       |
| **Access persistence**       | Same user re-downloads free; other users pay individually                                               | P0       |
| **Restrictions**             | DMs (1:1) + small private groups (≤20 members); not public forums                                       | P1       |
| **Anti-fraud**               | Report/flag "scam file" → mod review + potential chargeback                                             | P1       |
| **Category tags**            | Software, Art, Guides, Replays, etc.                                                                    | P2       |

### Forum-Level Monetization

| Task                                      | Scope                                                                                                              | Priority |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| **Monetization modes**                    | Forum owners choose: Free (tips only), Node-gated (one-time/monthly/yearly), Hybrid (free basic + premium boards)  | P0       |
| **Access tiers** (up to 3 per forum)      | Tier 1 Supporter (500N/mo, 5000N/yr), Tier 2 Pro (2000N/mo, 20000N/yr), Tier 3 Lifetime/Founder (50,000N one-time) | P0       |
| **Tier feature flags**                    | Private board access, special nameplates/badges for that forum, higher attach sizes, more threads/day              | P1       |
| **`PUT /api/v1/forums/:id/monetization`** | Set mode, tiers, Node prices                                                                                       | P0       |
| **Revenue share**                         | Default 80% creator / 20% platform. Configurable per large community                                               | P1       |

### Unlockable Forum Content (Enhanced)

| Task                     | Scope                                                                                     | Priority            |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------- |
| **One-time unlock**      | Pay once, persistent access forever (`content_unlock` transaction)                        | P0 (exists, refine) |
| **Time-based unlock**    | 30-day / 90-day access passes, re-pay after expiry                                        | P1                  |
| **Tier-based unlock**    | Access when subscribed to creator/forum tier                                              | P1                  |
| **Access token storage** | `user_id`, `content_id`, `expiration_at` in DB                                            | P0                  |
| **Teaser display**       | Title + excerpt + blurred content + "Unlock for X Nodes"                                  | P1                  |
| **Forum restrictions**   | Some forums allow only free content; others require reputation/verified seller for gating | P2                  |

### Boosts & Promotions

| Feature                              | Scope                                                        | Nodes Cost   | Priority |
| ------------------------------------ | ------------------------------------------------------------ | ------------ | -------- |
| **Forum Boost**                      | Boost forum position in Discovery (Pulse/Discovery contexts) | Configurable | P1       |
| **Thread Boost**                     | Push thread higher in Pulse/Fresh feed for X hours           | Configurable | P1       |
| **Profile Spotlight**                | Appear in "Featured creators" / "Rising accounts" carousel   | Configurable | P2       |
| **`POST /api/v1/forums/:id/boost`**  | Forum boost endpoint                                         | —            | P1       |
| **`POST /api/v1/threads/:id/boost`** | Thread boost endpoint                                        | —            | P1       |

### Reputation-Linked Rewards

| Milestone                        | Reward              | Fund Source               |
| -------------------------------- | ------------------- | ------------------------- |
| First 100 helpful votes          | 100 Nodes bonus     | Platform marketing budget |
| Monthly top 10 posters per forum | Prize pool in Nodes | Portion of boost revenue  |
| Consecutive 30-day streak        | 50 Nodes            | Platform marketing budget |

### Creator Payouts & Compliance

| Task                         | Scope                                                                           | Priority |
| ---------------------------- | ------------------------------------------------------------------------------- | -------- |
| **KYC threshold**            | Require identity verification at €500 lifetime earnings                         | P0       |
| **AML monitoring**           | Flag: many high tips from one account, circular tips, rapid withdrawal patterns | P0       |
| **Tax/receipts**             | Downloadable earnings reports per month/year                                    | P1       |
| **Payout via SEPA/card**     | Stripe Connect (exists), extend for creator payouts                             | P0       |
| **Regional payout partners** | Later: local payout partners per region                                         | P2       |

### Economic Guardrails

| Guardrail              | Rule                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Minimum tip**        | 5–10 Nodes (prevent spam)                                                                  |
| **Max DM file price**  | Cap without manual review                                                                  |
| **Max boosts/day**     | Per user and per forum                                                                     |
| **Reputation gating**  | Only users with certain reputation can: sell files, create Node-gated forums               |
| **Discovery fairness** | Paid boosts influence ranking but do NOT override organic quality (Pulse/Discovery scores) |
| **Rate limiting**      | Tips per minute per user pair via existing rate limiter                                    |
| **Refund policy**      | No refunds by default; manual support reversals with audit log                             |
| **Transparency**       | Show "Platform cut: 20%" clearly to both sides                                             |

### New API Endpoints (v1.3)

| Endpoint                           | Method | Purpose                              |
| ---------------------------------- | ------ | ------------------------------------ |
| `/api/v1/messages/:id/sell-file`   | POST   | Set price + flags on DM file         |
| `/api/v1/messages/:id/unlock-file` | POST   | Charge Nodes, mark access            |
| `/api/v1/forums/:id/monetization`  | PUT    | Set monetization mode, tiers, prices |
| `/api/v1/forums/:id/boost`         | POST   | Boost forum in discovery             |
| `/api/v1/threads/:id/boost`        | POST   | Boost thread in feed                 |

---

## v1.4.0 — Forum Transformation ✅ SHIPPED (Phase 37)

**Theme:** Evolve forums from Reddit-like flat model to enterprise-grade board hierarchy with
persistent cross-platform identity (nameplates), 10 forum themes, and full mobile forum parity.

**Shipped:** March 2026 (10 commits: 09b0a817…c2f2d65f)

**Source:** Forums Next-Gen Plan

### Architecture Transformation

| Current State                        | Target State                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Forum → Thread → Post (flat)         | Forum → Board → Subcategory (optional) → Thread → Post (with identity card) |
| No visual identity/personalization   | Nameplate (title + badge + border) on every post                            |
| Reputation invisible across contexts | Cross-platform identity persistence (forums, groups, DMs, profiles)         |
| No sticky features / colored titles  | Sticky threads (up to 3), announcements, thread prefixes, colored titles    |

### New Database Tables

| Table                     | Purpose                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `forum_boards`            | Enhanced board hierarchy with `display_order`, `parent_board_id`, `thread_count`, `post_count`, `last_post_at`            |
| `forum_threads`           | Enhanced: `prefix_id`, `is_sticky`, `is_announcement`, `view_count`, `is_content_gated`, `gate_price_nodes`               |
| `forum_posts`             | Enhanced: `user_nameplate_snapshot` (JSONB), edit history tracking                                                        |
| `user_nameplates`         | Active nameplate selection: `equipped_border_id`, `equipped_title_id`, `equipped_badge_ids[]`, `forum_override_nameplate` |
| `cosmetic_nameplates`     | Nameplate definitions: `background_gradient`, `border_style`, `glow_color`, `animation_type`, `rarity`                    |
| `cosmetic_profile_frames` | Profile frame definitions                                                                                                 |
| `forum_themes`            | 10 themes with `css_custom_properties`, `color_primary/secondary/accent`, `font_heading/body`                             |
| `user_reputation_scores`  | Per-forum: `post_count`, `helpful_votes`, `reputation_level`, `rank_title`                                                |
| `forum_thread_tags`       | Thread tagging system                                                                                                     |

### 10 Forum Themes

| Theme               | Colors                    | Vibe                  |
| ------------------- | ------------------------- | --------------------- |
| **Neon Cyber**      | #00FF00, #FF006E, #000000 | Futuristic hacker     |
| **Royal Gold**      | #4B0082, #FFD700, #1A0033 | Premium corporate     |
| **Midnight Ocean**  | #001F3F, #00CCFF, #003D5C | Calm professional     |
| **Sakura Blossom**  | #FFB6D9, #FFFFFF, #C8A2D0 | Asian-inspired serene |
| **Lava Flow**       | #FF4500, #FFD700, #1C0000 | Energy gaming         |
| **Forest Mist**     | #2D5016, #87CEEB, #8B7355 | Natural grounded      |
| **Retro Arcade**    | #FF00FF, #00FFFF, #111111 | Nostalgic gaming      |
| **Ethereal Dream**  | #9D4EDD, #E0AAFF, #3C096C | Mystical gradient     |
| **Cyberpunk Metro** | #00D9FF, #FF006E, #0A0E27 | Edgy modern           |
| **Zen Garden**      | #6B5B4D, #B8860B, #F5F5DC | Minimalist balanced   |

### Mobile Forum Parity

| Feature                    | Current Mobile        | Target                                                                                                                   |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Real-time sockets**      | None                  | 3 channel hooks (board/forum/thread) mirroring web                                                                       |
| **Threaded comments**      | Flat display          | Full tree rendering (`nested-comments`)                                                                                  |
| **Multi-quote**            | None                  | Quote buffer + indicator                                                                                                 |
| **BBCode editor**          | Plain text            | BBCode toolbar (bold, italic, code, quote, link, list, image)                                                            |
| **Announcements**          | None                  | Announcement banner + store                                                                                              |
| **Emoji pack marketplace** | None                  | Pack browser + import                                                                                                    |
| **Thread PDF export**      | None                  | Share sheet → PDF generation                                                                                             |
| **Forum themes**           | Theme picker only     | Full 10-theme system with custom CSS variables                                                                           |
| **Admin panels**           | Tab views + ban modal | Full 10-panel admin (general, appearance, categories, members, moderators, posts, rules, mod-queue, analytics)           |
| **Permissions system**     | Basic screen          | Full 21 permission flags + templates                                                                                     |
| **User groups**            | Basic screen          | Full CRUD + secondary groups + auto-rules                                                                                |
| **Store**                  | 1 store, ~15 actions  | Sliced store matching web (core, CRUD, moderation, features, admin, permissions, leaderboard, RSS, emoji, announcements) |

---

## v1.5.0 — Infrastructure Scaling ✅ SHIPPED (Phase 38)

**Theme:** Scale from 10K to 1M+ concurrent users. Database sharding, three-tier caching,
multi-queue async processing, and search optimization.

**Shipped:** March 2026 (20 commits: 30600950…db992cfb)

**Source:** Forums Infrastructure doc

### Database Sharding

| Component             | Current                                      | Target                                                                               |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Database**          | Single Supabase PostgreSQL (300 connections) | 16 forum shards (800 connections total) + dedicated cosmetics/accounts/messaging DBs |
| **Sharding strategy** | None                                         | Shard by `forum_id` (`rem(forum_id, 16)`)                                            |
| **Read replicas**     | None                                         | 3 replicas per shard (48 total)                                                      |
| **Connections**       | 300 total, 30 per app instance               | 50 per shard × 16 = 800 primary + replicas                                           |

### Three-Tier Caching

| Tier       | Technology       | Content                                           | TTL       | Size            |
| ---------- | ---------------- | ------------------------------------------------- | --------- | --------------- |
| **Tier 1** | ETS (in-process) | Cosmetics, themes, user nameplates                | 1 hour    | ~500MB/instance |
| **Tier 2** | Redis cluster    | Forum thread/board lists, user profiles, sessions | 5 minutes | 100GB (8×16GB)  |
| **Tier 3** | DB replicas      | Direct reads, replication lag as TTL              | ~50ms     | —               |

### Async Processing (Multi-Queue Oban)

| Queue                  | Concurrency | Content                          |
| ---------------------- | ----------- | -------------------------------- |
| `forum_notifications`  | 50          | Post/reply/mention notifications |
| `forum_indexing`       | 20          | Meilisearch incremental indexing |
| `cosmetics_processing` | 10          | Unlock condition evaluation      |
| `email`                | 30          | Transactional email              |
| `analytics`            | 10          | Event aggregation                |
| `media_processing`     | 5           | Image/video transcoding          |

### Archive/Cold Storage

| Tier     | Age        | Storage                 | Query Pattern       |
| -------- | ---------- | ----------------------- | ------------------- |
| **Hot**  | <30 days   | Main shard (PostgreSQL) | Direct query        |
| **Warm** | 30–90 days | TimescaleDB (columnar)  | Transparent routing |
| **Cold** | >90 days   | S3 (Parquet files)      | On-demand fetch     |

### Performance Targets

| Metric                 | Current | Target     |
| ---------------------- | ------- | ---------- |
| Concurrent users       | 10K     | 1M+        |
| P99 forum read latency | ~500ms  | <200ms     |
| Posts/day capacity     | ~100K   | 10M        |
| Availability           | 99.5%   | 99.99%     |
| Shard failure impact   | 100%    | 1/16 (~6%) |

---

## v2.0.0 — Enterprise + Desktop ✅ SHIPPED (Phase 39)

**Theme:** Enterprise admin console, SSO, organization model, compliance, analytics, and web admin
SPA.

**Shipped:** March 2026 (7 commits: c2fb14bc…135bf2f9)

**Scope Changes:**

- ~~Self-Hosting~~ — REMOVED (CGraph hosts everything; no Docker self-host packaging)
- ~~Desktop Apps~~ — DEFERRED (future phase; enterprise/normal users use same web/mobile app)
- ~~Federation / Decentralized Identity~~ — DEFERRED (exploration for 2027+)

### Enterprise Admin Console

| Component                     | Description                                                                  | Status |
| ----------------------------- | ---------------------------------------------------------------------------- | ------ |
| **AdminUser**                 | Admin user schema with email, password_hash, role_id, permissions JSONB, MFA | ✅     |
| **AdminRole**                 | Role schema with Ecto.Enum (super_admin, admin, moderator, analyst)          | ✅     |
| **AuditEntry**                | Enterprise-specific audit logging (distinct from existing audit modules)     | ✅     |
| **AdminConsole**              | Facade context with Admins + Auditing sub-modules                            | ✅     |
| **EnterpriseAdminController** | Full CRUD for admin users, roles, audit entries, platform stats              | ✅     |
| **EnterpriseJSON**            | View module rendering all enterprise entities (329 lines)                    | ✅     |

### SSO Integration

| Component         | Description                                                             | Status |
| ----------------- | ----------------------------------------------------------------------- | ------ |
| **SSO Context**   | initiate/callback/link_account flow using existing `assent` dependency  | ✅     |
| **SSOProvider**   | Schema for SAML 2.0 + OIDC providers (name, type, config JSONB, org_id) | ✅     |
| **SSOController** | Provider CRUD + auth flow endpoints                                     | ✅     |

### Organization Model

| Component                  | Description                                                              | Status |
| -------------------------- | ------------------------------------------------------------------------ | ------ |
| **Organization**           | Schema (name, slug, subscription_tier, owner_id, logo_url, max_members)  | ✅     |
| **OrgSettings**            | Schema (sso_enabled, allowed_domains, features, branding JSONB)          | ✅     |
| **OrgMembership**          | Join table (org_id, user_id, role Enum: owner/admin/member)              | ✅     |
| **Organizations**          | Context (CRUD, member management, cursor pagination, transfer ownership) | ✅     |
| **OrganizationController** | Full CRUD + members + settings endpoints                                 | ✅     |
| **Group org_id FK**        | Groups optionally belong to Organizations                                | ✅     |

### Compliance & Data Residency

| Component                | Description                                                  | Status |
| ------------------------ | ------------------------------------------------------------ | ------ |
| **ComplianceSuite**      | SOC2/GDPR/HIPAA checklist system, run_audit, generate_report | ✅     |
| **DataResidency**        | Region routing (US/EU/APAC), verify_residency                | ✅     |
| **ComplianceController** | Status, audit, regions, branding endpoints                   | ✅     |

### White Label & Analytics

| Component                         | Description                                               | Status |
| --------------------------------- | --------------------------------------------------------- | ------ |
| **WhiteLabel**                    | configure_branding, apply_theme, CSS variable generation  | ✅     |
| **AnalyticsDashboard**            | platform_overview, org_breakdown, time_series, export_csv | ✅     |
| **EnterpriseAnalyticsController** | Overview, time-series, org breakdown, export endpoints    | ✅     |

### Web Admin SPA (React)

| Component                    | Lines | Description                                       |
| ---------------------------- | ----- | ------------------------------------------------- |
| **compliance-dashboard.tsx** | 173   | SOC2/GDPR/HIPAA compliance status + audit trigger |
| **enterprise-analytics.tsx** | 179   | Platform analytics with charts + CSV export       |
| **organizations-panel.tsx**  | 154   | Organization management CRUD panel                |
| **sso-settings-panel.tsx**   | 262   | SSO provider configuration (SAML/OIDC)            |
| **analytics-dashboard.tsx**  | 181   | Analytics dashboard wrapper                       |
| **enterprise-api.ts**        | 372   | API client for all enterprise endpoints           |
| **enterprise-types.ts**      | 211   | TypeScript type definitions                       |

### Deferred to Future Phases

| Feature                    | Description                                                      | Timeline |
| -------------------------- | ---------------------------------------------------------------- | -------- |
| **Desktop app**            | Tauri-based (Rust + web frontend), native notifications, systray | TBD      |
| **Federated Messaging**    | Cross-instance communication                                     | 2027+    |
| **Decentralized Identity** | DID/Verifiable credentials                                       | 2028+    |
| **Bot API v2**             | Webhooks, slash commands, bot marketplace                        | TBD      |

---

## v2.1.0 — 100% Completion ✅ SHIPPED (Phase 40)

**Theme:** Closed all remaining gaps from 5-document audit: reputation rewards, forum monetization
enum + tiers, KYC/AML compliance, reputation levels, thread archiving, boost profile type, economic
guardrails, identity cards in DMs, profile spotlight UI, 48 profile frames, 12 profile effects,
border track metadata.

**Dependencies:** Phase 39 (Enterprise + Desktop)

### Execution Plan

| Plan  | Scope                                                                            | Wave | Status  |
| ----- | -------------------------------------------------------------------------------- | ---- | ------- |
| 40-01 | Backend: reputation rewards, forum monetization enum + tiers                     | 1    | ✅ Done |
| 40-02 | Backend: KYC/AML, reputation levels, thread archiving, boost profile, guardrails | 1    | ✅ Done |
| 40-03 | Frontend: identity cards in DMs, forum monetization UI, profile spotlight        | 2    | ✅ Done |
| 40-04 | Data: 48 profile frames, 12 profile effects, border track metadata               | 3    | ✅ Done |

### Wave Schedule

| Wave | Plans        | Focus    | Dependencies |
| ---- | ------------ | -------- | ------------ |
| 1    | 40-01, 40-02 | Backend  | Phase 39     |
| 2    | 40-03        | Frontend | Wave 1       |
| 3    | 40-04        | Data     | Wave 1       |

---

## Cross-Cutting Concerns (All Releases)

### Test Coverage

| Milestone | Target                                           | When    |
| --------- | ------------------------------------------------ | ------- |
| v1.1      | 70% unit coverage across all apps                | Q2 2026 |
| v1.3      | 80% coverage + integration tests for Nodes flows | Q4 2026 |
| v1.5      | Load tests passing for 1M concurrent             | Q2 2027 |

### Security

| Task                                                  | When |
| ----------------------------------------------------- | ---- |
| External E2EE audit completion                        | v1.1 |
| Penetration test remediation                          | v1.1 |
| KYC/AML integration                                   | v1.3 |
| Infrastructure security review (sharded architecture) | v1.5 |

### Mobile

| Milestone                           | When |
| ----------------------------------- | ---- |
| Public beta (TestFlight/Play Store) | v1.1 |
| Mobile GA (full release)            | v1.2 |
| Mobile feature parity with web      | v1.4 |

---

## Success Metrics

### v1.1 → v2.0 Growth Targets

| Metric                        | v1.1 | v1.2 | v1.3 | v1.4 | v1.5  | v2.0  |
| ----------------------------- | ---- | ---- | ---- | ---- | ----- | ----- |
| DAU                           | 1K   | 5K   | 25K  | 50K  | 200K  | 500K  |
| Forums                        | 100  | 500  | 2K   | 5K   | 20K   | 50K   |
| Mobile Users                  | 20%  | 40%  | 50%  | 55%  | 60%   | 60%   |
| Nodes Revenue (monthly)       | —    | —    | €10K | €50K | €200K | €500K |
| Creator Payouts (monthly)     | —    | —    | €8K  | €40K | €160K | €400K |
| Enterprise Customers          | 0    | 0    | 0    | 5    | 15    | 50    |
| Cosmetics Unlocked (avg/user) | 3    | 12   | 20   | 30   | 40    | 50    |

### Key Performance Indicators

| KPI                     | Target                                        | Measurement     |
| ----------------------- | --------------------------------------------- | --------------- |
| Messages Sent/Day       | 500K (v1.3) → 5M (v2.0)                       | Database        |
| Mobile App Rating       | 4.5+                                          | App Stores      |
| Error Rate              | <0.1%                                         | Sentry          |
| P95 Latency             | <150ms                                        | Fly.io Metrics  |
| Uptime                  | 99.99% (v1.5+)                                | Status Page     |
| Nodes Tip Volume        | 100K Nodes/day (v1.3)                         | Transactions DB |
| Creator Retention (30d) | >70%                                          | Analytics       |
| Cosmetic Engagement     | >60% users equip at least 1 non-free cosmetic | Analytics       |

---

## Release Process

### Versioning (SemVer)

- **Major (X.0.0):** Breaking changes, major milestones
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, security patches

### Release Cadence

| Release Type | Frequency  | Branch |
| ------------ | ---------- | ------ |
| Major        | 12 months  | `main` |
| Minor        | 8–10 weeks | `main` |
| Patch        | As needed  | `main` |
| Hotfix       | Emergency  | `main` |

### Quality Gates

Before any release:

- [ ] All CI checks passing
- [ ] No P0/P1 bugs open
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Changelog updated
- [ ] Documentation current

---

## Feature Freeze Policy

### When Feature Freeze Applies

Feature freezes are declared 2 weeks before major releases (x.0.0).

### What's Allowed During Freeze

| Allowed               | Not Allowed                             |
| --------------------- | --------------------------------------- |
| ✅ Security fixes     | ❌ New features                         |
| ✅ Critical bug fixes | ❌ Refactoring                          |
| ✅ Performance fixes  | ❌ UI changes                           |
| ✅ Documentation      | ❌ Dependency updates (except security) |
| ✅ Test additions     | ❌ Experimental code                    |

### Freeze Exception Process

1. Create issue with `freeze-exception` label
2. Justify why this can't wait
3. Require approval from 2 maintainers
4. Must include rollback plan

---

## How to Provide Feedback

### Community Channels

- **GitHub Discussions:** Feature requests, ideas
- **GitHub Issues:** Bug reports
- **CGraph Server:** Real-time chat
- **Email:** feedback@cgraph.app

### Prioritization Framework

We prioritize based on:

1. **Impact:** How many users affected?
2. **Effort:** How complex to implement?
3. **Alignment:** Does it fit our vision?
4. **Security:** Does it improve trust?

---

<sub>**CGraph Product Roadmap** • Version 1.0.0 • Last updated: March 11, 2026</sub>
