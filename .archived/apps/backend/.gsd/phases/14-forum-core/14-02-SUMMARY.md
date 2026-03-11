---
phase: 14
plan: 02
status: complete
---

# Summary: Plan 14-02

## Tasks Completed

### Task 1: Migration for tsvector columns and GIN indexes

- **File**: `apps/backend/priv/repo/migrations/20260301300001_add_forum_fulltext_search.exs` (170
  lines)
- Added `search_vector` tsvector columns to threads, thread_posts, posts, comments
- Created GIN indexes for fast full-text search
- Created auto-update trigger functions (title weighted A, content weighted B)
- Backfilled existing data

### Task 2: Rewrite search.ex with full-text search

- **File**: `apps/backend/lib/cgraph/forums/search.ex` (249 lines)
- `search_posts/2` — backward-compatible, upgraded to tsvector
- `search_threads/2` — tsvector search on MyBB threads
- `search_thread_posts/2` — tsvector search on MyBB thread posts
- `search_comments/2` — tsvector search on comments
- `search_all/2` — unified multi-entity search with type indicators
- `to_tsquery/1` — safe user input conversion
- Filters: forum_id, board_id, author_id, date_from, date_to, sort
- ts_rank_cd for relevance-based sorting

### Task 3: Forum search endpoint

- **Modified**: `apps/backend/lib/cgraph_web/controllers/api/v1/search_controller.ex` (+45 lines)
- **Modified**: `apps/backend/lib/cgraph_web/controllers/api/v1/search_json.ex` (+22 lines)
- **Modified**: `apps/backend/lib/cgraph_web/router/user_routes.ex` (+1 line)
- Added `forum_search/2` action with type, forum_id, board_id, author_id, date filters
- Added `forum_search` JSON renderer with `render_forum_result` helper
- Added `GET /search/forums` route

### Task 4: Reputation propagation from votes

- **Modified**: `apps/backend/lib/cgraph/forums/members.ex` (+15 lines) — `update_reputation/3`
- **Modified**: `apps/backend/lib/cgraph/forums/voting.ex` (+30 lines) — post & comment reputation
- **Modified**: `apps/backend/lib/cgraph/forums/thread_posts.ex` (+35 lines) — thread & thread_post
  reputation
- Self-vote prevention (voter != author check)
- Chain resolution: thread → board → forum for forum_id

### Task 5: Tests

- **File**: `apps/backend/test/cgraph/forums/search_test.exs` (118 lines)
- **File**: `apps/backend/test/cgraph/forums/reputation_test.exs` (113 lines)

## Commit History

| Hash       | Message                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `314fa538` | feat(forums): add tsvector columns and GIN indexes for full-text search |
| `67b55c4e` | feat(forums): rewrite search.ex with PostgreSQL full-text search        |
| `0a6afb92` | feat(forums): add forum_search endpoint to SearchController             |
| `f4fc03a1` | feat(forums): reputation propagation from votes                         |
| `205f8a54` | test(forums): add search and reputation test suites                     |

## Artifacts Created

- `apps/backend/priv/repo/migrations/20260301300001_add_forum_fulltext_search.exs` (new)
- `apps/backend/lib/cgraph/forums/search.ex` (rewritten)
- `apps/backend/lib/cgraph_web/controllers/api/v1/search_controller.ex` (modified)
- `apps/backend/lib/cgraph_web/controllers/api/v1/search_json.ex` (modified)
- `apps/backend/lib/cgraph_web/router/user_routes.ex` (modified)
- `apps/backend/lib/cgraph/forums/members.ex` (modified)
- `apps/backend/lib/cgraph/forums/voting.ex` (modified)
- `apps/backend/lib/cgraph/forums/thread_posts.ex` (modified)
- `apps/backend/test/cgraph/forums/search_test.exs` (new)
- `apps/backend/test/cgraph/forums/reputation_test.exs` (new)
