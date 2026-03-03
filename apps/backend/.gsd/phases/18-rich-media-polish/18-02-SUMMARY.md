---
phase: 18-rich-media-polish
plan: 02
subsystem: search, discovery, explore
tags: [meilisearch, search, explore, discover, quick-switcher, message-search, community-discovery]

# Dependency graph
requires:
  - phase: 11-groups-channels
    provides: Groups with is_discoverable, list_discoverable, channels
  - phase: 15-forum-customization
    provides: Forums context, public forums, forum categories

provides:
  - In-conversation message search panel with sender/date/type filters (MSG-20, SEARCH-01)
  - Extended Meilisearch message index with sender_name, type, has_attachment fields
  - Quick switcher polish with forum results, category headers, keyboard nav (SEARCH-04)
  - Unified explore endpoint combining groups + forums (GET /api/v1/explore) (SEARCH-05)
  - list_public_forums/1 in Forums context for public forum discovery
  - Explore frontend page with category bar, community cards, sort/search
  - Mobile explore screen with community discovery
  - Search & discovery integration test suite (10 tests)

affects: [19-analytics, mobile-search, community-growth]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unified explore aggregation — combine multiple content types into single ranked feed"
    - "In-conversation search — scoped search within specific conversation via conversation_id filter"
    - "Public route pattern — unauthenticated explore endpoint on public_routes.ex"

key-files:
  created:
    - apps/backend/lib/cgraph/explore.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/explore_controller.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/explore_json.ex
    - apps/web/src/modules/search/components/in-conversation-search/search-panel.tsx
    - apps/web/src/modules/search/components/in-conversation-search/filter-chips.tsx
    - apps/web/src/modules/search/components/in-conversation-search/search-result-item.tsx
    - apps/web/src/modules/search/hooks/useConversationSearch.ts
    - apps/web/src/pages/explore/explore-page.tsx
    - apps/web/src/pages/explore/community-card.tsx
    - apps/web/src/pages/explore/category-bar.tsx
    - apps/mobile/src/screens/explore/explore-screen.tsx
    - apps/mobile/src/screens/explore/community-card.tsx
    - apps/backend/test/cgraph_web/controllers/api/v1/search_discovery_test.exs
  modified:
    - apps/backend/lib/cgraph/search/search_engine.ex
    - apps/backend/lib/cgraph/search/indexer.ex
    - apps/backend/lib/cgraph/search/messages.ex
    - apps/backend/lib/cgraph/forums/core/listing.ex
    - apps/backend/lib/cgraph/forums/core.ex
    - apps/backend/lib/cgraph/forums.ex
    - apps/backend/lib/cgraph/groups/repositories/group_repository.ex
    - apps/backend/lib/cgraph_web/router/public_routes.ex
    - apps/web/src/shared/components/quick-switcher.tsx
    - apps/web/src/components/layout/command-registry.tsx
    - apps/web/src/routes/app-routes.tsx
    - apps/mobile/src/navigation/search-navigator.tsx

key-decisions:
  - "Explore endpoint is public (no auth) on public_routes.ex — anonymous community browsing"
  - "list_public_forums created in Forums.Core.Listing with category/query/sort support"
  - "Fixed Pagination sort_field leak — stripped :sort from params before parse_params in list_discoverable"
  - "Fixed DateTime parsing in search/messages.ex — ISO string params now parsed before to_unix"

patterns-established:
  - "Explore aggregation: fetch from multiple contexts → normalize to unified community struct → sort and paginate"
  - "In-conversation search: useConversationSearch hook wraps useInfiniteQuery with conversation_id scope"
  - "Category bar pattern: horizontal scrollable chip bar with 'All' reset filter"

# Metrics
duration: ~45min
completed: 2026-03-02
---

# Plan 18-02: Search & Discovery — Message Search, Quick Switcher, Community Explore

**Complete message search with in-conversation filters, polished quick switcher, and unified community explore page across web and mobile.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 7 completed (0-6)
- **Files modified:** 29

## Accomplishments

- In-conversation message search panel with sender, date range, and content type filters wired to existing `GET /api/v1/search/messages` API
- Quick switcher (⌘K) enhanced with forum search results, category headers, and improved keyboard navigation
- Unified explore endpoint aggregating discoverable groups + public forums with category/query/sort filters
- Mobile explore screen with community cards, category scroll, and search
- Fixed two production bugs: DateTime ISO string parsing in Meilisearch filter builder, and pagination sort_field leak in `list_discoverable`
- 10-test integration suite covering message search scoping, sender/date/type filters, explore aggregation, category filtering, sort ordering, and privacy exclusion

## Task Commits

Each task was committed atomically:

0. **Task 0: Extend message search index** — `7dc85c96` (feat)
1. **Task 1: In-conversation search panel** — `886be4f6` (feat)
2. **Task 2: Quick switcher polish** — `d970b48e` (feat)
3. **Task 3: Explore backend aggregation** — `87eae365` (feat)
4. **Task 4: Explore frontend** — `c73e97f8` (feat)
5. **Task 5: Mobile explore + search navigation** — `957524c3` (feat)
6. **Task 6: Search & discovery integration test** — `b62e47f0` (test)

## Files Created/Modified

### Created
- `apps/backend/lib/cgraph/explore.ex` — Explore context aggregating groups + forums
- `apps/backend/lib/cgraph_web/controllers/api/v1/explore_controller.ex` — GET /api/v1/explore endpoint
- `apps/backend/lib/cgraph_web/controllers/api/v1/explore_json.ex` — Explore JSON serialization
- `apps/web/src/modules/search/components/in-conversation-search/search-panel.tsx` — Search panel with filters
- `apps/web/src/modules/search/hooks/useConversationSearch.ts` — Conversation-scoped search hook
- `apps/web/src/pages/explore/explore-page.tsx` — Unified explore page
- `apps/web/src/pages/explore/community-card.tsx` — Community card component
- `apps/web/src/pages/explore/category-bar.tsx` — Category filter bar
- `apps/mobile/src/screens/explore/explore-screen.tsx` — Mobile explore screen
- `apps/backend/test/cgraph_web/controllers/api/v1/search_discovery_test.exs` — Integration test (10 tests)

### Modified
- `apps/backend/lib/cgraph/search/search_engine.ex` — Extended message index fields
- `apps/backend/lib/cgraph/search/messages.ex` — Fixed DateTime ISO parsing in Meilisearch filter builder
- `apps/backend/lib/cgraph/groups/repositories/group_repository.ex` — Fixed pagination sort_field leak
- `apps/backend/lib/cgraph/forums/core/listing.ex` — Added list_public_forums/1
- `apps/backend/lib/cgraph_web/router/public_routes.ex` — Added /explore route
- `apps/web/src/shared/components/quick-switcher.tsx` — Forum results + category headers
- `apps/web/src/routes/app-routes.tsx` — Added /explore route

## Decisions Made

- **Explore is public (unauthenticated):** Community discovery should be available without login to maximize discoverability. Route added to `public_routes.ex`.
- **Category-based filtering on both groups and forums:** Groups filter by `category` field, forums use existing `category` column. Unified in explore response.
- **Bugfixes included in test commit:** Two bugs found during integration testing — DateTime string parsing and pagination column leak — were fixed alongside the test to ensure passing suite.

## Deviations from Plan

### Auto-fixed Issues

**1. DateTime ISO string parsing in search/messages.ex**

- **Found during:** Task 6 (integration test)
- **Issue:** `build_message_filters/3` called `DateTime.to_unix/2` on raw ISO string params from the controller, causing `FunctionClauseError`
- **Fix:** Added `maybe_parse_datetime/1` helper that handles nil, DateTime structs, and ISO 8601 strings
- **Files modified:** `apps/backend/lib/cgraph/search/messages.ex`
- **Verification:** Date range filter test passes

**2. Pagination sort_field leak in GroupRepository.list_discoverable/1**

- **Found during:** Task 6 (integration test)
- **Issue:** `Enum.into(opts, %{})` passed `:sort` key to `Pagination.parse_params`, which used `:popular` as a column name, producing `ERROR 42703 (undefined_column) column g0.popular does not exist`
- **Fix:** Stripped `:sort` key from opts before passing to `parse_params`
- **Files modified:** `apps/backend/lib/cgraph/groups/repositories/group_repository.ex`
- **Verification:** All 5 explore tests pass
