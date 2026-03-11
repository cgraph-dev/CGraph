# Plan 16-01 Summary: XP Event Pipeline & Real-Time Toasts

**One-liner:** Built the complete XP event pipeline — from backend action→reward processing through
Redis leaderboards to real-time animated toasts on web and mobile.

## Tasks & Commits

| #   | Task                                                                                         | Commit     |
| --- | -------------------------------------------------------------------------------------------- | ---------- |
| 1   | Shared gamification types (`packages/shared-types/src/gamification.ts`)                      | `9f97a271` |
| 2   | XP config module (`apps/backend/lib/cgraph/gamification/xp_config.ex`)                       | `5846212b` |
| 3   | Redis-backed daily cap tracker (`apps/backend/lib/cgraph/gamification/daily_cap.ex`)         | `f844b3d1` |
| 4   | Central XP event handler (`apps/backend/lib/cgraph/gamification/xp_event_handler.ex`)        | `7e3f6031` |
| 5   | Messaging XP wiring (`apps/backend/lib/cgraph/messaging/core_messages.ex`)                   | `203bac49` |
| 6   | Forum XP wiring (`apps/backend/lib/cgraph/forums.ex`, `forums/voting.ex`)                    | `d5d9723e` |
| 7   | Friend acceptance XP wiring (`apps/backend/lib/cgraph/accounts/friends/requests.ex`)         | `9501a61a` |
| 8   | Per-board scoped leaderboard (`leaderboard.ex`, `leaderboard_system.ex`, controller, routes) | `3ff82a02` |
| 9   | Gamification channel PubSub handlers (`gamification_channel.ex`)                             | `51168d1e` |
| 10  | Web XP toast + socket handlers (`xp-toast/`, `useGamificationSocket`, store)                 | `2d42fae5` |
| 11  | Mobile XP toast + store integration (`xp-toast.tsx`, `gamificationStore.ts`)                 | `fa7e87cd` |

## Files Created

- `packages/shared-types/src/gamification.ts`
- `apps/backend/lib/cgraph/gamification/xp_config.ex`
- `apps/backend/lib/cgraph/gamification/daily_cap.ex`
- `apps/backend/lib/cgraph/gamification/xp_event_handler.ex`
- `apps/web/src/modules/gamification/components/xp-toast/xp-toast.tsx`
- `apps/web/src/modules/gamification/components/xp-toast/index.tsx`
- `apps/mobile/src/components/gamification/xp-toast.tsx`

## Files Modified

- `apps/backend/lib/cgraph/messaging/core_messages.ex` — fire-and-forget XP via Task.start
- `apps/backend/lib/cgraph/forums.ex` — XP for thread/post creation
- `apps/backend/lib/cgraph/forums/voting.ex` — XP for upvote received
- `apps/backend/lib/cgraph/accounts/friends/requests.ex` — XP for friend acceptance
- `apps/backend/lib/cgraph/gamification/leaderboard.ex` — scoped keys, sync_scoped_scores,
  get_scoped_top
- `apps/backend/lib/cgraph/gamification/leaderboard_system.ex` — get_scoped_leaderboard with cursor
  pagination
- `apps/backend/lib/cgraph_web/controllers/gamification_controller.ex` — scoped_leaderboard action
- `apps/backend/lib/cgraph_web/router/gamification_routes.ex` — scoped leaderboard route
- `apps/backend/lib/cgraph_web/channels/gamification_channel.ex` — xp_awarded, coins_awarded,
  cap_reached handlers
- `apps/web/src/modules/gamification/hooks/gamificationSocketStore.ts` — new channel events, state
  updates
- `apps/web/src/modules/gamification/hooks/useGamificationSocket.ts` — useXPAwarded,
  useCoinsAwarded, useCapReached hooks
- `apps/web/src/modules/gamification/hooks/gamification-socket.types.ts` — XPAwardedEvent,
  CoinsAwardedEvent, CapReachedEvent
- `apps/web/src/modules/gamification/store/gamification-actions.ts` — createHandleXPAwarded,
  createHandleCoinsAwarded
- `apps/mobile/src/stores/gamificationStore.ts` — handleXPAwarded, handleCoinsAwarded
- `apps/mobile/src/components/gamification/index.ts` — XPToast barrel export

## Deviations

- **Task 8:** `sync_scoped_scores` was already called by `XpEventHandler` (Task 4) before the
  function existed—Task 8 backfilled the implementation in `leaderboard.ex`.
- **Task 9:** Kept existing `:xp_gained` handler intact for backward compatibility; new
  `:xp_awarded` handler provides richer payload (daily cap status, level progress).
- **Task 10:** Used inline styles instead of CSS modules for the XP toast, matching the lightweight
  pattern of other gamification components.
- **Task 11:** Used React Native `Animated` API (not Reanimated) for consistency with existing
  `FloatingXPBadge` component, even though Reanimated is available.
- **Task 10 & 11:** `coins_awarded` broadcasting is not yet wired in `XpEventHandler`—the channel
  handler is ready but the PubSub broadcast for coins needs to be added to
  `Gamification.award_coins/4` in a follow-up.

## Issues

- None blocking. Backend compiles clean, shared-types typecheck passes.
