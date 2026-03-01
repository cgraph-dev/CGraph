# Phase 15 Discovery: Forum Customization

> Generated: 2026-03-01 | Depth: Level 2 (Standard) | Confidence: HIGH

## Summary

Phase 15 builds on the extensive Phase 14 forum core. The codebase is **~65% complete on average** across the 8 requirements, with backend consistently at 85-90% and frontend (especially mobile) being the primary gap. This is predominantly a **frontend wiring + admin UI** phase rather than a backend architecture phase.

### Key Insight

The pattern is consistent: backend schemas, contexts, controllers, and routes already exist for nearly every feature. What's missing is admin configuration UIs, mobile screens, shared types, and integration glue. This means plans should be frontend-heavy with thin backend enhancement layers.

---

## Findings by Requirement

### FORUM-07: 50+ Customization Options — ~55% Built

**Backend (75%):** `ForumTheme` schema (96L), `Forum` schema has custom_css/sidebar_html/header/footer fields, `ThemeController` (159L) with CRUD, migration exists.

**Web (50%):** `forumThemeStore.ts` (200L) with presets (dark-elite, classic-blue, midnight), `forum-theme-provider.tsx` (78L) CSS var injection, `forum-settings.tsx` (120L).

**Mobile (15%):** `forum-settings-screen.tsx` (528L) exists but limited theming.

**Gaps:**
- No CSS editor UI (CodeMirror/Monaco for custom_css field)
- No widget configuration panel (sidebar is raw HTML, needs drag-and-drop)
- No custom fields schema or UI
- No post templates UI (backend field exists)
- No badge management admin panel
- No karma/reputation name customization
- No rank image management
- Need to enumerate and implement 50+ distinct options

### FORUM-08: Plugin System — ~70% Built

**Backend (85%):** `ForumPlugin` schema (107L) with 18 hook events, `Plugins` context (268L), `PluginController` (175L), routes exist.

**Web (60%):** `plugin-marketplace.tsx` (298L), `pluginStore.impl.ts` (276L).

**Mobile (50%):** `plugin-marketplace-screen` (344L), `plugin-detail-modal.tsx` (169L), `plugin-card.tsx` (127L).

**Gaps:**
- No plugin execution runtime (hooks defined but no dispatcher)
- No plugin versioning/update flow
- No plugin conflict detection
- Need hook dispatch engine that fires events at lifecycle points

### FORUM-11: Forum Moderation Tools — ~70% Built

**Backend (85%):** `moderation.ex` (213L) with queue/hide/delete/ban/flag operations, `ContentReport` (64L), `Moderator` (33L), `Ban` (46L).

**Web (75%):** `moderationStore.ts` with 8 slices (~1,221L), queue/log/toolbar components, `automod-settings.tsx` (272L).

**Mobile (40%):** `moderation-queue-screen.tsx` (465L).

**Gaps:**
- Forum-specific automod (current automod is group-level at `/groups/:groupId/automod`)
- No warn/strike system (permission exists, no Warning schema)
- No IP ban capability
- Mobile moderation is groups-only, not forum-aware

### FORUM-12: Per-Board Permissions & Templates — ~60% Built

**Backend (90%):** `BoardPermission` (285L) with 15 fields, `ForumPermission` (303L), `PermissionTemplate` (241L), `ForumUserGroup` (213L), `PermissionsController` (470L).

**Web (55%):** `forum-permissions-panel.tsx` (136L), `use-forum-permissions.ts` (206L), `permission-overwrite-card.tsx` (88L).

**Mobile (0%):** No forum permission UI.

**Gaps:**
- No board-level permissions UI (only forum-level panel)
- No permission template management pages
- No permission audit/visual matrix
- No mobile permissions screens

### FORUM-13: Custom Emoji Packs & Post Icons — ~65% Built

**Backend (85%):** `CustomEmoji` (262L), `EmojiPack` (72L), `EmojiCategory` (85L), `PostIcon` (155L), `CustomEmojiController` (445L), admin moderation routes.

**Web (60%):** `custom-emoji-picker.tsx` (275L), `custom-emoji-page.tsx`, `upload-emoji-modal.tsx`.

**Mobile (30%):** `custom-emoji-screen.tsx`, `add-emoji-modal.tsx`.

**Gaps:**
- No emoji pack import/export UI
- No post icon selector in thread creation
- No emoji pack marketplace browse
- No animated emoji preview rendering

### FORUM-14: RSS Feeds — ~60% Built

**Backend (90%):** `rss.ex` (170L), `feeds.ex` (171L), `RssController` (480L), routes exist.

**Web (65%):** `rss-feed-button.tsx` (60L), `rss-feed-link.tsx` (33L), `rss-feeds-page.tsx` (121L).

**Mobile (0%):** No RSS components.

**Gaps:**
- No per-board RSS feeds (board-level feeds not implemented)
- No RSS feed configuration panel for enable/disable per board
- No mobile RSS integration
- Thin test coverage (22L controller test)

### FORUM-15: User Groups & Secondary Membership — ~45% Built

**Backend (90%):** `ForumUserGroup` (213L), `UserGroups` context (124L), `MemberSecondaryGroup` (209L), `GroupAutoRule` (323L), `SecondaryGroupsController` (447L).

**Web (10%):** No dedicated user group management UI.

**Mobile (5%):** No forum user group screens.

**Gaps:**
- No web user group admin page (backend complete, no frontend)
- No secondary group assignment UI
- No auto-rule configuration UI
- No group permission matrix editor
- No mobile user group screens

### FORUM-16: Ranking & Leaderboard — ~65% Built

**Backend (85%):** `RankingEngine` (253L) with 7 algorithms, `Leaderboard` (71L), `UserLeaderboard` (118L), `LeaderboardController` (181L), gamification `LeaderboardSystem` (211L).

**Web (55%):** `forum-leaderboard-widget.tsx` (166L), `global-leaderboard-widget.tsx` (122L), `leaderboard-sidebar.tsx` (29L), `leaderboard-page.tsx`, `rankings-list.tsx` (118L).

**Mobile (50%):** `forum-leaderboard-screen.tsx` (318L) with animated podium.

**Gaps:**
- No gamification ↔ forum ranking integration (separate systems)
- No Oban cron for `update_all_rankings()`
- No custom karma names per forum
- No rank image/badge progression schema
- Forum leaderboard page is a stub (15L)

---

## Cross-Cutting Themes

1. **Backend is 85-90% done** — schemas, contexts, controllers, routes, migrations all exist
2. **Web needs admin UIs** — stores partially exist but configuration panels are sparse
3. **Mobile is the biggest gap** — 0-30% for most features
4. **Shared types are nearly absent** — `packages/shared-types/` needs Phase 15 types
5. **Test coverage is thin** — controller tests are minimal across the board
6. **No unified "50 options" admin dashboard** — individual customization points exist but no central customization center

---

## Recommendation

**Plan structure: 5 plans in 2 waves**

Wave 1 (parallel — no interdependencies):
- **15-01**: Customization engine + 50 options enumeration (FORUM-07) — heaviest plan
- **15-02**: Plugin execution runtime + forum automod (FORUM-08, FORUM-11)
- **15-03**: User groups admin UI + permissions UI (FORUM-15, FORUM-12) — both are admin config UIs

Wave 2 (depends on wave 1):
- **15-04**: Emoji packs + post icons + RSS polish (FORUM-13, FORUM-14) — lighter features
- **15-05**: Ranking integration + leaderboard + shared types (FORUM-16) — ties to gamification

---

## Metadata

- **Confidence:** HIGH — backend is well-established, gaps are well-defined frontend work
- **Dependencies:** Phase 14 (complete), gamification contexts exist but Phase 16 not started
- **Risk:** FORUM-07 "50+ options" requires enumeration discipline — must not ship 30 and call it done
- **Open Questions:** None — requirements are concrete and codebase state is clear
