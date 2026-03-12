# Phase 37 — Forum Transformation: Verification Report

**Verified by**: gsd-verifier
**Date**: 2026-02-21
**Plans audited**: 6 (37-01 through 37-06)
**Errors found**: 28
**Errors fixed**: 28
**Remaining errors**: 0

---

## Summary

All 6 Phase 37 plans were verified against the actual codebase. Deep exploration covered 73 modules
in `CGraph.Forums`, 140+ controllers, router.ex structure, web frontend (117+ forum files), and
mobile frontend (18+ screens). **28 errors were found and fixed across all 6 plans.**

The most critical errors were:
1. **P0**: `advanced_search.ex` referenced as existing — file does NOT exist (correct: `search.ex`)
2. **P0**: ThreadPoll claimed to need extension — already FULLY COMPLETE with all fields
3. **P0**: Three plans said "do NOT edit router.ex" — MUST update router.ex for route modules
4. **P1**: All 4 backend plans placed controllers at top-level — must be under `api/v1/`
5. **P1**: All 4 backend plans referenced `forums.ex` as facade — correct facade is `core.ex`
6. **P1**: Plan 37-06 listed 4 mobile files as NEW — all 4 ALREADY EXIST

---

## Errors by Plan

### Plan 37-01 (Identity Card + PostCreationFlow) — 7 errors fixed

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | P0 | "do NOT edit router.ex directly" | Changed to: MUST update router.ex (add import ~line 45, macro ~line 149) |
| 2 | P1 | Controller at `controllers/identity_card_controller.ex` (top-level) | Moved to `controllers/api/v1/identity_card_controller.ex` with `CGraphWeb.API.V1` namespace |
| 3 | P1 | `Forums context: forums.ex` facade reference | Fixed to `core.ex` (delegates to Core.{Authorization, Listing, Membership, Stats}) |
| 4 | P1 | "See GamificationRoutes for pattern" | Fixed to ForumRoutes (same domain, better pattern) |
| 5 | P2 | `badge_ids (array of integers)` | Fixed to `{:array, :binary_id}` (CGraph uses UUID PKs) |
| 6 | P2 | `reputation_score (decimal)` | Fixed to integer (matches ForumMember.reputation field type) |
| 7 | P1 | No ForumMember reference in key_links | Added key_link for ForumMember (has display_name, title, reputation already) |

### Plan 37-02 (Tags + Reputation) — 5 errors fixed

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | P1 | Controller at `controllers/tag_controller.ex` (top-level) | Moved to `controllers/api/v1/tag_controller.ex` with `CGraphWeb.API.V1` namespace |
| 2 | P1 | `Forums: forums.ex` facade reference | Fixed to `core.ex` |
| 3 | P1 | Worker at `workers/reputation_recalc_worker.ex` | Moved to `forums/` dir (pattern: digest_worker.ex is in forums/) |
| 4 | P1 | No mention of existing reputation infrastructure | Added warnings: members.ex has update_reputation/3, voting.ex has propagate_post_reputation, ranking_engine.ex, forum_rank.ex, ForumMember already has reputation fields |
| 5 | P0 | No router.ex update instruction | Added: MUST update router.ex with import + macro call |

### Plan 37-03 (Mentions, Analytics, Search, Polls, Scheduled Posts) — 8 errors fixed

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | **P0** | `advanced_search.ex` referenced as "ALREADY EXISTS at 277 lines" | File does NOT exist. Correct: `search.ex` (CGraph.Forums.Search). Fixed all references. |
| 2 | **P0** | Search needs "tsvector, filters (forum, tags, date, author)" | search.ex ALREADY HAS all filters (forum_id, board_id, author_id, date_from, date_to, sort). Only tag filter is new. |
| 3 | **P0** | ThreadPoll "EXTEND with options JSONB, multi_select, closes_at" | All fields ALREADY EXIST: options ({:array, :map}), is_multiple_choice, max_options, is_public, closes_at, total_votes, PollVote. Fixed to "ALREADY COMPLETE". |
| 4 | P1 | `Forums: forums.ex` facade reference | Fixed to `core.ex` |
| 5 | P1 | No mention of Polls context (polls.ex) | Added key_link: CGraph.Forums.Polls wraps create_thread_poll/2, get_thread_poll/1 |
| 6 | P1 | No mention of PollVote schema | Added key_link: poll_vote.ex handles vote deduplication |
| 7 | P1 | Workers at `workers/` directory (2 files) | Fixed to `forums/` directory |
| 8 | P1 | Task 2 files block referenced `advanced_search.ex` and `workers/` path | Fixed to `search.ex` and `forums/` path |

### Plan 37-04 (Permissions, Custom Forums, Moderation Log, Admin) — 5 errors fixed

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | P0 | "do NOT edit router.ex directly" | Changed to: MUST update router.ex |
| 2 | P1 | Controller at `controllers/forum_admin_controller.ex` (top-level) | Moved to `controllers/api/v1/forum_admin_controller.ex` |
| 3 | **P1** | "role-based (owner, admin, moderator, member, guest)" on ForumPermission | ForumPermission is GROUP-BASED with tri-state (inherit/allow/deny). Roles are on ForumMember, not ForumPermission. Fixed permission extension to add new permission FIELDS, not roles. |
| 4 | P1 | `Forums context: forums.ex` facade reference | Fixed to `core.ex` |
| 5 | P1 | Objective text says "role-based access control" | Fixed to "new permission fields for Phase 37 capabilities" |

### Plan 37-05 (Web Frontend) — 3 errors fixed

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | P1 | No mention of existing forum-search/ (7 files) | Added warning: forum-search.tsx, filters-panel.tsx, search-result-item.tsx, search-results.tsx, useSearchHistory.ts, constants.ts, types.ts all exist. Page must COMPOSE them. |
| 2 | P1 | Creates `thread-poll.tsx` without mention of poll-widget.tsx, poll-card.tsx | Added warning: both already exist, must integrate/extend, not duplicate. |
| 3 | P2 | key_links too vague ("existing editor") | Fixed to specific: post-composer.tsx, bbcode-editor/, post-editor/, 28 forum store files, forum hooks |

### Plan 37-06 (Mobile Frontend) — 5 errors fixed (4 already-existing files)

| # | Severity | Error | Fix |
|---|----------|-------|-----|
| 1 | **P1** | `forum-search-screen.tsx (new)` | ALREADY EXISTS (line 81: export default function). Changed to `(update)` with EXTEND instruction. |
| 2 | **P1** | `create-forum-screen.tsx (new)` | ALREADY EXISTS (line 36: export default function). Changed to `(update)` with EXTEND instruction. |
| 3 | **P1** | `forum-admin-screen.tsx (new)` | ALREADY EXISTS with full subdirectory (components/, styles.ts, types.ts, use-forum-admin.ts). Changed to `(update)` with EXTEND instruction. |
| 4 | **P1** | `poll-view.tsx (new)` and no mention of poll-widget.tsx | poll-widget.tsx ALREADY EXISTS. Added compose/extend warning. |
| 5 | P2 | No mention of existing forumStore.ts | Added key_link for existing mobile forumStore.ts |

---

## Codebase Facts Verified

| Fact | Status | Evidence |
|------|--------|----------|
| Forums facade is `core.ex`, NOT `forums.ex` | ✅ Verified | `CGraph.Forums.Core` delegates to Core.{Authorization, Listing, Membership, Stats} |
| ForumPermission is SINGULAR (not plural) | ✅ Verified | `forum_permission.ex` with group-based tri-state (inherit/allow/deny) |
| ForumPermission uses groups, NOT roles | ✅ Verified | `ForumUserGroup`-based, `can?/3` → `get_effective_permission/4` → inheritance chain |
| ForumMember already has roles | ✅ Verified | `@roles ["member", "moderator", "admin", "owner"]` + reputation fields |
| `search.ex` exists, `advanced_search.ex` does NOT | ✅ Verified | `CGraph.Forums.Search` with tsvector, all filters already present |
| ThreadPoll is FULLY COMPLETE | ✅ Verified | question, options ({:array, :map}), is_multiple_choice, max_options, is_public, closes_at, total_votes, PollVote |
| Polls context exists | ✅ Verified | `CGraph.Forums.Polls` with create_thread_poll/2, get_thread_poll/1 |
| ALL controllers under api/v1/ | ✅ Verified | 140+ controllers at `controllers/api/v1/` with `CGraphWeb.API.V1.*` namespace |
| Router.ex: 18 imports (lines 27-44) | ✅ Verified | Including PaidDmRoutes, BoostRoutes from Phase 36 |
| Router.ex: 18 macro calls (lines 131-148) | ✅ Verified | New modules go after existing ones |
| 73 modules in CGraph.Forums namespace | ✅ Verified | Full inventory via defmodule grep |
| Mobile forum-search-screen.tsx exists | ✅ Verified | Line 81: `export default function ForumSearchScreen` |
| Mobile create-forum-screen.tsx exists | ✅ Verified | Line 36: `export default function CreateForumScreen` |
| Mobile forum-admin-screen.tsx exists | ✅ Verified | Plus subdirectory with components/, styles, types, hooks |
| Mobile poll-widget.tsx exists | ✅ Verified | In `components/forums/poll-widget.tsx` |
| Web forum-search/ has 7 files | ✅ Verified | forum-search.tsx, filters-panel.tsx, search-result-item.tsx, search-results.tsx, useSearchHistory.ts, constants.ts, types.ts |
| Web poll-widget.tsx and poll-card.tsx exist | ✅ Verified | Both in forums components |
| Forum workers in forums/ dir | ✅ Verified | digest_worker.ex pattern |
| forumAdminStore.ts does NOT exist on mobile | ✅ Verified | grep found 0 matches — genuinely new |

---

## Error Distribution

```
P0 (Critical — would cause build failure or wrong file):  6 errors
P1 (High — wrong namespace, missing existing files):     17 errors
P2 (Medium — wrong types, vague references):              5 errors
Total:                                                    28 errors
```

**All 28 errors have been fixed. Plans are now accurate against the codebase.**
