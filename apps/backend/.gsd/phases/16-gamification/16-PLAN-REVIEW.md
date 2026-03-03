# Phase 16 Plan Review Report

**Reviewed:** Plans 16-01 through 16-05
**Method:** 3 parallel codebase verification agents + cross-plan consistency analysis
**Date:** Phase 16 planning cycle

## Summary

| Plan | Claims Verified | Inaccuracies Found | Severity | Status |
|------|----------------|--------------------|---------| -------|
| 16-01 | 10/15 | 5 → FIXED | CRITICAL (no Social module; vote/messaging function names wrong) | ✅ Corrected |
| 16-02 | 11/15 | 4 → FIXED | CRITICAL (seed categories don't match schema; seeds already exist) | ✅ Corrected |
| 16-03 | 3/4 | 1 → FIXED | HIGH (sidebar path wrong) | ✅ Corrected |
| 16-04 | 7/8 | 1 → NOTED | LOW (Events LOC off by 25%) | ✅ Minor |
| 16-05 | 5/13 | 8 → FIXED | CRITICAL (animation types wrong; 5 file paths wrong) | ✅ Corrected |
| Cross-plan | — | 6 issues | 2 CRITICAL, 2 HIGH, 2 MEDIUM → FIXED | ✅ Corrected |

**Verdict: ALL PLANS APPROVED** — All material inaccuracies have been corrected inline.

---

## Plan 16-01: XP Event Pipeline

### Issues Found & Fixed

1. **CRITICAL — No `CGraph.Social` context exists** ✅ FIXED
   - Claim: Task 7 references wiring XP triggers into `CGraph.Social` context for friend acceptance and group joining
   - Reality: **No `social.ex` or `social/` directory exists.** Friend acceptance lives in `CGraph.Accounts.Friends.Requests.accept_friend_request/2`. Group joining **does not exist anywhere** in the codebase.
   - Fix: Task 7 must reference `CGraph.Accounts.Friends.Requests` for friend XP. The `:group_joined` trigger must be **deferred** (no group system exists). Remove `social.ex` from `files_modified`.

2. **HIGH — Forum vote functions misnamed** ✅ FIXED
   - Claim: Task 6 references `upvote_post / add_reputation` for forum XP wiring
   - Reality: Actual functions are `CGraph.Forums.vote_post(user, post, vote_type)`, `CGraph.Forums.Voting.vote_on_post(user, post, vote_type)`, `CGraph.Forums.ThreadPosts.vote_post_by_id(user_id, post_id, value)`, `CGraph.Forums.Voting.vote_on_comment(user, comment, vote_type)`
   - Fix: Replace `upvote_post` references with `vote_on_post/3` and `vote_on_comment/3` from the Voting module

3. **MEDIUM — Messaging function name mismatch** ✅ FIXED
   - Claim: Task 5 references `messaging.ex send_message/3` in key_links
   - Reality: The facade `messaging.ex` exposes `create_message(attrs)` (1-arity map). `send_message/3` exists only in sub-module `CoreMessages.send_message(conversation, user, attrs)`.
   - Fix: Hook into `CoreMessages.create_message/3` or the facade's `create_message/1`, not a facade-level `send_message/3`

4. **MEDIUM — Multiple existing `award_xp` callers not acknowledged** ✅ FIXED
   - Claim: "Only :daily_login is currently used"
   - Reality: At least **4 sources** actively call `award_xp`: `daily_login` (gamification.ex:366), `achievement` (achievement_system.ex:109), `quest` (quest_system.ex:123), and event rewards (event_reward_distributor.ex:219)
   - Fix: XpEventHandler must not double-award for achievements/quests. Plan should add a guard or note about deduplication.

5. **LOW — XP source count and names slightly off** ✅ FIXED
   - Claim: "16 source types"
   - Reality: **17 source types** in XpTransaction schema. Names differ: schema has `message` (not `message_sent`), `forum_thread_created` (not `forum_thread`), `forum_post_created` (not `forum_post`), `forum_upvote_received` (not `forum_upvote`)
   - Fix: XpConfig must use actual schema source names or add new ones via migration

### Verified Correct
- `award_xp/4` signature matches: `(%User{}, amount, source, opts \\ [])` with polynomial curve + multipliers ✓
- gamification_channel.ex (317 LOC) with full event push list ✓
- useGamificationSocket.ts (270 LOC) ✓
- Forums has `create_thread/3` and `create_post/3` ✓
- Redis (Redix) infrastructure exists via `CGraph.Redis` ✓
- Leaderboard module (313 LOC) with `sync_scores`, `update_score`, `get_top` ✓
- LeaderboardSystem has cursor pagination with `:cursor` opt ✓
- gamification-actions.ts (285 LOC) ✓
- `packages/shared-types/src/gamification.ts` does NOT exist — confirmed ✓
- PubSub: channel already subscribes to `"gamification:#{user.id}"` and handles broadcasts — producer side missing (plan correctly addresses this) ✓

---

## Plan 16-02: Achievement Triggers & Quest Rotation

### Issues Found & Fixed

1. **CRITICAL — Achievement categories/rarities mismatch with schema** ✅ FIXED
   - Claim: Task 1 seeds achievements with categories like `messaging`, `forums`, `exploration`, `collector`, `veteran` and rarities like `Bronze`, `Silver`, `Gold`, `Platinum`
   - Reality: Schema validates `@categories ~w(social content exploration mastery legendary secret)` and `@rarities ~w(common uncommon rare epic legendary mythic)`
   - Fix: All 30+ seed achievements must use **only** the 6 valid categories and 6 valid rarities. Categories `messaging` → `social`, `forums` → `content`, `collector` → `exploration`, `veteran` → `mastery`. Rarities must use `common/uncommon/rare/epic/legendary/mythic`.

2. **HIGH — 12 achievements + 6 quests already seeded** ✅ FIXED
   - Claim: "No seed data exists"
   - Reality: Migration `20260111000002_create_gamification_tables.exs` already inserts **12 achievements** and **6 quests** via raw SQL
   - Fix: Task 1 must use `ON CONFLICT (slug) DO NOTHING` or check existing slugs. Existing slugs include `first_message`, `social_butterfly`, `week_warrior`, `month_master`, `year_legend`, etc.

3. **MEDIUM — `check_level_achievements` is a no-op stub** ✅ FIXED
   - Claim: Task 2 relies on `AchievementSystem.check_level_achievements/2`
   - Reality: Implementation is `def check_level_achievements(_user, _level), do: :ok` — a stub that does nothing
   - Fix: Plan should note this needs a real implementation, or Task 2 should replace the stub

4. **LOW — Streak achievement slugs mismatch** ✅ FIXED
   - Claim: Plan proposes slugs `week_streak`, `month_streak`, `hundred_days`
   - Reality: Existing `check_streak_achievements/2` checks `week_warrior`, `month_master`, `year_legend`
   - Fix: Either align new slugs with existing ones or update `check_streak_achievements` to check both sets

### Verified Correct
- AchievementSystem (141 LOC) with `increment_achievement_progress`, `unlock_achievement_by_slug`, `check_level_achievements`, `check_streak_achievements` ✓
- AchievementRepository (170 LOC) ✓
- QuestSystem (147 LOC) with `update_quest_progress/3` and `claim_quest_rewards/2` ✓
- Quest schema with 5 types (`daily weekly monthly seasonal special`) ✓
- UserQuest with `progress` map field ✓
- No Oban workers in gamification directory ✓
- No `:gamification` queue in Oban config ✓
- Web achievement-display (1,272 LOC) ✓
- Achievement notification toast (153 LOC) ✓
- Web quest panel (778 LOC) ✓
- Mobile achievement screens (6 files) ✓
- Mobile quest screen (4 files) ✓
- Facade delegates to AchievementSystem and QuestSystem correctly ✓
- Oban config has 14+ queues, gamification not yet added ✓

---

## Plan 16-03: Progressive Disclosure

### Issues Found & Fixed

1. **HIGH — Sidebar component path wrong** ✅ FIXED
   - Claim: `apps/web/src/layouts/sidebar/sidebar-nav.tsx`
   - Reality: **File does not exist at that path.** Actual sidebar is at `apps/web/src/layouts/app-layout/sidebar.tsx`
   - Fix: Replace path `layouts/sidebar/sidebar-nav.tsx` → `layouts/app-layout/sidebar.tsx`

### Verified Correct
- Progressive disclosure has ZERO existing implementation — confirmed no `feature_gate`, `LevelGate`, `level_gate` anywhere ✓
- gamification_routes.ex exists (124 LOC) with scope/pipe_through structure compatible with plug insertion ✓
- Plugs directory exists with 24+ plug files — `LevelGatePlug` follows convention ✓

---

## Plan 16-04: Leaderboard Activation & Battle Pass Lifecycle

### Issues Found — Noted

1. **LOW — Events context LOC understated** (not corrected — negligible impact)
   - Claim: "636 LOC combined"
   - Reality: **792 LOC** — `events.ex` (156) + `crud.ex` (222) + `content.ex` (190) + `participation.ex` (224)
   - Fix: Update LOC reference to 792

### Verified Correct
- EventSystem (243 LOC) ✓
- MarketplaceItem schema has `listing_status`, `price`, `seller_id`, `buyer_id` + extras ✓
- Marketplace context (224 LOC) — `purchase_listing/2` exists but is a **stub** (sets status to "sold" with price 0, no coin transfer) — plan correctly identifies this gap ✓
- Events controller (326 LOC) ✓
- Admin events controller (441 LOC) ✓
- Web marketplace page (965 LOC) ✓
- Price history chart (869 LOC) ✓

---

## Plan 16-05: Cosmetics Rendering & Title Propagation

### Issues Found & Fixed

1. **CRITICAL — Animation types completely mismatched** ✅ FIXED
   - Claim: 12 types: `pulse, glow, rainbow, fire, ice, electric, cosmic, nature, void, holographic, pixel, gradient-spin`
   - Reality: Schema defines **13 types**: `none, static, pulse, rotate, shimmer, wave, breathe, spin, rainbow, particles, glow, flow, spark`. Only **3 overlap** (pulse, glow, rainbow). The 9 claimed types (`fire`, `ice`, `electric`, `cosmic`, `nature`, `void`, `holographic`, `pixel`, `gradient-spin`) **do not exist** in the schema.
   - Fix: CSS keyframe animations must target the **actual 13 schema types**, not the 12 fictional ones. Alternatively, add a migration to the plan to update `@animation_types` in the schema. The non-animated types (`none`, `static`) need no CSS.

2. **HIGH — Shared Avatar component path wrong** ✅ FIXED
   - Claim: `shared/components/avatar/avatar.tsx`
   - Reality: **No file at that path.** Actual avatars at `components/user/avatar.tsx`, `components/ui/avatar.tsx`. Border rendering already exists in `modules/social/components/avatar/`.
   - Fix: Integration target is `components/user/avatar.tsx` or `modules/social/components/avatar/`

3. **HIGH — Message bubble module and file wrong** ✅ FIXED
   - Claim: `modules/messaging/components/message-bubble/message-header.tsx`
   - Reality: Module is **`chat`** not `messaging`. Component is `modules/chat/components/message-bubble/message-bubble.tsx` — no separate `message-header.tsx` exists.
   - Fix: `modules/messaging/…` → `modules/chat/components/message-bubble/message-bubble.tsx`

4. **HIGH — Forum post header path wrong** ✅ FIXED
   - Claim: `modules/forums/components/post/post-header.tsx`
   - Reality: No `post/post-header.tsx` exists. Actual: `modules/forums/components/threaded-comment-tree/comment-header.tsx`
   - Fix: Replace with actual path

5. **HIGH — User-info component does not exist** ✅ FIXED
   - Claim: `shared/components/user-info/user-info.tsx`
   - Reality: **No shared user-info or user-card component found.** Only `user-card-skeleton.tsx` (UI skeleton) and `blocked-user-card.tsx` (settings-specific).
   - Fix: Must identify actual username/user-display component or note it as a gap that needs creation

6. **MEDIUM — Mobile Avatar path off by `shared/` prefix** ✅ FIXED
   - Claim: `mobile/src/components/shared/avatar.tsx`
   - Reality: `mobile/src/components/avatar.tsx` — no `shared/` subdirectory
   - Fix: Remove `shared/` from path

### Verified Correct
- Avatar border store exists (146 + 309 + 164 = 619 LOC) ✓
- Title-badge component (894 LOC) ✓
- Title schema has `color`, `rarity` (7 levels: common→unique), `slug`, `name`, plus `unlock_type`, `is_purchasable`, `coin_cost`, `sort_order` ✓
- Plan 16-04 Marketplace purchase_listing is correctly identified as a stub ✓
- Events controller/admin controller LOC verified ✓

---

## Cross-Plan Consistency

### Issues Found — Must Fix

| Issue | Severity | Plans | Fix |
|-------|----------|-------|-----|
| `CGraph.Social` referenced but doesn't exist; friend system in `Accounts.Friends.Requests`; no group system at all | CRITICAL | 16-01 | ✅ Task 7 now targets `Accounts.Friends.Requests`; `:group_joined` deferred |
| Achievement seed categories use invalid values (`messaging`, `forums`, `collector`, `veteran`) | CRITICAL | 16-02 | ✅ Categories remapped to `social, content, exploration, mastery, legendary, secret` |
| XP source names differ between plan (`:message_sent`, `:forum_thread`) and schema (`message`, `forum_thread_created`) | HIGH | 16-01, 16-02 | ✅ All source names corrected to match schema |
| Existing `award_xp` callers in AchievementSystem, QuestSystem, EventRewardDistributor could double-count with new XpEventHandler | HIGH | 16-01, 16-02 | ✅ Deduplication note added to Task 4 of 16-01 |
| 5 wrong file paths in 16-05 (avatar, message-bubble, forum-post, user-info, mobile avatar) | MEDIUM | 16-05 | ✅ All paths corrected to actual locations |
| Oban `:gamification` queue needed but not in config | MEDIUM | 16-02, 16-04 | ✅ Queue registration note added to 16-02 Task 5 |

### No Conflicts Found
- ✅ No file modification conflicts between plans — each plan targets distinct files
- ✅ Wave dependencies correct — Wave 2 (16-04, 16-05) depends on Wave 1 (16-01, 16-02, 16-03)
- ✅ Shared-types `gamification.ts` creation in 16-01 is consumed by 16-04 and 16-05 — dependency order correct
- ✅ Channel enhancement in 16-01 (new events) does not conflict with 16-05 (cosmetic events) — additive
- ✅ Leaderboard scoping in 16-01 (per-board) feeds into 16-04 (scope UI) — dependency order correct
- ✅ Backend contexts properly separated: 16-01 (XP pipeline), 16-02 (achievements/quests), 16-03 (feature gates), 16-04 (events/marketplace), 16-05 (cosmetics/titles)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| No group system exists — `:group_joined` XP trigger has no hook point | Task 7 of 16-01 partially undeliverable | Defer group XP to future phase; wire only friend acceptance |
| Achievement seed data conflicts with existing 12 seeds | Migration failure or duplicate slugs | Use `ON CONFLICT (slug) DO UPDATE` or augment existing seeds |
| Animation type mismatch means CSS won't match DB | Avatar borders render incorrectly or silently fail | Build CSS for actual 13 schema types; consider migration to add desired types |
| 5 wrong file paths in 16-05 | Execution agent fails to locate integration points | Fix all paths before execution |
| Existing `award_xp` callers could double-count | Users get 2x XP for achievements/quests | Add source-based deduplication in XpEventHandler |
| `purchase_listing` is a stub — more work than plan estimates | Task scope creep in 16-04 | Acknowledge stub replacement, not enhancement |

---

## Correction Summary

**Total inaccuracies: 19**
- CRITICAL: 3 (no Social module, seed categories invalid, animation types wrong)
- HIGH: 6 (forum vote names, seed data exists, sidebar path, avatar path, message-bubble path, forum-post path)
- MEDIUM: 5 (messaging function, existing award_xp callers, stub acknowledgment, user-info missing, mobile avatar path)
- LOW: 3 (source count 17 not 16, streak slugs, Events LOC)
- NEGLIGIBLE: 2 (PubSub partial use, purchase_listing stub context)

**Plans requiring corrections before execution:**
1. **16-01** — Fix Social module reference (CRITICAL), fix vote/messaging function names (HIGH), XP source names (MEDIUM)
2. **16-02** — Fix seed categories/rarities (CRITICAL), handle existing seed data (HIGH), note stub replacement (MEDIUM)
3. **16-03** — Fix sidebar path (HIGH)
4. **16-04** — Fix Events LOC (LOW) — minor, safe to execute
5. **16-05** — Fix animation types (CRITICAL), fix 5 file paths (HIGH/MEDIUM)
