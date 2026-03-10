# Phase 31: Forums + Discovery — Pre-Execution Audit

**Audit date:** 2026-03-10 **Auditor:** Deep infrastructure scan before execution

## Critical Finding: Plans Were Fundamentally Wrong

The original plans claimed "100% greenfield — build forums from scratch" but the codebase already
contains one of its largest subsystems:

### Existing Forum Infrastructure (DO NOT REBUILD)

| Layer                | Files                             | Key Modules                                                                      |
| -------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| **Backend schemas**  | 70+ files in `lib/cgraph/forums/` | Forum, Board, Thread, ThreadPost, Post, Comment, Vote, + 60 more                 |
| **Backend context**  | `forums.ex` (472 LOC)             | Delegates to 20+ sub-modules (Core, Posts, Comments, Members, Threads, etc.)     |
| **Migrations**       | 14 forum-related                  | Full table structure: forums, boards, threads, thread_posts, subscriptions, etc. |
| **Controllers**      | 27 controllers                    | ForumController, ThreadController, BoardController, PostController, + 23 more    |
| **Routes**           | `forum_routes.ex` (182 LOC)       | Complete CRUD + nested resources + moderation + customization                    |
| **Channels**         | 3 WebSocket channels              | ForumChannel, ThreadChannel, BoardChannel                                        |
| **Frontend modules** | 316+ files in `modules/forums/`   | Store (28 files), hooks (6), components (70+), types, utils                      |
| **Frontend pages**   | 109 files in `pages/forums/`      | Forums, threads, boards, posts, admin, moderation, leaderboard, etc.             |
| **Shared types**     | 8 type packages                   | forum-user-groups, forum-permissions, forum-leaderboard, + 5 more                |
| **Routes**           | `forum-routes.tsx` (route group)  | 15+ forum routes registered                                                      |
| **Lazy imports**     | 12 in `lazyPages.ts`              | All forum pages lazy-loaded                                                      |
| **Existing feeds**   | `CGraph.Forums.Feeds` (171 LOC)   | list_public_feed, list_home_feed, list_popular_feed                              |

### What's Genuinely New (Discovery System)

| Component                       | Status         | Description                                              |
| ------------------------------- | -------------- | -------------------------------------------------------- |
| `topics` table                  | **GREENFIELD** | No table, no schema, no controller                       |
| `user_frequencies` table        | **GREENFIELD** | No table, no schema                                      |
| `post_metrics` table            | **GREENFIELD** | No table, no schema                                      |
| `CGraph.Discovery` context      | **GREENFIELD** | Module doesn't exist                                     |
| Feed ranking (5 modes)          | **GREENFIELD** | Existing feeds are basic list/sort, not ranked discovery |
| Community health scoring        | **GREENFIELD** | No health computation exists                             |
| `FeedController`                | **GREENFIELD** | No standalone feed controller                            |
| `TopicController`               | **GREENFIELD** | No topic/frequency endpoints                             |
| `discovery_routes.ex`           | **GREENFIELD** | No route macro                                           |
| `modules/discovery/` (frontend) | **GREENFIELD** | Directory doesn't exist                                  |
| `pages/feed/` (frontend)        | **GREENFIELD** | No feed page exists                                      |
| `/feed` route                   | **GREENFIELD** | No route registered                                      |
| `/settings/discovery`           | **GREENFIELD** | No settings page                                         |

### Thread Enhancements (Schema Extensions)

| Field                | Status      | Notes                                  |
| -------------------- | ----------- | -------------------------------------- |
| `is_content_gated`   | **MISSING** | Not in current Thread schema (145 LOC) |
| `gate_price_nodes`   | **MISSING** | Not in current Thread schema           |
| `gate_preview_chars` | **MISSING** | Not in current Thread schema           |
| `weighted_resonates` | **MISSING** | Not in current Thread schema           |

## Issues Found & Corrected (11 total)

| #   | Issue                                    | Severity     | Correction Applied                                                                                            |
| --- | ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | "100% greenfield" claim                  | **CRITICAL** | Changed to "Discovery is greenfield; forums system already exists"                                            |
| 2   | `feed_controller.ex` wrong path          | **MODERATE** | Fixed to `controllers/api/v1/feed_controller.ex` (module `CGraphWeb.API.V1.FeedController`)                   |
| 3   | `forum_controller.ex` listed as "new"    | **CRITICAL** | Removed — already exists with full implementation                                                             |
| 4   | `forum_threads` / `forum_replies` tables | **CRITICAL** | Removed — `threads` and `thread_posts` tables already exist. Added ALTER migration for gating columns instead |
| 5   | `CGraph.Forums` context "new"            | **CRITICAL** | Removed — 472-line context exists. Created `CGraph.Discovery` as separate context                             |
| 6   | Endpoint namespace `/communities/`       | **CRITICAL** | Removed duplicate forum endpoints. Discovery endpoints use `/feed`, `/topics`, `/frequencies`                 |
| 7   | `modules/forums/` "new directory"        | **CRITICAL** | Removed — 316 files exist. Created `modules/discovery/` instead                                               |
| 8   | `pages/forums/` "new pages"              | **CRITICAL** | Removed — 109 files exist. Created `pages/feed/` instead                                                      |
| 9   | `app-routes.tsx` forum routes            | **MODERATE** | Changed to ADD `/feed` and `/settings/discovery` routes only                                                  |
| 10  | `lazyPages.ts` existing imports          | **MINOR**    | Changed to ADD 2 new lazy imports (FeedPage, DiscoverySettings)                                               |
| 11  | Thread list/detail/reply tree rebuild    | **CRITICAL** | Removed — all exist. Plan now only extends thread-card with gating indicator                                  |

## Corrected Plan Summary

### Plan 31-01 (Backend — Wave 1)

1. Create topics, user_frequencies, post_metrics tables + seed 12 topics
2. ALTER threads table: add content gating columns + update Thread schema
3. Build CGraph.Discovery context with Feed module (5 ranked modes)
4. Build CommunityHealth scoring (ETS cached, never exposed)
5. Create FeedController, TopicController, discovery_routes.ex, wire into router.ex

### Plan 31-02 (Frontend — Wave 2)

1. Build modules/discovery/ (hooks, store, components: feed tabs, topic cards, frequency picker)
2. Build pages/feed/ (feed page with infinite scroll, post cards, Pulse reactions)
3. Build pages/settings/discovery/ + extend thread components with gating UI
4. Register /feed and /settings/discovery routes, add lazy imports

---

_Phase: 31-forums-discovery_ _Context gathered: 2026-03-10_ _Corrections: 8 CRITICAL, 2 MODERATE, 1
MINOR — all applied to both plan files_
