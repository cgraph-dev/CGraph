# Phase 15 Plan Review Report

**Reviewed:** Plans 15-01 through 15-05 **Method:** 4 parallel codebase verification agents + 1
cross-plan consistency check **Date:** Phase 15 planning cycle

## Summary

| Plan       | Claims Verified | Inaccuracies Found | Severity                                     | Status        |
| ---------- | --------------- | ------------------ | -------------------------------------------- | ------------- |
| 15-01      | 7/9             | 2 → FIXED          | HIGH (theme controller misidentified)        | ✅ Corrected  |
| 15-02      | 10/14           | 4 → FIXED          | LOW (off-by-1 lines, reason count)           | ✅ Corrected  |
| 15-03      | 7/13            | 6 → SKIPPED        | NEGLIGIBLE (all off-by-1 trailing newlines)  | ✅ Acceptable |
| 15-04      | 7/16            | 9 → FIXED          | HIGH (mobile paths wrong, RSS screen exists) | ✅ Corrected  |
| 15-05      | 10/13           | 3 → FIXED          | MEDIUM (wrong file ref, missing Oban queue)  | ✅ Corrected  |
| Cross-plan | —               | 6 issues           | 3 HIGH, 3 MEDIUM → FIXED                     | ✅ Corrected  |

**Verdict: ALL PLANS APPROVED** — All material inaccuracies have been corrected inline.

---

## Plan 15-01: Forum Customization Engine (FORUM-07)

### Issues Found & Fixed

1. **CRITICAL — Theme controller misidentified**
   - Claim: `theme_controller.ex` (159L) handles forum themes
   - Reality: It handles **user profile themes** via `CGraph.Themes`, not forum themes
   - Fix: Plan now notes a new `ForumThemeController` + `CustomizationController` needed

2. **Theme preset names wrong**
   - Claim: Presets are `classic-blue`, `midnight`
   - Reality: Actual presets are `cyberpunk`, `classic-mybb`
   - Fix: Corrected in plan

3. **`customization_options` JSONB column**
   - Claim: Column exists on forums table
   - Reality: Does not exist
   - Fix: Plan now notes migration required

### Verified Correct

- ForumCustomization schema (186L, 55 options) ✓
- ForumTheme schema (83L) with 22 color fields ✓
- Custom CSS context (170L) with sanitization ✓
- Web customization panels (theme, layout, content-settings) ✓
- Mobile settings screens exist ✓

---

## Plan 15-02: Plugin Runtime + Automod + Warnings (FORUM-08, FORUM-11)

### Issues Found & Fixed

1. **ContentReport has 6 reasons, not 5** — Fixed (spam, harassment, hate_speech, misinformation,
   nsfw, other)
2. **`moderation.ex` is 212L, not 213L** — Fixed
3. **`GET /forums/:id/modqueue` already exists** — Added note to Task 6
4. **`forumStore.moderation.ts` already exists (191L)** — Added note to Task 7 to extend, not
   recreate

### Verified Correct

- ForumPlugin (107L) with 18 hook events ✓
- Plugins context (268L) with install/uninstall/toggle ✓
- Plugin runtime correctly identified as missing ✓
- `CGraph.TaskSupervisor` exists in supervision tree ✓
- Warning/strike system correctly identified as missing ✓

---

## Plan 15-03: User Groups Admin + Permissions UI (FORUM-15, FORUM-12)

### Issues Found

- 6 off-by-1 line counts (trailing newline differences): 212→213, 208→209, 322→323, 284→285,
  302→303, 240→241
- **Decision:** Not fixed — negligible, won't affect execution

### Verified Correct

- ForumUserGroup (213L) with 30+ permissions ✓
- MemberSecondaryGroup (209L) with expiration ✓
- GroupAutoRule (323L) with auto-assignment ✓
- SecondaryGroupsController (447L) ✓
- BoardPermission (285L) with inherit/allow/deny ✓
- PermissionsController (470L) with full CRUD ✓
- All routes already exist in `forum_routes.ex` ✓

### Cross-plan Fix

- Added mobile navigator registration note to Task 10

---

## Plan 15-04: Emoji Packs + Post Icons + RSS (FORUM-13, FORUM-14)

### Issues Found & Fixed

1. **MATERIAL — Mobile RSS screen already exists**
   - Claim: "No mobile RSS"
   - Reality: `rss-feeds-screen.tsx` (486L) exists at `screens/settings/rss-feeds-screen.tsx`
   - Fix: Context updated, Task 10 now notes it's a quick-subscribe sheet, not replacing the
     existing screen

2. **Mobile emoji file paths wrong**
   - Claim: `screens/forums/components/emoji-pack-browser.tsx`
   - Reality: Mobile emoji files are under `screens/settings/custom-emoji/`
   - Fix: All mobile emoji paths corrected to `screens/settings/custom-emoji/`

3. **`rss-feed-button.tsx` is 27L, not 60L** — Fixed in context

4. **RSS feeds page path** — noted as `pages/settings/rss-feeds/`, not `pages/forums/`

### Verified Correct

- CustomEmoji (262L) ✓
- EmojiPack (72L) ✓
- EmojiCategory (85L) ✓
- PostIcon (155L) ✓
- CustomEmojiController (445L) ✓
- RssController (480L) ✓
- Backend APIs comprehensive ✓

---

## Plan 15-05: Ranking + Leaderboard + Gamification Bridge (FORUM-16)

### Issues Found & Fixed

1. **`reset_weekly_scores` in wrong file**
   - Claim: Lives in `user_leaderboard.ex`
   - Reality: Lives in `ranking_engine.ex`
   - Fix: Corrected reference in Task 2 code snippet

2. **Animated sub-components count**
   - Claim: 5 animated components
   - Reality: 4 (animated-list-item, animated-period-selector, animated-podium, animated-tab-bar)
   - Fix: Corrected in context

3. **`:rankings` Oban queue missing from config**
   - No `:rankings` queue in Oban config
   - Fix: Added note that queue must be registered in `config.exs` and `prod.exs`

4. **Daily XP cap is entirely new infrastructure**
   - No existing cap/rate-limiting in gamification system
   - Fix: Added note about needing `forum_xp_daily_totals` table or Redis counter

### Verified Correct

- RankingEngine (252L) with 7 algorithms ✓
- UserLeaderboard (118L) ✓
- LeaderboardController (181L) ✓
- Gamification LeaderboardSystem (211L) ✓
- Mobile leaderboard screen (318L) ✓
- Web leaderboard widget (166L) ✓
- Forum/gamification separation confirmed as gap ✓

---

## Cross-Plan Consistency

### Issues Found & Fixed

| Issue                                                                  | Severity | Plans        | Fix                                                                         |
| ---------------------------------------------------------------------- | -------- | ------------ | --------------------------------------------------------------------------- |
| Permission + secondary group routes already exist in `forum_routes.ex` | HIGH     | 15-02, 15-03 | Plans reference existing controllers correctly — tasks extend, not recreate |
| `forumStore.moderation.ts` already exists (191L)                       | HIGH     | 15-02        | Added "extend, not create" note to Task 7                                   |
| `GET /forums/:id/modqueue` route exists                                | HIGH     | 15-02        | Added note to Task 6                                                        |
| `:rankings` Oban queue missing from config                             | MEDIUM   | 15-05        | Added config registration note                                              |
| Daily XP cap = new infrastructure                                      | MEDIUM   | 15-05        | Added scope note about table/counter needed                                 |
| Mobile navigator registration needed                                   | MEDIUM   | 15-03, 15-05 | Added cross-plan notes to mobile tasks                                      |

### No Conflicts Found

- ✅ No shared-types filename conflicts — all proposed files are new
- ✅ No store slice conflicts — `forumStore.userGroups.ts`, `forumStore.permissions.ts`,
  `forumStore.emoji.ts`, `forumStore.rss.ts`, `forumStore.leaderboard.ts` don't exist
- ✅ Wave dependencies correct — Wave 2 plans (15-04, 15-05) depend on Wave 1 (15-01, 15-02, 15-03)
- ✅ Backend contexts properly separated across plans

---

## Risk Register

| Risk                                                | Impact                                        | Mitigation                                                       |
| --------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Daily XP cap needs new DB table + enforcement logic | Could balloon scope in Task 3 of 15-05        | Consider Redis counters for v1, migrate to table later           |
| Theme controller confusion                          | Execution agent might re-use wrong controller | Plan 15-01 now explicitly says "create NEW ForumThemeController" |
| Mobile RSS screen duplication                       | Might build redundant screen                  | Plan 15-04 now clarifies existing screen vs new subscribe sheet  |
| Oban queue registration                             | Worker silently fails without queue           | Plan 15-05 now calls out `config.exs` + `prod.exs` registration  |
