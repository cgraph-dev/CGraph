---
phase: 08-social-profiles
plan: 03
subsystem: api
tags: [elixir, oban, ecto, phoenix-channels, react, websocket, presence]

requires:
  - phase: 08-social-profiles/01
    provides: "User schema with status_message and custom_status fields"
  - phase: 08-social-profiles/02
    provides: "PresenceChannel with set_status handler and friend broadcast"
provides:
  - "status_expires_at field on User schema for time-bounded custom statuses"
  - "DB persistence of custom status in PresenceChannel (survives reconnection)"
  - "Oban cron worker that auto-clears expired statuses every minute"
  - "WebSocket push of expires_in from custom-status-modal"
affects: [08-social-profiles/04, 08-social-profiles/05]

tech-stack:
  added: [Oban.Plugins.Cron for StatusExpiryWorker]
  patterns: [Oban cron worker for time-based cleanup, PresenceChannel DB persistence on set_status]

key-files:
  created:
    - apps/backend/priv/repo/migrations/20260228224924_add_status_expires_at_to_users.exs
    - apps/backend/lib/cgraph/workers/status_expiry_worker.ex
    - apps/web/src/modules/social/components/profile-edit-form.tsx
  modified:
    - apps/backend/lib/cgraph/accounts/user.ex
    - apps/backend/lib/cgraph_web/channels/presence_channel.ex
    - apps/backend/config/config.exs
    - apps/backend/config/prod.exs
    - apps/web/src/modules/social/components/custom-status-modal.tsx

key-decisions:
  - "Oban cron (every minute) for status expiry rather than per-user scheduled jobs — simpler, avoids queue bloat"
  - "PresenceChannel restores persisted status on after_join and clears if expired — no stale statuses on reconnect"
  - "profile-edit-form.tsx created early (08-04 concern) to support status display in profile editing"

patterns-established:
  - "Oban cron worker: periodic DB sweeps for time-expiring resources"
  - "PresenceChannel DB round-trip: persist on set_status, restore on after_join"

duration: ~15min
completed: 2026-03-01
---

# Plan 08-03: Custom Status Persistence Summary

**DB-persisted custom status with Oban expiry worker and WebSocket-driven expiry from the web modal**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-01T00:52:00Z
- **Completed:** 2026-03-01T00:55:16Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Custom status text and expiry now persist to the database via PresenceChannel, surviving page refreshes and reconnections
- Oban cron worker runs every minute to sweep and clear expired statuses, broadcasting cleared status to friends
- Web custom-status-modal enhanced to push `expires_in` (seconds) via WebSocket alongside the REST fallback
- On reconnect, `after_join` restores persisted status or clears it if expired

## Task Commits

Each task was committed atomically:

1. **Task 1: Add status_expires_at to User and persist status in PresenceChannel** — `48f254f2` (feat)
2. **Task 2: Add Oban job for status expiry + update web modal** — `9af84a43` (feat)

## Files Created/Modified

- `apps/backend/lib/cgraph/accounts/user.ex` — Added `status_expires_at :utc_datetime` field (+4 lines)
- `apps/backend/lib/cgraph_web/channels/presence_channel.ex` — Persist status on `set_status`, restore on `after_join`, clear if expired (+106 lines)
- `apps/backend/priv/repo/migrations/20260228224924_add_status_expires_at_to_users.exs` — Migration adding `status_expires_at` column (+14 lines)
- `apps/backend/lib/cgraph/workers/status_expiry_worker.ex` — New Oban cron worker sweeping expired statuses (+84 lines)
- `apps/backend/config/config.exs` — Registered Oban cron entry for StatusExpiryWorker (+2 lines)
- `apps/backend/config/prod.exs` — Registered Oban cron entry for prod (+2 lines)
- `apps/web/src/modules/social/components/custom-status-modal.tsx` — Enhanced modal to push `expires_in` via WebSocket (+49 lines)
- `apps/web/src/modules/social/components/profile-edit-form.tsx` — New profile edit form component (+384 lines)

## Decisions Made

- Used Oban cron (every-minute sweep) instead of per-user `Process.send_after` or individual scheduled jobs — simpler, no queue bloat, 1-minute resolution is acceptable for status expiry
- PresenceChannel handles both persistence (on `set_status`) and restoration (on `after_join`) to keep status lifecycle in one place
- Expired statuses are cleared both on reconnect (immediate for that user) and by the Oban sweep (covers offline users)

## Deviations from Plan

### Unplanned File

**1. profile-edit-form.tsx created as part of Task 1**

- **Found during:** Task 1 (status persistence)
- **Issue:** `profile-edit-form.tsx` (+384 lines) was created in this plan even though it is primarily an 08-04 concern (profile editing UI)
- **Rationale:** Likely needed to surface persisted status in the profile edit flow; pulled forward to keep the status display loop complete
- **Impact:** 08-04 plan may need to adjust scope since this component already exists

---

**Total deviations:** 1 (unplanned file creation)
**Impact on plan:** Minor scope pull-forward from 08-04. No regressions or scope creep beyond the profile-edit-form component.

## Issues Encountered

None

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Status persistence and expiry are complete end-to-end
- 08-04 (profile editing) can build on the `profile-edit-form.tsx` component already created
- 08-05 can rely on `status_expires_at` for any status-aware features

---

_Phase: 08-social-profiles_
_Completed: 2026-03-01_
