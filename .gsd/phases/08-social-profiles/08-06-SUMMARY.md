---
phase: 08-social-profiles
plan: 06
subsystem: api
tags: [elixir, phoenix-channels, zustand, block-enforcement, presence, messaging]

requires:
  - phase: 08-social-profiles/03
    provides: "User.ex status persistence fields (status_message, custom_status, status_expires_at)"
  - phase: 08-social-profiles/01
    provides: "Friendship schema with :blocked status, block_user/2, blocked?/2"
provides:
  - "mutually_blocked?/2 — bidirectional block check (A↔B)"
  - "get_blocked_user_ids/1 — all block-related user IDs for a given user"
  - "Block enforcement in ConversationChannel (join + new_message rejection)"
  - "Block filtering in PresenceChannel (after_join + refresh_friends)"
  - "Restricted profile response for blocked users in UserController (show + profile)"
  - "Bidirectional search exclusion via get_blocked_user_ids/1"
  - "Web UI: blocked user removed from friends/presence stores on block action"
affects: [notifications, groups, moderation]

tech-stack:
  added: []
  patterns:
    - "Bidirectional block check via mutually_blocked?/2 composing two blocked?/2 calls"
    - "Block filtering as MapSet rejection on friend_ids before presence operations"
    - "Dynamic import for cross-store cleanup (profileStore → friendStore)"

key-files:
  created: []
  modified:
    - "apps/backend/lib/cgraph/accounts/friends/queries.ex"
    - "apps/backend/lib/cgraph/accounts/friends.ex"
    - "apps/backend/lib/cgraph_web/channels/conversation_channel.ex"
    - "apps/backend/lib/cgraph_web/channels/presence_channel.ex"
    - "apps/backend/lib/cgraph_web/controllers/api/v1/user_controller.ex"
    - "apps/backend/lib/cgraph/search/users.ex"
    - "apps/web/src/modules/social/store/profile-blocked-and-media.ts"

key-decisions:
  - "mutually_blocked?/2 composes two blocked?/2 calls rather than a single OR query — clearer semantics, acceptable for non-hot-path"
  - "get_blocked_user_ids/1 uses CASE fragment to return the 'other' user ID from each block row"
  - "Presence filtering uses MapSet for O(1) lookups when rejecting blocked IDs from friend list"
  - "Search exclusion replaced raw 'blocks' table subquery with get_blocked_user_ids/1 for bidirectional correctness"
  - "Web block action uses dynamic import to avoid circular dependency between profileStore and friendStore"

patterns-established:
  - "Block enforcement pattern: check mutually_blocked?/2 at channel join AND per-message send"
  - "Presence block filtering: get_blocked_user_ids → MapSet → Enum.reject on friend_ids"
  - "Profile block response: minimal JSON with {id, username, display_name, blocked: true}"

duration: 12min
completed: 2026-03-01
---

# Plan 08-06: Block Enforcement Summary

**Bidirectional block enforcement across messaging channels, presence broadcasts, profile viewing, and search with mutually_blocked?/2 and get_blocked_user_ids/1**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-01T00:00:00Z
- **Completed:** 2026-03-01T00:12:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `mutually_blocked?/2` for bidirectional block checks and `get_blocked_user_ids/1` for bulk block ID retrieval
- Messaging channel (ConversationChannel) now rejects join and new_message when participants are mutually blocked
- Presence channel filters blocked users from friend_ids before broadcasting — blocked users invisible in both directions
- Profile endpoints (show/profile) return restricted minimal data for mutually blocked users
- Search exclusion upgraded from unidirectional `blocks` table query to bidirectional `get_blocked_user_ids/1`
- Web profileStore block action now also removes blocked user from friendStore (friends, pending, sent requests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mutually_blocked?/2 and enforce blocks in messaging + presence channels** — `c92ad0cd` (feat)
2. **Task 2: Enforce blocks in profile viewing + verify search bidirectionality + web UI cleanup** — `ed7a03dd` (feat)

## Files Created/Modified

- `apps/backend/lib/cgraph/accounts/friends/queries.ex` — Added mutually_blocked?/2 and get_blocked_user_ids/1
- `apps/backend/lib/cgraph/accounts/friends.ex` — Added delegates for new query functions
- `apps/backend/lib/cgraph_web/channels/conversation_channel.ex` — Block check on join (DM) and new_message handler
- `apps/backend/lib/cgraph_web/channels/presence_channel.ex` — Block filtering in after_join and refresh_friends
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_controller.ex` — Restricted profile for blocked users in show/profile
- `apps/backend/lib/cgraph/search/users.ex` — Bidirectional block exclusion via get_blocked_user_ids/1
- `apps/web/src/modules/social/store/profile-blocked-and-media.ts` — Cross-store cleanup on block action

## Decisions Made

- Used `mutually_blocked?/2` composing two `blocked?/2` calls for clarity over a single complex query
- Replaced raw `"blocks"` table subquery in search with `get_blocked_user_ids/1` which uses the authoritative `friendships` table
- Block check on conversation join uses preloaded participants from `get_conversation/1` — no extra query
- Used dynamic import (`await import('./friendStore.impl')`) to avoid circular dependency between profile and friend stores

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Search used non-existent `blocks` table**

- **Found during:** Task 2 (search bidirectionality verification)
- **Issue:** `maybe_exclude_blocked/2` used `from b in "blocks"` with `blocker_id/blocked_id` columns — this raw table doesn't match the Friendship-based block model and was unidirectional
- **Fix:** Replaced with `get_blocked_user_ids/1` which queries the `friendships` table bidirectionally
- **Files modified:** `apps/backend/lib/cgraph/search/users.ex`
- **Verification:** Backend compiles clean
- **Committed in:** `ed7a03dd` (Task 2 commit)

**2. [Rule 3 — Blocking] Extracted send_message/5 for cleaner block check flow**

- **Found during:** Task 1 (messaging channel block enforcement)
- **Issue:** Adding block check inside deeply nested `case check_rate_limit` made code hard to follow
- **Fix:** Extracted message creation into `send_message/5` private function, block check is now top-level in handle_in
- **Files modified:** `apps/backend/lib/cgraph_web/channels/conversation_channel.ex`
- **Verification:** Backend compiles clean
- **Committed in:** `c92ad0cd` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

None — plan executed cleanly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Block enforcement is comprehensive across all social surfaces
- Ready for Phase 9 (Notifications & Safety) which depends on Phase 8
- Moderation tools (Phase 12) can leverage mutually_blocked?/2 and get_blocked_user_ids/1

---

_Phase: 08-social-profiles_
_Completed: 2026-03-01_
